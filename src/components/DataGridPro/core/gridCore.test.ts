import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyClipboardPasteMatrix,
  applyValueSetter,
  buildColumnGroupHeaderRows,
  buildRowGroupingRows,
  buildTreeDataRows,
  collectDefaultExpandedRowGroups,
  collectDefaultExpandedTreeGroups,
  computeAutoFillUpdates,
  computeCellRangeStats,
  computeColumnAggregation,
  computeColumnAutosizeWidth,
  computePinnedOffsets,
  computeShiftRowSelectionRange,
  computeVirtualRowWindow,
  createEditHistoryState,
  evaluateEditCellValidation,
  evaluateFilterItem,
  evaluateFilterModel,
  formatAggregatedValue,
  formatCellValue,
  getCellRangeEdges,
  getDensityMetrics,
  getHeaderFilterOperator,
  getHeaderFilterValue,
  getOperatorsForColumnType,
  isCellInRange,
  isFilterItemActive,
  normalizeCellRange,
  parseEditedCellValue,
  parseTsvClipboardMatrix,
  pushEditHistoryEntry,
  redoEditHistory,
  reorderColumnIds,
  reorderRowGroupingModel,
  reorderRowsByIndex,
  resolveRowHeightConfig,
  serializeCellRangeToTsv,
  serializeCellsToTsv,
  serializeRowsToCsv,
  swapColumnOrder,
  undoEditHistory,
  upsertExactValueFilter,
  upsertHeaderFilterItem,
  upsertHeaderFilterOperator,
  validateAndMergeRowEdits,
} from './gridCore';
import { buildPivotTable } from './pivotEngine';
import { buildChartSeries, getChartEligibleFields } from './chartEngine';
import { computeColSpanRow, computeRowSpanMatrix } from './spanEngine';
import { serializeRowsToJson, serializeRowsToXlsxBytes } from './xlsxExport';
import type { GridColDef, GridColumnGroupingModel, GridFilterModel } from '../types';

interface SampleOrder extends Record<string, unknown> {
  id: string;
  customer: string;
  amount: number;
  status: string;
  approved: boolean;
  createdAt: string;
  note?: string;
}

const sampleColumns: GridColDef<SampleOrder>[] = [
  { field: 'id', headerName: '订单编号', type: 'string' },
  { field: 'customer', headerName: '客户名称', type: 'string' },
  {
    field: 'amount',
    headerName: '订单金额',
    type: 'number',
    valueFormatter: (v) => `¥${Number(v).toLocaleString('zh-CN')}`,
  },
  {
    field: 'status',
    headerName: '状态',
    type: 'singleSelect',
    valueOptions: [
      { value: 'paid', label: '已结算' },
      { value: 'pending', label: '待审核' },
    ],
  },
  { field: 'approved', headerName: '审批通过', type: 'boolean' },
  { field: 'createdAt', headerName: '创建日期', type: 'date' },
  { field: 'note', headerName: '备注', type: 'string' },
];

const sampleRows: SampleOrder[] = [
  {
    id: 'ORD-001',
    customer: '星河智造科技',
    amount: 128000,
    status: 'paid',
    approved: true,
    createdAt: '2026-10-12',
    note: '含税, 季度框架协议',
  },
  {
    id: 'ORD-002',
    customer: '华东云网数据',
    amount: 45000,
    status: 'pending',
    approved: false,
    createdAt: '2026-11-01',
    note: '',
  },
];

test('getDensityMetrics returns exact MUI X density row/header heights', () => {
  const compact = getDensityMetrics('compact');
  const standard = getDensityMetrics('standard');
  const comfortable = getDensityMetrics('comfortable');

  assert.equal(compact.rowHeight, 36);
  assert.equal(standard.rowHeight, 52);
  assert.equal(comfortable.rowHeight, 67);
  assert.equal(compact.headerHeight, 40);
  assert.equal(standard.headerHeight, 56);
  assert.equal(comfortable.headerHeight, 68);
});

test('getOperatorsForColumnType returns appropriate operators per GridColType', () => {
  const numOps = getOperatorsForColumnType('number').map((o) => o.value);
  assert.ok(numOps.includes('>'));
  assert.ok(numOps.includes('<='));
  assert.ok(!numOps.includes('contains'));

  const strOps = getOperatorsForColumnType('string').map((o) => o.value);
  assert.ok(strOps.includes('contains'));
  assert.ok(strOps.includes('startsWith'));
  assert.ok(strOps.includes('isEmpty'));
});

test('evaluateFilterItem handles string, number, boolean, date, and empty operators', () => {
  assert.equal(
    evaluateFilterItem('星河智造科技', { id: '1', field: 'customer', operator: 'contains', value: '智造' }, sampleColumns[1]),
    true,
  );
  assert.equal(
    evaluateFilterItem('ORD-001', { id: '2', field: 'id', operator: 'startsWith', value: 'ord-' }, sampleColumns[0]),
    true,
  );
  assert.equal(
    evaluateFilterItem(128000, { id: '3', field: 'amount', operator: '>', value: '100000' }, sampleColumns[2]),
    true,
  );
  assert.equal(
    evaluateFilterItem(45000, { id: '4', field: 'amount', operator: '>', value: '100000' }, sampleColumns[2]),
    false,
  );
  assert.equal(
    evaluateFilterItem('', { id: '5', field: 'note', operator: 'isEmpty' }, sampleColumns[6]),
    true,
  );
  assert.equal(
    evaluateFilterItem(true, { id: '6', field: 'approved', operator: 'is', value: 'true' }, sampleColumns[4]),
    true,
  );
  assert.equal(
    evaluateFilterItem('2026-11-01', { id: '7', field: 'createdAt', operator: '>=', value: '2026-11-01' }, sampleColumns[5]),
    true,
  );
});

