import type {
  GridAggregationFunctionName,
  GridChartModel,
  GridColDef,
  GridValidRowModel,
} from '../types';
import {
  computeColumnAggregation,
  formatAggregatedValue,
  formatCellValue,
  resolveCellValue,
} from './gridCore';

export interface ChartDatum {
  key: string;
  rawKey: unknown;
  label: string;
  value: number;
  formattedValue: string;
  count: number;
  share: number;
}

export interface ChartBuildResult {
  dimensionField: string;
  dimensionHeader: string;
  valueField: string;
  valueHeader: string;
  aggFunc: GridAggregationFunctionName;
  data: ChartDatum[];
  totalValue: number;
  maxValue: number;
  minValue: number;
}

/**
 * Returns candidate category dimension columns and numeric/countable value columns
 * suitable for MUI X Premium Charts Integration.
 */
export function getChartEligibleFields<R extends GridValidRowModel>(
  columns: GridColDef<R>[],
): {
  dimensionColumns: GridColDef<R>[];
  valueColumns: GridColDef<R>[];
} {
  const dataCols = columns.filter(
    (c) => c.type !== 'actions' && c.filterable !== false,
  );

  const dimensionColumns = dataCols.filter(
    (c) =>
      c.type === 'singleSelect' ||
      c.type === 'string' ||
      c.type === 'boolean' ||
      c.type === 'date' ||
      c.type === undefined,
  );

  const numericCols = dataCols.filter((c) => c.type === 'number');
  const valueColumns = numericCols.length > 0 ? numericCols : dataCols;

  return {
    dimensionColumns: dimensionColumns.length > 0 ? dimensionColumns : dataCols,
    valueColumns,
  };
}

/**
 * Pure aggregation engine for MUI X Premium Charts Integration.
 * Groups live filtered rows by dimensionField and aggregates valueField using aggFunc.
 */
export function buildChartSeries<R extends GridValidRowModel>(
  rows: R[],
  columns: GridColDef<R>[],
  model: GridChartModel,
): ChartBuildResult {
  const colMap = new Map(columns.map((c) => [c.field, c]));
  const dimCol = colMap.get(model.dimensionField);
  const valCol = colMap.get(model.valueField);

  const buckets = new Map<
    string,
    { rawKey: unknown; label: string; rows: R[] }
  >();

  for (const row of rows) {
    const rawKey = dimCol
      ? resolveCellValue(row, dimCol)
      : row[model.dimensionField];
    const formattedLabel = dimCol
      ? formatCellValue(rawKey, row, dimCol)
      : rawKey === null || rawKey === undefined
        ? ''
        : String(rawKey);
    const label = formattedLabel.trim() === '' ? '（空）' : formattedLabel;
    const key =
      rawKey === null || rawKey === undefined ? '__empty__' : String(rawKey);

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { rawKey, label, rows: [] };
      buckets.set(key, bucket);
    }
    bucket.rows.push(row);
  }

  const rawPoints: Array<{
    key: string;
    rawKey: unknown;
    label: string;
    value: number;
    formattedValue: string;
    count: number;
  }> = [];

  for (const [key, bucket] of buckets.entries()) {
    let aggVal = 0;
    let formattedValue = '0';

    if (model.aggFunc === 'size' || !valCol) {
      aggVal = bucket.rows.length;
      formattedValue = `${aggVal.toLocaleString('zh-CN')} 项`;
    } else {
      const computed = computeColumnAggregation(
        bucket.rows,
        valCol,
        model.aggFunc,
      );
      aggVal = computed ?? 0;
      formattedValue =
        computed === null
          ? '—'
          : formatAggregatedValue(computed, model.aggFunc, valCol);
    }

    rawPoints.push({
      key,
      rawKey: bucket.rawKey,
      label: bucket.label,
      value: aggVal,
      formattedValue,
      count: bucket.rows.length,
    });
  }

  // Keep chronological order for dates, otherwise sort descending by metric value
  if (dimCol?.type === 'date') {
    rawPoints.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
  } else {
    rawPoints.sort(
      (a, b) => b.value - a.value || a.label.localeCompare(b.label, 'zh-CN'),
    );
  }

  const positiveSum = rawPoints.reduce(
    (acc, p) => acc + Math.max(0, p.value),
    0,
  );
  const totalValue = rawPoints.reduce((acc, p) => acc + p.value, 0);
  const maxValue =
    rawPoints.length > 0 ? Math.max(...rawPoints.map((p) => p.value)) : 0;
  const minValue =
    rawPoints.length > 0 ? Math.min(...rawPoints.map((p) => p.value)) : 0;

  const data: ChartDatum[] = rawPoints.map((p) => ({
    ...p,
    share: positiveSum > 0 ? Math.max(0, p.value) / positiveSum : 0,
  }));

  return {
    dimensionField: model.dimensionField,
    dimensionHeader: dimCol?.headerName ?? model.dimensionField,
    valueField: model.valueField,
    valueHeader: valCol?.headerName ?? model.valueField,
    aggFunc: model.aggFunc,
    data,
    totalValue,
    maxValue,
    minValue,
  };
}

/**
 * Formats compact axis tick labels (e.g. ¥1.5M, ¥320k, 85%).
 */
export function formatCompactAxisValue<R extends GridValidRowModel>(
  value: number,
  colDef: GridColDef<R> | undefined,
  aggFunc: GridAggregationFunctionName,
): string {
  if (aggFunc === 'size') {
    return `${Math.round(value).toLocaleString('zh-CN')}`;
  }
  const sampleFormatted =
    colDef?.valueFormatter ? colDef.valueFormatter(value, {} as R) : '';
  const hasYen = sampleFormatted.startsWith('¥');
  const hasPct = sampleFormatted.endsWith('%');

  if (hasPct) {
    return `${Math.round(value)}%`;
  }

  const abs = Math.abs(value);
  const prefix = hasYen ? '¥' : '';
  if (abs >= 1_000_000) {
    return `${prefix}${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  }
  if (abs >= 10_000) {
    return `${prefix}${(value / 10_000).toFixed(abs >= 100_000 ? 0 : 1)}万`;
  }
  if (abs >= 1_000) {
    return `${prefix}${(value / 1_000).toFixed(1)}k`;
  }
  return `${prefix}${Math.round(value).toLocaleString('zh-CN')}`;
}
