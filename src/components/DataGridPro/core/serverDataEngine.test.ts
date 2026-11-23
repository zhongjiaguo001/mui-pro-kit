import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDataSourceCacheKey,
  createDataSourceCache,
  executeServerQuery,
} from './serverDataEngine';
import type { GridColDef } from '../types';

interface ServerOrder extends Record<string, unknown> {
  id: string;
  customer: string;
  region: string;
  amount: number;
  createdAt: string;
  approved: boolean;
}

const columns: GridColDef<ServerOrder>[] = [
  { field: 'id', headerName: '编号', type: 'string' },
  { field: 'customer', headerName: '客户', type: 'string' },
  { field: 'region', headerName: '区域', type: 'singleSelect', valueOptions: ['华东区', '华北区', '华南区'] },
  { field: 'amount', headerName: '金额', type: 'number' },
  { field: 'createdAt', headerName: '日期', type: 'date' },
  { field: 'approved', headerName: '审批', type: 'boolean' },
];

const dataset: ServerOrder[] = [
  { id: 'O-1', customer: '星河智造', region: '华东区', amount: 300000, createdAt: '2026-08-10', approved: true },
  { id: 'O-2', customer: '博雅半导体', region: '华北区', amount: 120000, createdAt: '2026-10-05', approved: false },
  { id: 'O-3', customer: '华东云网', region: '华东区', amount: 520000, createdAt: '2026-09-20', approved: true },
  { id: 'O-4', customer: '中科光学', region: '华南区', amount: 120000, createdAt: '2026-07-01', approved: true },
  { id: 'O-5', customer: '启明供应链', region: '华东区', amount: 85000, createdAt: '2026-11-12', approved: false },
];

test('executeServerQuery applies server-side pagination, multi-sort, and filtering accurately', () => {
  // 1. Server pagination without sort/filter
  const page0 = executeServerQuery(dataset, columns, {
    paginationModel: { page: 0, pageSize: 2 },
  });
  assert.equal(page0.rowCount, 5);
  assert.deepEqual(
    page0.rows.map((r) => r.id),
    ['O-1', 'O-2'],
  );

  const page2 = executeServerQuery(dataset, columns, {
    paginationModel: { page: 2, pageSize: 2 },
  });
  assert.equal(page2.rowCount, 5);
  assert.deepEqual(
    page2.rows.map((r) => r.id),
    ['O-5'],
  );

  // 2. Multi-column server sorting: amount asc, then createdAt desc tie-breaker
  const sorted = executeServerQuery(dataset, columns, {
    sortModel: [
      { field: 'amount', sort: 'asc' },
      { field: 'createdAt', sort: 'desc' },
    ],
    paginationModel: { page: 0, pageSize: 5 },
  });
  assert.deepEqual(
    sorted.rows.map((r) => r.id),
    ['O-5', 'O-2', 'O-4', 'O-1', 'O-3'],
  );

  // 3. Server filtering (semantic date 'after' + quickFilter)
  const filtered = executeServerQuery(dataset, columns, {
    filterModel: {
      items: [{ id: 'f1', field: 'createdAt', operator: 'after', value: '2026-09-01' }],
      logicOperator: 'and',
      quickFilterValues: ['华东区'],
    },
    sortModel: [{ field: 'amount', sort: 'desc' }],
    paginationModel: { page: 0, pageSize: 10 },
  });
  assert.equal(filtered.rowCount, 2);
  assert.deepEqual(
    filtered.rows.map((r) => r.id),
    ['O-3', 'O-5'],
  );
});

test('executeServerQuery supports lazy/infinite start..end inclusive slicing', () => {
  const batch1 = executeServerQuery(dataset, columns, { start: 0, end: 1 });
  assert.equal(batch1.rowCount, 5);
  assert.deepEqual(
    batch1.rows.map((r) => r.id),
    ['O-1', 'O-2'],
  );

  const batch2 = executeServerQuery(dataset, columns, { start: 2, end: 4 });
  assert.equal(batch2.rowCount, 5);
  assert.deepEqual(
    batch2.rows.map((r) => r.id),
    ['O-3', 'O-4', 'O-5'],
  );
});

test('createDataSourceCache supports key stability, TTL expiration, LRU eviction, and clear', () => {
  let clock = 1000;
  const cache = createDataSourceCache<ServerOrder>({
    ttl: 500,
    maxEntries: 2,
    now: () => clock,
  });

  const p0 = { paginationModel: { page: 0, pageSize: 2 } };
  const p1 = { paginationModel: { page: 1, pageSize: 2 } };
  const p2 = { paginationModel: { page: 2, pageSize: 2 } };

  assert.equal(
    buildDataSourceCacheKey(p0),
    buildDataSourceCacheKey({ paginationModel: { page: 0, pageSize: 2 } }),
  );

  cache.set(p0, { rows: dataset.slice(0, 2), rowCount: 5 });
  cache.set(p1, { rows: dataset.slice(2, 4), rowCount: 5 });
  assert.equal(cache.get(p0)?.rows.length, 2); // Refreshes p0 recency -> p1 is now LRU

  // Adding p2 evicts LRU entry (p1)
  cache.set(p2, { rows: dataset.slice(4, 5), rowCount: 5 });
  assert.equal(cache.get(p1), undefined);
  assert.equal(cache.get(p0)?.rows.length, 2);
  assert.equal(cache.get(p2)?.rows.length, 1);

  // Advance clock past TTL -> entry expires
  clock += 600;
  assert.equal(cache.get(p0), undefined);

  cache.set(p0, { rows: dataset.slice(0, 2), rowCount: 5 });
  cache.clear();
  assert.equal(cache.get(p0), undefined);
});