test('evaluateFilterModel evaluates AND/OR multi-filters and quickFilterValues', () => {
  const andModel: GridFilterModel = {
    logicOperator: 'and',
    items: [
      { id: 'f1', field: 'amount', operator: '>', value: 50000 },
      { id: 'f2', field: 'status', operator: 'is', value: 'paid' },
    ],
  };
  assert.equal(evaluateFilterModel(sampleRows[0], andModel, sampleColumns), true);
  assert.equal(evaluateFilterModel(sampleRows[1], andModel, sampleColumns), false);

  const orModel: GridFilterModel = {
    logicOperator: 'or',
    items: [
      { id: 'f1', field: 'amount', operator: '>', value: 100000 },
      { id: 'f2', field: 'status', operator: 'is', value: 'pending' },
    ],
  };
  assert.equal(evaluateFilterModel(sampleRows[0], orModel, sampleColumns), true);
  assert.equal(evaluateFilterModel(sampleRows[1], orModel, sampleColumns), true);

  const quickModel: GridFilterModel = {
    items: [],
    quickFilterValues: ['华东', '待审核'],
  };
  assert.equal(evaluateFilterModel(sampleRows[0], quickModel, sampleColumns), false);
  assert.equal(evaluateFilterModel(sampleRows[1], quickModel, sampleColumns), true);
});

test('computePinnedOffsets calculates sticky pixel offsets and boundary markers', () => {
  const cols = [
    { id: '__check__', size: 48 },
    { id: 'id', size: 130 },
    { id: 'customer', size: 220 },
    { id: 'amount', size: 140 },
    { id: 'actions', size: 90 },
  ];

  const layout = computePinnedOffsets(cols, ['__check__', 'id'], ['actions']);

  assert.deepEqual(layout.__check__, { side: 'left', offset: 0, isBoundary: false });
  assert.deepEqual(layout.id, { side: 'left', offset: 48, isBoundary: true });
  assert.deepEqual(layout.customer, { side: false, offset: 0, isBoundary: false });
  assert.deepEqual(layout.actions, { side: 'right', offset: 0, isBoundary: true });
});

