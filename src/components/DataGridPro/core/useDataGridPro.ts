import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useTable,
  tableFeatures,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnResizingFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  createSortedRowModel,
  createPaginatedRowModel,
  sortFns,
  type ColumnDef,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ColumnVisibilityState,
  type PaginationState,
  type ReactTable,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import type {
  DataGridProProps,
  GridAggregationFunctionName,
  GridAggregationModel,
  GridColDef,
  GridDensity,
  GridFilterItem,
  GridFilterModel,
  GridFilterOperatorValue,
  GridPaginationModel,
  GridPersistedState,
  GridPinnedColumnFields,
  GridPivotModel,
  GridRowGroupingColumnMode,
  GridRowGroupingModel,
  GridRowId,
  GridSortDirection,
  GridSortModel,
  GridStateSnapshot,
  GridValidRowModel,
} from '../types';
import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_MAX_COLUMN_WIDTH,
  DEFAULT_MIN_COLUMN_WIDTH,
  GRID_CHECKBOX_COLUMN_WIDTH,
  GRID_CHECKBOX_SELECTION_FIELD,
  GRID_DETAIL_PANEL_TOGGLE_FIELD,
  GRID_DETAIL_PANEL_TOGGLE_WIDTH,
  GRID_REORDER_COL_FIELD,
  GRID_REORDER_COL_WIDTH,
  GRID_ROW_GROUPING_FIELD,
  GRID_TREE_DATA_DEFAULT_WIDTH,
  GRID_TREE_DATA_GROUPING_FIELD,
  buildColumnGroupHeaderRows,
  buildRowGroupingRows,
  buildTreeDataRows,
  collectDefaultExpandedRowGroups,
  collectDefaultExpandedTreeGroups,
  computeColumnAutosizeWidth,
  computePinnedOffsets,
  computeShiftRowSelectionRange,
  createRowFilterPredicate,
  evaluateFilterModel,
  formatCellValue,
  getMultipleGroupingColId,
  getOperatorsForColumn,
  isFilterItemActive,
  isHierarchyColId,
  reorderColumnIds,
  reorderRowGroupingModel,
  resolveCellValue,
  resolveRowId,
  swapColumnOrder,
  upsertHeaderFilterItem,
  upsertHeaderFilterOperator,
} from './gridCore';
import { getNextSortDirection } from './columnVirtualizer';
import { computeFlexColumnWidths } from './flexLayout';

export const dataGridFeatures = tableFeatures({
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnResizingFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns,
});

export type DataGridFeatures = typeof dataGridFeatures;
export type DataGridReactTable<R extends GridValidRowModel> = ReactTable<
  DataGridFeatures,
  R
>;

export interface ColumnMetaExt<R extends GridValidRowModel = GridValidRowModel> {
  colDef: GridColDef<R>;
}

function isInternalField(id: string): boolean {
  return (
    id === GRID_CHECKBOX_SELECTION_FIELD ||
    id === GRID_REORDER_COL_FIELD ||
    id === GRID_DETAIL_PANEL_TOGGLE_FIELD ||
    isHierarchyColId(id)
  );
}

function toTanStackSorting(
  sortModel?: Array<{ field: string; sort: GridSortDirection }>,
): SortingState {
  if (!sortModel) return [];
  return sortModel.map((item) => ({
    id: item.field,
    desc: item.sort === 'desc',
  }));
}

function toGridSortModel(sorting: SortingState) {
  return sorting.map((item) => ({
    field: item.id,
    sort: (item.desc ? 'desc' : 'asc') as GridSortDirection,
  }));
}

function syncUtilityLeftPins(
  dataStart: string[],
  checkboxSelection: boolean,
  rowReordering: boolean,
  hasDetailPanel: boolean,
  hierarchyFields: string[],
): string[] {
  if (dataStart.length === 0 && hierarchyFields.length === 0) return [];
  const prefix: string[] = [];
  if (checkboxSelection) prefix.push(GRID_CHECKBOX_SELECTION_FIELD);
  if (rowReordering) prefix.push(GRID_REORDER_COL_FIELD);
  if (hasDetailPanel) prefix.push(GRID_DETAIL_PANEL_TOGGLE_FIELD);
  for (const hf of hierarchyFields) {
    prefix.push(hf);
  }
  return [...prefix, ...dataStart];
}

function normalizePinning(
  pinned: GridPinnedColumnFields | undefined,
  checkboxSelection: boolean,
  rowReordering: boolean,
  hasDetailPanel: boolean,
  hierarchyFields: string[],
): ColumnPinningState {
  const dataStart = (pinned?.left ?? []).filter((id) => !isInternalField(id));
  const end = (pinned?.right ?? []).filter((id) => !isInternalField(id));
  return {
    start: syncUtilityLeftPins(
      dataStart,
      checkboxSelection,
      rowReordering,
      hasDetailPanel,
      hierarchyFields,
    ),
    end,
  };
}

function buildColumnOrder<R extends GridValidRowModel>(
  columns: GridColDef<R>[],
  baseOrder: string[] | undefined,
  checkboxSelection: boolean,
  rowReordering: boolean,
  hasDetailPanel: boolean,
  hierarchyFields: string[],
): ColumnOrderState {
  const dataFieldSet = new Set(columns.map((c) => c.field));
  const orderedDataFields: string[] = [];

  if (baseOrder && baseOrder.length > 0) {
    for (const id of baseOrder) {
      if (dataFieldSet.has(id) && !orderedDataFields.includes(id)) {
        orderedDataFields.push(id);
      }
    }
  }
  for (const col of columns) {
    if (!orderedDataFields.includes(col.field)) {
      orderedDataFields.push(col.field);
    }
  }

  const prefix: string[] = [];
  if (checkboxSelection) prefix.push(GRID_CHECKBOX_SELECTION_FIELD);
  if (rowReordering) prefix.push(GRID_REORDER_COL_FIELD);
  if (hasDetailPanel) prefix.push(GRID_DETAIL_PANEL_TOGGLE_FIELD);
  for (const hf of hierarchyFields) {
    prefix.push(hf);
  }
  return [...prefix, ...orderedDataFields];
}

export interface UseDataGridProInternalOptions {
  pivotMode?: boolean;
  pivotModel?: GridPivotModel;
  pivotPinnedOverride?: { left: string[]; right: string[] } | null;
  viewportWidth?: number;
}

