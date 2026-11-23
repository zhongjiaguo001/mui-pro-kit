import test from 'node:test';
import assert from 'node:assert/strict';
import type { GridColDef, GridColumnGroupingModel } from '../types';
import {
  buildServerTreeVisibleRows,
  executeServerTreeQuery,
  serializeServerTreePath,
} from './serverTreeEngine';
import {
  buildDataSourceCacheKey,
  executeServerGroupQuery,
} from './serverDataEngine';
import {
  applyClipboardPasteMatrix,
  buildCellRangeClearUpdates,
} from './gridCore';
import { serializeRowsToXlsxBytes } from './xlsxExport';

interface OrderFixture extends Record<string, unknown> {
  id: string;
  orderNo: string;
  region: string;
  industry: string;
  customer: string;
  amount: number;
  collectionRate: number;
  approved: boolean;
}

const FIXTURE_COLS: GridColDef<OrderFixture>[] = [
  { field: 'orderNo', headerName: '订单号', type: 'string', editable: false },
  { field: 'region', headerName: '区域', type: 'string', editable: true },
  { field: 'industry', headerName: '行业', type: 'string', editable: true },
  { field: 'customer', headerName: '客户', type: 'string', editable: true },
  { field: 'amount', headerName: '金额', type: 'number', editable: true, rowSpan: false },
  { field: 'collectionRate', headerName: '回款', type: 'number', editable: true, rowSpan: false },
  { field: 'approved', headerName: '审批', type: 'boolean', editable: true },
];

const FIXTURE_ROWS: OrderFixture[] = [
  {
    id: '1',
    orderNo: 'SO-1',
    region: '华东区',
    industry: '智能制造',
    customer: '星河智造',
    amount: 200000,
    collectionRate: 100,
    approved: true,
  },
  {
    id: '2',
    orderNo: 'SO-2',
    region: '华东区',
    industry: '智能制造',
    customer: '辰光装备',
    amount: 300000,
    collectionRate: 80,
    approved: false,
  },
  {
    id: '3',
    orderNo: 'SO-3',
    region: '华东区',
    industry: '半导体',
    customer: '博雅半导',
    amount: 150000,
    collectionRate: 60,
    approved: true,
  },
  {
    id: '4',
    orderNo: 'SO-4',
    region: '华南区',
    industry: '生物医药',
    customer: '新锐医药',
    amount: 400000,
    collectionRate: 100,
    approved: true,
  },
];

test('executeServerTreeQuery & buildServerTreeVisibleRows lazily expand server tree levels', () => {
  const getPath = (r: OrderFixture) => [r.region, r.industry, r.orderNo];
  const rootRes = executeServerTreeQuery(FIXTURE_ROWS, FIXTURE_COLS, getPath, {
    groupKeys: [],
  });
  assert.equal(rootRes.rows.length, 2); // 华东区, 华南区
  const eastRoot = rootRes.rows.find((r) => r.__serverTreeKey === '华东区')!;
  assert.equal(eastRoot.amount, 650000);
  assert.equal(eastRoot.__serverTreeChildrenCount, 2); // 智能制造, 半导体

  const eastChildren = executeServerTreeQuery(
    FIXTURE_ROWS,
    FIXTURE_COLS,
    getPath,
    { groupKeys: ['华东区'] },
  );
  assert.equal(eastChildren.rows.length, 2);

  const mfgLeaves = executeServerTreeQuery(
    FIXTURE_ROWS,
    FIXTURE_COLS,
    getPath,
    { groupKeys: ['华东区', '智能制造'] },
  );
  assert.equal(mfgLeaves.rows.length, 2);
  assert.equal(mfgLeaves.rows[0].__serverTreeChildrenCount, 0);

  const eastKey = serializeServerTreePath(['华东区']);
  const mfgKey = serializeServerTreePath(['华东区', '智能制造']);
  const visible = buildServerTreeVisibleRows({
    rootRows: rootRes.rows,
    childrenByPathKey: {
      [eastKey]: eastChildren.rows,
      [mfgKey]: mfgLeaves.rows,
    },
    expandedPathKeys: {
      [eastKey]: true,
      [mfgKey]: true,
    },
    loadingPathKeys: {},
    getGroupKey: (r) => String(r.__serverTreeKey ?? r.id),
    getChildrenCount: (r) => Number(r.__serverTreeChildrenCount ?? 0),
  });

  // 华东区 (depth 0) -> 智能制造 (depth 1) -> SO-1, SO-2 (depth 2) -> 半导体 (depth 1) -> 华南区 (depth 0)
  assert.equal(visible.length, 6);
  assert.deepEqual(
    visible.map((v) => [v.groupKey, v.depth]),
    [
      ['华东区', 0],
      ['智能制造', 1],
      ['SO-1', 2],
      ['SO-2', 2],
      ['半导体', 1],
      ['华南区', 0],
    ],
  );
});