test('serializeRowsToCsv formats values, escapes commas/quotes, and adds UTF-8 BOM', () => {
  const csv = serializeRowsToCsv(sampleRows, sampleColumns);
  assert.equal(csv.startsWith('\uFEFF'), true);
  const lines = csv.slice(1).split('\r\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0], '订单编号,客户名称,订单金额,状态,审批通过,创建日期,备注');
  assert.equal(
    lines[1],
    'ORD-001,星河智造科技,"¥128,000",已结算,是,2026-10-12,"含税, 季度框架协议"',
  );
  assert.equal(formatCellValue(false, sampleRows[1], sampleColumns[4]), '否');
});

test('reorderColumnIds moves columns before/after target cleanly', () => {
  const initial = ['orderNo', 'customer', 'status', 'amount', 'region'];
  assert.deepEqual(
    reorderColumnIds(initial, 'amount', 'customer', 'before'),
    ['orderNo', 'amount', 'customer', 'status', 'region'],
  );
  assert.deepEqual(
    reorderColumnIds(initial, 'customer', 'amount', 'after'),
    ['orderNo', 'status', 'amount', 'customer', 'region'],
  );
  assert.deepEqual(
    reorderColumnIds(initial, 'status', 'status', 'before'),
    initial,
  );
  assert.deepEqual(
    reorderColumnIds(initial, 'missing', 'status', 'before'),
    initial,
  );
});

test('parseEditedCellValue validates and coerces string, number, boolean, and date edits', () => {
  assert.deepEqual(
    parseEditedCellValue('¥250,000', sampleRows[0], sampleColumns[2]),
    { valid: true, value: 250000 },
  );
  const badNum = parseEditedCellValue('abc', sampleRows[0], sampleColumns[2]);
  assert.equal(badNum.valid, false);

  assert.deepEqual(
    parseEditedCellValue('  新客户名称  ', sampleRows[0], sampleColumns[1]),
    { valid: true, value: '新客户名称' },
  );
  assert.deepEqual(
    parseEditedCellValue('true', sampleRows[1], sampleColumns[4]),
    { valid: true, value: true },
  );
  assert.deepEqual(
    parseEditedCellValue('2026-12-01', sampleRows[0], sampleColumns[5]),
    { valid: true, value: '2026-12-01' },
  );
});

test('upsertHeaderFilterItem syncs per-column header filters with GridFilterModel', () => {
  const base: GridFilterModel = { items: [], logicOperator: 'and', quickFilterValues: [] };
  const withCustomer = upsertHeaderFilterItem(base, 'customer', '星河', sampleColumns[1]);
  assert.equal(withCustomer.items.length, 1);
  assert.equal(withCustomer.items[0].operator, 'contains');
  assert.equal(getHeaderFilterValue(withCustomer, 'customer'), '星河');

  const withAmount = upsertHeaderFilterItem(withCustomer, 'amount', '100000', sampleColumns[2]);
  assert.equal(withAmount.items.length, 2);
  assert.equal(withAmount.items[1].operator, '>=');

  const clearedCustomer = upsertHeaderFilterItem(withAmount, 'customer', '', sampleColumns[1]);
  assert.equal(clearedCustomer.items.length, 1);
  assert.equal(clearedCustomer.items[0].field, 'amount');
  assert.equal(getHeaderFilterValue(clearedCustomer, 'customer'), '');
});

test('swapColumnOrder performs live directional swapping like MUI X column reorder', () => {
  const initial = ['orderNo', 'customer', 'status', 'amount', 'region'];
  // Dragging customer rightward over amount places customer after amount
  assert.deepEqual(
    swapColumnOrder(initial, 'customer', 'amount'),
    ['orderNo', 'status', 'amount', 'customer', 'region'],
  );
  // Dragging amount leftward over customer places amount before customer
  assert.deepEqual(
    swapColumnOrder(initial, 'amount', 'customer'),
    ['orderNo', 'amount', 'customer', 'status', 'region'],
  );
});

test('upsertHeaderFilterOperator switches column header filter operators including unary ops', () => {
  const base: GridFilterModel = { items: [], logicOperator: 'and', quickFilterValues: [] };
  assert.equal(getHeaderFilterOperator(base, 'amount', sampleColumns[2]), '>=');

  const withLt = upsertHeaderFilterOperator(base, 'amount', '<', sampleColumns[2]);
  assert.equal(getHeaderFilterOperator(withLt, 'amount', sampleColumns[2]), '<');

  const withVal = upsertHeaderFilterItem(withLt, 'amount', '50000', sampleColumns[2]);
  assert.equal(withVal.items[0].operator, '<');
  assert.equal(withVal.items[0].value, '50000');

  const withEmpty = upsertHeaderFilterOperator(withVal, 'amount', 'isEmpty', sampleColumns[2]);
  assert.equal(withEmpty.items[0].operator, 'isEmpty');
  assert.equal(withEmpty.items[0].value, '');
});

test('buildColumnGroupHeaderRows merges contiguous columns and respects pinned boundaries', () => {
  const cols = [
    { id: '__check__', size: 50 },
    { id: 'orderNo', size: 140 },
    { id: 'customer', size: 200 },
    { id: 'amount', size: 150 },
    { id: 'actions', size: 92 },
  ];
  const pinned = computePinnedOffsets(cols, ['__check__', 'orderNo'], ['actions']);
  const model: GridColumnGroupingModel = [
    {
      groupId: 'identity',
      headerName: '合同标识',
      children: [{ field: 'orderNo' }, { field: 'customer' }],
    },
    {
      groupId: 'finance',
      headerName: '财务信息',
      children: [{ field: 'amount' }],
    },
  ];
  const rows = buildColumnGroupHeaderRows(cols, model, pinned);
  assert.equal(rows.length, 1);
  // orderNo (pinned left) and customer (center) must NOT merge across the sticky pinning boundary
  assert.equal(rows[0].length, 5);
  assert.equal(rows[0][0].groupId, null);
  assert.equal(rows[0][1].groupId, 'identity');
  assert.equal(rows[0][1].pinnedSide, 'left');
  assert.equal(rows[0][1].isLeftBoundary, true);
  assert.equal(rows[0][2].groupId, 'identity');
  assert.equal(rows[0][2].pinnedSide, false);
  assert.equal(rows[0][3].groupId, 'finance');
  assert.equal(rows[0][4].pinnedSide, 'right');
});

test('reorderRowsByIndex moves rows accurately and handles out-of-bounds safely', () => {
  const list = ['A', 'B', 'C', 'D'];
  assert.deepEqual(reorderRowsByIndex(list, 0, 2), ['B', 'C', 'A', 'D']);
  assert.deepEqual(reorderRowsByIndex(list, 3, 1), ['A', 'D', 'B', 'C']);
  assert.deepEqual(reorderRowsByIndex(list, 1, 1), list);
  assert.deepEqual(reorderRowsByIndex(list, -1, 2), list);
});

test('computeColumnAutosizeWidth sizes to widest value within min/max bounds', () => {
  const measure = (s: string) => s.length * 10;
  assert.equal(
    computeColumnAutosizeWidth('客户', ['短', '较长的企业客户名称测试'], 100, 300, measure),
    142,
  );
  // Respects minWidth
  assert.equal(computeColumnAutosizeWidth('A', ['B'], 120, 300, measure), 120);
  // Respects maxWidth
  assert.equal(
    computeColumnAutosizeWidth('长标题', ['X'.repeat(80)], 100, 260, measure),
    260,
  );
});

test('validateAndMergeRowEdits atomically merges valid row drafts and rejects invalid fields', () => {
  const editableCols: GridColDef<SampleOrder>[] = sampleColumns.map((c) => ({
    ...c,
    editable: true,
  }));
  const ok = validateAndMergeRowEdits(
    sampleRows[0],
    { customer: '新客户集团', amount: '250000' },
    editableCols,
  );
  assert.equal(ok.valid, true);
  assert.equal(ok.changed, true);
  assert.equal(ok.nextRow.customer, '新客户集团');
  assert.equal(ok.nextRow.amount, 250000);

  const bad = validateAndMergeRowEdits(
    sampleRows[0],
    { customer: '有效客户', amount: 'not-a-number' },
    editableCols,
  );
  assert.equal(bad.valid, false);
  assert.equal(bad.field, 'amount');
  assert.equal(bad.nextRow, sampleRows[0]);
});

test('buildTreeDataRows constructs hierarchy, counts descendants, and honors expansion state', () => {
  const treeFixture: SampleOrder[] = [
    ...sampleRows,
    {
      id: 'ORD-003',
      customer: '远景传感科技',
      amount: 92000,
      status: 'paid',
      approved: true,
      createdAt: '2026-11-08',
    },
  ];
  const getPath = (r: SampleOrder) => [r.status, r.id];
  const expandedNone = new Set<string>();
  const collapsed = buildTreeDataRows(treeFixture, getPath, expandedNone);
  // Only top-level status groups visible ('paid', 'pending')
  assert.equal(collapsed.length, 2);
  assert.equal(collapsed[0].isGroup, true);
  assert.equal(collapsed[0].descendantCount, 2);

  const defaultDepth1 = collectDefaultExpandedTreeGroups(treeFixture, getPath, 1);
  const expanded = buildTreeDataRows(treeFixture, getPath, new Set(defaultDepth1));
  // 2 parent groups + 3 leaf rows = 5 rows
  assert.equal(expanded.length, 5);
  assert.equal(expanded[1].depth, 1);
  assert.equal(expanded[1].isGroup, false);
  assert.equal(expanded[1].row?.id, 'ORD-001');
});

test('computeColumnAggregation calculates sum, avg, min, max, size and formats cleanly', () => {
  const amountCol = sampleColumns[2];
  assert.equal(computeColumnAggregation(sampleRows, amountCol, 'sum'), 173000);
  assert.equal(computeColumnAggregation(sampleRows, amountCol, 'min'), 45000);
  assert.equal(computeColumnAggregation(sampleRows, amountCol, 'max'), 128000);
  assert.equal(computeColumnAggregation(sampleRows, amountCol, 'size'), 2);
  const avg = computeColumnAggregation(sampleRows, amountCol, 'avg');
  assert.equal(avg, 86500);
  assert.equal(formatAggregatedValue(173000, 'sum', amountCol), '¥173,000');
  assert.equal(formatAggregatedValue(2, 'size', amountCol), '2 项');
  assert.equal(formatAggregatedValue(1000, 'size', amountCol), '1,000 项');
});

test('computeVirtualRowWindow slices viewport accurately and conserves total scroll height', () => {
  const win = computeVirtualRowWindow({
    totalRows: 1000,
    scrollTop: 5200,
    viewportHeight: 520,
    rowHeight: 52,
    overscan: 5,
  });
  assert.equal(win.startIndex, 95);
  assert.equal(win.endIndex, 115);
  assert.equal(
    win.topSpacerHeight + (win.endIndex - win.startIndex) * 52 + win.bottomSpacerHeight,
    1000 * 52,
  );
  // Clamps cleanly at bottom
  const endWin = computeVirtualRowWindow({
    totalRows: 1000,
    scrollTop: 999999,
    viewportHeight: 520,
    rowHeight: 52,
    overscan: 4,
  });
  assert.equal(endWin.endIndex, 1000);
  assert.equal(endWin.bottomSpacerHeight, 0);
});

test('serializeCellsToTsv produces Excel-ready tab-separated rows', () => {
  const tsv = serializeCellsToTsv(sampleRows, sampleColumns.slice(0, 3));
  const lines = tsv.split('\n');
  assert.equal(lines.length, 2);
  assert.equal(lines[0], 'ORD-001\t星河智造科技\t¥128,000');
  assert.equal(lines[1], 'ORD-002\t华东云网数据\t¥45,000');
});

test('buildRowGroupingRows groups by formatted column values and preserves descendants for rollups', () => {
  const expandedKeys = new Set(
    collectDefaultExpandedRowGroups(sampleRows, ['status'], sampleColumns, 1),
  );
  const grouped = buildRowGroupingRows(
    sampleRows,
    ['status'],
    sampleColumns,
    expandedKeys,
  );
  // 2 status groups ('已结算', '待审核') + 2 leaf rows = 4 rows
  assert.equal(grouped.length, 4);
  assert.equal(grouped[0].isGroup, true);
  assert.equal(grouped[0].label, '已结算');
  assert.equal(grouped[0].descendantCount, 1);
  assert.equal(grouped[1].isGroup, false);
  assert.equal(grouped[1].row?.id, 'ORD-001');
  assert.equal(grouped[2].label, '待审核');
});

test('cell range selection normalizes coords, detects perimeter edges, computes stats and TSV', () => {
  // Reverse drag from (1, 2) back to (0, 1)
  const range = { start: { rowIndex: 1, colIndex: 2 }, end: { rowIndex: 0, colIndex: 1 } };
  const norm = normalizeCellRange(range);
  assert.deepEqual(norm, { minRow: 0, maxRow: 1, minCol: 1, maxCol: 2 });
  assert.equal(isCellInRange(0, 1, range), true);
  assert.equal(isCellInRange(0, 0, range), false);

  const topLeftEdges = getCellRangeEdges(0, 1, range);
  assert.deepEqual(topLeftEdges, { top: true, right: false, bottom: false, left: true });
  const bottomRightEdges = getCellRangeEdges(1, 2, range);
  assert.deepEqual(bottomRightEdges, { top: false, right: true, bottom: true, left: false });

  const stats = computeCellRangeStats(sampleRows, sampleColumns, range);
  assert.equal(stats.cellCount, 4);
  assert.equal(stats.numericCount, 2);
  assert.equal(stats.sum, 173000);
  assert.equal(stats.avg, 86500);

  const rangeTsv = serializeCellRangeToTsv(sampleRows, sampleColumns, range);
  assert.equal(rangeTsv, '星河智造科技\t¥128,000\n华东云网数据\t¥45,000');
});

test('parseTsvClipboardMatrix and applyClipboardPasteMatrix update editable cells safely', () => {
  const editableCols = sampleColumns.map((c) => ({
    ...c,
    editable: c.field === 'customer' || c.field === 'amount' || c.field === 'status',
  }));
  const matrix = parseTsvClipboardMatrix('新客户A\t¥200,000\t待审核\n新客户B\t55000\t已结算\n');
  assert.equal(matrix.length, 2);
  assert.equal(matrix[0].length, 3);

  const result = applyClipboardPasteMatrix(sampleRows, editableCols, 0, 1, matrix);
  assert.equal(result.updates.length, 2);
  assert.equal(result.updatedCells, 6);
  assert.equal(result.updates[0].nextRow.customer, '新客户A');
  assert.equal(result.updates[0].nextRow.amount, 200000);
  assert.equal(result.updates[0].nextRow.status, 'pending');
  assert.equal(result.updates[1].nextRow.amount, 55000);
  assert.equal(result.updates[1].nextRow.status, 'paid');
});

test('computeAutoFillUpdates repeats values and extrapolates arithmetic numeric series', () => {
  const rows = [
    { id: 1, customer: 'A', amount: 100, status: 'paid' },
    { id: 2, customer: 'B', amount: 200, status: 'pending' },
    { id: 3, customer: 'C', amount: 50, status: 'overdue' },
    { id: 4, customer: 'D', amount: 80, status: 'overdue' },
  ];
  const cols: GridColDef<(typeof rows)[number]>[] = [
    { field: 'customer', headerName: '客户', editable: true },
    { field: 'amount', headerName: '金额', type: 'number', editable: true },
    { field: 'status', headerName: '状态', editable: false },
  ];

  // Fill 2 numeric cells (100, 200) + text down to row 3 -> arithmetic series 300, 400 + tiled customer
  const fillRes = computeAutoFillUpdates(
    rows,
    cols,
    { start: { rowIndex: 0, colIndex: 0 }, end: { rowIndex: 1, colIndex: 2 } },
    { start: { rowIndex: 0, colIndex: 0 }, end: { rowIndex: 3, colIndex: 2 } },
  );
  assert.equal(fillRes.updates.length, 2);
  assert.equal(fillRes.updatedCells, 4); // status skipped because editable=false
  assert.equal(fillRes.updates[0].nextRow.customer, 'A');
  assert.equal(fillRes.updates[0].nextRow.amount, 300);
  assert.equal(fillRes.updates[0].nextRow.status, 'overdue');
  assert.equal(fillRes.updates[1].nextRow.customer, 'B');
  assert.equal(fillRes.updates[1].nextRow.amount, 400);
});

test('serializeRowsToXlsxBytes generates a valid OOXML ZIP workbook and JSON export', () => {
  const bytes = serializeRowsToXlsxBytes(sampleRows, sampleColumns, '企业订单');
  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.length > 500);
  // ZIP Local File Header magic bytes: PK\x03\x04
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  assert.equal(bytes[2], 0x03);
  assert.equal(bytes[3], 0x04);

  const decoded = new TextDecoder().decode(bytes);
  assert.ok(decoded.includes('[Content_Types].xml'));
  assert.ok(decoded.includes('xl/worksheets/sheet1.xml'));
  assert.ok(decoded.includes('星河智造科技'));
  assert.ok(decoded.includes('<v>128000</v>'));

  const json = serializeRowsToJson(sampleRows.slice(0, 1), sampleColumns);
  const parsed = JSON.parse(json) as Array<Record<string, unknown>>;
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0]['客户名称'], '星河智造科技');
  assert.equal(parsed[0]['订单金额'], 128000);
});

