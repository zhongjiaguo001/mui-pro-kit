import type {
  GridAggregationModel,
  GridColDef,
  GridDataSourceCache,
  GridFilterModel,
  GridGetRowsParams,
  GridGetRowsResponse,
  GridSortModel,
  GridValidRowModel,
} from '../types';
import {
  computeColumnAggregation,
  createRowFilterPredicate,
  formatCellValue,
  resolveCellValue,
} from './gridCore';

/**
 * Pure server-side query engine matching official MUI X DataSource / Server-Side
 * filtering, multi-column sorting, and pagination / range slicing semantics.
 */
export function executeServerQuery<R extends GridValidRowModel>(
  allRows: readonly R[],
  columns: readonly GridColDef<R>[],
  params: GridGetRowsParams,
): GridGetRowsResponse<R> {
  // 1. Apply server-side filterModel (items + quickFilterValues)
  const filterModel: GridFilterModel = params.filterModel ?? {
    items: [],
    logicOperator: 'and',
    quickFilterValues: [],
  };
  const predicate = createRowFilterPredicate(filterModel, columns);
  const filtered = allRows.filter(predicate);

  // 2. Apply server-side multi-column sortModel
  const sortModel: GridSortModel = params.sortModel ?? [];
  const colMap = new Map<string, GridColDef<R>>();
  for (const col of columns) {
    colMap.set(col.field, col);
  }

  const sorted =
    sortModel.length > 0
      ? [...filtered].sort((rowA, rowB) => {
          for (const item of sortModel) {
            if (!item.sort) continue;
            const colDef = colMap.get(item.field);
            const valA = colDef
              ? resolveCellValue(rowA, colDef)
              : (rowA as Record<string, unknown>)[item.field];
            const valB = colDef
              ? resolveCellValue(rowB, colDef)
              : (rowB as Record<string, unknown>)[item.field];

            let cmp = 0;
            if (colDef?.sortComparator) {
              cmp = colDef.sortComparator(valA, valB, rowA, rowB);
            } else {
              cmp = defaultServerCompare(valA, valB, colDef?.type);
            }
            if (cmp !== 0) {
              return item.sort === 'desc' ? -cmp : cmp;
            }
          }
          return 0;
        })
      : filtered;

  const rowCount = sorted.length;

  // 3. Apply either start/end range slicing (lazy/infinite) or page/pageSize slicing
  let pageRows: R[];
  if (typeof params.start === 'number' && typeof params.end === 'number') {
    const startIdx = Math.max(0, Math.floor(params.start));
    const endIdx = Math.max(startIdx, Math.floor(params.end) + 1);
    pageRows = sorted.slice(startIdx, endIdx);
  } else if (params.paginationModel) {
    const page = Math.max(0, params.paginationModel.page);
    const pageSize = Math.max(1, params.paginationModel.pageSize);
    const startIdx = page * pageSize;
    pageRows = sorted.slice(startIdx, startIdx + pageSize);
  } else {
    pageRows = [...sorted];
  }

  return {
    rows: pageRows,
    rowCount,
  };
}

function defaultServerCompare(
  a: unknown,
  b: unknown,
  colType?: GridColDef<GridValidRowModel>['type'],
): number {
  const aEmpty = a === null || a === undefined || a === '';
  const bEmpty = b === null || b === undefined || b === '';
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return -1;
  if (bEmpty) return 1;

  if (colType === 'number') {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      return na - nb;
    }
  }
  if (colType === 'boolean') {
    return Number(Boolean(a)) - Number(Boolean(b));
  }
  if (colType === 'date' || colType === 'dateTime') {
    const ta = Date.parse(String(a).replace(' ', 'T'));
    const tb = Date.parse(String(b).replace(' ', 'T'));
    if (!Number.isNaN(ta) && !Number.isNaN(tb)) {
      return ta - tb;
    }
  }
  return String(a).localeCompare(String(b), 'zh-CN', { numeric: true });
}

/**
 * Executes a server-side row grouping & aggregation query for a given
 * `groupFields` dimension hierarchy and `groupKeys` path prefix.
 */
