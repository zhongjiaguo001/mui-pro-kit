import type {
  GridAggregationFunctionName,
  GridAlignment,
  GridCellRange,
  GridCellRangeStats,
  GridColDef,
  GridColType,
  GridColumnGroup,
  GridColumnGroupingModel,
  GridDensity,
  GridEditHistoryBatch,
  GridFilterItem,
  GridFilterModel,
  GridFilterOperatorOption,
  GridFilterOperatorValue,
  GridProcessCellPasteParams,
  GridRowGroupingModel,
  GridRowHeightParams,
  GridRowHeightReturnValue,
  GridRowId,
  GridValidRowModel,
  GridValueOption,
} from '../types';

export const GRID_CHECKBOX_SELECTION_FIELD = '__check__';
export const GRID_CHECKBOX_COLUMN_WIDTH = 50;
export const GRID_REORDER_COL_FIELD = '__reorder__';
export const GRID_REORDER_COL_WIDTH = 46;
export const GRID_DETAIL_PANEL_TOGGLE_FIELD = '__detail_panel_toggle__';
export const GRID_DETAIL_PANEL_TOGGLE_WIDTH = 50;
export const GRID_TREE_DATA_GROUPING_FIELD = '__tree_data_group__';
export const GRID_ROW_GROUPING_FIELD = '__row_group_by_columns_group__';
export const GRID_ROW_GROUPING_PREFIX = '__row_group_col__';
export const GRID_TREE_DATA_DEFAULT_WIDTH = 240;

export function getMultipleGroupingColId(field: string): string {
  return `${GRID_ROW_GROUPING_PREFIX}${field}`;
}

export function isRowGroupingColId(colId: string): boolean {
  return (
    colId === GRID_ROW_GROUPING_FIELD ||
    colId.startsWith(GRID_ROW_GROUPING_PREFIX)
  );
}

export function isHierarchyColId(colId: string): boolean {
  return colId === GRID_TREE_DATA_GROUPING_FIELD || isRowGroupingColId(colId);
}
export const DEFAULT_COLUMN_WIDTH = 150;
export const DEFAULT_MIN_COLUMN_WIDTH = 72;
export const DEFAULT_MAX_COLUMN_WIDTH = 640;

export interface DensityMetrics {
  rowHeight: number;
  headerHeight: number;
  cellPaddingX: number;
  fontSize: number;
  label: string;
}

/**
 * Matches MUI X DataGrid source density factors:
 * standard: row 52px / header 56px
 * compact (0.7x): row 36px / header 40px
 * comfortable (1.3x): row 67px / header 68px
 */
export function getDensityMetrics(density: GridDensity): DensityMetrics {
  switch (density) {
    case 'compact':
      return {
        rowHeight: 36,
        headerHeight: 40,
        cellPaddingX: 10,
        fontSize: 14,
        label: '紧凑',
      };
    case 'comfortable':
      return {
        rowHeight: 67,
        headerHeight: 68,
        cellPaddingX: 10,
        fontSize: 14,
        label: '宽松',
      };
    case 'standard':
    default:
      return {
        rowHeight: 52,
        headerHeight: 56,
        cellPaddingX: 10,
        fontSize: 14,
        label: '标准',
      };
  }
}

export function normalizeValueOptions(
  options?: Array<string | GridValueOption>,
): GridValueOption[] {
  if (!options) return [];
  return options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt,
  );
}

export function getOperatorsForColumnType(
  type: GridColType = 'string',
): GridFilterOperatorOption[] {
  switch (type) {
    case 'number':
      return [
        { value: '=', label: '等于 (=)', requiresValue: true },
        { value: '!=', label: '不等于 (≠)', requiresValue: true },
        { value: '>', label: '大于 (>)', requiresValue: true },
        { value: '>=', label: '大于等于 (≥)', requiresValue: true },
        { value: '<', label: '小于 (<)', requiresValue: true },
        { value: '<=', label: '小于等于 (≤)', requiresValue: true },
        { value: 'isEmpty', label: '为空', requiresValue: false },
        { value: 'isNotEmpty', label: '不为空', requiresValue: false },
      ];
    case 'date':
    case 'dateTime':
      return [
        { value: 'is', label: '等于日期', requiresValue: true },
        { value: 'not', label: '不等于日期', requiresValue: true },
        { value: 'after', label: '晚于', requiresValue: true },
        { value: 'onOrAfter', label: '不早于', requiresValue: true },
        { value: 'before', label: '早于', requiresValue: true },
        { value: 'onOrBefore', label: '不晚于', requiresValue: true },
        { value: 'isEmpty', label: '为空', requiresValue: false },
        { value: 'isNotEmpty', label: '不为空', requiresValue: false },
      ];
    case 'singleSelect':
      return [
        { value: 'is', label: '是', requiresValue: true },
        { value: 'not', label: '不是', requiresValue: true },
        { value: 'isAnyOf', label: '属于任一', requiresValue: true },
        { value: 'isEmpty', label: '为空', requiresValue: false },
        { value: 'isNotEmpty', label: '不为空', requiresValue: false },
      ];
    case 'boolean':
      return [
        { value: 'is', label: '等于', requiresValue: true },
      ];
    case 'string':
    default:
      return [
        { value: 'contains', label: '包含', requiresValue: true },
        { value: 'equals', label: '等于', requiresValue: true },
        { value: 'startsWith', label: '开头为', requiresValue: true },
        { value: 'endsWith', label: '结尾为', requiresValue: true },
        { value: 'isAnyOf', label: '属于任一', requiresValue: true },
        { value: 'isEmpty', label: '为空', requiresValue: false },
        { value: 'isNotEmpty', label: '不为空', requiresValue: false },
      ];
  }
}

/**
 * Resolves filter operators for a specific column, merging or honoring official
 * MUI X `colDef.filterOperators` custom operators when supplied.
 */
export function getOperatorsForColumn<R extends GridValidRowModel>(
  colDef?: GridColDef<R>,
): GridFilterOperatorOption<R>[] {
  if (colDef?.filterOperators && colDef.filterOperators.length > 0) {
    return colDef.filterOperators.map((op) => ({
      value: op.value,
      label: op.label,
      requiresValue: op.requiresValue ?? true,
      customOperator: op,
    }));
  }
  return getOperatorsForColumnType(colDef?.type) as GridFilterOperatorOption<R>[];
}

export function resolveRowId<R extends GridValidRowModel>(
  row: R,
  index: number,
  getRowId?: (row: R) => GridRowId,
): GridRowId {
  if (getRowId) {
    return getRowId(row);
  }
  const raw = row.id;
  if (typeof raw === 'string' || typeof raw === 'number') {
    return raw;
  }
  return index;
}

export function resolveCellValue<R extends GridValidRowModel>(
  row: R,
  colDef: GridColDef<R>,
): unknown {
  const raw = row[colDef.field];
  if (colDef.valueGetter) {
    return colDef.valueGetter(raw, row);
  }
  return raw;
}

export function formatCellValue<R extends GridValidRowModel>(
  value: unknown,
  row: R,
  colDef: GridColDef<R>,
): string {
  if (colDef.valueFormatter) {
    return colDef.valueFormatter(value, row);
  }
  if (value === null || value === undefined) {
    return '';
  }
  if (colDef.type === 'boolean') {
    return value ? '是' : '否';
  }
  if (colDef.type === 'singleSelect' && colDef.valueOptions) {
    const options = normalizeValueOptions(colDef.valueOptions);
    const matched = options.find((opt) => String(opt.value) === String(value));
    if (matched) return matched.label;
  }
  if (value instanceof Date) {
    if (colDef.type === 'dateTime') {
      return value.toISOString().slice(0, 16).replace('T', ' ');
    }
    return value.toISOString().slice(0, 10);
  }
  if (colDef.type === 'dateTime' && typeof value === 'string') {
    return value.replace('T', ' ').slice(0, 16);
  }
  return String(value);
}