test('computeShiftRowSelectionRange selects inclusive visual range upward and downward', () => {
  const ids = ['r1', 'r2', 'r3', 'r4', 'r5'];
  assert.deepEqual(computeShiftRowSelectionRange(ids, 'r2', 'r4'), [
    'r2',
    'r3',
    'r4',
  ]);
  assert.deepEqual(computeShiftRowSelectionRange(ids, 'r4', 'r1'), [
    'r1',
    'r2',
    'r3',
    'r4',
  ]);
  assert.deepEqual(computeShiftRowSelectionRange(ids, null, 'r3'), ['r3']);
});

test('reorderRowGroupingModel moves grouping dimensions without duplication', () => {
  assert.deepEqual(
    reorderRowGroupingModel(['region', 'status', 'priority'], 'priority', 'region'),
    ['priority', 'region', 'status'],
  );
  assert.deepEqual(
    reorderRowGroupingModel(['region', 'status'], 'region', 'status'),
    ['status', 'region'],
  );
});

test('buildPivotTable builds row buckets, multi-level column groups, aggregations, and row totals', () => {
  const pivotRows = [
    { id: '1', region: '华东区', status: 'paid', amount: 120000 },
    { id: '2', region: '华东区', status: 'pending', amount: 240000 },
    { id: '3', region: '华北区', status: 'paid', amount: 90000 },
    { id: '4', region: '华南区', status: 'overdue', amount: 60000 },
  ];
  const pivotCols: GridColDef<(typeof pivotRows)[number]>[] = [
    { field: 'id', headerName: '订单编号', type: 'string' },
    { field: 'region', headerName: '负责区域', type: 'string' },
    {
      field: 'status',
      headerName: '状态',
      type: 'singleSelect',
      valueOptions: [
        { value: 'paid', label: '已结算' },
        { value: 'pending', label: '待审核' },
        { value: 'overdue', label: '已逾期' },
      ],
    },
    { field: 'amount', headerName: '订单金额', type: 'number' },
  ];

  const result = buildPivotTable(pivotRows, pivotCols, {
    rows: ['region'],
    columns: ['status'],
    values: [
      { field: 'amount', aggFunc: 'sum' },
      { field: 'id', aggFunc: 'size' },
    ],
  });

  // 3 distinct regions: 华东区, 华北区, 华南区
  assert.equal(result.rows.length, 3);
  assert.deepEqual(result.pinnedLeftFields, ['region']);
  assert.equal(result.pinnedRightFields.length, 2);

  // Column groups: 3 distinct statuses + 1 行总计 group
  assert.equal(result.columnGroupingModel.length, 4);
  assert.equal(
    result.columnGroupingModel[result.columnGroupingModel.length - 1]
      ?.headerName,
    '行总计',
  );

  // Check 华东区 row totals (120000 + 240000 = 360000, count = 2)
  const eastRow = result.rows.find((r) => r.region === '华东区');
  assert.ok(eastRow);
  const totalAmountField = result.pinnedRightFields.find((f) =>
    f.includes('__amount__sum'),
  );
  const totalCountField = result.pinnedRightFields.find((f) =>
    f.includes('__id__size'),
  );
  assert.ok(totalAmountField && totalCountField);
  assert.equal(eastRow[totalAmountField], 360000);
  assert.equal(eastRow[totalCountField], 2);

  // Changing to avg without column dimensions computes flat averages
  const flatAvg = buildPivotTable(pivotRows, pivotCols, {
    rows: ['region'],
    columns: [],
    values: [{ field: 'amount', aggFunc: 'avg' }],
  });
  assert.equal(flatAvg.columnGroupingModel.length, 0);
  const eastAvgRow = flatAvg.rows.find((r) => r.region === '华东区');
  assert.equal(eastAvgRow?.pv__flat__amount__avg, 180000);
});