export function useDataGridPro<R extends GridValidRowModel>(
  props: DataGridProProps<R>,
  internalOptions?: UseDataGridProInternalOptions,
) {
  const {
    rows,
    columns,
    getRowId,
    checkboxSelection = false,
    disableMultipleRowSelection = false,
    keepNonExistentRowsSelected = false,
    isRowSelectable,
    rowReordering = false,
    columnGroupingModel,
    treeData = false,
    getTreeDataPath,
    rowGroupingModel: controlledRowGroupingModel,
    onRowGroupingModelChange,
    rowGroupingColumnMode: controlledRowGroupingColumnMode,
    onRowGroupingColumnModeChange,
    groupingColDef,
    defaultGroupingExpansionDepth = 1,
    aggregationModel: controlledAggregationModel,
    onAggregationModelChange,
    getDetailPanelContent,
    detailPanelExpandedRowIds: controlledExpandedIds,
    onDetailPanelExpandedRowIdsChange,
    pagination = true,
    paginationMode = 'client',
    sortingMode = 'client',
    filterMode = 'client',
    rowCount: externalRowCount,
    initialState,
    sortModel: controlledSortModel,
    onSortModelChange,
    filterModel: controlledFilterModel,
    onFilterModelChange,
    paginationModel: controlledPaginationModel,
    onPaginationModelChange,
    columnVisibilityModel: controlledColumnVisibilityModel,
    onColumnVisibilityModelChange,
    pinnedColumns: controlledPinnedColumns,
    onPinnedColumnsChange,
    density: controlledDensity,
    onDensityChange,
    rowSelectionModel: controlledRowSelection,
    onRowSelectionModelChange,
    sortingOrder,
    disableColumnSorting = false,
    disableColumnResize = false,
    disableColumnPinning = false,
    onColumnOrderChange,
    onColumnWidthChange,
    onStateChange,
  } = props;

  const isServerPagination = paginationMode === 'server';
  const isServerSorting = sortingMode === 'server';
  const isServerFiltering = filterMode === 'server';

  // Row Grouping model state (controlled or uncontrolled)
  const [internalRowGroupingModel, setInternalRowGroupingModel] =
    useState<GridRowGroupingModel>([]);
  const rowGroupingModel =
    controlledRowGroupingModel ?? internalRowGroupingModel;

  const setRowGroupingModel = useCallback(
    (next: GridRowGroupingModel) => {
      if (controlledRowGroupingModel === undefined) {
        setInternalRowGroupingModel(next);
      }
      onRowGroupingModelChange?.(next);
    },
    [controlledRowGroupingModel, onRowGroupingModelChange],
  );

  // Row Grouping column mode ('single' | 'multiple')
  const [internalRowGroupingColumnMode, setInternalRowGroupingColumnMode] =
    useState<GridRowGroupingColumnMode>('single');
  const rowGroupingColumnMode =
    controlledRowGroupingColumnMode ?? internalRowGroupingColumnMode;

  const setRowGroupingColumnMode = useCallback(
    (next: GridRowGroupingColumnMode) => {
      if (controlledRowGroupingColumnMode === undefined) {
        setInternalRowGroupingColumnMode(next);
      }
      onRowGroupingColumnModeChange?.(next);
    },
    [controlledRowGroupingColumnMode, onRowGroupingColumnModeChange],
  );

  const toggleRowGroupingColumn = useCallback(
    (field: string) => {
      const exists = rowGroupingModel.includes(field);
      const next = exists
        ? rowGroupingModel.filter((f) => f !== field)
        : [...rowGroupingModel, field];
      setRowGroupingModel(next);
    },
    [rowGroupingModel, setRowGroupingModel],
  );

  const addRowGroupingColumn = useCallback(
    (field: string) => {
      const colDef = columns.find((c) => c.field === field);
      if (
        !colDef ||
        colDef.type === 'actions' ||
        colDef.groupable === false ||
        rowGroupingModel.includes(field)
      ) {
        return;
      }
      setRowGroupingModel([...rowGroupingModel, field]);
    },
    [columns, rowGroupingModel, setRowGroupingModel],
  );

  const reorderRowGroupingColumn = useCallback(
    (sourceField: string, targetField: string) => {
      const next = reorderRowGroupingModel(
        rowGroupingModel,
        sourceField,
        targetField,
      );
      if (next !== rowGroupingModel) {
        setRowGroupingModel(next);
      }
    },
    [rowGroupingModel, setRowGroupingModel],
  );

  const removeRowGroupingColumn = useCallback(
    (field: string) => {
      setRowGroupingModel(rowGroupingModel.filter((f) => f !== field));
    },
    [rowGroupingModel, setRowGroupingModel],
  );

  const clearRowGrouping = useCallback(() => {
    setRowGroupingModel([]);
  }, [setRowGroupingModel]);

  const hasDetailPanel = Boolean(getDetailPanelContent);
  const hasTreeData = Boolean(treeData && getTreeDataPath);
  const hasRowGrouping = !hasTreeData && rowGroupingModel.length > 0;
  const hierarchyFields = useMemo<string[]>(() => {
    if (hasTreeData) return [GRID_TREE_DATA_GROUPING_FIELD];
    if (hasRowGrouping) {
      return rowGroupingColumnMode === 'multiple'
        ? rowGroupingModel.map(getMultipleGroupingColId)
        : [GRID_ROW_GROUPING_FIELD];
    }
    return [];
  }, [hasTreeData, hasRowGrouping, rowGroupingColumnMode, rowGroupingModel]);

  // Density state
  const [internalDensity, setInternalDensity] = useState<GridDensity>(
    initialState?.density ?? 'standard',
  );
  const density = controlledDensity ?? internalDensity;

  const setDensity = useCallback(
    (next: GridDensity) => {
      if (controlledDensity === undefined) {
        setInternalDensity(next);
      }
      onDensityChange?.(next);
    },
    [controlledDensity, onDensityChange],
  );

  // Aggregation model state (controlled or uncontrolled)
  const [internalAggregationModel, setInternalAggregationModel] =
    useState<GridAggregationModel>({});
  const aggregationModel =
    controlledAggregationModel ?? internalAggregationModel;

  const setAggregationModel = useCallback(
    (next: GridAggregationModel) => {
      if (controlledAggregationModel === undefined) {
        setInternalAggregationModel(next);
      }
      onAggregationModelChange?.(next);
    },
    [controlledAggregationModel, onAggregationModelChange],
  );

  const setColumnAggregation = useCallback(
    (field: string, fn: GridAggregationFunctionName | null) => {
      const next: GridAggregationModel = { ...aggregationModel };
      if (fn === null) {
        delete next[field];
      } else {
        next[field] = fn;
      }
      setAggregationModel(next);
    },
    [aggregationModel, setAggregationModel],
  );

  // Sorting state (multi-sort enabled, controlled or uncontrolled)
  const [internalSorting, setInternalSorting] = useState<SortingState>(() =>
    toTanStackSorting(initialState?.sorting?.sortModel),
  );
  const sorting = useMemo(
    () =>
      controlledSortModel !== undefined
        ? toTanStackSorting(controlledSortModel)
        : internalSorting,
    [controlledSortModel, internalSorting],
  );
  const setSorting = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      if (controlledSortModel === undefined) {
        setInternalSorting(next);
      }
      onSortModelChange?.(toGridSortModel(next));
    },
    [controlledSortModel, onSortModelChange, sorting],
  );

  const setSortModel = useCallback(
    (model: GridSortModel) => {
      setSorting(toTanStackSorting(model));
    },
    [setSorting],
  );

  // Filter state (MUI X Pro multi-filter + header filters + quick filter, controlled or uncontrolled)
  const [internalFilterModel, setInternalFilterModel] =
    useState<GridFilterModel>(() => ({
      items: initialState?.filter?.filterModel?.items ?? [],
      logicOperator: initialState?.filter?.filterModel?.logicOperator ?? 'and',
      quickFilterValues:
        initialState?.filter?.filterModel?.quickFilterValues ?? [],
    }));
  const filterModel = controlledFilterModel ?? internalFilterModel;
  const setFilterModel = useCallback(
    (
      updater: GridFilterModel | ((old: GridFilterModel) => GridFilterModel),
    ) => {
      const next =
        typeof updater === 'function' ? updater(filterModel) : updater;
      if (controlledFilterModel === undefined) {
        setInternalFilterModel(next);
      }
      onFilterModelChange?.(next);
    },
    [controlledFilterModel, filterModel, onFilterModelChange],
  );

  // Column visibility state (controlled or uncontrolled)
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<ColumnVisibilityState>(() => ({
      ...(initialState?.columns?.columnVisibilityModel ?? {}),
    }));
  const columnVisibility =
    controlledColumnVisibilityModel ?? internalColumnVisibility;
  const setColumnVisibility = useCallback(
    (
      updater:
        | ColumnVisibilityState
        | ((old: ColumnVisibilityState) => ColumnVisibilityState),
    ) => {
      const next =
        typeof updater === 'function' ? updater(columnVisibility) : updater;
      if (controlledColumnVisibilityModel === undefined) {
        setInternalColumnVisibility(next);
      }
      onColumnVisibilityModelChange?.(next);
    },
    [
      columnVisibility,
      controlledColumnVisibilityModel,
      onColumnVisibilityModelChange,
    ],
  );

  // Column ordering state (MUI X Pro drag-and-drop column reordering)
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() =>
    buildColumnOrder(
      columns,
      initialState?.columns?.orderedFields,
      checkboxSelection,
      rowReordering,
      hasDetailPanel,
      hierarchyFields,
    ),
  );

  useEffect(() => {
    if (internalOptions?.pivotMode) return;
    setColumnOrder((prev) =>
      buildColumnOrder(
        columns,
        prev,
        checkboxSelection,
        rowReordering,
        hasDetailPanel,
        hierarchyFields,
      ),
    );
  }, [
    columns,
    checkboxSelection,
    rowReordering,
    hasDetailPanel,
    hierarchyFields,
    internalOptions?.pivotMode,
  ]);

  // Column pinning state (controlled or uncontrolled)
  const [internalColumnPinning, setInternalColumnPinning] =
    useState<ColumnPinningState>(() =>
      normalizePinning(
        initialState?.pinnedColumns,
        checkboxSelection,
        rowReordering,
        hasDetailPanel,
        hierarchyFields,
      ),
    );
  const columnPinning = useMemo(
    () =>
      controlledPinnedColumns !== undefined
        ? normalizePinning(
            controlledPinnedColumns,
            checkboxSelection,
            rowReordering,
            hasDetailPanel,
            hierarchyFields,
          )
        : internalColumnPinning,
    [
      checkboxSelection,
      controlledPinnedColumns,
      hasDetailPanel,
      hierarchyFields,
      internalColumnPinning,
      rowReordering,
    ],
  );
  const setColumnPinning = useCallback(
    (
      updater:
        | ColumnPinningState
        | ((old: ColumnPinningState) => ColumnPinningState),
    ) => {
      const next =
        typeof updater === 'function' ? updater(columnPinning) : updater;
      if (controlledPinnedColumns === undefined) {
        setInternalColumnPinning(next);
      }
      onPinnedColumnsChange?.({
        left: (next.start ?? []).filter((id) => !isInternalField(id)),
        right: [...(next.end ?? [])],
      });
    },
    [columnPinning, controlledPinnedColumns, onPinnedColumnsChange],
  );

  useEffect(() => {
    if (controlledPinnedColumns !== undefined) return;
    setInternalColumnPinning((prev) => {
      const dataStart = (prev.start ?? []).filter((id) => !isInternalField(id));
      const nextStart = syncUtilityLeftPins(
        dataStart,
        checkboxSelection,
        rowReordering,
        hasDetailPanel,
        hierarchyFields,
      );
      if (
        nextStart.length === (prev.start ?? []).length &&
        nextStart.every((id, idx) => id === (prev.start ?? [])[idx])
      ) {
        return prev;
      }
      return { ...prev, start: nextStart };
    });
  }, [
    checkboxSelection,
    controlledPinnedColumns,
    rowReordering,
    hasDetailPanel,
    hierarchyFields,
  ]);

  // Column sizing state
  const [columnSizing, setColumnSizingState] = useState<ColumnSizingState>({});
  const onColumnWidthChangeRef = useRef(onColumnWidthChange);
  onColumnWidthChangeRef.current = onColumnWidthChange;
  const onColumnOrderChangeRef = useRef(onColumnOrderChange);
  onColumnOrderChangeRef.current = onColumnOrderChange;

  const setColumnSizing = useCallback(
    (
      updater:
        | ColumnSizingState
        | ((old: ColumnSizingState) => ColumnSizingState),
    ) => {
      setColumnSizingState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        const cb = onColumnWidthChangeRef.current;
        if (cb) {
          for (const [field, width] of Object.entries(next)) {
            if (prev[field] !== width && typeof width === 'number') {
              const colDef = columns.find((c) => c.field === field);
              if (colDef) {
                cb({ colDef, width });
              }
            }
          }
        }
        return next;
      });
    },
    [columns],
  );

  // Master-Detail expanded rows state
  const [internalExpandedIds, setInternalExpandedIds] = useState<GridRowId[]>(
    () => initialState?.detailPanel?.expandedRowIds ?? [],
  );
  const expandedRowIds = controlledExpandedIds ?? internalExpandedIds;

  const toggleDetailPanel = useCallback(
    (rowId: GridRowId) => {
      const exists = expandedRowIds.includes(rowId);
      const next = exists
        ? expandedRowIds.filter((id) => id !== rowId)
        : [...expandedRowIds, rowId];
      if (controlledExpandedIds === undefined) {
        setInternalExpandedIds(next);
      }
      onDetailPanelExpandedRowIdsChange?.(next);
    },
    [
      controlledExpandedIds,
      expandedRowIds,
      onDetailPanelExpandedRowIdsChange,
    ],
  );

  // Pagination state (controlled or uncontrolled)
  const [internalPaginationState, setInternalPaginationState] =
    useState<PaginationState>(() => ({
      pageIndex: initialState?.pagination?.paginationModel?.page ?? 0,
      pageSize: initialState?.pagination?.paginationModel?.pageSize ?? 10,
    }));
  const paginationState = useMemo<PaginationState>(
    () =>
      controlledPaginationModel !== undefined
        ? {
            pageIndex: controlledPaginationModel.page,
            pageSize: controlledPaginationModel.pageSize,
          }
        : internalPaginationState,
    [controlledPaginationModel, internalPaginationState],
  );
  const setPaginationState = useCallback(
    (
      updater: PaginationState | ((old: PaginationState) => PaginationState),
    ) => {
      const next =
        typeof updater === 'function' ? updater(paginationState) : updater;
      if (controlledPaginationModel === undefined) {
        setInternalPaginationState(next);
      }
      onPaginationModelChange?.({
        page: next.pageIndex,
        pageSize: next.pageSize,
      });
    },
    [controlledPaginationModel, onPaginationModelChange, paginationState],
  );

  // Row selection state
  const [internalRowSelection, setInternalRowSelection] =
    useState<RowSelectionState>({});

  const getRowIdRef = useRef(getRowId);
  getRowIdRef.current = getRowId;
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  // Map stringified row ID back to original GridRowId
  const idLookup = useMemo(() => {
    const map = new Map<string, GridRowId>();
    rows.forEach((row, index) => {
      const id = resolveRowId(row, index, getRowIdRef.current);
      map.set(String(id), id);
    });
    return map;
  }, [rows]);

  // Official MUI X keepNonExistentRowsSelected: prune deleted row IDs when false
  useEffect(() => {
    if (keepNonExistentRowsSelected || controlledRowSelection !== undefined) {
      return;
    }
    setInternalRowSelection((prev) => {
      const keys = Object.keys(prev).filter((k) => prev[k]);
      const prunedKeys = keys.filter((k) => idLookup.has(k));
      if (prunedKeys.length === keys.length) return prev;
      const next: RowSelectionState = {};
      for (const k of prunedKeys) {
        next[k] = true;
      }
      return next;
    });
  }, [controlledRowSelection, idLookup, keepNonExistentRowsSelected]);

  const rowSelection: RowSelectionState = useMemo(() => {
    if (controlledRowSelection !== undefined) {
      const record: RowSelectionState = {};
      for (const id of controlledRowSelection) {
        record[String(id)] = true;
      }
      return record;
    }
    return internalRowSelection;
  }, [controlledRowSelection, internalRowSelection]);

  const handleRowSelectionChange = useCallback(
    (
      updater:
        | RowSelectionState
        | ((old: RowSelectionState) => RowSelectionState),
    ) => {
      const rawNext =
        typeof updater === 'function' ? updater(rowSelection) : updater;
      let next: RowSelectionState = rawNext;

      if (disableMultipleRowSelection) {
        const selectedKeys = Object.keys(rawNext).filter((k) => rawNext[k]);
        if (selectedKeys.length > 1) {
          const newlyAdded = selectedKeys.find((k) => !rowSelection[k]);
          const kept = newlyAdded ?? selectedKeys[selectedKeys.length - 1];
          next = kept ? { [kept]: true } : {};
        }
      }

      if (controlledRowSelection === undefined) {
        setInternalRowSelection(next);
      }
      if (onRowSelectionModelChange) {
        const ids: GridRowId[] = Object.keys(next)
          .filter((k) => next[k])
          .map((k) => idLookup.get(k) ?? k);
        onRowSelectionModelChange(ids);
      }
    },
    [
      controlledRowSelection,
      disableMultipleRowSelection,
      idLookup,
      onRowSelectionModelChange,
      rowSelection,
    ],
  );

  const selectRowRange = useCallback(
    (
      orderedRowIds: string[],
      anchorId: string,
      targetId: string,
      nextSelected: boolean,
    ) => {
      if (disableMultipleRowSelection) {
        handleRowSelectionChange(nextSelected ? { [targetId]: true } : {});
        return;
      }
      const rangeIds = computeShiftRowSelectionRange(
        orderedRowIds,
        anchorId,
        targetId,
      );
      if (rangeIds.length === 0) return;
      handleRowSelectionChange((prev) => {
        const next: RowSelectionState = { ...prev };
        for (const id of rangeIds) {
          if (nextSelected) {
            next[id] = true;
          } else {
            delete next[id];
          }
        }
        return next;
      });
    },
    [disableMultipleRowSelection, handleRowSelectionChange],
  );

  // Filter rows via pure MUI X Pro filter engine (ignore stale non-existent column filters in pivotMode)
  const validColumnFieldSet = useMemo(
    () => new Set(columns.map((c) => c.field)),
    [columns],
  );
  const effectiveFilterModel = useMemo<GridFilterModel>(() => {
    if (!internalOptions?.pivotMode) return filterModel;
    return {
      ...filterModel,
      items: filterModel.items.filter((item) =>
        validColumnFieldSet.has(item.field),
      ),
    };
  }, [filterModel, internalOptions?.pivotMode, validColumnFieldSet]);

  const filteredRows = useMemo(() => {
    if (isServerFiltering) return rows;
    const predicate = createRowFilterPredicate(effectiveFilterModel, columns);
    return rows.filter(predicate);
  }, [isServerFiltering, rows, effectiveFilterModel, columns]);

  // Reset to page 0 when filter criteria change (and on server-side sort changes)
  const prevFilterRef = useRef(filterModel);
  useEffect(() => {
    if (prevFilterRef.current !== filterModel) {
      prevFilterRef.current = filterModel;
      setPaginationState((prev) =>
        prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
      );
    }
  }, [filterModel, setPaginationState]);

  const prevSortSigRef = useRef(JSON.stringify(sorting));
  useEffect(() => {
    const sig = JSON.stringify(sorting);
    if (sig !== prevSortSigRef.current) {
      prevSortSigRef.current = sig;
      if (isServerSorting && isServerPagination) {
        setPaginationState((prev) =>
          prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
        );
      }
    }
  }, [sorting, isServerSorting, isServerPagination, setPaginationState]);

  // Adapt MUI X GridColDef[] -> TanStack Table v9 ColumnDef[]
  const tanStackColumns = useMemo<
    ColumnDef<DataGridFeatures, R, unknown>[]
  >(() => {
    const mapped: ColumnDef<DataGridFeatures, R, unknown>[] = [];

    if (checkboxSelection) {
      mapped.push({
        id: GRID_CHECKBOX_SELECTION_FIELD,
        header: '',
        size: GRID_CHECKBOX_COLUMN_WIDTH,
        minSize: GRID_CHECKBOX_COLUMN_WIDTH,
        maxSize: GRID_CHECKBOX_COLUMN_WIDTH,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        enablePinning: true,
        meta: {
          colDef: {
            field: GRID_CHECKBOX_SELECTION_FIELD,
            headerName: '选择',
            width: GRID_CHECKBOX_COLUMN_WIDTH,
            minWidth: GRID_CHECKBOX_COLUMN_WIDTH,
            maxWidth: GRID_CHECKBOX_COLUMN_WIDTH,
            sortable: false,
            filterable: false,
            resizable: false,
            hideable: false,
            pinnable: false,
            disableReorder: true,
            align: 'center',
            headerAlign: 'center',
          },
        } satisfies ColumnMetaExt<R>,
      });
    }

    if (rowReordering) {
      mapped.push({
        id: GRID_REORDER_COL_FIELD,
        header: '',
        size: GRID_REORDER_COL_WIDTH,
        minSize: GRID_REORDER_COL_WIDTH,
        maxSize: GRID_REORDER_COL_WIDTH,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        enablePinning: true,
        meta: {
          colDef: {
            field: GRID_REORDER_COL_FIELD,
            headerName: '排序手柄',
            width: GRID_REORDER_COL_WIDTH,
            minWidth: GRID_REORDER_COL_WIDTH,
            maxWidth: GRID_REORDER_COL_WIDTH,
            sortable: false,
            filterable: false,
            resizable: false,
            hideable: false,
            pinnable: false,
            disableReorder: true,
            align: 'center',
            headerAlign: 'center',
          },
        } satisfies ColumnMetaExt<R>,
      });
    }

    if (hasDetailPanel) {
      mapped.push({
        id: GRID_DETAIL_PANEL_TOGGLE_FIELD,
        header: '',
        size: GRID_DETAIL_PANEL_TOGGLE_WIDTH,
        minSize: GRID_DETAIL_PANEL_TOGGLE_WIDTH,
        maxSize: GRID_DETAIL_PANEL_TOGGLE_WIDTH,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        enablePinning: true,
        meta: {
          colDef: {
            field: GRID_DETAIL_PANEL_TOGGLE_FIELD,
            headerName: '明细',
            width: GRID_DETAIL_PANEL_TOGGLE_WIDTH,
            minWidth: GRID_DETAIL_PANEL_TOGGLE_WIDTH,
            maxWidth: GRID_DETAIL_PANEL_TOGGLE_WIDTH,
            sortable: false,
            filterable: false,
            resizable: false,
            hideable: false,
            pinnable: false,
            disableReorder: true,
            align: 'center',
            headerAlign: 'center',
          },
        } satisfies ColumnMetaExt<R>,
      });
    }

    if (hierarchyFields.length > 0) {
      const colMap = new Map(columns.map((c) => [c.field, c]));
      if (hasTreeData || rowGroupingColumnMode === 'single') {
        const hierarchyId = hierarchyFields[0];
        const groupHeaderLabel = hasTreeData
          ? groupingColDef?.headerName ?? '层级结构'
          : `分组 (${rowGroupingModel
              .map((f) => colMap.get(f)?.headerName ?? f)
              .join(' / ')})`;
        const groupWidth = groupingColDef?.width ?? GRID_TREE_DATA_DEFAULT_WIDTH;
        mapped.push({
          id: hierarchyId,
          header: groupHeaderLabel,
          size: groupWidth,
          minSize: 160,
          maxSize: 520,
          enableSorting: false,
          enableHiding: false,
          enableResizing: true,
          enablePinning: true,
          meta: {
            colDef: {
              field: hierarchyId,
              headerName: groupHeaderLabel,
              width: groupWidth,
              minWidth: 160,
              maxWidth: 520,
              sortable: false,
              filterable: false,
              resizable: true,
              hideable: false,
              pinnable: false,
              disableReorder: true,
              aggregable: false,
              groupable: false,
              align: 'left',
              headerAlign: 'left',
            },
          } satisfies ColumnMetaExt<R>,
        });
      } else {
        for (const field of rowGroupingModel) {
          const groupColId = getMultipleGroupingColId(field);
          const groupHeaderLabel = colMap.get(field)?.headerName ?? field;
          mapped.push({
            id: groupColId,
            header: groupHeaderLabel,
            size: 168,
            minSize: 130,
            maxSize: 380,
            enableSorting: false,
            enableHiding: false,
            enableResizing: true,
            enablePinning: true,
            meta: {
              colDef: {
                field: groupColId,
                headerName: groupHeaderLabel,
                width: 168,
                minWidth: 130,
                maxWidth: 380,
                sortable: false,
                filterable: false,
                resizable: true,
                hideable: false,
                pinnable: false,
                disableReorder: true,
                aggregable: false,
                groupable: false,
                align: 'left',
                headerAlign: 'left',
              },
            } satisfies ColumnMetaExt<R>,
          });
        }
      }
    }

    for (const colDef of columns) {
      mapped.push({
        id: colDef.field,
        accessorFn: (row) => resolveCellValue(row, colDef),
        header: colDef.headerName ?? colDef.field,
        size: colDef.width ?? DEFAULT_COLUMN_WIDTH,
        minSize: colDef.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
        maxSize: colDef.maxWidth ?? DEFAULT_MAX_COLUMN_WIDTH,
        enableSorting:
          !disableColumnSorting &&
          colDef.sortable !== false &&
          colDef.type !== 'actions',
        enableHiding: colDef.hideable !== false,
        enableResizing:
          !disableColumnResize &&
          colDef.resizable !== false &&
          colDef.type !== 'actions',
        enablePinning: !disableColumnPinning && colDef.pinnable !== false,
        sortFn: colDef.sortComparator
          ? (rowA, rowB, columnId) =>
              colDef.sortComparator!(
                rowA.getValue(columnId),
                rowB.getValue(columnId),
                rowA.original,
                rowB.original,
              )
          : colDef.type === 'number'
            ? 'basic'
            : colDef.type === 'date' || colDef.type === 'dateTime'
              ? (rowA, rowB, columnId) => {
                  const a = String(rowA.getValue(columnId) ?? '');
                  const b = String(rowB.getValue(columnId) ?? '');
                  return a.localeCompare(b);
                }
              : colDef.type === 'boolean'
                ? (rowA, rowB, columnId) => {
                    const a = rowA.getValue(columnId) ? 1 : 0;
                    const b = rowB.getValue(columnId) ? 1 : 0;
                    return a - b;
                  }
                : 'alphanumeric',
        meta: {
          colDef,
        } satisfies ColumnMetaExt<R>,
      });
    }

    return mapped;
  }, [
    checkboxSelection,
    rowReordering,
    hasDetailPanel,
    hierarchyFields,
    hasTreeData,
    rowGroupingColumnMode,
    rowGroupingModel,
    groupingColDef?.headerName,
    groupingColDef?.width,
    columns,
    disableColumnSorting,
    disableColumnResize,
    disableColumnPinning,
  ]);

  const effectivePagination = useMemo<PaginationState>(
    () =>
      pagination
        ? paginationState
        : { pageIndex: 0, pageSize: Math.max(filteredRows.length, 1) },
    [pagination, paginationState, filteredRows.length],
  );

  const effectiveSorting = useMemo<SortingState>(
    () => sorting.filter((s) => validColumnFieldSet.has(s.id)),
    [sorting, validColumnFieldSet],
  );

  const effectiveColumnOrder = useMemo<ColumnOrderState>(() => {
    if (internalOptions?.pivotMode) {
      return buildColumnOrder(
        columns,
        undefined,
        checkboxSelection,
        rowReordering,
        hasDetailPanel,
        hierarchyFields,
      );
    }
    return columnOrder;
  }, [
    checkboxSelection,
    columnOrder,
    columns,
    hasDetailPanel,
    hierarchyFields,
    internalOptions?.pivotMode,
    rowReordering,
  ]);

  const effectiveColumnPinning = useMemo<ColumnPinningState>(() => {
    if (internalOptions?.pivotPinnedOverride) {
      return {
        start: internalOptions.pivotPinnedOverride.left,
        end: internalOptions.pivotPinnedOverride.right,
      };
    }
    return columnPinning;
  }, [columnPinning, internalOptions?.pivotPinnedOverride]);

  // Responsive MUI X `colDef.flex` column width distribution
  const effectiveColumnSizing = useMemo<ColumnSizingState>(() => {
    const vpWidth = internalOptions?.viewportWidth ?? 0;
    if (vpWidth <= 0) return columnSizing;

    const specs = tanStackColumns
      .filter((col) => {
        const colId = String(col.id ?? '');
        return columnVisibility[colId] !== false;
      })
      .map((col) => {
        const colId = String(col.id ?? '');
        const colDef = (col.meta as ColumnMetaExt<R> | undefined)?.colDef;
        const userWidth = columnSizing[colId];
        return {
          id: colId,
          width:
            typeof userWidth === 'number'
              ? userWidth
              : (colDef?.width ?? col.size ?? DEFAULT_COLUMN_WIDTH),
          minWidth: colDef?.minWidth ?? col.minSize ?? DEFAULT_MIN_COLUMN_WIDTH,
          maxWidth: colDef?.maxWidth ?? col.maxSize,
          flex: colDef?.flex,
          isUserResized: typeof userWidth === 'number',
        };
      });

    const flexWidths = computeFlexColumnWidths(specs, vpWidth);
    if (Object.keys(flexWidths).length === 0) {
      return columnSizing;
    }
    return { ...flexWidths, ...columnSizing };
  }, [
    columnSizing,
    columnVisibility,
    internalOptions?.viewportWidth,
    tanStackColumns,
  ]);

  const effectiveRowCount =
    typeof externalRowCount === 'number' && externalRowCount >= 0
      ? externalRowCount
      : filteredRows.length;

  const table = useTable({
    features: dataGridFeatures,
    data: filteredRows,
    columns: tanStackColumns,
    manualSorting: isServerSorting,
    manualPagination: isServerPagination,
    rowCount: isServerPagination ? effectiveRowCount : undefined,
    state: {
      sorting: effectiveSorting,
      columnVisibility,
      columnOrder: effectiveColumnOrder,
      columnPinning: effectiveColumnPinning,
      columnSizing: effectiveColumnSizing,
      rowSelection,
      pagination: effectivePagination,
    },
    getRowId: (originalRow, index) =>
      String(resolveRowId(originalRow, index, getRowIdRef.current)),
    enableRowSelection: checkboxSelection
      ? isRowSelectable
        ? (row) =>
            isRowSelectable({
              id: resolveRowId(row.original, row.index, getRowIdRef.current),
              row: row.original,
            })
        : true
      : false,
    enableMultiRowSelection: !disableMultipleRowSelection,
    enableMultiSort: !disableColumnSorting,
    enableColumnResizing: !disableColumnResize,
    enableColumnPinning: !disableColumnPinning,
    columnResizeMode: 'onChange',
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange: handleRowSelectionChange,
    onPaginationChange: setPaginationState,
  });

  // Compute sticky offsets for visible leaf columns in visual order (left -> center -> right)
  const visibleLeafColumns = table.getVisibleLeafColumns();
  const pinnedLayout = useMemo(() => {
    const entries = visibleLeafColumns.map((col) => ({
      id: col.id,
      size: col.getSize(),
    }));
    return computePinnedOffsets(
      entries,
      effectiveColumnPinning.start ?? [],
      effectiveColumnPinning.end ?? [],
    );
  }, [
    visibleLeafColumns,
    effectiveColumnPinning.start,
    effectiveColumnPinning.end,
  ]);

  // Compute multi-level column group headers aligned with visibility, ordering, sizing & pinning
  const columnGroupHeaderRows = useMemo(() => {
    const entries = visibleLeafColumns.map((col) => ({
      id: col.id,
      size: col.getSize(),
    }));
    return buildColumnGroupHeaderRows(
      entries,
      columnGroupingModel,
      pinnedLayout,
    );
  }, [visibleLeafColumns, columnGroupingModel, pinnedLayout]);

  // Unified Tree Data & Row Grouping expansion + flattened hierarchy rows
  const rowGroupingKey = rowGroupingModel.join('|');
  const [expandedTreeGroups, setExpandedTreeGroups] = useState<Set<string>>(
    () => {
      if (hasTreeData && getTreeDataPath) {
        return new Set(
          collectDefaultExpandedTreeGroups(
            filteredRows,
            getTreeDataPath,
            defaultGroupingExpansionDepth,
            getRowIdRef.current,
          ),
        );
      }
      if (hasRowGrouping) {
        return new Set(
          collectDefaultExpandedRowGroups(
            filteredRows,
            rowGroupingModel,
            columns,
            defaultGroupingExpansionDepth,
            getRowIdRef.current,
          ),
        );
      }
      return new Set();
    },
  );

  const prevHierarchySigRef = useRef(
    hasTreeData ? 'tree' : hasRowGrouping ? `group:${rowGroupingKey}` : 'none',
  );
  useEffect(() => {
    const nextSig = hasTreeData
      ? 'tree'
      : hasRowGrouping
        ? `group:${rowGroupingKey}`
        : 'none';
    if (nextSig !== prevHierarchySigRef.current) {
      prevHierarchySigRef.current = nextSig;
      if (hasTreeData && getTreeDataPath) {
        setExpandedTreeGroups(
          new Set(
            collectDefaultExpandedTreeGroups(
              filteredRows,
              getTreeDataPath,
              defaultGroupingExpansionDepth,
              getRowIdRef.current,
            ),
          ),
        );
      } else if (hasRowGrouping) {
        setExpandedTreeGroups(
          new Set(
            collectDefaultExpandedRowGroups(
              filteredRows,
              rowGroupingModel,
              columns,
              defaultGroupingExpansionDepth,
              getRowIdRef.current,
            ),
          ),
        );
      }
    }
  }, [
    columns,
    defaultGroupingExpansionDepth,
    filteredRows,
    getTreeDataPath,
    hasRowGrouping,
    hasTreeData,
    rowGroupingKey,
    rowGroupingModel,
  ]);

  const sortedFilteredRows = table
    .getPrePaginatedRowModel()
    .rows.map((r) => r.original);

  const allTreeGroupKeys = useMemo(() => {
    if (hasTreeData && getTreeDataPath) {
      return collectDefaultExpandedTreeGroups(
        sortedFilteredRows,
        getTreeDataPath,
        -1,
        getRowIdRef.current,
      );
    }
    if (hasRowGrouping) {
      return collectDefaultExpandedRowGroups(
        sortedFilteredRows,
        rowGroupingModel,
        columns,
        -1,
        getRowIdRef.current,
      );
    }
    return [];
  }, [
    columns,
    getTreeDataPath,
    hasRowGrouping,
    hasTreeData,
    rowGroupingModel,
    sortedFilteredRows,
  ]);

  const treeFlatRows = useMemo(() => {
    if (hasTreeData && getTreeDataPath) {
      return buildTreeDataRows(
        sortedFilteredRows,
        getTreeDataPath,
        expandedTreeGroups,
        getRowIdRef.current,
      );
    }
    if (hasRowGrouping) {
      return buildRowGroupingRows(
        sortedFilteredRows,
        rowGroupingModel,
        columns,
        expandedTreeGroups,
        getRowIdRef.current,
      );
    }
    return null;
  }, [
    columns,
    expandedTreeGroups,
    getTreeDataPath,
    hasRowGrouping,
    hasTreeData,
    rowGroupingModel,
    sortedFilteredRows,
  ]);

  const toggleTreeGroup = useCallback((groupKey: string) => {
    setExpandedTreeGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  const expandAllTreeGroups = useCallback(() => {
    setExpandedTreeGroups(new Set(allTreeGroupKeys));
  }, [allTreeGroupKeys]);

  const collapseAllTreeGroups = useCallback(() => {
    setExpandedTreeGroups(new Set());
  }, []);

  // Helper actions matching MUI X DataGrid Pro imperative API
  const pinColumn = useCallback(
    (field: string, side: 'left' | 'right' | false) => {
      setColumnPinning((prev) => {
        const dataStart = (prev.start ?? []).filter(
          (id) => !isInternalField(id) && id !== field,
        );
        const end = (prev.end ?? []).filter(
          (id) => !isInternalField(id) && id !== field,
        );

        if (side === 'left') {
          dataStart.push(field);
        } else if (side === 'right') {
          end.unshift(field);
        }

        return {
          start: syncUtilityLeftPins(
            dataStart,
            checkboxSelection,
            rowReordering,
            hasDetailPanel,
            hierarchyFields,
          ),
          end,
        };
      });
    },
    [checkboxSelection, rowReordering, hasDetailPanel, hierarchyFields],
  );

  const reorderColumn = useCallback(
    (sourceId: string, targetId: string, position: 'before' | 'after') => {
      if (
        sourceId === targetId ||
        isInternalField(sourceId) ||
        isInternalField(targetId)
      ) {
        return;
      }

      setColumnOrder((prev) => {
        const next = reorderColumnIds(prev, sourceId, targetId, position);
        const cb = onColumnOrderChangeRef.current;
        if (cb) {
          const dataPrev = prev.filter((id) => !isInternalField(id));
          const dataNext = next.filter((id) => !isInternalField(id));
          const oldIndex = dataPrev.indexOf(sourceId);
          const targetIndex = dataNext.indexOf(sourceId);
          const column = columns.find((c) => c.field === sourceId);
          if (column && oldIndex !== -1 && targetIndex !== -1 && oldIndex !== targetIndex) {
            cb({ column, oldIndex, targetIndex });
          }
        }
        return next;
      });

      // Keep pinned left/right order aligned when reordering inside the same pinned zone
      setColumnPinning((prev) => {
        const start = prev.start ?? [];
        const end = prev.end ?? [];
        if (start.includes(sourceId) && start.includes(targetId)) {
          return {
            ...prev,
            start: reorderColumnIds(start, sourceId, targetId, position),
          };
        }
        if (end.includes(sourceId) && end.includes(targetId)) {
          return {
            ...prev,
            end: reorderColumnIds(end, sourceId, targetId, position),
          };
        }
        return prev;
      });
    },
    [columns, setColumnPinning],
  );

  const swapColumns = useCallback(
    (sourceId: string, targetId: string) => {
      if (
        sourceId === targetId ||
        isInternalField(sourceId) ||
        isInternalField(targetId)
      ) {
        return;
      }

      setColumnOrder((prev) => {
        const next = swapColumnOrder(prev, sourceId, targetId);
        const cb = onColumnOrderChangeRef.current;
        if (cb) {
          const dataPrev = prev.filter((id) => !isInternalField(id));
          const dataNext = next.filter((id) => !isInternalField(id));
          const oldIndex = dataPrev.indexOf(sourceId);
          const targetIndex = dataNext.indexOf(sourceId);
          const column = columns.find((c) => c.field === sourceId);
          if (column && oldIndex !== -1 && targetIndex !== -1 && oldIndex !== targetIndex) {
            cb({ column, oldIndex, targetIndex });
          }
        }
        return next;
      });

      setColumnPinning((prev) => {
        const start = prev.start ?? [];
        const end = prev.end ?? [];
        if (start.includes(sourceId) && start.includes(targetId)) {
          return {
            ...prev,
            start: swapColumnOrder(start, sourceId, targetId),
          };
        }
        if (end.includes(sourceId) && end.includes(targetId)) {
          return {
            ...prev,
            end: swapColumnOrder(end, sourceId, targetId),
          };
        }
        return prev;
      });
    },
    [columns, setColumnPinning],
  );

  const setColumnSort = useCallback(
    (field: string, direction: GridSortDirection | null) => {
      if (disableColumnSorting) return;
      setSorting((prev) => {
        const rest = prev.filter((s) => s.id !== field);
        if (!direction) return rest;
        return [{ id: field, desc: direction === 'desc' }, ...rest];
      });
    },
    [disableColumnSorting, setSorting],
  );

  const toggleColumnSort = useCallback(
    (field: string, isMulti: boolean) => {
      if (disableColumnSorting) return;
      const colDef = columns.find((c) => c.field === field);
      if (colDef && (colDef.sortable === false || colDef.type === 'actions')) {
        return;
      }
      const order = colDef?.sortingOrder ?? sortingOrder;
      setSorting((prev) => {
        const existing = prev.find((s) => s.id === field);
        const currentDir: GridSortDirection | null = existing
          ? existing.desc
            ? 'desc'
            : 'asc'
          : null;
        const nextDir = getNextSortDirection(currentDir, order);
        if (isMulti) {
          const rest = prev.filter((s) => s.id !== field);
          if (!nextDir) return rest;
          return [...rest, { id: field, desc: nextDir === 'desc' }];
        }
        if (!nextDir) return [];
        return [{ id: field, desc: nextDir === 'desc' }];
      });
    },
    [columns, disableColumnSorting, setSorting, sortingOrder],
  );

  const hideColumn = useCallback((field: string) => {
    setColumnVisibility((prev) => ({ ...prev, [field]: false }));
  }, []);

  const showAllColumns = useCallback(() => {
    setColumnVisibility({});
  }, []);

  const resetColumnWidths = useCallback(() => {
    setColumnSizing({});
  }, []);

  const autosizeColumn = useCallback(
    (field: string) => {
      const colDef = columns.find((c) => c.field === field);
      if (!colDef || colDef.resizable === false || colDef.type === 'actions') {
        return;
      }
      const sampleRows = filteredRows.slice(0, 100);
      const formattedVals = sampleRows.map((row) =>
        formatCellValue(resolveCellValue(row, colDef), row, colDef),
      );
      const nextWidth = computeColumnAutosizeWidth(
        colDef.headerName ?? colDef.field,
        formattedVals,
        colDef.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
        colDef.maxWidth ?? DEFAULT_MAX_COLUMN_WIDTH,
      );
      setColumnSizing((prev) => ({ ...prev, [field]: nextWidth }));
    },
    [columns, filteredRows],
  );

  const autosizeAllColumns = useCallback(() => {
    const sampleRows = filteredRows.slice(0, 100);
    const nextSizing: ColumnSizingState = {};
    for (const colDef of columns) {
      if (colDef.resizable === false || colDef.type === 'actions') continue;
      const formattedVals = sampleRows.map((row) =>
        formatCellValue(resolveCellValue(row, colDef), row, colDef),
      );
      nextSizing[colDef.field] = computeColumnAutosizeWidth(
        colDef.headerName ?? colDef.field,
        formattedVals,
        colDef.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
        colDef.maxWidth ?? DEFAULT_MAX_COLUMN_WIDTH,
      );
    }
    setColumnSizing(nextSizing);
  }, [columns, filteredRows]);

  const addFilterForColumn = useCallback(
    (field: string) => {
      const col = columns.find((c) => c.field === field);
      const ops = getOperatorsForColumn(col);
      const defaultOp = ops[0]?.value ?? 'contains';
      setFilterModel((prev) => {
        const exists = prev.items.some((i) => i.field === field);
        if (exists) return prev;
        const newItem: GridFilterItem = {
          id: `filter_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          field,
          operator: defaultOp,
          value: col?.type === 'boolean' ? 'true' : '',
        };
        return {
          ...prev,
          items: [...prev.items, newItem],
        };
      });
    },
    [columns],
  );

  const setHeaderFilterValue = useCallback(
    (field: string, rawValue: string) => {
      const col = columns.find((c) => c.field === field);
      setFilterModel((prev) =>
        upsertHeaderFilterItem(prev, field, rawValue, col),
      );
    },
    [columns],
  );

  const setHeaderFilterOperator = useCallback(
    (field: string, operator: GridFilterOperatorValue) => {
      const col = columns.find((c) => c.field === field);
      setFilterModel((prev) =>
        upsertHeaderFilterOperator(prev, field, operator, col),
      );
    },
    [columns],
  );

  const setQuickFilterValues = useCallback(
    (values: string[]) => {
      const normalized = values
        .map((s) => String(s).trim())
        .filter(Boolean);
      setFilterModel((prev) => ({
        ...prev,
        quickFilterValues: normalized,
      }));
    },
    [setFilterModel],
  );

  const setQuickFilterText = useCallback(
    (rawText: string) => {
      const tokens = rawText
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      setQuickFilterValues(tokens);
    },
    [setQuickFilterValues],
  );

  const clearAllFilters = useCallback(() => {
    setFilterModel({
      items: [],
      logicOperator: 'and',
      quickFilterValues: [],
    });
  }, [setFilterModel]);

  const clearSelection = useCallback(() => {
    handleRowSelectionChange({});
  }, [handleRowSelectionChange]);

  const activeFilterCount = useMemo(() => {
    const colMap = new Map(columns.map((c) => [c.field, c]));
    return filterModel.items.filter((item) =>
      isFilterItemActive(item, colMap.get(item.field)),
    ).length;
  }, [columns, filterModel.items]);

  const selectedIds = useMemo<GridRowId[]>(() => {
    return Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((k) => idLookup.get(k) ?? k);
  }, [rowSelection, idLookup]);

  const hasActiveFilter =
    activeFilterCount > 0 || (filterModel.quickFilterValues?.length ?? 0) > 0;

  const lastSnapshotJsonRef = useRef<string>('');

  useEffect(() => {
    const cb = onStateChangeRef.current;
    if (!cb) return;
    const snapshot: GridStateSnapshot = {
      sorting: toGridSortModel(effectiveSorting),
      filterModel,
      columnVisibilityModel: columnVisibility,
      columnOrder: columnOrder.filter((id) => !isInternalField(id)),
      pinnedColumns: {
        left: (effectiveColumnPinning.start ?? []).filter(
          (id) => !isInternalField(id),
        ),
        right: effectiveColumnPinning.end ?? [],
      },
      columnSizing,
      paginationModel: {
        page: paginationState.pageIndex,
        pageSize: paginationState.pageSize,
      },
      rowSelectionModel: selectedIds,
      detailPanelExpandedRowIds: expandedRowIds,
      rowGroupingModel,
      aggregationModel,
      pivotMode: Boolean(internalOptions?.pivotMode),
      pivotModel: internalOptions?.pivotModel,
      density,
      filteredRowCount: isServerPagination
        ? effectiveRowCount
        : filteredRows.length,
      totalRowCount:
        typeof externalRowCount === 'number' ? externalRowCount : rows.length,
    };
    const serialized = JSON.stringify(snapshot);
    if (serialized !== lastSnapshotJsonRef.current) {
      lastSnapshotJsonRef.current = serialized;
      cb(snapshot);
    }
  }, [
    effectiveSorting,
    filterModel,
    columnVisibility,
    columnOrder,
    effectiveColumnPinning,
    columnSizing,
    paginationState,
    selectedIds,
    expandedRowIds,
    rowGroupingModel,
    aggregationModel,
    internalOptions?.pivotMode,
    internalOptions?.pivotModel,
    density,
    effectiveRowCount,
    externalRowCount,
    filteredRows.length,
    isServerPagination,
    rows.length,
  ]);

  const exportState = useCallback((): GridPersistedState => {
    return {
      sorting: toGridSortModel(sorting),
      filterModel,
      columnVisibilityModel: { ...columnVisibility },
      columnOrder: columnOrder.filter((id) => !isInternalField(id)),
      pinnedColumns: {
        left: (columnPinning.start ?? []).filter((id) => !isInternalField(id)),
        right: [...(columnPinning.end ?? [])],
      },
      columnSizing: { ...columnSizing },
      density,
      rowGroupingModel: [...rowGroupingModel],
      aggregationModel: { ...aggregationModel },
    };
  }, [
    aggregationModel,
    columnOrder,
    columnPinning.end,
    columnPinning.start,
    columnSizing,
    columnVisibility,
    density,
    filterModel,
    rowGroupingModel,
    sorting,
  ]);

  const restoreState = useCallback(
    (state: GridPersistedState) => {
      if (state.sorting) {
        setSorting(toTanStackSorting(state.sorting));
      }
      if (state.filterModel) {
        setFilterModel({
          items: state.filterModel.items ?? [],
          logicOperator: state.filterModel.logicOperator ?? 'and',
          quickFilterValues: state.filterModel.quickFilterValues ?? [],
        });
      }
      if (state.columnVisibilityModel) {
        setColumnVisibility({ ...state.columnVisibilityModel });
      }
      if (state.columnOrder) {
        setColumnOrder(
          buildColumnOrder(
            columns,
            state.columnOrder,
            checkboxSelection,
            rowReordering,
            hasDetailPanel,
            hierarchyFields,
          ),
        );
      }
      if (state.pinnedColumns) {
        setColumnPinning(
          normalizePinning(
            state.pinnedColumns,
            checkboxSelection,
            rowReordering,
            hasDetailPanel,
            hierarchyFields,
          ),
        );
      }
      if (state.columnSizing) {
        setColumnSizing({ ...state.columnSizing });
      }
      if (state.density) {
        setDensity(state.density);
      }
      if (state.rowGroupingModel) {
        setRowGroupingModel([...state.rowGroupingModel]);
      }
      if (state.aggregationModel) {
        setAggregationModel({ ...state.aggregationModel });
      }
    },
    [
      checkboxSelection,
      columns,
      hasDetailPanel,
      hierarchyFields,
      rowReordering,
      setAggregationModel,
      setDensity,
      setRowGroupingModel,
    ],
  );

  const getVisibleDataColDefs = useCallback((): GridColDef<R>[] => {
    const result: GridColDef<R>[] = [];
    for (const col of table.getVisibleLeafColumns()) {
      const def = (col.columnDef.meta as ColumnMetaExt<R> | undefined)?.colDef;
      if (def && !isInternalField(def.field)) {
        result.push(def);
      }
    }
    return result;
  }, [table]);

  const isSortedOrFiltered = sorting.length > 0 || hasActiveFilter;

  const sortModel = useMemo(
    () => toGridSortModel(effectiveSorting),
    [effectiveSorting],
  );
  const paginationModel = useMemo<GridPaginationModel>(
    () => ({
      page: paginationState.pageIndex,
      pageSize: paginationState.pageSize,
    }),
    [paginationState.pageIndex, paginationState.pageSize],
  );

  const setRowSelectionModel = useCallback(
    (ids: GridRowId[]) => {
      const next: RowSelectionState = {};
      for (const id of ids) {
        next[String(id)] = true;
      }
      handleRowSelectionChange(next);
    },
    [handleRowSelectionChange],
  );

  const selectRow = useCallback(
    (id: GridRowId, isSelected = true, resetSelection = false) => {
      const key = String(id);
      if (resetSelection) {
        handleRowSelectionChange(isSelected ? { [key]: true } : {});
        return;
      }
      handleRowSelectionChange((prev) => {
        const next = { ...prev };
        if (isSelected) {
          next[key] = true;
        } else {
          delete next[key];
        }
        return next;
      });
    },
    [handleRowSelectionChange],
  );

  const setColumnVisibilityModel = useCallback(
    (model: Record<string, boolean>) => {
      setColumnVisibility({ ...model });
    },
    [setColumnVisibility],
  );

  const setColumnVisibilityField = useCallback(
    (field: string, isVisible: boolean) => {
      setColumnVisibility((prev) => ({ ...prev, [field]: isVisible }));
    },
    [setColumnVisibility],
  );

  const setColumnWidth = useCallback(
    (field: string, width: number) => {
      const clamped = Math.max(48, Math.round(width));
      setColumnSizing((prev) => ({ ...prev, [field]: clamped }));
    },
    [],
  );

  const setPaginationModel = useCallback(
    (model: GridPaginationModel) => {
      setPaginationState({
        pageIndex: Math.max(0, model.page),
        pageSize: Math.max(1, model.pageSize),
      });
    },
    [setPaginationState],
  );

  return {
    table,
    density,
    setDensity,
    sortModel,
    paginationModel,
    setPaginationModel,
    filterModel,
    setFilterModel,
    activeFilterCount,
    hasActiveFilter,
    isSortedOrFiltered,
    pinnedLayout,
    columnGroupHeaderRows,
    columnVisibility,
    selectedIds,
    setRowSelectionModel,
    selectRow,
    selectRowRange,
    expandedRowIds,
    hasDetailPanel,
    hasTreeData,
    hasRowGrouping,
    hierarchyFields,
    rowGroupingModel,
    setRowGroupingModel,
    rowGroupingColumnMode,
    setRowGroupingColumnMode,
    toggleRowGroupingColumn,
    addRowGroupingColumn,
    reorderRowGroupingColumn,
    removeRowGroupingColumn,
    clearRowGrouping,
    treeFlatRows,
    expandedTreeGroups,
    toggleTreeGroup,
    expandAllTreeGroups,
    collapseAllTreeGroups,
    aggregationModel,
    setAggregationModel,
    setColumnAggregation,
    setSortModel,
    setColumnVisibilityModel,
    setColumnVisibilityField,
    setColumnWidth,
    exportState,
    restoreState,
    filteredRows,
    pinColumn,
    reorderColumn,
    swapColumns,
    toggleDetailPanel,
    setColumnSort,
    toggleColumnSort,
    hideColumn,
    showAllColumns,
    resetColumnWidths,
    autosizeColumn,
    autosizeAllColumns,
    addFilterForColumn,
    setHeaderFilterValue,
    setHeaderFilterOperator,
    setQuickFilterText,
    setQuickFilterValues,
    clearAllFilters,
    clearSelection,
    getVisibleDataColDefs,
    formatCellValue,
  };
}