export function evaluateFilterItem<R extends GridValidRowModel>(
  rawValue: unknown,
  item: GridFilterItem,
  colDef?: GridColDef<R>,
  row?: R,
): boolean {
  const { operator, value: filterVal } = item;

  // Official MUI X custom column filterOperators precedence
  if (colDef?.filterOperators && colDef.filterOperators.length > 0) {
    const customOp = colDef.filterOperators.find((op) => op.value === operator);
    if (customOp) {
      const applyFn = customOp.getApplyFilterFn(item, colDef);
      if (!applyFn) return true;
      return applyFn(rawValue, (row ?? {}) as R, colDef);
    }
  }

  const isEmptyValue =
    rawValue === null ||
    rawValue === undefined ||
    (typeof rawValue === 'string' && rawValue.trim() === '');

  if (operator === 'isEmpty') {
    return isEmptyValue;
  }
  if (operator === 'isNotEmpty') {
    return !isEmptyValue;
  }

  // Official MUI X isAnyOf multi-value filter evaluation
  if (operator === 'isAnyOf') {
    const candidates: string[] = Array.isArray(filterVal)
      ? filterVal.map((v) => String(v).trim()).filter(Boolean)
      : typeof filterVal === 'string'
        ? filterVal
            .split(/[,，\n]/)
            .map((v) => v.trim())
            .filter(Boolean)
        : filterVal !== undefined && filterVal !== null
          ? [String(filterVal).trim()].filter(Boolean)
          : [];
    if (candidates.length === 0) return true;
    const rawStr = String(rawValue ?? '').trim().toLowerCase();
    const formattedStr = colDef
      ? formatCellValue(rawValue, {} as R, colDef).trim().toLowerCase()
      : rawStr;
    return candidates.some((cand) => {
      const target = cand.toLowerCase();
      return rawStr === target || formattedStr === target;
    });
  }

  // If filter requires a value and none is provided yet, do not exclude rows (matches MUI X behavior)
  if (
    filterVal === undefined ||
    filterVal === null ||
    (Array.isArray(filterVal)
      ? filterVal.length === 0
      : String(filterVal).trim() === '')
  ) {
    return true;
  }

  const colType: GridColType = colDef?.type ?? 'string';

  if (colType === 'number') {
    const numCell = Number(rawValue);
    const numFilter = Number(filterVal);
    if (Number.isNaN(numCell) || Number.isNaN(numFilter)) {
      return false;
    }
    switch (operator) {
      case '=':
        return numCell === numFilter;
      case '!=':
        return numCell !== numFilter;
      case '>':
        return numCell > numFilter;
      case '>=':
        return numCell >= numFilter;
      case '<':
        return numCell < numFilter;
      case '<=':
        return numCell <= numFilter;
      default:
        return true;
    }
  }

  if (colType === 'boolean') {
    const boolFilter =
      typeof filterVal === 'boolean'
        ? filterVal
        : String(filterVal).toLowerCase() === 'true';
    return Boolean(rawValue) === boolFilter;
  }

  if (colType === 'date' || colType === 'dateTime') {
    const sliceLen = colType === 'dateTime' ? 16 : 10;
    const normalizeDt = (v: unknown) =>
      v instanceof Date
        ? v.toISOString().slice(0, sliceLen).replace('T', ' ')
        : String(v ?? '').replace('T', ' ').slice(0, sliceLen);
    const cellDate = normalizeDt(rawValue);
    const targetDate = normalizeDt(filterVal);
    if (!cellDate) return false;
    switch (operator) {
      case 'is':
        return cellDate === targetDate;
      case 'not':
        return cellDate !== targetDate;
      case 'after':
      case '>':
        return cellDate > targetDate;
      case 'onOrAfter':
      case '>=':
        return cellDate >= targetDate;
      case 'before':
      case '<':
        return cellDate < targetDate;
      case 'onOrBefore':
      case '<=':
        return cellDate <= targetDate;
      default:
        return true;
    }
  }

  if (colType === 'singleSelect') {
    const strCell = String(rawValue ?? '');
    const strFilter = String(filterVal);
    if (operator === 'is') return strCell === strFilter;
    if (operator === 'not') return strCell !== strFilter;
    return true;
  }

  // Default: string comparison (case-insensitive)
  const strCell = String(rawValue ?? '').toLowerCase();
  const strFilter = String(filterVal).toLowerCase().trim();

  switch (operator) {
    case 'contains':
      return strCell.includes(strFilter);
    case 'equals':
      return strCell === strFilter;
    case 'startsWith':
      return strCell.startsWith(strFilter);
    case 'endsWith':
      return strCell.endsWith(strFilter);
    default:
      return strCell.includes(strFilter);
  }
}

export function isFilterItemActive<R extends GridValidRowModel>(
  item: GridFilterItem,
  colDef?: GridColDef<R>,
): boolean {
  if (!item.field) return false;
  if (colDef?.filterOperators && colDef.filterOperators.length > 0) {
    const customOp = colDef.filterOperators.find(
      (op) => op.value === item.operator,
    );
    if (customOp && customOp.requiresValue === false) {
      return true;
    }
  }
  if (item.operator === 'isEmpty' || item.operator === 'isNotEmpty') {
    return true;
  }
  if (Array.isArray(item.value)) {
    return item.value.some((v) => String(v).trim() !== '');
  }
  return (
    item.value !== undefined &&
    item.value !== null &&
    String(item.value).trim() !== ''
  );
}

/**
 * Compiles a GridFilterModel + column definitions ONCE into a fast per-row predicate,
 * eliminating per-row Map/Array allocations and evaluating fast structured filters before
 * short-circuiting quickFilter scans.
 */
export function createRowFilterPredicate<R extends GridValidRowModel>(
  filterModel: GridFilterModel,
  columns: readonly GridColDef<R>[],
): (row: R) => boolean {
  const quickTokens = (filterModel.quickFilterValues ?? [])
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const rawItems = filterModel.items ?? [];
  if (quickTokens.length === 0 && rawItems.length === 0) {
    return () => true;
  }

  const colMap = new Map<string, GridColDef<R>>();
  for (let i = 0; i < columns.length; i += 1) {
    colMap.set(columns[i].field, columns[i]);
  }

  const activeItems: Array<{ item: GridFilterItem; colDef: GridColDef<R> }> = [];
  for (let i = 0; i < rawItems.length; i += 1) {
    const item = rawItems[i];
    const colDef = colMap.get(item.field);
    if (colDef && isFilterItemActive(item, colDef)) {
      activeItems.push({ item, colDef });
    }
  }

  if (quickTokens.length === 0 && activeItems.length === 0) {
    return () => true;
  }

  const logic = filterModel.logicOperator ?? 'and';
  const filterableCols =
    quickTokens.length > 0
      ? columns.filter((c) => c.filterable !== false && c.type !== 'actions')
      : [];

  return (row: R): boolean => {
    // 1. Evaluate fast structured filter items FIRST to reject non-matching rows before string formatting
    if (activeItems.length > 0) {
      if (logic === 'or') {
        let matchedAny = false;
        for (let i = 0; i < activeItems.length; i += 1) {
          const { item, colDef } = activeItems[i];
          if (evaluateFilterItem(resolveCellValue(row, colDef), item, colDef, row)) {
            matchedAny = true;
            break;
          }
        }
        if (!matchedAny) return false;
      } else {
        for (let i = 0; i < activeItems.length; i += 1) {
          const { item, colDef } = activeItems[i];
          if (!evaluateFilterItem(resolveCellValue(row, colDef), item, colDef, row)) {
            return false;
          }
        }
      }
    }

    // 2. Evaluate quickFilterValues with lazy column scanning & zero intermediate arrays
    if (quickTokens.length > 0) {
      for (let t = 0; t < quickTokens.length; t += 1) {
        const token = quickTokens[t];
        let tokenMatched = false;
        for (let c = 0; c < filterableCols.length; c += 1) {
          const col = filterableCols[c];
          const val = resolveCellValue(row, col);
          if (val !== null && val !== undefined) {
            const rawLower = String(val).toLowerCase();
            if (rawLower.includes(token)) {
              tokenMatched = true;
              break;
            }
          }
          if (
            col.valueFormatter ||
            col.valueOptions ||
            col.type === 'boolean' ||
            col.type === 'singleSelect'
          ) {
            const formatted = formatCellValue(val, row, col);
            if (formatted && formatted.toLowerCase().includes(token)) {
              tokenMatched = true;
              break;
            }
          }
        }
        if (!tokenMatched) return false;
      }
    }

    return true;
  };
}

export function evaluateFilterModel<R extends GridValidRowModel>(
  row: R,
  filterModel: GridFilterModel,
  columns: GridColDef<R>[],
): boolean {
  return createRowFilterPredicate(filterModel, columns)(row);
}

export interface PinnedColumnLayout {
  side: 'left' | 'right' | false;
  offset: number;
  isBoundary: boolean;
}

export interface ColumnSizeEntry {
  id: string;
  size: number;
}

/**
 * Computes exact sticky offsets and boundary shadow markers for pinned columns,
 * mirroring MUI X DataGrid Pro's pinned column layout engine.
 */