export function executeServerGroupQuery<R extends GridValidRowModel>(
  allRows: readonly R[],
  columns: readonly GridColDef<R>[],
  params: GridGetRowsParams,
): GridGetRowsResponse<R> {
  const groupFields = params.groupFields ?? [];
  if (groupFields.length === 0) {
    return executeServerQuery(allRows, columns, params);
  }

  const filterModel: GridFilterModel = params.filterModel ?? {
    items: [],
    logicOperator: 'and',
    quickFilterValues: [],
  };
  const predicate = createRowFilterPredicate(filterModel, columns);
  const filtered = allRows.filter(predicate);

  const colMap = new Map<string, GridColDef<R>>();
  for (const col of columns) colMap.set(col.field, col);

  const requestedKeys = params.groupKeys ?? [];
  const depth = requestedKeys.length;

  // Filter rows matching the requested parent groupKeys prefix
  const scoped = filtered.filter((row) => {
    for (let i = 0; i < depth; i += 1) {
      const field = groupFields[i];
      const col = colMap.get(field);
      const raw = col ? resolveCellValue(row, col) : row[field];
      const keyLabel = col ? formatCellValue(raw, row, col) : String(raw ?? '');
      if (keyLabel !== requestedKeys[i]) return false;
    }
    return true;
  });

  // If we've reached leaf level beneath the deepest group dimension, return sorted leaves
  if (depth >= groupFields.length) {
    return executeServerQuery(scoped, columns, {
      ...params,
      groupFields: undefined,
      groupKeys: undefined,
    });
  }

  // Group scoped rows by groupFields[depth] and evaluate aggregationModel
  const activeField = groupFields[depth];
  const activeCol = colMap.get(activeField);
  const buckets = new Map<string, R[]>();
  for (const row of scoped) {
    const raw = activeCol ? resolveCellValue(row, activeCol) : row[activeField];
    const label = activeCol
      ? formatCellValue(raw, row, activeCol)
      : String(raw ?? '—');
    const existing = buckets.get(label);
    if (existing) existing.push(row);
    else buckets.set(label, [row]);
  }

  const aggModel: GridAggregationModel = params.aggregationModel ?? {};
  const groupRows: R[] = [];
  for (const [label, bucketRows] of buckets.entries()) {
    const nextPath = [...requestedKeys, label];
    const summary: Record<string, unknown> = {
      id: `__srv_grp__${nextPath.join('/')}`,
      __isServerGroup: true,
      __serverGroupKey: label,
      __serverGroupField: activeField,
      __serverChildrenCount: bucketRows.length,
      [activeField]: label,
    };
    for (const [field, fn] of Object.entries(aggModel)) {
      if (!fn) continue;
      const col = colMap.get(field);
      if (!col) continue;
      const agg = computeColumnAggregation(bucketRows, col, fn);
      if (agg !== null) {
        summary[field] = agg;
      }
    }
    groupRows.push(summary as R);
  }

  return {
    rows: groupRows,
    rowCount: groupRows.length,
  };
}

/**
 * Produces a deterministic cache key for official MUI X DataSource caching.
 */
export function buildDataSourceCacheKey(params: GridGetRowsParams): string {
  return JSON.stringify({
    p: params.paginationModel
      ? [params.paginationModel.page, params.paginationModel.pageSize]
      : null,
    r:
      typeof params.start === 'number' && typeof params.end === 'number'
        ? [params.start, params.end]
        : null,
    gk: params.groupKeys ?? null,
    gf: params.groupFields ?? null,
    ag: params.aggregationModel ?? null,
    s: (params.sortModel ?? []).map((item) => [item.field, item.sort ?? null]),
    f: params.filterModel
      ? {
          l: params.filterModel.logicOperator ?? 'and',
          q: params.filterModel.quickFilterValues ?? [],
          i: (params.filterModel.items ?? []).map((item) => [
            item.field,
            item.operator,
            item.value ?? null,
          ]),
        }
      : null,
  });
}

/**
 * Default in-memory TTL + LRU-bounded cache aligned with official MUI X
 * GridDataSourceCacheDefault.
 */
export function createDataSourceCache<R extends GridValidRowModel>(options?: {
  ttl?: number;
  maxEntries?: number;
  now?: () => number;
}): GridDataSourceCache<R> {
  const ttl = options?.ttl ?? 300_000;
  const maxEntries = Math.max(1, options?.maxEntries ?? 64);
  const now = options?.now ?? (() => Date.now());
  const store = new Map<
    string,
    { value: GridGetRowsResponse<R>; expiresAt: number }
  >();

  return {
    get(params: GridGetRowsParams): GridGetRowsResponse<R> | undefined {
      const key = buildDataSourceCacheKey(params);
      const entry = store.get(key);
      if (!entry) return undefined;
      if (ttl > 0 && now() > entry.expiresAt) {
        store.delete(key);
        return undefined;
      }
      // Refresh recency for LRU behavior
      store.delete(key);
      store.set(key, entry);
      return entry.value;
    },
    set(params: GridGetRowsParams, value: GridGetRowsResponse<R>): void {
      const key = buildDataSourceCacheKey(params);
      if (store.has(key)) {
        store.delete(key);
      } else if (store.size >= maxEntries) {
        const oldestKey = store.keys().next().value;
        if (oldestKey !== undefined) {
          store.delete(oldestKey);
        }
      }
      store.set(key, {
        value,
        expiresAt: ttl > 0 ? now() + ttl : Number.POSITIVE_INFINITY,
      });
    },
    clear(): void {
      store.clear();
    },
  };
}