test('edit history supports push, undo, redo, redo truncation, and maxEntries cap', () => {
  let history = createEditHistoryState<SampleOrder>(2);
  const r0 = sampleRows[0];
  const r1 = { ...r0, amount: 200000 };
  const r2 = { ...r0, amount: 300000 };
  const r3 = { ...r0, amount: 400000 };

  history = pushEditHistoryEntry(history, {
    label: 'edit-1',
    changes: [{ oldRow: r0, newRow: r1 }],
  });
  history = pushEditHistoryEntry(history, {
    label: 'edit-2',
    changes: [{ oldRow: r1, newRow: r2 }],
  });
  history = pushEditHistoryEntry(history, {
    label: 'edit-3',
    changes: [{ oldRow: r2, newRow: r3 }],
  });

  // Capped at maxEntries = 2
  assert.equal(history.past.length, 2);
  assert.equal(history.past[0].label, 'edit-2');
  assert.equal(history.past[1].label, 'edit-3');

  const u1 = undoEditHistory(history);
  assert.equal(u1.batch?.label, 'edit-3');
  assert.equal(u1.state.past.length, 1);
  assert.equal(u1.state.future.length, 1);

  const re1 = redoEditHistory(u1.state);
  assert.equal(re1.batch?.label, 'edit-3');
  assert.equal(re1.state.past.length, 2);
  assert.equal(re1.state.future.length, 0);

  // Undo then push a brand new edit clears future stack
  const u2 = undoEditHistory(re1.state);
  const branched = pushEditHistoryEntry(u2.state, {
    label: 'edit-branch',
    changes: [{ oldRow: r2, newRow: { ...r2, amount: 999 } }],
  });
  assert.equal(branched.future.length, 0);
  assert.equal(branched.past[branched.past.length - 1].label, 'edit-branch');
});