export function computePinnedOffsets(
  orderedColumns: ColumnSizeEntry[],
  pinnedLeftIds: string[],
  pinnedRightIds: string[],
): Record<string, PinnedColumnLayout> {
  const layout: Record<string, PinnedColumnLayout> = {};
  const leftSet = new Set(pinnedLeftIds);
  const rightSet = new Set(pinnedRightIds);

  const visibleLeft = orderedColumns.filter((c) => leftSet.has(c.id));
  const visibleRight = orderedColumns.filter((c) => rightSet.has(c.id));

  let leftAcc = 0;
  visibleLeft.forEach((col, idx) => {
    layout[col.id] = {
      side: 'left',
      offset: leftAcc,
      isBoundary: idx === visibleLeft.length - 1,
    };
    leftAcc += col.size;
  });

  let rightAcc = 0;
  for (let i = visibleRight.length - 1; i >= 0; i -= 1) {
    const col = visibleRight[i];
    layout[col.id] = {
      side: 'right',
      offset: rightAcc,
      isBoundary: i === 0,
    };
    rightAcc += col.size;
  }

  for (const col of orderedColumns) {
    if (!layout[col.id]) {
      layout[col.id] = {
        side: false,
        offset: 0,
        isBoundary: false,
      };
    }
  }

  return layout;
}

function escapeCsvCell(raw: string): string {
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function serializeRowsToCsv<R extends GridValidRowModel>(
  rows: R[],
  visibleColumns: GridColDef<R>[],
): string {
  const exportableCols = visibleColumns.filter(
    (col) =>
      col.field !== GRID_CHECKBOX_SELECTION_FIELD &&
      col.field !== GRID_DETAIL_PANEL_TOGGLE_FIELD &&
      col.type !== 'actions',
  );

  const headerLine = exportableCols
    .map((col) => escapeCsvCell(col.headerName ?? col.field))
    .join(',');

  const bodyLines = rows.map((row) =>
    exportableCols
      .map((col) => {
        const val = resolveCellValue(row, col);
        const formatted = formatCellValue(val, row, col);
        return escapeCsvCell(formatted);
      })
      .join(','),
  );

  // Prefix UTF-8 BOM for clean Chinese character rendering in Microsoft Excel
  return `\uFEFF${[headerLine, ...bodyLines].join('\r\n')}`;
}

export function getDefaultAlignForType(type?: GridColType): 'left' | 'right' | 'center' {
  if (type === 'number') return 'right';
  if (type === 'boolean' || type === 'actions') return 'center';
  return 'left';
}

/**
 * Pure column reordering helper mirroring MUI X DataGrid Pro's column drag-and-drop engine.
 */
export function reorderColumnIds(
  currentOrder: string[],
  sourceId: string,
  targetId: string,
  position: 'before' | 'after' = 'before',
): string[] {
  if (sourceId === targetId) return currentOrder;
  const sourceIdx = currentOrder.indexOf(sourceId);
  const targetIdx = currentOrder.indexOf(targetId);
  if (sourceIdx === -1 || targetIdx === -1) return currentOrder;

  const withoutSource = currentOrder.filter((id) => id !== sourceId);
  const nextTargetIdx = withoutSource.indexOf(targetId);
  const insertAt = position === 'after' ? nextTargetIdx + 1 : nextTargetIdx;
  withoutSource.splice(insertAt, 0, sourceId);
  return withoutSource;
}

/**
 * Live directional column swap mirroring MUI X DataGrid Pro's useGridColumnReorder:
 * dragging rightward places source after target; dragging leftward places source before target.
 */
export function swapColumnOrder(
  currentOrder: string[],
  sourceId: string,
  targetId: string,
): string[] {
  if (sourceId === targetId) return currentOrder;
  const sourceIdx = currentOrder.indexOf(sourceId);
  const targetIdx = currentOrder.indexOf(targetId);
  if (sourceIdx === -1 || targetIdx === -1) return currentOrder;
  return reorderColumnIds(
    currentOrder,
    sourceId,
    targetId,
    sourceIdx < targetIdx ? 'after' : 'before',
  );
}

export interface ParsedEditResult {
  valid: boolean;
  value: unknown;
  error?: string;
}

/**
 * Validates and coerces inline cell edit input according to GridColDef type & valueParser.
 */
export function parseEditedCellValue<R extends GridValidRowModel>(
  rawInput: unknown,
  row: R,
  colDef: GridColDef<R>,
): ParsedEditResult {
  if (colDef.valueParser) {
    try {
      return { valid: true, value: colDef.valueParser(rawInput, row) };
    } catch (err) {
      return {
        valid: false,
        value: rawInput,
        error: err instanceof Error ? err.message : '输入格式无效',
      };
    }
  }

  const colType: GridColType = colDef.type ?? 'string';

  if (colType === 'number') {
    const cleaned =
      typeof rawInput === 'string'
        ? rawInput.replace(/[,¥$\s%]/g, '').trim()
        : rawInput;
    if (cleaned === '' || cleaned === null || cleaned === undefined) {
      return { valid: false, value: rawInput, error: '请输入有效数值' };
    }
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) {
      return { valid: false, value: rawInput, error: '请输入有效数值' };
    }
    return { valid: true, value: parsed };
  }

  if (colType === 'boolean') {
    if (typeof rawInput === 'boolean') {
      return { valid: true, value: rawInput };
    }
    return {
      valid: true,
      value: String(rawInput).toLowerCase() === 'true',
    };
  }

  if (colType === 'date') {
    const str = String(rawInput ?? '').trim();
    if (!str) {
      return { valid: false, value: rawInput, error: '请选择有效日期' };
    }
    return { valid: true, value: str.slice(0, 10) };
  }

  if (colType === 'dateTime') {
    const str = String(rawInput ?? '').trim();
    if (!str) {
      return { valid: false, value: rawInput, error: '请选择有效日期时间' };
    }
    return { valid: true, value: str.replace('T', ' ').slice(0, 16) };
  }

  if (colType === 'singleSelect') {
    return { valid: true, value: rawInput };
  }

  return { valid: true, value: String(rawInput ?? '').trim() };
}

export interface EditCellValidationResult {
  valid: boolean;
  value: unknown;
  errorMessage: string | null;
}

/**
 * Evaluates official MUI X cell edit validation by running parseEditedCellValue
 * followed by optional GridColDef.preProcessEditCellProps.
 */
export function evaluateEditCellValidation<R extends GridValidRowModel>(
  rawInput: unknown,
  row: R,
  rowId: GridRowId,
  colDef: GridColDef<R>,
): EditCellValidationResult {
  const parsed = parseEditedCellValue(rawInput, row, colDef);
  const candidateValue = parsed.valid ? parsed.value : rawInput;
  const oldVal = resolveCellValue(row, colDef);
  const hasChanged = !Object.is(oldVal, candidateValue);

  if (!parsed.valid) {
    return {
      valid: false,
      value: rawInput,
      errorMessage: parsed.error ?? '输入格式无效',
    };
  }

  if (colDef.preProcessEditCellProps) {
    const processed = colDef.preProcessEditCellProps({
      id: rowId,
      row,
      props: { value: candidateValue },
      hasChanged,
    });
    if (processed.error) {
      const msg =
        typeof processed.error === 'string' && processed.error.trim().length > 0
          ? processed.error
          : `${colDef.headerName ?? colDef.field}输入不符合校验规则`;
      return {
        valid: false,
        value: processed.value,
        errorMessage: msg,
      };
    }
    return {
      valid: true,
      value: processed.value,
      errorMessage: null,
    };
  }

  return {
    valid: true,
    value: candidateValue,
    errorMessage: null,
  };
}

/**
 * Applies GridColDef.valueSetter if defined, otherwise writes to row[colDef.field].
 */
export function applyValueSetter<R extends GridValidRowModel>(
  row: R,
  value: unknown,
  colDef: GridColDef<R>,
): R {
  if (colDef.valueSetter) {
    return colDef.valueSetter(value, row);
  }
  return { ...row, [colDef.field]: value } as R;
}

export interface ResolvedRowHeightConfig {
  isAuto: boolean;
  height: number | 'auto';
  minHeight: number;
}

/**
 * Resolves official MUI X getRowHeight({ id, model, densityFactor }) into concrete
 * row layout metrics supporting fixed px numbers, 'auto' content wrap, or default density height.
 */
export function resolveRowHeightConfig<R extends GridValidRowModel>(
  row: R,
  rowId: GridRowId,
  baseRowHeight: number,
  getRowHeight?: (params: GridRowHeightParams<R>) => GridRowHeightReturnValue,
): ResolvedRowHeightConfig {
  if (!getRowHeight) {
    return { isAuto: false, height: baseRowHeight, minHeight: baseRowHeight };
  }
  const densityFactor = baseRowHeight / 52;
  const result = getRowHeight({ id: rowId, model: row, densityFactor });
  if (result === 'auto') {
    return { isAuto: true, height: 'auto', minHeight: baseRowHeight };
  }
  if (typeof result === 'number' && Number.isFinite(result) && result > 0) {
    return { isAuto: false, height: result, minHeight: result };
  }
  return { isAuto: false, height: baseRowHeight, minHeight: baseRowHeight };
}

const HEADER_FILTER_PREFIX = 'hdr_filter_';