test('executeServerGroupQuery computes server-side group buckets + aggregations and isolates cache keys', () => {
  const keyA = buildDataSourceCacheKey({
    groupFields: ['region'],
    groupKeys: [],
    aggregationModel: { amount: 'sum' },
  });
  const keyB = buildDataSourceCacheKey({
    groupFields: ['region'],
    groupKeys: ['华东区'],
    aggregationModel: { amount: 'sum' },
  });
  assert.notEqual(keyA, keyB);

  const grouped = executeServerGroupQuery(FIXTURE_ROWS, FIXTURE_COLS, {
    groupFields: ['region'],
    groupKeys: [],
    aggregationModel: { amount: 'sum', collectionRate: 'avg' },
  });
  assert.equal(grouped.rows.length, 2);
  const east = grouped.rows.find((r) => r.__serverGroupKey === '华东区')!;
  assert.equal(east.amount, 650000);
  assert.equal(east.collectionRate, 80);
  assert.equal(east.__serverChildrenCount, 3);
});

test('buildCellRangeClearUpdates clears editable cells and respects canEditCell locks', () => {
  const result = buildCellRangeClearUpdates(
    FIXTURE_ROWS,
    FIXTURE_COLS,
    {
      start: { rowIndex: 0, colIndex: 0 },
      end: { rowIndex: 1, colIndex: 6 },
    },
    (row) => row.id !== '2', // lock row 2
  );
  assert.equal(result.updates.length, 1);
  assert.equal(result.updates[0].rowIndex, 0);
  // orderNo is non-editable -> preserved
  assert.equal(result.updates[0].nextRow.orderNo, 'SO-1');
  // editable string/number/boolean cleared
  assert.equal(result.updates[0].nextRow.customer, '');
  assert.equal(result.updates[0].nextRow.amount, 0);
  assert.equal(result.updates[0].nextRow.approved, false);
});

test('applyClipboardPasteMatrix invokes processCellPaste transform and rejects throwing cells', () => {
  const res = applyClipboardPasteMatrix(
    FIXTURE_ROWS,
    FIXTURE_COLS,
    0,
    3, // customer, amount
    [
      ['新客户A', '500000'],
      ['新客户B', '-100'], // rejected by hook
    ],
    undefined,
    ({ field, parsedValue }) => {
      if (field === 'amount' && Number(parsedValue) < 0) {
        throw new Error('negative amount forbidden');
      }
      if (field === 'customer') {
        return `${String(parsedValue).trim()}（粘贴）`;
      }
      return parsedValue;
    },
  );
  assert.equal(res.updates.length, 2);
  assert.equal(res.updates[0].nextRow.customer, '新客户A（粘贴）');
  assert.equal(res.updates[0].nextRow.amount, 500000);
  assert.equal(res.updates[1].nextRow.customer, '新客户B（粘贴）');
  // Negative amount was rejected, keeping original 300000
  assert.equal(res.updates[1].nextRow.amount, 300000);
});

test('serializeRowsToXlsxBytes writes column group header merges, vertical rowSpan merges, and numeric style', () => {
  const colGroups: GridColumnGroupingModel = [
    {
      groupId: 'geo',
      headerName: '区域分类',
      children: [{ field: 'region' }, { field: 'industry' }],
    },
  ];

  const bytes = serializeRowsToXlsxBytes(FIXTURE_ROWS, FIXTURE_COLS, '高级导出', {
    columnGroupingModel: colGroups,
    rowSpanning: true,
  });

  // Valid ZIP magic header PK\x03\x04
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);

  const decoded = new TextDecoder().decode(bytes);
  // Multi-row header freeze pane (ySplit="2")
  assert.ok(decoded.includes('ySplit="2"'), 'Expected ySplit="2" for grouped headers');
  // Horizontal merge for 区域分类 across B1:C1
  assert.ok(decoded.includes('mergeCell ref="B1:C1"'), 'Expected B1:C1 column group merge');
  // Vertical rowSpan merge for 华东区 across rows 3..5 (B3:B5) and 智能制造 across C3:C4
  assert.ok(decoded.includes('mergeCell ref="B3:B5"'), 'Expected B3:B5 rowSpan merge');
  assert.ok(decoded.includes('mergeCell ref="C3:C4"'), 'Expected C3:C4 rowSpan merge');
  // Styled numeric cell s="2"
  assert.ok(decoded.includes('s="2" t="n"'), 'Expected styled numeric cell s="2"');
});
