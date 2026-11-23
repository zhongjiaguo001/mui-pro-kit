import type {
  GridAggregationFunctionName,
  GridAggregationModel,
  GridColDef,
  GridColumnGroupingModel,
  GridPivotModel,
  GridValidRowModel,
} from '../types';
import {
  AGGREGATION_FUNCTION_LABELS,
  computeColumnAggregation,
  formatAggregatedValue,
  formatCellValue,
  resolveCellValue,
} from './gridCore';

export interface PivotBuildResult {
  rows: Record<string, unknown>[];
  columns: GridColDef<Record<string, unknown>>[];
  columnGroupingModel: GridColumnGroupingModel;
  aggregationModel: GridAggregationModel;
  pinnedLeftFields: string[];
  pinnedRightFields: string[];
  distinctColumnKeys: string[];
}

const PIVOT_COL_SEP = '|||';
const PIVOT_TOTAL_GROUP_KEY = '__pivot_grand_total__';

/**
 * Formats a raw dimension value consistently for pivot grouping headers and labels.
 */
function formatDimensionLabel<R extends GridValidRowModel>(
  row: R,
  colDef: GridColDef<R> | undefined,
  field: string,
): string {
  if (!colDef) {
    const raw = row[field];
    return raw === null || raw === undefined || raw === '' ? '（空）' : String(raw);
  }
  const raw = resolveCellValue(row, colDef);
  const formatted = formatCellValue(raw, row, colDef);
  return formatted.trim() === '' ? '（空）' : formatted;
}

/**
 * Pure MUI X Premium Pivot Table engine.
 * Transforms flat rows + GridPivotModel into pivoted rows, dynamic grouped columns,
 * multi-level columnGroupingModel headers, and grand-total aggregations.
 */