export function getDefaultHeaderFilterOperator(
  colType: GridColType = 'string',
): GridFilterOperatorValue {
  if (colType === 'number') return '>=';
  if (
    colType === 'singleSelect' ||
    colType === 'boolean' ||
    colType === 'date' ||
    colType === 'dateTime'
  ) {
    return 'is';
  }
  return 'contains';
}

export function getHeaderFilterValue(
  filterModel: GridFilterModel,
  field: string,
): string {
  const item = filterModel.items.find((i) => i.field === field);
  if (!item || item.value === null || item.value === undefined) return '';
  if (Array.isArray(item.value)) {
    return item.value.map((v) => String(v)).join(',');
  }
  return String(item.value);
}

export function getHeaderFilterOperator<R extends GridValidRowModel>(
  filterModel: GridFilterModel,
  field: string,
  colDef?: GridColDef<R>,
): GridFilterOperatorValue {
  const item = filterModel.items.find((i) => i.field === field);
  if (item) return item.operator;
  return getDefaultHeaderFilterOperator(colDef?.type);
}

/**
 * Bidirectionally syncs a column's Header Filter input into GridFilterModel.items,
 * matching MUI X DataGrid Pro's headerFilters architecture.
 */
export function upsertHeaderFilterItem<R extends GridValidRowModel>(
  filterModel: GridFilterModel,
  field: string,
  rawValue: string,
  colDef?: GridColDef<R>,
): GridFilterModel {
  const trimmed = rawValue.trim();
  const existingIndex = filterModel.items.findIndex((i) => i.field === field);

  if (trimmed === '') {
    if (existingIndex === -1) return filterModel;
    return {
      ...filterModel,
      items: filterModel.items.filter((_, idx) => idx !== existingIndex),
    };
  }

  const defaultOp = getDefaultHeaderFilterOperator(colDef?.type);

  if (existingIndex >= 0) {
    const existing = filterModel.items[existingIndex];
    const nextItems = [...filterModel.items];
    const nextOperator =
      existing.operator === 'isEmpty' || existing.operator === 'isNotEmpty'
        ? defaultOp
        : existing.operator;
    nextItems[existingIndex] = {
      ...existing,
      operator: nextOperator,
      value:
        nextOperator === 'isAnyOf'
          ? rawValue
              .split(/[,，]/)
              .map((v) => v.trim())
              .filter(Boolean)
          : rawValue,
    };
    return {
      ...filterModel,
      items: nextItems,
    };
  }

  const newItem: GridFilterItem = {
    id: `${HEADER_FILTER_PREFIX}${field}`,
    field,
    operator: defaultOp,
    value: rawValue,
  };

  return {
    ...filterModel,
    items: [...filterModel.items, newItem],
  };
}

/**
 * Updates the operator for a column's Header Filter directly from its operator menu,
 * matching official MUI X GridHeaderFilterCell operator picker interaction.
 */
export function upsertHeaderFilterOperator<R extends GridValidRowModel>(
  filterModel: GridFilterModel,
  field: string,
  operator: GridFilterOperatorValue,
  colDef?: GridColDef<R>,
): GridFilterModel {
  const existingIndex = filterModel.items.findIndex((i) => i.field === field);
  const isUnaryOp = operator === 'isEmpty' || operator === 'isNotEmpty';

  if (existingIndex >= 0) {
    const existing = filterModel.items[existingIndex];
    const nextItems = [...filterModel.items];
    let nextVal = existing.value ?? '';
    if (isUnaryOp) {
      nextVal = '';
    } else if (operator === 'isAnyOf') {
      if (Array.isArray(existing.value)) {
        nextVal = existing.value;
      } else if (existing.value !== undefined && existing.value !== null && String(existing.value).trim() !== '') {
        nextVal = [String(existing.value).trim()];
      } else {
        nextVal = [];
      }
    } else if (Array.isArray(existing.value)) {
      nextVal = existing.value[0] !== undefined ? String(existing.value[0]) : '';
    }
    nextItems[existingIndex] = {
      ...existing,
      operator,
      value: nextVal,
    };
    return {
      ...filterModel,
      items: nextItems,
    };
  }

  const newItem: GridFilterItem = {
    id: `${HEADER_FILTER_PREFIX}${field}`,
    field,
    operator,
    value: isUnaryOp
      ? ''
      : operator === 'isAnyOf'
        ? []
        : colDef?.type === 'boolean'
          ? 'true'
          : '',
  };

  return {
    ...filterModel,
    items: [...filterModel.items, newItem],
  };
}

export interface ComputedColumnGroupCell {
  key: string;
  groupId: string | null;
  headerName: string;
  description?: string;
  headerAlign: GridAlignment;
  width: number;
  pinnedSide: 'left' | 'right' | false;
  pinnedOffset: number;
  isLeftBoundary: boolean;
  isRightBoundary: boolean;
  fields: string[];
}

function isColumnGroupNode(
  node: { field: string } | GridColumnGroup,
): node is GridColumnGroup {
  return 'children' in node && Array.isArray(node.children);
}

/**
 * Computes multi-level column group header rows mirroring official MUI X DataGrid
 * useGridColumnGrouping: merges contiguous visible leaf columns sharing the same
 * ancestor groupId within the same pinning section (left / center / right).
 */
export function buildColumnGroupHeaderRows(
  visibleColumns: Array<{ id: string; size: number }>,
  columnGroupingModel: GridColumnGroupingModel | undefined,
  pinnedLayout: Record<string, PinnedColumnLayout>,
): ComputedColumnGroupCell[][] {
  if (!columnGroupingModel || columnGroupingModel.length === 0) return [];

  const fieldToPath = new Map<string, GridColumnGroup[]>();
  let maxDepth = 0;

  const walk = (
    nodes: Array<{ field: string } | GridColumnGroup>,
    ancestors: GridColumnGroup[],
  ) => {
    for (const node of nodes) {
      if (isColumnGroupNode(node)) {
        const nextAncestors = [...ancestors, node];
        if (nextAncestors.length > maxDepth) {
          maxDepth = nextAncestors.length;
        }
        walk(node.children, nextAncestors);
      } else {
        fieldToPath.set(node.field, ancestors);
      }
    }
  };

  walk(columnGroupingModel, []);
  if (maxDepth === 0) return [];

  const rows: ComputedColumnGroupCell[][] = [];

  for (let depth = 0; depth < maxDepth; depth += 1) {
    const rowCells: ComputedColumnGroupCell[] = [];

    for (let i = 0; i < visibleColumns.length; i += 1) {
      const col = visibleColumns[i];
      const path = fieldToPath.get(col.id) ?? [];
      const group = path[depth] ?? null;
      const pinInfo = pinnedLayout[col.id];
      const pinnedSide = pinInfo?.side ?? false;
      const isLeftBoundary =
        pinnedSide === 'left' && Boolean(pinInfo?.isBoundary);
      const isRightBoundary =
        pinnedSide === 'right' && Boolean(pinInfo?.isBoundary);

      const prev = rowCells[rowCells.length - 1];
      const canMerge =
        prev !== undefined &&
        prev.pinnedSide === pinnedSide &&
        prev.groupId === (group ? group.groupId : null);

      if (canMerge) {
        prev.width += col.size;
        prev.fields.push(col.id);
        if (isLeftBoundary) prev.isLeftBoundary = true;
        if (isRightBoundary) prev.isRightBoundary = true;
        // For right-pinned groups, the sticky `right` offset equals the rightmost column's offset
        if (pinnedSide === 'right' && pinInfo) {
          prev.pinnedOffset = Math.min(prev.pinnedOffset, pinInfo.offset);
        }
      } else {
        rowCells.push({
          key: `grp_${depth}_${group ? group.groupId : 'empty'}_${i}`,
          groupId: group ? group.groupId : null,
          headerName: group ? group.headerName ?? group.groupId : '',
          description: group?.description,
          headerAlign: group?.headerAlign ?? 'left',
          width: col.size,
          pinnedSide,
          pinnedOffset: pinInfo?.offset ?? 0,
          isLeftBoundary,
          isRightBoundary,
          fields: [col.id],
        });
      }
    }

    rows.push(rowCells);
  }

  return rows;
}

/**
 * Pure array reorder helper for official MUI X Pro rowReordering.
 */