test('upsertExactValueFilter builds typed exact filters and preserves other column filters', () => {
  const initial: GridFilterModel = {
    items: [
      { id: 'f1', field: 'customer', operator: 'contains', value: '星河' },
    ],
    logicOperator: 'and',
    quickFilterValues: [],
  };

  const statusCol = sampleColumns.find((c) => c.field === 'status');
  const amountCol = sampleColumns.find((c) => c.field === 'amount');
  const customerCol = sampleColumns.find((c) => c.field === 'customer');

  const m1 = upsertExactValueFilter(initial, 'status', 'paid', statusCol);
  assert.equal(m1.items.length, 2);
  assert.equal(m1.items[1].operator, 'is');
  assert.equal(m1.items[1].value, 'paid');

  const m2 = upsertExactValueFilter(m1, 'amount', 128000, amountCol);
  assert.equal(m2.items.length, 3);
  assert.equal(m2.items[2].operator, '=');
  assert.equal(m2.items[2].value, '128000');

  // Replaces existing customer filter without duplicating
  const m3 = upsertExactValueFilter(m2, 'customer', '星河智造科技', customerCol);
  assert.equal(m3.items.length, 3);
  const custFilter = m3.items.find((i) => i.field === 'customer');
  assert.equal(custFilter?.operator, 'equals');
  assert.equal(custFilter?.value, '星河智造科技');

  // Empty value uses isEmpty
  const m4 = upsertExactValueFilter(m3, 'customer', '', customerCol);
  assert.equal(
    m4.items.find((i) => i.field === 'customer')?.operator,
    'isEmpty',
  );
});

test('isAnyOf operator matches multiple values on singleSelect and string columns', () => {
  const statusCol = sampleColumns.find((c) => c.field === 'status');
  const customerCol = sampleColumns.find((c) => c.field === 'customer');

  assert.ok(
    getOperatorsForColumnType('singleSelect').some((o) => o.value === 'isAnyOf'),
  );
  assert.ok(
    getOperatorsForColumnType('string').some((o) => o.value === 'isAnyOf'),
  );

  // Empty array is inactive and does not exclude rows
  assert.equal(
    isFilterItemActive({ id: 'a0', field: 'status', operator: 'isAnyOf', value: [] }),
    false,
  );
  assert.equal(
    evaluateFilterItem(
      'paid',
      { id: 'a0', field: 'status', operator: 'isAnyOf', value: [] },
      statusCol,
    ),
    true,
  );

  // Multi-select match by raw value or formatted label
  const activeItem = {
    id: 'a1',
    field: 'status',
    operator: 'isAnyOf' as const,
    value: ['paid', 'pending'],
  };
  assert.equal(isFilterItemActive(activeItem), true);
  assert.equal(evaluateFilterItem('paid', activeItem, statusCol), true);
  assert.equal(evaluateFilterItem('pending', activeItem, statusCol), true);
  assert.equal(evaluateFilterItem('overdue', activeItem, statusCol), false);

  // String multi-value match (case-insensitive)
  const strItem = {
    id: 'a2',
    field: 'customer',
    operator: 'isAnyOf' as const,
    value: ['星河智造科技', '博雅医疗'],
  };
  assert.equal(evaluateFilterItem('星河智造科技', strItem, customerCol), true);
  assert.equal(evaluateFilterItem('华东云网数据', strItem, customerCol), false);
});