export function buildPivotTable<R extends GridValidRowModel>(
  sourceRows: R[],
  sourceColumns: GridColDef<R>[],
  pivotModel: GridPivotModel,
): PivotBuildResult {
  const colMap = new Map(sourceColumns.map((c) => [c.field, c]));

  const rowFields = pivotModel.rows.filter((f) => colMap.has(f));
  const colFields = pivotModel.columns.filter(
    (f) => colMap.has(f) && !rowFields.includes(f),
  );
  const valueSpecs = pivotModel.values.filter((v) => colMap.has(v.field));

  // Fallback when no values selected: count rows
  const effectiveValues =
    valueSpecs.length > 0
      ? valueSpecs
      : sourceColumns[0]
        ? [{ field: sourceColumns[0].field, aggFunc: 'size' as GridAggregationFunctionName }]
        : [];

  // 1) Collect ordered distinct column-pivot keys
  const distinctColKeyOrder: string[] = [];
  const colKeyLabels = new Map<string, string[]>();

  if (colFields.length > 0) {
    for (const row of sourceRows) {
      const parts = colFields.map((f) => formatDimensionLabel(row, colMap.get(f), f));
      const key = parts.join(PIVOT_COL_SEP);
      if (!colKeyLabels.has(key)) {
        colKeyLabels.set(key, parts);
        distinctColKeyOrder.push(key);
      }
    }
    distinctColKeyOrder.sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }

  // 2) Group source rows by row-dimension tuple
  interface RowBucket {
    id: string;
    dimLabels: Record<string, string>;
    allRows: R[];
    byColKey: Map<string, R[]>;
  }

  const rowBucketOrder: string[] = [];
  const rowBucketMap = new Map<string, RowBucket>();

  for (const row of sourceRows) {
    const dimParts =
      rowFields.length > 0
        ? rowFields.map((f) => formatDimensionLabel(row, colMap.get(f), f))
        : ['全部汇总'];
    const rowKey = dimParts.join(PIVOT_COL_SEP);

    let bucket = rowBucketMap.get(rowKey);
    if (!bucket) {
      const dimLabels: Record<string, string> = {};
      if (rowFields.length > 0) {
        rowFields.forEach((f, idx) => {
          dimLabels[f] = dimParts[idx];
        });
      } else {
        dimLabels.__pivot_all__ = '全部汇总';
      }
      bucket = {
        id: `pivot-row-${rowBucketOrder.length}-${rowKey}`,
        dimLabels,
        allRows: [],
        byColKey: new Map(),
      };
      rowBucketMap.set(rowKey, bucket);
      rowBucketOrder.push(rowKey);
    }

    bucket.allRows.push(row);

    if (colFields.length > 0) {
      const cKey = colFields
        .map((f) => formatDimensionLabel(row, colMap.get(f), f))
        .join(PIVOT_COL_SEP);
      let cellRows = bucket.byColKey.get(cKey);
      if (!cellRows) {
        cellRows = [];
        bucket.byColKey.set(cKey, cellRows);
      }
      cellRows.push(row);
    }
  }

  rowBucketOrder.sort((a, b) => a.localeCompare(b, 'zh-CN'));

  // 3) Build dynamic GridColDef[], columnGroupingModel, and bottom aggregationModel
  const pivotColumns: GridColDef<Record<string, unknown>>[] = [];
  const columnGroupingModel: GridColumnGroupingModel = [];
  const aggregationModel: GridAggregationModel = {};
  const pinnedLeftFields: string[] = [];
  const pinnedRightFields: string[] = [];

  if (rowFields.length > 0) {
    for (const rField of rowFields) {
      const srcCol = colMap.get(rField);
      pinnedLeftFields.push(rField);
      pivotColumns.push({
        field: rField,
        headerName: srcCol?.headerName ?? rField,
        type: 'string',
        width: Math.max(132, Math.min(180, srcCol?.width ?? 140)),
        minWidth: 110,
        sortable: true,
        filterable: true,
        hideable: false,
        groupable: false,
        aggregable: false,
      });
    }
  } else {
    pinnedLeftFields.push('__pivot_all__');
    pivotColumns.push({
      field: '__pivot_all__',
      headerName: '汇总范围',
      type: 'string',
      width: 140,
      minWidth: 110,
      sortable: false,
      filterable: false,
      hideable: false,
      groupable: false,
      aggregable: false,
    });
  }

  const makeMetricColumn = (
    fieldId: string,
    srcCol: GridColDef<R>,
    aggFunc: GridAggregationFunctionName,
  ): GridColDef<Record<string, unknown>> => {
    const fnLabel = AGGREGATION_FUNCTION_LABELS[aggFunc];
    const headerName =
      effectiveValues.length === 1 && colFields.length > 0
        ? `${srcCol.headerName ?? srcCol.field} (${fnLabel})`
        : `${srcCol.headerName ?? srcCol.field} · ${fnLabel}`;

    const footerAggFunc: GridAggregationFunctionName =
      aggFunc === 'size' ? 'sum' : aggFunc;
    aggregationModel[fieldId] = footerAggFunc;

    return {
      field: fieldId,
      headerName,
      type: 'number',
      width: 152,
      minWidth: 118,
      align: 'right',
      headerAlign: 'right',
      sortable: true,
      filterable: true,
      groupable: false,
      valueFormatter: (value) => {
        if (value === null || value === undefined || value === '') return '—';
        if (aggFunc === 'size') {
          return `${Number(value).toLocaleString('zh-CN')} 项`;
        }
        return formatAggregatedValue(Number(value), aggFunc, srcCol);
      },
    };
  };

  if (colFields.length > 0 && distinctColKeyOrder.length > 0) {
    for (const cKey of distinctColKeyOrder) {
      const labelParts = colKeyLabels.get(cKey) ?? [cKey];
      const groupChildren: Array<{ field: string }> = [];
      for (const valSpec of effectiveValues) {
        const srcCol = colMap.get(valSpec.field);
        if (!srcCol) continue;
        const fieldId = `pv__${cKey}__${valSpec.field}__${valSpec.aggFunc}`;
        groupChildren.push({ field: fieldId });
        pivotColumns.push(makeMetricColumn(fieldId, srcCol, valSpec.aggFunc));
      }
      if (groupChildren.length > 0) {
        columnGroupingModel.push({
          groupId: `pivot-grp-${cKey}`,
          headerName: labelParts.join(' / '),
          children: groupChildren,
        });
      }
    }

    // Grand total column group on the right
    const totalChildren: Array<{ field: string }> = [];
    for (const valSpec of effectiveValues) {
      const srcCol = colMap.get(valSpec.field);
      if (!srcCol) continue;
      const totalFieldId = `${PIVOT_TOTAL_GROUP_KEY}__${valSpec.field}__${valSpec.aggFunc}`;
      totalChildren.push({ field: totalFieldId });
      pinnedRightFields.push(totalFieldId);
      pivotColumns.push(makeMetricColumn(totalFieldId, srcCol, valSpec.aggFunc));
    }
    if (totalChildren.length > 0) {
      columnGroupingModel.push({
        groupId: PIVOT_TOTAL_GROUP_KEY,
        headerName: '行总计',
        children: totalChildren,
      });
    }
  } else {
    // No column pivot dimension: flat aggregated columns per value spec
    for (const valSpec of effectiveValues) {
      const srcCol = colMap.get(valSpec.field);
      if (!srcCol) continue;
      const fieldId = `pv__flat__${valSpec.field}__${valSpec.aggFunc}`;
      pivotColumns.push(makeMetricColumn(fieldId, srcCol, valSpec.aggFunc));
    }
  }

  // 4) Materialize pivoted rows
  const pivotRows: Record<string, unknown>[] = rowBucketOrder.map((rowKey) => {
    const bucket = rowBucketMap.get(rowKey)!;
    const record: Record<string, unknown> = {
      id: bucket.id,
      ...bucket.dimLabels,
    };

    if (colFields.length > 0 && distinctColKeyOrder.length > 0) {
      for (const cKey of distinctColKeyOrder) {
        const cellRows = bucket.byColKey.get(cKey) ?? [];
        for (const valSpec of effectiveValues) {
          const srcCol = colMap.get(valSpec.field);
          if (!srcCol) continue;
          const fieldId = `pv__${cKey}__${valSpec.field}__${valSpec.aggFunc}`;
          if (cellRows.length === 0) {
            record[fieldId] = null;
          } else {
            record[fieldId] = computeColumnAggregation(
              cellRows,
              srcCol,
              valSpec.aggFunc,
            );
          }
        }
      }
      for (const valSpec of effectiveValues) {
        const srcCol = colMap.get(valSpec.field);
        if (!srcCol) continue;
        const totalFieldId = `${PIVOT_TOTAL_GROUP_KEY}__${valSpec.field}__${valSpec.aggFunc}`;
        record[totalFieldId] = computeColumnAggregation(
          bucket.allRows,
          srcCol,
          valSpec.aggFunc,
        );
      }
    } else {
      for (const valSpec of effectiveValues) {
        const srcCol = colMap.get(valSpec.field);
        if (!srcCol) continue;
        const fieldId = `pv__flat__${valSpec.field}__${valSpec.aggFunc}`;
        record[fieldId] = computeColumnAggregation(
          bucket.allRows,
          srcCol,
          valSpec.aggFunc,
        );
      }
    }

    return record;
  });

  return {
    rows: pivotRows,
    columns: pivotColumns,
    columnGroupingModel,
    aggregationModel,
    pinnedLeftFields,
    pinnedRightFields,
    distinctColumnKeys: distinctColKeyOrder,
  };
}