export function reorderRowsByIndex<T>(
  rows: T[],
  oldIndex: number,
  targetIndex: number,
): T[] {
  if (
    oldIndex === targetIndex ||
    oldIndex < 0 ||
    targetIndex < 0 ||
    oldIndex >= rows.length ||
    targetIndex >= rows.length
  ) {
    return rows;
  }
  const next = [...rows];
  const [moved] = next.splice(oldIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

/**
 * Measures optimal column width based on header label & visible formatted values,
 * matching official MUI X Pro autosizeColumns behavior.
 */
export function computeColumnAutosizeWidth(
  headerLabel: string,
  formattedValues: string[],
  minWidth = DEFAULT_MIN_COLUMN_WIDTH,
  maxWidth = DEFAULT_MAX_COLUMN_WIDTH,
  measureText?: (text: string) => number,
): number {
  const defaultMeasure = (text: string): number => {
    let width = 0;
    for (const ch of text) {
      width += ch.charCodeAt(0) > 255 ? 14 : 8.2;
    }
    return width;
  };

  let activeMeasure = measureText ?? defaultMeasure;
  if (!measureText && typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font =
          "500 14px 'Plus Jakarta Sans', 'Noto Sans SC', -apple-system, sans-serif";
        activeMeasure = (text: string) => ctx.measureText(text).width;
      }
    } catch {
      activeMeasure = defaultMeasure;
    }
  }

  // Header needs room for sort icon + column menu trigger + horizontal padding
  const headerNeeded = Math.ceil(activeMeasure(headerLabel) + 64);
  let maxCellNeeded = 0;
  for (const val of formattedValues) {
    const w = Math.ceil(activeMeasure(val) + 32);
    if (w > maxCellNeeded) maxCellNeeded = w;
  }

  const target = Math.max(headerNeeded, maxCellNeeded);
  return Math.max(minWidth, Math.min(maxWidth, target));
}

export interface RowEditMergeResult<R extends GridValidRowModel> {
  valid: boolean;
  changed: boolean;
  nextRow: R;
  error?: string;
  field?: string;
}

/**
 * Atomically validates & merges multi-column draft values for official MUI X editMode="row".
 */
export function validateAndMergeRowEdits<R extends GridValidRowModel>(
  row: R,
  drafts: Record<string, unknown>,
  columns: GridColDef<R>[],
  rowId: GridRowId = resolveRowId(row, 0),
  canEditCell?: (row: R, colDef: GridColDef<R>) => boolean,
): RowEditMergeResult<R> {
  let changed = false;
  let nextRow = { ...row } as R;

  for (const [field, rawDraft] of Object.entries(drafts)) {
    const colDef = columns.find((c) => c.field === field);
    if (!colDef || !colDef.editable) continue;
    if (canEditCell && !canEditCell(row, colDef)) continue;
    const validation = evaluateEditCellValidation(rawDraft, nextRow, rowId, colDef);
    if (!validation.valid) {
      return {
        valid: false,
        changed: false,
        nextRow: row,
        error: validation.errorMessage ?? '输入值无效',
        field,
      };
    }
    const prevVal = resolveCellValue(row, colDef);
    if (!Object.is(prevVal, validation.value)) {
      nextRow = applyValueSetter(nextRow, validation.value, colDef);
      changed = true;
    }
  }

  return {
    valid: true,
    changed,
    nextRow,
  };
}

export const AGGREGATION_FUNCTION_LABELS: Record<
  GridAggregationFunctionName,
  string
> = {
  sum: '合计',
  avg: '均值',
  min: '最小值',
  max: '最大值',
  size: '计数',
};

/**
 * Computes official MUI X column aggregation (sum / avg / min / max / size)
 * across a list of data rows.
 */
export function computeColumnAggregation<R extends GridValidRowModel>(
  rows: R[],
  colDef: GridColDef<R>,
  fn: GridAggregationFunctionName,
): number | null {
  if (rows.length === 0) return fn === 'size' ? 0 : null;

  if (fn === 'size') {
    let count = 0;
    for (const row of rows) {
      const val = resolveCellValue(row, colDef);
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        count += 1;
      }
    }
    return count;
  }

  const nums: number[] = [];
  for (const row of rows) {
    const raw = resolveCellValue(row, colDef);
    if (raw === null || raw === undefined || raw === '') continue;
    const n = Number(raw);
    if (!Number.isNaN(n) && Number.isFinite(n)) {
      nums.push(n);
    }
  }

  if (nums.length === 0) return null;

  if (fn === 'sum') {
    return nums.reduce((acc, v) => acc + v, 0);
  }
  if (fn === 'avg') {
    return nums.reduce((acc, v) => acc + v, 0) / nums.length;
  }
  if (fn === 'min') {
    return Math.min(...nums);
  }
  if (fn === 'max') {
    return Math.max(...nums);
  }
  return null;
}

export function formatAggregatedValue<R extends GridValidRowModel>(
  value: number | null,
  fn: GridAggregationFunctionName,
  colDef: GridColDef<R>,
): string {
  if (value === null) return '—';
  if (fn === 'size') return `${value.toLocaleString('zh-CN')} 项`;
  const rounded = fn === 'avg' ? Math.round(value * 10) / 10 : value;
  if (colDef.valueFormatter) {
    return colDef.valueFormatter(rounded, {} as R);
  }
  return rounded.toLocaleString('zh-CN');
}

export interface TreeFlatRow<R extends GridValidRowModel> {
  id: string;
  rowId: GridRowId;
  path: string[];
  label: string;
  depth: number;
  isGroup: boolean;
  descendantCount: number;
  row: R | null;
  descendantRows: R[];
}

interface InternalTreeNode<R extends GridValidRowModel> {
  key: string;
  path: string[];
  label: string;
  depth: number;
  row: R | null;
  rowId: GridRowId | null;
  childrenOrder: string[];
  childrenMap: Map<string, InternalTreeNode<R>>;
  descendantRows: R[];
}

function buildInternalTree<R extends GridValidRowModel>(
  rows: R[],
  getTreeDataPath: (row: R) => string[],
  getRowId?: (row: R) => GridRowId,
): InternalTreeNode<R> {
  const root: InternalTreeNode<R> = {
    key: '__root__',
    path: [],
    label: '',
    depth: -1,
    row: null,
    rowId: null,
    childrenOrder: [],
    childrenMap: new Map(),
    descendantRows: [],
  };

  rows.forEach((row, idx) => {
    const rawPath = getTreeDataPath(row);
    const segments =
      rawPath && rawPath.length > 0
        ? rawPath.map((s) => String(s))
        : [String(resolveRowId(row, idx, getRowId))];

    let cursor = root;
    const prefix: string[] = [];

    segments.forEach((seg, segIdx) => {
      prefix.push(seg);
      const nodeKey = prefix.join('\u001f');
      let child = cursor.childrenMap.get(nodeKey);
      if (!child) {
        child = {
          key: nodeKey,
          path: [...prefix],
          label: seg,
          depth: segIdx,
          row: null,
          rowId: null,
          childrenOrder: [],
          childrenMap: new Map(),
          descendantRows: [],
        };
        cursor.childrenMap.set(nodeKey, child);
        cursor.childrenOrder.push(nodeKey);
      }
      child.descendantRows.push(row);
      if (segIdx === segments.length - 1) {
        child.row = row;
        child.rowId = resolveRowId(row, idx, getRowId);
      }
      cursor = child;
    });
  });

  return root;
}

/**
 * Collects initial expanded group node keys based on official MUI X Pro
 * defaultGroupingExpansionDepth (-1 = all expanded, 0 = none, N = depths < N).
 */
export function collectDefaultExpandedTreeGroups<R extends GridValidRowModel>(
  rows: R[],
  getTreeDataPath: (row: R) => string[],
  defaultDepth = 1,
  getRowId?: (row: R) => GridRowId,
): string[] {
  if (defaultDepth === 0) return [];
  const root = buildInternalTree(rows, getTreeDataPath, getRowId);
  const expanded: string[] = [];

  const visit = (node: InternalTreeNode<R>) => {
    for (const childKey of node.childrenOrder) {
      const child = node.childrenMap.get(childKey)!;
      const isGroup = child.childrenOrder.length > 0;
      if (isGroup) {
        if (defaultDepth === -1 || child.depth < defaultDepth) {
          expanded.push(child.key);
        }
        visit(child);
      }
    }
  };

  visit(root);
  return expanded;
}

/**
 * Builds flattened visible Tree Data rows matching official MUI X DataGrid Pro
 * treeData + getTreeDataPath semantics, preserving descendant rows for rollups.
 */
export function buildTreeDataRows<R extends GridValidRowModel>(
  rows: R[],
  getTreeDataPath: (row: R) => string[],
  expandedGroupKeys: Set<string>,
  getRowId?: (row: R) => GridRowId,
): TreeFlatRow<R>[] {
  const root = buildInternalTree(rows, getTreeDataPath, getRowId);
  const result: TreeFlatRow<R>[] = [];

  const flatten = (node: InternalTreeNode<R>) => {
    for (const childKey of node.childrenOrder) {
      const child = node.childrenMap.get(childKey)!;
      const isGroup = child.childrenOrder.length > 0;
      const descendantCount = isGroup
        ? child.descendantRows.length - (child.row ? 1 : 0)
        : 0;

      result.push({
        id: child.key,
        rowId: child.rowId ?? `tree_group_${child.key}`,
        path: child.path,
        label: child.label,
        depth: child.depth,
        isGroup,
        descendantCount,
        row: child.row,
        descendantRows: child.descendantRows,
      });

      if (isGroup && expandedGroupKeys.has(child.key)) {
        flatten(child);
      }
    }
  };

  flatten(root);
  return result;
}