test('buildChartSeries aggregates live rows across sum, avg, and size with share calculation', () => {
  const chartRows = [
    { id: '1', region: '华东区', amount: 100000, status: 'settled' },
    { id: '2', region: '华东区', amount: 300000, status: 'settled' },
    { id: '3', region: '华南区', amount: 200000, status: 'pending' },
  ];
  const chartCols: GridColDef<(typeof chartRows)[number]>[] = [
    { field: 'region', headerName: '负责区域', type: 'singleSelect', valueOptions: ['华东区', '华南区'] },
    { field: 'amount', headerName: '订单金额', type: 'number', valueFormatter: (v) => `¥${Number(v).toLocaleString('zh-CN')}` },
    { field: 'status', headerName: '订单状态', type: 'singleSelect', valueOptions: [{ value: 'settled', label: '已结算' }, { value: 'pending', label: '待审核' }] },
  ];

  const { dimensionColumns, valueColumns } = getChartEligibleFields(chartCols);
  assert.equal(dimensionColumns.length, 2);
  assert.equal(valueColumns.length, 1);

  const sumRes = buildChartSeries(chartRows, chartCols, {
    chartType: 'bar',
    dimensionField: 'region',
    valueField: 'amount',
    aggFunc: 'sum',
  });
  assert.equal(sumRes.data.length, 2);
  assert.equal(sumRes.data[0].label, '华东区');
  assert.equal(sumRes.data[0].value, 400000);
  assert.equal(sumRes.data[1].label, '华南区');
  assert.equal(sumRes.data[1].value, 200000);
  assert.ok(Math.abs(sumRes.data[0].share - 400000 / 600000) < 1e-6);

  const avgRes = buildChartSeries(chartRows, chartCols, {
    chartType: 'line',
    dimensionField: 'region',
    valueField: 'amount',
    aggFunc: 'avg',
  });
  assert.equal(avgRes.data.find((d) => d.label === '华东区')?.value, 200000);

  const sizeRes = buildChartSeries(chartRows, chartCols, {
    chartType: 'pie',
    dimensionField: 'status',
    valueField: 'amount',
    aggFunc: 'size',
  });
  assert.equal(sizeRes.data[0].label, '已结算');
  assert.equal(sizeRes.data[0].value, 2);
});

test('computeRowSpanMatrix merges consecutive equal values and respects rowSpan: false opt-out', () => {
  const rows = [
    { id: '1', region: '华东区', status: '已结算', amount: 100 },
    { id: '2', region: '华东区', status: '已结算', amount: 100 },
    { id: '3', region: '华东区', status: '待审核', amount: 200 },
    { id: '4', region: '华南区', status: '待审核', amount: 300 },
  ];
  const cols: GridColDef<(typeof rows)[number]>[] = [
    { field: 'region', headerName: '区域' },
    { field: 'status', headerName: '状态' },
    { field: 'amount', headerName: '金额', type: 'number', rowSpan: false },
  ];

  const spanMap = computeRowSpanMatrix(rows, cols, true);
  assert.equal(spanMap.get('0:region'), 3);
  assert.equal(spanMap.get('1:region'), 0);
  assert.equal(spanMap.get('2:region'), 0);
  assert.equal(spanMap.get('3:region'), undefined);

  assert.equal(spanMap.get('0:status'), 2);
  assert.equal(spanMap.get('1:status'), 0);
  assert.equal(spanMap.get('2:status'), 2);
  assert.equal(spanMap.get('3:status'), 0);

  // rowSpan: false prevents merging amount even though rows 0 and 1 are both 100
  assert.equal(spanMap.get('0:amount'), undefined);
  assert.equal(spanMap.get('1:amount'), undefined);

  // Disabled returns empty map
  assert.equal(computeRowSpanMatrix(rows, cols, false).size, 0);
});

test('computeColSpanRow computes combined column width and marks covered trailing cells', () => {
  const row = { id: 'sum', label: '汇总', col2: '', col3: 'ok' };
  const cols: GridColDef<typeof row>[] = [
    {
      field: 'label',
      colSpan: (_val, r) => (r.id === 'sum' ? 2 : 1),
    },
    { field: 'col2' },
    { field: 'col3' },
  ];
  const layout = computeColSpanRow(row, cols, [120, 150, 100]);
  assert.equal(layout[0].spanCount, 2);
  assert.equal(layout[0].totalWidth, 270);
  assert.equal(layout[0].covered, false);

  assert.equal(layout[1].covered, true);
  assert.equal(layout[1].totalWidth, 0);

  assert.equal(layout[2].spanCount, 1);
  assert.equal(layout[2].totalWidth, 100);
  assert.equal(layout[2].covered, false);
});

test('date and dateTime columns support official semantic operators and formatting', () => {
  const dateOps = getOperatorsForColumnType('date').map((o) => o.value);
  assert.deepEqual(dateOps, [
    'is',
    'not',
    'after',
    'onOrAfter',
    'before',
    'onOrBefore',
    'isEmpty',
    'isNotEmpty',
  ]);
  assert.deepEqual(
    getOperatorsForColumnType('dateTime').map((o) => o.value),
    dateOps,
  );

  const dateCol: GridColDef<SampleOrder> = {
    field: 'createdAt',
    headerName: '创建日期',
    type: 'date',
  };
  assert.equal(
    evaluateFilterItem(
      '2026-10-15',
      { id: 'd1', field: 'createdAt', operator: 'after', value: '2026-10-01' },
      dateCol,
    ),
    true,
  );
  assert.equal(
    evaluateFilterItem(
      '2026-10-01',
      { id: 'd2', field: 'createdAt', operator: 'after', value: '2026-10-01' },
      dateCol,
    ),
    false,
  );
  assert.equal(
    evaluateFilterItem(
      '2026-10-01',
      { id: 'd3', field: 'createdAt', operator: 'onOrAfter', value: '2026-10-01' },
      dateCol,
    ),
    true,
  );
  assert.equal(
    evaluateFilterItem(
      '2026-09-20',
      { id: 'd4', field: 'createdAt', operator: 'before', value: '2026-10-01' },
      dateCol,
    ),
    true,
  );
  assert.equal(
    evaluateFilterItem(
      '2026-10-01',
      { id: 'd5', field: 'createdAt', operator: 'onOrBefore', value: '2026-10-01' },
      dateCol,
    ),
    true,
  );
  assert.equal(
    evaluateFilterItem(
      '2026-10-15',
      { id: 'd6', field: 'createdAt', operator: 'not', value: '2026-10-01' },
      dateCol,
    ),
    true,
  );
  assert.equal(
    evaluateFilterItem(
      '2026-10-01',
      { id: 'd7', field: 'createdAt', operator: 'not', value: '2026-10-01' },
      dateCol,
    ),
    false,
  );

  const dtRow = { id: 'dt-1', updatedAt: '2026-10-15T14:30' };
  const dtCol: GridColDef<typeof dtRow> = {
    field: 'updatedAt',
    headerName: '更新时间',
    type: 'dateTime',
  };
  assert.equal(formatCellValue('2026-10-15T14:30', dtRow, dtCol), '2026-10-15 14:30');
  assert.equal(
    evaluateFilterItem(
      '2026-10-15T14:30',
      { id: 'dt1', field: 'updatedAt', operator: 'after', value: '2026-10-15T12:00' },
      dtCol,
    ),
    true,
  );
  assert.equal(
    evaluateFilterItem(
      '2026-10-15T09:15',
      { id: 'dt2', field: 'updatedAt', operator: 'before', value: '2026-10-15T12:00' },
      dtCol,
    ),
    true,
  );
});

