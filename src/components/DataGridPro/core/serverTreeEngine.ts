import type {
  GridColDef,
  GridFilterModel,
  GridGetRowsParams,
  GridGetRowsResponse,
  GridRowId,
  GridValidRowModel,
} from '../types';
import { createRowFilterPredicate, resolveRowId } from './gridCore';

export const SERVER_TREE_PATH_SEP = '\u0000';

export function serializeServerTreePath(groupKeys: readonly string[]): string {
  return groupKeys.join(SERVER_TREE_PATH_SEP);
}

export interface ServerTreeDisplayRow<R extends GridValidRowModel> {
  id: GridRowId;
  row: R;
  depth: number;
  groupKey: string;
  groupKeys: string[];
  pathKey: string;
  childrenCount: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isLoading: boolean;
}

export interface BuildServerTreeVisibleRowsOptions<R extends GridValidRowModel> {
  rootRows: readonly R[];
  childrenByPathKey: Record<string, R[]>;
  expandedPathKeys: Record<string, boolean>;
  loadingPathKeys: Record<string, boolean>;
  getGroupKey: (row: R) => string;
  getChildrenCount: (row: R) => number;
  getRowId?: (row: R) => GridRowId;
}

/**
 * Flattens server-fetched root rows and lazily cached descendant branches into
 * a visible row list matching official MUI X Pro Server-Side Tree Data semantics.
 */
export function buildServerTreeVisibleRows<R extends GridValidRowModel>({
  rootRows,
  childrenByPathKey,
  expandedPathKeys,
  loadingPathKeys,
  getGroupKey,
  getChildrenCount,
  getRowId,
}: BuildServerTreeVisibleRowsOptions<R>): ServerTreeDisplayRow<R>[] {
  const result: ServerTreeDisplayRow<R>[] = [];

  const visit = (rows: readonly R[], parentKeys: string[], depth: number) => {
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const id = resolveRowId(row, i, getRowId);
      const groupKey = getGroupKey(row);
      const groupKeys = [...parentKeys, groupKey];
      const pathKey = serializeServerTreePath(groupKeys);
      const childrenCount = getChildrenCount(row);
      const hasChildren = childrenCount > 0 || childrenCount === -1;
      const isExpanded = Boolean(hasChildren && expandedPathKeys[pathKey]);
      const isLoading = Boolean(loadingPathKeys[pathKey]);

      result.push({
        id,
        row,
        depth,
        groupKey,
        groupKeys,
        pathKey,
        childrenCount,
        hasChildren,
        isExpanded,
        isLoading,
      });

      if (isExpanded) {
        const cachedChildren = childrenByPathKey[pathKey];
        if (cachedChildren && cachedChildren.length > 0) {
          visit(cachedChildren, groupKeys, depth + 1);
        }
      }
    }
  };

  visit(rootRows, [], 0);
  return result;
}

/**
 * Pure server-side tree data query engine for hierarchical datasets.
 * Returns aggregated branch nodes for intermediate path depths and leaf rows
 * when expanding down to the terminal level.
 */
export function executeServerTreeQuery<R extends GridValidRowModel>(
  allRows: readonly R[],
  columns: readonly GridColDef<R>[],
  getTreeDataPath: (row: R) => string[],
  params: GridGetRowsParams,
): GridGetRowsResponse<R> {
  const filterModel: GridFilterModel = params.filterModel ?? {
    items: [],
    logicOperator: 'and',
    quickFilterValues: [],
  };
  const predicate = createRowFilterPredicate(filterModel, columns);
  const filtered = allRows.filter(predicate);

  const requestedKeys = params.groupKeys ?? [];
  const targetDepth = requestedKeys.length;

  // Match rows whose tree path starts with requestedKeys
  const matching: Array<{ row: R; path: string[] }> = [];
  for (const row of filtered) {
    const path = getTreeDataPath(row);
    if (path.length <= targetDepth) continue;
    let matchesPrefix = true;
    for (let i = 0; i < targetDepth; i += 1) {
      if (path[i] !== requestedKeys[i]) {
        matchesPrefix = false;
        break;
      }
    }
    if (matchesPrefix) {
      matching.push({ row, path });
    }
  }

  // Group by segment at targetDepth
  const buckets = new Map<string, Array<{ row: R; path: string[] }>>();
  for (const entry of matching) {
    const seg = entry.path[targetDepth];
    const list = buckets.get(seg);
    if (list) {
      list.push(entry);
    } else {
      buckets.set(seg, [entry]);
    }
  }

  const outRows: R[] = [];
  const numericCols = columns.filter(
    (c) => c.type === 'number' && c.aggregable !== false,
  );

  for (const [segment, entries] of buckets.entries()) {
    const isTerminalLeaf =
      entries.length === 1 && entries[0].path.length === targetDepth + 1;
    if (isTerminalLeaf) {
      const leaf = entries[0].row;
      outRows.push({
        ...leaf,
        __serverTreeKey: segment,
        __serverTreeChildrenCount: 0,
      } as R);
      continue;
    }

    // Count distinct immediate child keys under this branch
    const childKeySet = new Set<string>();
    for (const item of entries) {
      if (item.path.length > targetDepth + 1) {
        childKeySet.add(item.path[targetDepth + 1]);
      }
    }

    const template = entries[0].row;
    const aggPatch: Record<string, unknown> = {
      id: `__srv_tree__${[...requestedKeys, segment].join('/')}`,
      __isServerTreeGroup: true,
      __serverTreeKey: segment,
      __serverTreeChildrenCount: childKeySet.size || entries.length,
      __serverTreeDescendantCount: entries.length,
    };

    // Roll up numeric fields cleanly (sum for monetary/amount-like fields, average for rate/percent fields)
    for (const col of numericCols) {
      const vals = entries
        .map((e) => Number((e.row as Record<string, unknown>)[col.field]))
        .filter((n) => Number.isFinite(n));
      if (vals.length === 0) continue;
      if (/rate|pct|percent|ratio/i.test(col.field)) {
        aggPatch[col.field] = Math.round(
          vals.reduce((a, b) => a + b, 0) / vals.length,
        );
      } else {
        aggPatch[col.field] = vals.reduce((a, b) => a + b, 0);
      }
    }

    // Build synthetic branch row preserving non-null display metadata cleanly
    const branchRow: Record<string, unknown> = {
      ...template,
      ...aggPatch,
    };
    if ('orderNo' in branchRow) {
      branchRow.orderNo = `${segment} (${entries.length}笔)`;
    }
    if ('customer' in branchRow) {
      branchRow.customer =
        targetDepth === 0
          ? `${segment} · ${childKeySet.size} 个行业`
          : `${segment} · ${entries.length} 笔合同`;
    }
    outRows.push(branchRow as R);
  }

  // Sort branch/leaf nodes by active sortModel if supplied
  const sortModel = params.sortModel ?? [];
  if (sortModel.length > 0) {
    const primary = sortModel[0];
    if (primary.sort) {
      const dir = primary.sort === 'desc' ? -1 : 1;
      outRows.sort((a, b) => {
        const va = (a as Record<string, unknown>)[primary.field];
        const vb = (b as Record<string, unknown>)[primary.field];
        const na = Number(va);
        const nb = Number(vb);
        if (Number.isFinite(na) && Number.isFinite(nb)) {
          return (na - nb) * dir;
        }
        return String(va ?? '').localeCompare(String(vb ?? ''), 'zh-CN') * dir;
      });
    }
  }

  return {
    rows: outRows,
    rowCount: outRows.length,
  };
}