export interface VirtualWindowParams {
  totalRows: number;
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
  overscan?: number;
}

export interface VirtualWindowResult {
  startIndex: number;
  endIndex: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
}

/**
 * Pure row virtualization window calculator for high-volume datasets (1,000+ rows)
 * mirroring official MUI X DataGrid Pro virtual scroller windowing.
 */
export function computeVirtualRowWindow({
  totalRows,
  scrollTop,
  viewportHeight,
  rowHeight,
  overscan = 6,
}: VirtualWindowParams): VirtualWindowResult {
  if (totalRows <= 0 || rowHeight <= 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      topSpacerHeight: 0,
      bottomSpacerHeight: 0,
    };
  }

  const effectiveViewport = viewportHeight > 0 ? viewportHeight : rowHeight * 12;
  const clampedScroll = Math.max(0, scrollTop);
  const visibleStart = Math.floor(clampedScroll / rowHeight);
  const visibleCount = Math.ceil(effectiveViewport / rowHeight);

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(totalRows, visibleStart + visibleCount + overscan);

  return {
    startIndex,
    endIndex,
    topSpacerHeight: startIndex * rowHeight,
    bottomSpacerHeight: Math.max(0, (totalRows - endIndex) * rowHeight),
  };
}

/**
 * Serializes rows + columns into Excel/Sheets-compatible TSV for Ctrl+C clipboard copy.
 */
export function serializeCellsToTsv<R extends GridValidRowModel>(
  rows: R[],
  columns: GridColDef<R>[],
): string {
  const exportCols = columns.filter(
    (c) =>
      c.field !== GRID_CHECKBOX_SELECTION_FIELD &&
      c.field !== GRID_REORDER_COL_FIELD &&
      c.field !== GRID_DETAIL_PANEL_TOGGLE_FIELD &&
      c.field !== GRID_TREE_DATA_GROUPING_FIELD &&
      c.field !== GRID_ROW_GROUPING_FIELD &&
      c.type !== 'actions',
  );
  return rows
    .map((row) =>
      exportCols
        .map((col) => {
          const val = formatCellValue(resolveCellValue(row, col), row, col);
          return val.replace(/[\t\r\n]+/g, ' ');
        })
        .join('\t'),
    )
    .join('\n');
}

function getRowGroupingPath<R extends GridValidRowModel>(
  row: R,
  rowGroupingModel: GridRowGroupingModel,
  columnsByField: Map<string, GridColDef<R>>,
  rowId: GridRowId,
): string[] {
  const segments: string[] = [];
  for (const field of rowGroupingModel) {
    const colDef = columnsByField.get(field);
    const formatted = colDef
      ? formatCellValue(resolveCellValue(row, colDef), row, colDef).trim()
      : String(row[field] ?? '').trim();
    segments.push(formatted || '（空）');
  }
  segments.push(String(rowId));
  return segments;
}

/**
 * Collects initial expanded row group keys matching official MUI X Row Grouping
 * defaultGroupingExpansionDepth semantics.
 */
export function collectDefaultExpandedRowGroups<R extends GridValidRowModel>(
  rows: R[],
  rowGroupingModel: GridRowGroupingModel,
  columns: GridColDef<R>[],
  defaultDepth = 1,
  getRowId?: (row: R) => GridRowId,
): string[] {
  if (rowGroupingModel.length === 0) return [];
  const colMap = new Map(columns.map((c) => [c.field, c]));
  return collectDefaultExpandedTreeGroups(
    rows,
    (row) => {
      const id = resolveRowId(row, 0, getRowId);
      return getRowGroupingPath(row, rowGroupingModel, colMap, id);
    },
    defaultDepth,
    getRowId,
  );
}

/**
 * Builds flattened visible Row Grouping rows matching official MUI X Premium
 * rowGroupingModel semantics, preserving descendant rows for live group rollups.
 */
export function buildRowGroupingRows<R extends GridValidRowModel>(
  rows: R[],
  rowGroupingModel: GridRowGroupingModel,
  columns: GridColDef<R>[],
  expandedGroupKeys: Set<string>,
  getRowId?: (row: R) => GridRowId,
): TreeFlatRow<R>[] {
  if (rowGroupingModel.length === 0) return [];
  const colMap = new Map(columns.map((c) => [c.field, c]));
  const firstDataCol = columns.find(
    (c) => !rowGroupingModel.includes(c.field) && c.type !== 'actions',
  );
  const built = buildTreeDataRows(
    rows,
    (row) => {
      const id = resolveRowId(row, 0, getRowId);
      return getRowGroupingPath(row, rowGroupingModel, colMap, id);
    },
    expandedGroupKeys,
    getRowId,
  );
  // Display a friendly leaf label on grouped leaf rows
  return built.map((node) => {
    if (node.isGroup || !node.row) return node;
    const leafLabel = firstDataCol
      ? formatCellValue(
          resolveCellValue(node.row, firstDataCol),
          node.row,
          firstDataCol,
        )
      : node.label;
    return { ...node, label: leafLabel || node.label };
  });
}

export interface NormalizedCellRange {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}

export function normalizeCellRange(range: GridCellRange): NormalizedCellRange {
  return {
    minRow: Math.min(range.start.rowIndex, range.end.rowIndex),
    maxRow: Math.max(range.start.rowIndex, range.end.rowIndex),
    minCol: Math.min(range.start.colIndex, range.end.colIndex),
    maxCol: Math.max(range.start.colIndex, range.end.colIndex),
  };
}

export function isCellInRange(
  rowIndex: number,
  colIndex: number,
  range: GridCellRange | null,
): boolean {
  if (!range) return false;
  const { minRow, maxRow, minCol, maxCol } = normalizeCellRange(range);
  return (
    rowIndex >= minRow &&
    rowIndex <= maxRow &&
    colIndex >= minCol &&
    colIndex <= maxCol
  );
}

export function getCellRangeEdges(
  rowIndex: number,
  colIndex: number,
  range: GridCellRange | null,
): { top: boolean; right: boolean; bottom: boolean; left: boolean } | null {
  if (!range) return null;
  const { minRow, maxRow, minCol, maxCol } = normalizeCellRange(range);
  if (
    rowIndex < minRow ||
    rowIndex > maxRow ||
    colIndex < minCol ||
    colIndex > maxCol
  ) {
    return null;
  }
  return {
    top: rowIndex === minRow,
    right: colIndex === maxCol,
    bottom: rowIndex === maxRow,
    left: colIndex === minCol,
  };
}

/**
 * Computes live Excel / MUI X status-bar statistics (count, numeric sum & avg)
 * across a selected rectangular cell range.
 */
export function computeCellRangeStats<R extends GridValidRowModel>(
  rows: Array<R | null>,
  columns: Array<GridColDef<R> | undefined>,
  range: GridCellRange | null,
): GridCellRangeStats {
  if (!range) {
    return { cellCount: 0, numericCount: 0, sum: null, avg: null };
  }
  const { minRow, maxRow, minCol, maxCol } = normalizeCellRange(range);
  let cellCount = 0;
  let numericCount = 0;
  let sum = 0;

  for (let r = minRow; r <= maxRow; r += 1) {
    const row = rows[r];
    if (!row) continue;
    for (let c = minCol; c <= maxCol; c += 1) {
      const colDef = columns[c];
      if (
        !colDef ||
        colDef.field === GRID_CHECKBOX_SELECTION_FIELD ||
        colDef.field === GRID_REORDER_COL_FIELD ||
        colDef.field === GRID_DETAIL_PANEL_TOGGLE_FIELD ||
        colDef.field === GRID_TREE_DATA_GROUPING_FIELD ||
        colDef.field === GRID_ROW_GROUPING_FIELD ||
        colDef.type === 'actions'
      ) {
        continue;
      }
      cellCount += 1;
      if (colDef.type === 'number') {
        const raw = resolveCellValue(row, colDef);
        const n = Number(raw);
        if (raw !== null && raw !== undefined && raw !== '' && Number.isFinite(n)) {
          sum += n;
          numericCount += 1;
        }
      }
    }
  }

  return {
    cellCount,
    numericCount,
    sum: numericCount > 0 ? sum : null,
    avg: numericCount > 0 ? sum / numericCount : null,
  };
}

/**
 * Serializes ONLY the selected rectangular cell range to Excel-ready TSV.
 */