test('evaluateEditCellValidation and applyValueSetter enforce preProcessEditCellProps and custom setters', () => {
  const amountCol: GridColDef<SampleOrder> = {
    field: 'amount',
    headerName: '订单金额',
    type: 'number',
    editable: true,
    preProcessEditCellProps: ({ props }) => {
      const n = Number(props.value);
      if (Number.isNaN(n) || n < 0) {
        return { ...props, error: '订单金额不能为负数' };
      }
      return { ...props, value: Math.round(n), error: false };
    },
    valueSetter: (value, row) => ({
      ...row,
      amount: Number(value),
      note: `updated:${value}`,
    }),
  };

  const invalid = evaluateEditCellValidation('-500', sampleRows[0], 'ORD-001', amountCol);
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errorMessage, '订单金额不能为负数');

  const valid = evaluateEditCellValidation('380000.6', sampleRows[0], 'ORD-001', amountCol);
  assert.equal(valid.valid, true);
  assert.equal(valid.value, 380001);

  const nextRow = applyValueSetter(sampleRows[0], valid.value, amountCol);
  assert.equal(nextRow.amount, 380001);
  assert.equal(nextRow.note, 'updated:380001');
});

test('canEditCell blocks locked cells in row editing, clipboard paste, and autofill', () => {
  const editableCols: GridColDef<SampleOrder>[] = sampleColumns.map((c) => ({
    ...c,
    editable: c.field === 'customer' || c.field === 'amount',
  }));
  const canEditCell = (row: SampleOrder) => row.status !== 'paid';

  // Row 0 is 'paid' (locked), Row 1 is 'pending' (unlocked)
  const lockedRowEdit = validateAndMergeRowEdits(
    sampleRows[0],
    { amount: '999999' },
    editableCols,
    sampleRows[0].id,
    canEditCell,
  );
  assert.equal(lockedRowEdit.valid, true);
  assert.equal(lockedRowEdit.changed, false);
  assert.equal(lockedRowEdit.nextRow.amount, 128000);

  const pasteRes = applyClipboardPasteMatrix(
    sampleRows,
    editableCols,
    0,
    1,
    [
      ['被锁定客户', '999999'],
      ['已更新客户', '88000'],
    ],
    canEditCell,
  );
  // Row 0 skipped completely; only Row 1 updated (2 cells)
  assert.equal(pasteRes.updates.length, 1);
  assert.equal(pasteRes.updates[0].rowIndex, 1);
  assert.equal(pasteRes.updates[0].nextRow.customer, '已更新客户');
  assert.equal(pasteRes.updates[0].nextRow.amount, 88000);
  assert.equal(pasteRes.updatedCells, 2);

  const fillRows: SampleOrder[] = [
    { ...sampleRows[1], id: 'R1', amount: 1000, status: 'pending' },
    { ...sampleRows[0], id: 'R2', amount: 2000, status: 'paid' },
    { ...sampleRows[1], id: 'R3', amount: 3000, status: 'pending' },
  ];
  const fillRes = computeAutoFillUpdates(
    fillRows,
    editableCols,
    { start: { rowIndex: 0, colIndex: 2 }, end: { rowIndex: 0, colIndex: 2 } },
    { start: { rowIndex: 0, colIndex: 2 }, end: { rowIndex: 2, colIndex: 2 } },
    canEditCell,
  );
  // Row 1 ('paid') skipped; only Row 2 ('pending') filled
  assert.equal(fillRes.updates.length, 1);
  assert.equal(fillRes.updates[0].rowIndex, 2);
  assert.equal(fillRes.updates[0].nextRow.amount, 1000);
});

test('resolveRowHeightConfig handles default, fixed pixel height, and auto dynamic height', () => {
  const row = sampleRows[0];
  assert.deepEqual(resolveRowHeightConfig(row, 'ORD-001', 52, undefined), {
    isAuto: false,
    height: 52,
    minHeight: 52,
  });
  assert.deepEqual(resolveRowHeightConfig(row, 'ORD-001', 52, () => 'auto'), {
    isAuto: true,
    height: 'auto',
    minHeight: 52,
  });
  assert.deepEqual(resolveRowHeightConfig(row, 'ORD-001', 52, () => 84), {
    isAuto: false,
    height: 84,
    minHeight: 84,
  });
  assert.deepEqual(resolveRowHeightConfig(row, 'ORD-001', 52, () => null), {
    isAuto: false,
    height: 52,
    minHeight: 52,
  });
});