export function serializeCellRangeToTsv<R extends GridValidRowModel>(
  rows: Array<R | null>,
  columns: Array<GridColDef<R> | undefined>,
  range: GridCellRange,
): string {
  const { minRow, maxRow, minCol, maxCol } = normalizeCellRange(range);
  const lines: string[] = [];

  for (let r = minRow; r <= maxRow; r += 1) {
    const row = rows[r];
    if (!row) continue;
    const cells: string[] = [];
    for (let c = minCol; c <= maxCol; c += 1) {
      const colDef = columns[c];
      if (
        !colDef ||
        colDef.field === GRID_CHECKBOX_SELECTION_FIELD ||
        colDef.field === GRID_REORDER_COL_FIELD ||
        colDef.field === GRID_DETAIL_PANEL_TOGGLE_FIELD ||
        colDef.field === GRID_TREE_DATA_GROUPING_FIELD ||
        colDef.field === GRID_ROW_GROUPING_FIELD ||
        colDef.type === 'actions'
      ) {
        continue;
      }
      const val = formatCellValue(resolveCellValue(row, colDef), row, colDef);
      cells.push(val.replace(/[\t\r\n]+/g, ' '));
    }
    if (cells.length > 0) {
      lines.push(cells.join('\t'));
    }
  }

  return lines.join('\n');
}

/**
 * Parses clipboard TSV text (from Excel/Sheets/Grid Ctrl+C) into a 2D string matrix.
 */
export function parseTsvClipboardMatrix(rawText: string): string[][] {
  if (!rawText) return [];
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  // Strip single trailing empty line commonly appended by spreadsheets
  if (lines.length > 1 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.map((line) => line.split('\t'));
}

/**
 * Applies a parsed 2D clipboard matrix onto target rows/columns starting at
 * (startRowIndex, startColIndex), updating only editable cells with valid values.
 */
export function applyClipboardPasteMatrix<R extends GridValidRowModel>(
  rows: Array<R | null>,
  columns: Array<GridColDef<R> | undefined>,
  startRowIndex: number,
  startColIndex: number,
  matrix: string[][],
  canEditCell?: (row: R, colDef: GridColDef<R>) => boolean,
  processCellPaste?: (params: GridProcessCellPasteParams<R>) => unknown,
): {
  updates: Array<{ rowIndex: number; nextRow: R; oldRow: R }>;
  updatedCells: number;
} {
  const updates: Array<{ rowIndex: number; nextRow: R; oldRow: R }> = [];
  let updatedCells = 0;

  for (let rOffset = 0; rOffset < matrix.length; rOffset += 1) {
    const targetRowIdx = startRowIndex + rOffset;
    const oldRow = rows[targetRowIdx];
    if (!oldRow) continue;

    const rowValues = matrix[rOffset];
    let nextRow: R | null = null;
    const rowId = resolveRowId(oldRow, targetRowIdx);

    for (let cOffset = 0; cOffset < rowValues.length; cOffset += 1) {
      const targetColIdx = startColIndex + cOffset;
      const colDef = columns[targetColIdx];
      if (!colDef || !colDef.editable || colDef.type === 'actions') continue;
      if (canEditCell && !canEditCell(oldRow, colDef)) continue;

      const rawText = rowValues[cOffset];
      let rawCell: unknown = rawText;
      // Allow pasting formatted currency/percentage strings (e.g. "¥128,000" or "85%") into numeric columns
      if (colDef.type === 'number' && typeof rawCell === 'string') {
        const cleaned = rawCell.replace(/[¥￥$,%\s]/g, '');
        if (cleaned !== '') {
          rawCell = cleaned;
        }
      } else if (colDef.type === 'singleSelect' && typeof rawCell === 'string') {
        const opts = normalizeValueOptions(colDef.valueOptions);
        const byLabel = opts.find(
          (o) => o.label === rawCell || String(o.value) === rawCell,
        );
        if (byLabel) {
          rawCell = byLabel.value;
        } else {
          continue;
        }
      }

      if (processCellPaste) {
        try {
          rawCell = processCellPaste({
            row: nextRow ?? oldRow,
            field: colDef.field,
            rawValue: rawText,
            parsedValue: rawCell,
            colDef,
          });
        } catch {
          // Reject/skip cell cleanly when custom processCellPaste throws
          continue;
        }
      }

      const validation: EditCellValidationResult = evaluateEditCellValidation(
        rawCell,
        nextRow ?? oldRow,
        rowId,
        colDef,
      );
      if (!validation.valid) continue;

      const currentVal = resolveCellValue(nextRow ?? oldRow, colDef);
      if (!Object.is(currentVal, validation.value)) {
        nextRow = applyValueSetter(nextRow ?? oldRow, validation.value, colDef);
        updatedCells += 1;
      }
    }

    if (nextRow) {
      updates.push({ rowIndex: targetRowIdx, nextRow, oldRow });
    }
  }

  return { updates, updatedCells };
}

/**
 * Computes atomic cell clear updates across a selected cell range for
 * Delete / Backspace bulk clearing, honoring column editability & row locks.
 */
export function buildCellRangeClearUpdates<R extends GridValidRowModel>(
  rows: Array<R | null>,
  columns: Array<GridColDef<R> | undefined>,
  range: GridCellRange,
  canEditCell?: (row: R, colDef: GridColDef<R>) => boolean,
): {
  updates: Array<{ rowIndex: number; nextRow: R; oldRow: R }>;
  updatedCells: number;
} {
  const { minRow, maxRow, minCol, maxCol } = normalizeCellRange(range);
  const updates: Array<{ rowIndex: number; nextRow: R; oldRow: R }> = [];
  let updatedCells = 0;

  for (let r = minRow; r <= maxRow; r += 1) {
    const oldRow = rows[r];
    if (!oldRow) continue;
    let nextRow: R | null = null;

    for (let c = minCol; c <= maxCol; c += 1) {
      const colDef = columns[c];
      if (!colDef || !colDef.editable || colDef.type === 'actions') continue;
      if (canEditCell && !canEditCell(oldRow, colDef)) continue;

      let clearedValue: unknown;
      if (colDef.type === 'number') {
        clearedValue = 0;
      } else if (colDef.type === 'boolean') {
        clearedValue = false;
      } else if (colDef.type === 'singleSelect') {
        // Skip singleSelect when no empty option exists so row stays valid
        const opts = normalizeValueOptions(colDef.valueOptions);
        if (!opts.some((o) => o.value === '')) continue;
        clearedValue = '';
      } else {
        clearedValue = '';
      }

      const currentVal = resolveCellValue(nextRow ?? oldRow, colDef);
      if (!Object.is(currentVal, clearedValue)) {
        nextRow = applyValueSetter(nextRow ?? oldRow, clearedValue, colDef);
        updatedCells += 1;
      }
    }

    if (nextRow) {
      updates.push({ rowIndex: r, nextRow, oldRow });
    }
  }

  return { updates, updatedCells };
}

/**
 * Reorders a dimension chip inside rowGroupingModel without introducing duplicates.
 */
export function reorderRowGroupingModel(
  model: GridRowGroupingModel,
  sourceField: string,
  targetField: string,
): GridRowGroupingModel {
  if (sourceField === targetField) return model;
  const fromIdx = model.indexOf(sourceField);
  const toIdx = model.indexOf(targetField);
  if (fromIdx === -1 || toIdx === -1) return model;
  const next = [...model];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}

/**
 * Computes the inclusive visual row ID range for official MUI X Shift+Click
 * checkbox range selection.
 */
export function computeShiftRowSelectionRange(
  orderedRowIds: string[],
  anchorId: string | null,
  targetId: string,
): string[] {
  const targetIdx = orderedRowIds.indexOf(targetId);
  if (targetIdx === -1) return [];
  if (!anchorId) return [targetId];
  const anchorIdx = orderedRowIds.indexOf(anchorId);
  if (anchorIdx === -1) return [targetId];
  const start = Math.min(anchorIdx, targetIdx);
  const end = Math.max(anchorIdx, targetIdx);
  return orderedRowIds.slice(start, end + 1);
}

/**
 * Computes Excel / MUI X Premium Fill-Handle AutoFill updates from `sourceRange`
 * into `targetRange`. Supports linear arithmetic series extrapolation for 2+
 * numeric source cells along the fill axis and repeating/tiling for all other values.
 */
export function computeAutoFillUpdates<R extends GridValidRowModel>(
  rows: Array<R | null>,
  columns: Array<GridColDef<R> | undefined>,
  sourceRange: GridCellRange,
  targetRange: GridCellRange,
  canEditCell?: (row: R, colDef: GridColDef<R>) => boolean,
): {
  updates: Array<{ rowIndex: number; nextRow: R; oldRow: R }>;
  updatedCells: number;
} {
  const src = normalizeCellRange(sourceRange);
  const tgt = normalizeCellRange(targetRange);
  const srcHeight = src.maxRow - src.minRow + 1;
  const srcWidth = src.maxCol - src.minCol + 1;

  const isVerticalFill =
    tgt.minRow < src.minRow || tgt.maxRow > src.maxRow;
  const isHorizontalFill =
    !isVerticalFill && (tgt.minCol < src.minCol || tgt.maxCol > src.maxCol);

  if (!isVerticalFill && !isHorizontalFill) {
    return { updates: [], updatedCells: 0 };
  }

  const updates: Array<{ rowIndex: number; nextRow: R; oldRow: R }> = [];
  let updatedCells = 0;

  // Pre-compute vertical arithmetic progression per column if applicable
  const verticalSeries = new Map<
    number,
    { first: number; last: number; step: number }
  >();
  if (isVerticalFill && srcHeight >= 2) {
    for (let c = src.minCol; c <= src.maxCol; c += 1) {
      const colDef = columns[c];
      if (!colDef || colDef.type !== 'number') continue;
      const vals: number[] = [];
      let allNumeric = true;
      for (let r = src.minRow; r <= src.maxRow; r += 1) {
        const row = rows[r];
        if (!row) {
          allNumeric = false;
          break;
        }
        const n = Number(resolveCellValue(row, colDef));
        if (!Number.isFinite(n)) {
          allNumeric = false;
          break;
        }
        vals.push(n);
      }
      if (allNumeric && vals.length >= 2) {
        const step = vals[1] - vals[0];
        const isArithmetic = vals.every(
          (v, idx) => idx === 0 || Math.abs(v - vals[idx - 1] - step) < 1e-6,
        );
        if (isArithmetic) {
          verticalSeries.set(c, {
            first: vals[0],
            last: vals[vals.length - 1],
            step,
          });
        }
      }
    }
  }

  // Pre-compute horizontal arithmetic progression per row if applicable
  const horizontalSeries = new Map<
    number,
    { first: number; last: number; step: number }
  >();
  if (isHorizontalFill && srcWidth >= 2) {
    for (let r = src.minRow; r <= src.maxRow; r += 1) {
      const row = rows[r];
      if (!row) continue;
      const vals: number[] = [];
      let allNumeric = true;
      for (let c = src.minCol; c <= src.maxCol; c += 1) {
        const colDef = columns[c];
        if (!colDef || colDef.type !== 'number') {
          allNumeric = false;
          break;
        }
        const n = Number(resolveCellValue(row, colDef));
        if (!Number.isFinite(n)) {
          allNumeric = false;
          break;
        }
        vals.push(n);
      }
      if (allNumeric && vals.length >= 2) {
        const step = vals[1] - vals[0];
        const isArithmetic = vals.every(
          (v, idx) => idx === 0 || Math.abs(v - vals[idx - 1] - step) < 1e-6,
        );
        if (isArithmetic) {
          horizontalSeries.set(r, {
            first: vals[0],
            last: vals[vals.length - 1],
            step,
          });
        }
      }
    }
  }

  for (let r = tgt.minRow; r <= tgt.maxRow; r += 1) {
    const oldRow = rows[r];
    if (!oldRow) continue;
    let nextRow: R | null = null;

    for (let c = tgt.minCol; c <= tgt.maxCol; c += 1) {
      // Skip cells already inside the source selection
      if (
        r >= src.minRow &&
        r <= src.maxRow &&
        c >= src.minCol &&
        c <= src.maxCol
      ) {
        continue;
      }

      const colDef = columns[c];
      if (
        !colDef ||
        !colDef.editable ||
        colDef.type === 'actions' ||
        isHierarchyColId(colDef.field)
      ) {
        continue;
      }
      if (canEditCell && !canEditCell(oldRow, colDef)) {
        continue;
      }

      let rawFillVal: unknown;
      const vSeries = verticalSeries.get(c);
      const hSeries = horizontalSeries.get(r);

      if (isVerticalFill && vSeries) {
        const delta = r > src.maxRow ? r - src.maxRow : r - src.minRow;
        const base = r > src.maxRow ? vSeries.last : vSeries.first;
        rawFillVal = Math.round((base + vSeries.step * delta) * 100) / 100;
      } else if (isHorizontalFill && hSeries && colDef.type === 'number') {
        const delta = c > src.maxCol ? c - src.maxCol : c - src.minCol;
        const base = c > src.maxCol ? hSeries.last : hSeries.first;
        rawFillVal = Math.round((base + hSeries.step * delta) * 100) / 100;
      } else {
        const srcRowOffset =
          (((r - src.minRow) % srcHeight) + srcHeight) % srcHeight;
        const srcColOffset =
          (((c - src.minCol) % srcWidth) + srcWidth) % srcWidth;
        const srcRow = rows[src.minRow + srcRowOffset];
        const srcCol = columns[src.minCol + srcColOffset];
        if (!srcRow || !srcCol) continue;
        rawFillVal = resolveCellValue(srcRow, srcCol);
      }

      const rowId = resolveRowId(oldRow, r);
      const validation: EditCellValidationResult = evaluateEditCellValidation(
        rawFillVal,
        nextRow ?? oldRow,
        rowId,
        colDef,
      );
      if (!validation.valid) continue;

      const currentVal = resolveCellValue(nextRow ?? oldRow, colDef);
      if (!Object.is(currentVal, validation.value)) {
        nextRow = applyValueSetter(nextRow ?? oldRow, validation.value, colDef);
        updatedCells += 1;
      }
    }

    if (nextRow) {
      updates.push({ rowIndex: r, nextRow, oldRow });
    }
  }

  return { updates, updatedCells };
}

/**
 * Pure Edit History Undo/Redo state machine for MUI X cell edit, row edit, paste, and autofill.
 */
export interface EditHistoryState<
  R extends GridValidRowModel = GridValidRowModel,
> {
  past: GridEditHistoryBatch<R>[];
  future: GridEditHistoryBatch<R>[];
  maxEntries: number;
}

export function createEditHistoryState<
  R extends GridValidRowModel = GridValidRowModel,
>(maxEntries = 50): EditHistoryState<R> {
  return {
    past: [],
    future: [],
    maxEntries: Math.max(1, maxEntries),
  };
}

export function pushEditHistoryEntry<R extends GridValidRowModel>(
  state: EditHistoryState<R>,
  batch: GridEditHistoryBatch<R>,
): EditHistoryState<R> {
  if (batch.changes.length === 0) return state;
  const nextPast = [...state.past, batch];
  const trimmedPast =
    nextPast.length > state.maxEntries
      ? nextPast.slice(nextPast.length - state.maxEntries)
      : nextPast;
  return {
    ...state,
    past: trimmedPast,
    future: [],
  };
}

export function undoEditHistory<R extends GridValidRowModel>(
  state: EditHistoryState<R>,
): { state: EditHistoryState<R>; batch: GridEditHistoryBatch<R> | null } {
  if (state.past.length === 0) {
    return { state, batch: null };
  }
  const batch = state.past[state.past.length - 1];
  const nextPast = state.past.slice(0, -1);
  return {
    batch,
    state: {
      ...state,
      past: nextPast,
      future: [batch, ...state.future],
    },
  };
}

export function redoEditHistory<R extends GridValidRowModel>(
  state: EditHistoryState<R>,
): { state: EditHistoryState<R>; batch: GridEditHistoryBatch<R> | null } {
  if (state.future.length === 0) {
    return { state, batch: null };
  }
  const [batch, ...restFuture] = state.future;
  return {
    batch,
    state: {
      ...state,
      past: [...state.past, batch],
      future: restFuture,
    },
  };
}

/**
 * Upserts a one-click exact-value filter item for a cell's raw value (used by right-click context menu).
 */
export function upsertExactValueFilter<R extends GridValidRowModel>(
  filterModel: GridFilterModel,
  field: string,
  rawValue: unknown,
  colDef?: GridColDef<R>,
): GridFilterModel {
  const isEmptyValue =
    rawValue === null ||
    rawValue === undefined ||
    (typeof rawValue === 'string' && rawValue.trim() === '');

  let operator: GridFilterOperatorValue;
  let value = '';

  if (isEmptyValue) {
    operator = 'isEmpty';
    value = '';
  } else if (colDef?.type === 'number') {
    operator = '=';
    value = String(rawValue);
  } else if (
    colDef?.type === 'singleSelect' ||
    colDef?.type === 'boolean' ||
    colDef?.type === 'date'
  ) {
    operator = 'is';
    value = String(rawValue);
  } else {
    operator = 'equals';
    value = String(rawValue);
  }

  const remaining = filterModel.items.filter((item) => item.field !== field);
  const newItem: GridFilterItem = {
    id: `ctx_filter_${field}`,
    field,
    operator,
    value,
  };

  return {
    ...filterModel,
    items: [...remaining, newItem],
  };
}

