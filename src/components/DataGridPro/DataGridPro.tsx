import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import type { Row } from '@tanstack/react-table';
import {
  GridCellModes,
  GridRowModes,
  type DataGridProProps,
  type GridCellModesModel,
  type GridCellRange,
  type GridChartModel,
  type GridColDef,
  type GridEditHistoryChange,
  type GridPivotModel,
  type GridRowId,
  type GridRowModesModel,
  type GridSidebarPanel,
  type GridValidRowModel,
} from './types';
import {
  GRID_CHECKBOX_SELECTION_FIELD,
  GRID_DETAIL_PANEL_TOGGLE_FIELD,
  GRID_REORDER_COL_FIELD,
  applyClipboardPasteMatrix,
  applyValueSetter,
  buildCellRangeClearUpdates,
  computeAutoFillUpdates,
  computeCellRangeStats,
  computeVirtualRowWindow,
  createEditHistoryState,
  evaluateEditCellValidation,
  createRowFilterPredicate,
  getCellRangeEdges,
  getDefaultAlignForType,
  getDensityMetrics,
  isCellInRange,
  isHierarchyColId,
  normalizeCellRange,
  parseTsvClipboardMatrix,
  pushEditHistoryEntry,
  redoEditHistory,
  resolveCellValue,
  resolveRowHeightConfig,
  resolveRowId,
  serializeCellRangeToTsv,
  serializeCellsToTsv,
  serializeRowsToCsv,
  undoEditHistory,
  upsertExactValueFilter,
  validateAndMergeRowEdits,
  type EditHistoryState,
  type TreeFlatRow,
} from './core/gridCore';
import { buildPivotTable } from './core/pivotEngine';
import { getChartEligibleFields } from './core/chartEngine';
import { computeColSpanRow, computeRowSpanMatrix } from './core/spanEngine';
import {
  serializeRowsToJson,
  serializeRowsToXlsxBytes,
} from './core/xlsxExport';
import { createDataSourceCache } from './core/serverDataEngine';
import {
  buildServerTreeVisibleRows,
  type ServerTreeDisplayRow,
} from './core/serverTreeEngine';
import { resolveLocaleText } from './core/localeText';
import {
  applyRowUpdates,
  createGridEventBus,
  renderGridSlot,
} from './core/gridApiHelpers';
import {
  computeAutoPageSize,
  computeVirtualColumnWindow,
} from './core/columnVirtualizer';
import {
  computeMissingChunkRanges,
  mergeLazyRowsIntoMap,
} from './core/lazyViewportEngine';
import {
  useDataGridPro,
  type ColumnMetaExt,
  type DataGridFeatures,
} from './core/useDataGridPro';
import { GridToolbar } from './components/GridToolbar';
import { GridRowGroupingBar } from './components/GridRowGroupingBar';
import { GridColumnsPanel } from './components/GridColumnsPanel';
import { GridFilterPanel } from './components/GridFilterPanel';
import { GridColumnHeader } from './components/GridColumnHeader';
import { GridColumnGroupHeaderRow } from './components/GridColumnGroupHeaderRow';
import { GridHeaderFilterRow } from './components/GridHeaderFilterRow';
import { GridColumnMenu } from './components/GridColumnMenu';
import { GridActionsCell } from './components/GridActionsCellItem';
import { GridListView } from './components/GridListView';
import {
  GridCellContextMenu,
  type CellContextMenuState,
} from './components/GridCellContextMenu';
import { GridSidebar } from './components/GridSidebar';
import { GridChartsPanel } from './components/GridChartsPanel';
import { GridPrintPreviewDialog } from './components/GridPrintPreviewDialog';
import {
  GridEditCell,
  type EditCommitNavigation,
} from './components/GridEditCell';
import { GridPinnedRowsSection } from './components/GridPinnedRowsSection';
import { GridAggregationFooterRow } from './components/GridAggregationFooterRow';
import { GridTreeGroupRow } from './components/GridTreeGroupRow';
import { GridFooter } from './components/GridFooter';
import { GridEmptyOverlay, GridLoadingOverlay } from './components/GridOverlays';

function attachRowDragGhost(
  e: React.DragEvent<HTMLElement>,
  label: string,
) {
  const ghost = document.createElement('div');
  ghost.textContent = label;
  ghost.style.position = 'fixed';
  ghost.style.top = '-9999px';
  ghost.style.left = '-9999px';
  ghost.style.padding = '8px 14px';
  ghost.style.background = '#FFFFFF';
  ghost.style.color = 'rgba(0, 0, 0, 0.87)';
  ghost.style.border = '1px solid #1976D2';
  ghost.style.borderRadius = '4px';
  ghost.style.boxShadow =
    '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14)';
  ghost.style.fontSize = '13px';
  ghost.style.fontWeight = '500';
  ghost.style.fontFamily =
    "'Plus Jakarta Sans', 'Noto Sans SC', -apple-system, sans-serif";
  ghost.style.whiteSpace = 'nowrap';
  ghost.style.pointerEvents = 'none';
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 20, 16);
  requestAnimationFrame(() => {
    if (ghost.parentNode) {
      ghost.parentNode.removeChild(ghost);
    }
  });
}

export function DataGridPro<R extends GridValidRowModel>(
  props: DataGridProProps<R>,
) {
  const {
    apiRef,
    rows,
    columns,
    getRowId,
    height = 620,
    rowHeight,
    columnHeaderHeight,
    autoHeight = false,
    autoPageSize = false,
    disableVirtualization = false,
    columnBufferPx = 150,
    columnVirtualizeThreshold = 20,
    loading = false,
    loadingOverlayVariant,
    paginationMode,
    sortingMode,
    filterMode,
    rowCount: externalRowCount,
    dataSource,
    dataSourceCache,
    onDataSourceError,
    lazyLoading = false,
    lazyLoadingChunkSize = 25,
    listView = false,
    listViewColumn,
    checkboxSelection = false,
    disableRowSelectionOnClick = false,
    disableMultipleRowSelection = false,
    isCellEditable,
    getRowHeight,
    getRowSpacing,
    getRowClassName,
    getCellClassName,
    showCellVerticalBorder = false,
    showColumnVerticalBorder = false,
    pinnedColumnsSectionSeparator = 'border-and-shadow',
    disableColumnReorder = false,
    disableColumnMenu = false,
    disableColumnFilter = false,
    disableColumnSelector = false,
    disableDensitySelector = false,
    disableColumnPinning = false,
    headerFilters = false,
    columnGroupHeaderHeight = 46,
    pinnedRows,
    rowReordering = false,
    onRowOrderChange,
    editMode = 'cell',
    cellModesModel,
    onCellModesModelChange,
    rowModesModel,
    onRowModesModelChange,
    groupingColDef,
    cellSelection = false,
    splitClipboardPastedText,
    processCellPaste,
    onClipboardCopy,
    onClipboardPaste,
    onClipboardClear,
    onCellAutoFill,
    onUndoRedo,
    onExport,
    pivotMode = false,
    onPivotModeChange,
    pivotModel: controlledPivotModel,
    onPivotModelChange,
    sidebarPanel: controlledSidebarPanel,
    onSidebarPanelChange,
    defaultSidebarPanel = null,
    chartsIntegration = true,
    rowSpanning = false,
    virtualizeThreshold = 40,
    onRowsScrollEnd,
    scrollEndThreshold = 80,
    getDetailPanelContent,
    getDetailPanelHeight,
    keepDetailContentMounted = false,
    processRowUpdate: externalProcessRowUpdate,
    onProcessRowUpdateError,
    pagination = true,
    pageSizeOptions = [10, 25, 50, 100],
    onRowClick,
    onRowDoubleClick,
    onCellClick,
    onCellDoubleClick,
    onColumnHeaderClick,
    onColumnOrderChange,
    onColumnWidthChange,
    onDeleteSelectedRows,
    onRowsUpdate,
    localeText: localeTextInput,
    hideFooter = false,
    hideFooterPagination = false,
    hideFooterSelectedRowCount = false,
    slots,
    slotProps,
    disableToolbar = false,
    emptyStateAction,
    ariaLabel = '企业级数据表格',
  } = props;

  const localeText = useMemo(
    () => resolveLocaleText(localeTextInput),
    [localeTextInput],
  );
  const eventBusRef = useRef(createGridEventBus());
  const [internalRowOverride, setInternalRowOverride] = useState<R[] | null>(
    null,
  );
  useEffect(() => {
    setInternalRowOverride(null);
  }, [rows]);

  // Pivot Mode controlled/uncontrolled model & docked sidebar state
  const [internalPivotModel, setInternalPivotModel] = useState<GridPivotModel>(
    () => ({
      rows: columns[0] ? [columns[0].field] : [],
      columns: [],
      values: [],
    }),
  );
  const effectivePivotModel = controlledPivotModel ?? internalPivotModel;
  const handlePivotModelChange = useCallback(
    (next: GridPivotModel) => {
      if (controlledPivotModel === undefined) {
        setInternalPivotModel(next);
      }
      onPivotModelChange?.(next);
    },
    [controlledPivotModel, onPivotModelChange],
  );

  const [internalSidebarPanel, setInternalSidebarPanel] =
    useState<GridSidebarPanel | null>(
      pivotMode ? 'pivot' : defaultSidebarPanel,
    );
  const activeSidebarPanel =
    controlledSidebarPanel !== undefined
      ? controlledSidebarPanel
      : internalSidebarPanel;
  const setActiveSidebarPanel = useCallback(
    (next: GridSidebarPanel | null) => {
      if (controlledSidebarPanel === undefined) {
        setInternalSidebarPanel(next);
      }
      onSidebarPanelChange?.(next);
    },
    [controlledSidebarPanel, onSidebarPanelChange],
  );
  const [chartsPanelOpen, setChartsPanelOpen] = useState(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);

  const [chartModel, setChartModel] = useState<GridChartModel>(() => {
    const { dimensionColumns, valueColumns } = getChartEligibleFields(columns);
    const defaultDim =
      dimensionColumns.find((c) => c.type === 'singleSelect') ??
      dimensionColumns[0] ??
      columns[0];
    const defaultVal =
      valueColumns.find((c) => c.type === 'number') ??
      valueColumns[0] ??
      columns[0];
    return {
      chartType: 'bar',
      dimensionField: defaultDim?.field ?? '',
      valueField: defaultVal?.field ?? '',
      aggFunc: defaultVal?.type === 'number' ? 'sum' : 'size',
    };
  });

  const prevPivotModeRef = useRef(pivotMode);
  useEffect(() => {
    if (pivotMode && !prevPivotModeRef.current) {
      setActiveSidebarPanel('pivot');
      setChartsPanelOpen(false);
    } else if (!pivotMode && prevPivotModeRef.current && activeSidebarPanel === 'pivot') {
      setActiveSidebarPanel(null);
    }
    prevPivotModeRef.current = pivotMode;
  }, [activeSidebarPanel, pivotMode, setActiveSidebarPanel]);

  const pivotResult = useMemo(() => {
    if (!pivotMode) return null;
    return buildPivotTable(rows, columns, effectivePivotModel);
  }, [columns, effectivePivotModel, pivotMode, rows]);

  const effectiveCheckboxSelection = pivotMode ? false : checkboxSelection;
  const effectiveRowReordering = pivotMode ? false : rowReordering;
  const effectiveHeaderFilters = pivotMode ? false : headerFilters;
  const effectivePinnedRows = pivotMode ? undefined : pinnedRows;
  const effectiveDetailPanelContent = pivotMode
    ? undefined
    : getDetailPanelContent;
  const effectiveCellSelection = pivotMode ? false : cellSelection;
  const effectivePagination = pivotMode ? false : pagination;
  const effectiveColumns = useMemo<GridColDef<R>[]>(
    () =>
      pivotMode && pivotResult
        ? (pivotResult.columns as unknown as GridColDef<R>[])
        : columns,
    [columns, pivotMode, pivotResult],
  );

  const pivotGetRowId = useCallback(
    (r: R) => String((r as Record<string, unknown>).id ?? ''),
    [],
  );
  const effectiveGetRowId = pivotMode ? pivotGetRowId : getRowId;

  const [viewportWidth, setViewportWidth] = useState<number>(0);

  // Built-in official MUI X DataSource async state & cache
  const defaultDataSourceCacheRef = useRef(createDataSourceCache<R>());
  const activeDataSourceCache =
    dataSourceCache === null
      ? null
      : (dataSourceCache ?? defaultDataSourceCacheRef.current);
  const [dsRows, setDsRows] = useState<R[]>([]);
  const [dsRowCount, setDsRowCount] = useState<number>(0);
  const [dsLoading, setDsLoading] = useState<boolean>(false);
  const [dsError, setDsError] = useState<string | null>(null);
  const [dsRetryTick, setDsRetryTick] = useState<number>(0);
  const dsRequestSeqRef = useRef<number>(0);

  // Official MUI X Pro Server-Side Tree Data & Viewport Chunked Lazy Loading state
  const hasDataSource = Boolean(dataSource && !pivotMode);
  const isServerTreeMode = Boolean(
    hasDataSource &&
      props.treeData &&
      !lazyLoading &&
      dataSource?.getGroupKey &&
      dataSource?.getChildrenCount,
  );
  const isViewportLazy = Boolean(
    lazyLoading && hasDataSource && !pivotMode && !isServerTreeMode,
  );
  const [lazyRowMap, setLazyRowMap] = useState<Map<number, R>>(() => new Map());
  const [lazyTotalCount, setLazyTotalCount] = useState<number>(0);
  const [lazyInitialLoading, setLazyInitialLoading] = useState<boolean>(false);
  const lazyInFlightChunksRef = useRef<Set<number>>(new Set());
  const lazyQueryEpochRef = useRef<number>(0);
  const lazyHydratedRows = useMemo(
    () => (isViewportLazy ? Array.from(lazyRowMap.values()) : []),
    [isViewportLazy, lazyRowMap],
  );

  // Server-Side Tree Data lazy branch cache & expand/loading maps
  const [serverTreeChildrenMap, setServerTreeChildrenMap] = useState<
    Record<string, R[]>
  >({});
  const [serverTreeExpandedMap, setServerTreeExpandedMap] = useState<
    Record<string, boolean>
  >({});
  const [serverTreeLoadingMap, setServerTreeLoadingMap] = useState<
    Record<string, boolean>
  >({});

  const serverTreeVisibleRows = useMemo<ServerTreeDisplayRow<R>[]>(() => {
    if (
      !isServerTreeMode ||
      !dataSource?.getGroupKey ||
      !dataSource?.getChildrenCount
    ) {
      return [];
    }
    return buildServerTreeVisibleRows({
      rootRows: dsRows,
      childrenByPathKey: serverTreeChildrenMap,
      expandedPathKeys: serverTreeExpandedMap,
      loadingPathKeys: serverTreeLoadingMap,
      getGroupKey: dataSource.getGroupKey,
      getChildrenCount: dataSource.getChildrenCount,
      getRowId: effectiveGetRowId,
    });
  }, [
    dataSource,
    dsRows,
    effectiveGetRowId,
    isServerTreeMode,
    serverTreeChildrenMap,
    serverTreeExpandedMap,
    serverTreeLoadingMap,
  ]);

  const serverTreeMetaById = useMemo(() => {
    const map = new Map<string, ServerTreeDisplayRow<R>>();
    for (const item of serverTreeVisibleRows) {
      map.set(String(item.id), item);
    }
    return map;
  }, [serverTreeVisibleRows]);

  const effectivePaginationMode =
    paginationMode ?? (hasDataSource ? 'server' : 'client');
  const effectiveSortingMode =
    sortingMode ?? (hasDataSource ? 'server' : 'client');
  const effectiveFilterMode =
    filterMode ?? (hasDataSource ? 'server' : 'client');
  const effectiveClientRows = internalRowOverride ?? rows;
  const effectiveSourceRows = isViewportLazy
    ? lazyHydratedRows
    : isServerTreeMode
      ? serverTreeVisibleRows.map((item) => item.row)
      : hasDataSource
        ? dsRows
        : effectiveClientRows;
  const effectiveRowCount = isViewportLazy
    ? lazyTotalCount
    : isServerTreeMode
      ? serverTreeVisibleRows.length
      : hasDataSource
        ? dsRowCount
        : externalRowCount;
  const effectiveLoading = isViewportLazy
    ? loading || lazyInitialLoading
    : loading || (hasDataSource && dsLoading);

  // Unified row update pipeline: supports official MUI X dataSource.updateRow optimistic updates + automatic rollback
  const processRowUpdate = useMemo<
    ((newRow: R, oldRow: R) => R | Promise<R>) | undefined
  >(() => {
    if (hasDataSource && dataSource?.updateRow) {
      const updateRowFn = dataSource.updateRow;
      return async (newRow: R, oldRow: R): Promise<R> => {
        const targetId = String(resolveRowId(oldRow, 0, effectiveGetRowId));
        const patchList = (list: R[], replacement: R) =>
          list.map((item, idx) =>
            String(resolveRowId(item, idx, effectiveGetRowId)) === targetId
              ? replacement
              : item,
          );
        const patchAllLocalServerStores = (replacement: R) => {
          setDsRows((prev) => patchList(prev, replacement));
          setServerTreeChildrenMap((prev) => {
            const keys = Object.keys(prev);
            if (keys.length === 0) return prev;
            const next: Record<string, R[]> = {};
            for (const k of keys) {
              next[k] = patchList(prev[k], replacement);
            }
            return next;
          });
          setLazyRowMap((prev) => {
            if (prev.size === 0) return prev;
            let changed = false;
            const next = new Map(prev);
            for (const [idx, item] of prev.entries()) {
              if (String(resolveRowId(item, idx, effectiveGetRowId)) === targetId) {
                next.set(idx, replacement);
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        };

        // 1. Optimistic UI update
        patchAllLocalServerStores(newRow);
        try {
          const confirmed = await updateRowFn({
            newRow,
            oldRow,
            previousRow: oldRow,
          });
          const authoritative = confirmed ?? newRow;
          patchAllLocalServerStores(authoritative);
          activeDataSourceCache?.clear();
          if (externalProcessRowUpdate) {
            await externalProcessRowUpdate(authoritative, oldRow);
          }
          return authoritative;
        } catch (err) {
          // 2. Roll back optimistic state cleanly on server rejection
          patchAllLocalServerStores(oldRow);
          onDataSourceErrorRef.current?.(err);
          throw err;
        }
      };
    }
    return externalProcessRowUpdate;
  }, [
    activeDataSourceCache,
    dataSource,
    effectiveGetRowId,
    externalProcessRowUpdate,
    hasDataSource,
  ]);

  const handleWrappedColumnOrderChange = useCallback(
    (params: Parameters<NonNullable<DataGridProProps<R>['onColumnOrderChange']>>[0]) => {
      onColumnOrderChange?.(params);
      eventBusRef.current.publish('columnOrderChange', params);
    },
    [onColumnOrderChange],
  );

  const handleWrappedColumnWidthChange = useCallback(
    (params: Parameters<NonNullable<DataGridProProps<R>['onColumnWidthChange']>>[0]) => {
      onColumnWidthChange?.(params);
      eventBusRef.current.publish('columnWidthChange', params);
    },
    [onColumnWidthChange],
  );

  const effectiveHookProps = useMemo<DataGridProProps<R>>(() => {
    if (pivotMode && pivotResult) {
      return {
        ...props,
        rows: pivotResult.rows as unknown as R[],
        columns: pivotResult.columns as unknown as GridColDef<R>[],
        getRowId: pivotGetRowId,
        columnGroupingModel: pivotResult.columnGroupingModel,
        aggregationModel: pivotResult.aggregationModel,
        checkboxSelection: false,
        rowReordering: false,
        getDetailPanelContent: undefined,
        treeData: false,
        rowGroupingModel: [],
        pinnedRows: undefined,
        pagination: false,
        paginationMode: 'client',
        sortingMode: 'client',
        filterMode: 'client',
        rowCount: undefined,
        onColumnOrderChange: handleWrappedColumnOrderChange,
        onColumnWidthChange: handleWrappedColumnWidthChange,
      };
    }
    return {
      ...props,
      rows: effectiveSourceRows,
      treeData: isServerTreeMode ? false : props.treeData,
      pagination: isViewportLazy || isServerTreeMode ? false : effectivePagination,
      paginationMode: effectivePaginationMode,
      sortingMode: effectiveSortingMode,
      filterMode: effectiveFilterMode,
      rowCount: effectiveRowCount,
      onColumnOrderChange: handleWrappedColumnOrderChange,
      onColumnWidthChange: handleWrappedColumnWidthChange,
    };
  }, [
    effectiveFilterMode,
    effectivePagination,
    effectivePaginationMode,
    effectiveRowCount,
    effectiveSortingMode,
    effectiveSourceRows,
    handleWrappedColumnOrderChange,
    handleWrappedColumnWidthChange,
    isServerTreeMode,
    isViewportLazy,
    pivotGetRowId,
    pivotMode,
    pivotResult,
    props,
  ]);

  const pivotInternalOptions = useMemo(
    () =>
      pivotMode && pivotResult
        ? {
            pivotMode: true,
            pivotModel: effectivePivotModel,
            pivotPinnedOverride: {
              left: pivotResult.pinnedLeftFields,
              right: pivotResult.pinnedRightFields,
            },
            viewportWidth,
          }
        : { viewportWidth },
    [effectivePivotModel, pivotMode, pivotResult, viewportWidth],
  );

  const {
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
    clearAllFilters,
    clearSelection,
    getVisibleDataColDefs,
    formatCellValue,
  } = useDataGridPro(effectiveHookProps, pivotInternalOptions);

  const sortModelSig = JSON.stringify(sortModel);
  const filterModelSig = JSON.stringify(filterModel);
  const onDataSourceErrorRef = useRef(onDataSourceError);
  onDataSourceErrorRef.current = onDataSourceError;

  // Trigger DataSource fetch whenever server pagination, sorting, filter model, or server-tree mode changes
  useEffect(() => {
    if (!hasDataSource || !dataSource || isViewportLazy) {
      if (!isViewportLazy) {
        setDsError(null);
      }
      return;
    }
    if (isServerTreeMode) {
      setServerTreeChildrenMap({});
      setServerTreeExpandedMap({});
      setServerTreeLoadingMap({});
    }
    const queryParams = {
      paginationModel:
        effectivePagination && !isServerTreeMode ? paginationModel : undefined,
      sortModel,
      filterModel,
      groupKeys: isServerTreeMode ? [] : undefined,
    };

    const cached = activeDataSourceCache?.get(queryParams);
    if (cached) {
      setDsRows(cached.rows);
      setDsRowCount(cached.rowCount ?? cached.rows.length);
      setDsError(null);
      setDsLoading(false);
      return;
    }

    const reqId = ++dsRequestSeqRef.current;
    setDsLoading(true);
    setDsError(null);

    Promise.resolve(dataSource.getRows(queryParams))
      .then((res) => {
        if (dsRequestSeqRef.current !== reqId) return;
        const resolvedRows = res.rows ?? [];
        const resolvedCount =
          typeof res.rowCount === 'number' ? res.rowCount : resolvedRows.length;
        activeDataSourceCache?.set(queryParams, {
          rows: resolvedRows,
          rowCount: resolvedCount,
        });
        setDsRows(resolvedRows);
        setDsRowCount(resolvedCount);
        setDsLoading(false);
      })
      .catch((err) => {
        if (dsRequestSeqRef.current !== reqId) return;
        setDsError(err instanceof Error ? err.message : '服务端数据加载失败');
        setDsLoading(false);
        onDataSourceErrorRef.current?.(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasDataSource,
    isViewportLazy,
    isServerTreeMode,
    dataSource,
    activeDataSourceCache,
    effectivePagination,
    paginationModel.page,
    paginationModel.pageSize,
    sortModelSig,
    filterModelSig,
    dsRetryTick,
  ]);

  // Lazy-fetch children when user expands a Server-Side Tree Data branch node
  const handleToggleServerTreeNode = useCallback(
    async (node: ServerTreeDisplayRow<R>) => {
      if (!isServerTreeMode || !dataSource || !node.hasChildren) return;
      const { pathKey, groupKeys } = node;
      if (serverTreeExpandedMap[pathKey]) {
        setServerTreeExpandedMap((prev) => ({ ...prev, [pathKey]: false }));
        return;
      }

      setServerTreeExpandedMap((prev) => ({ ...prev, [pathKey]: true }));
      if (serverTreeChildrenMap[pathKey]) {
        return;
      }

      const queryParams = {
        groupKeys,
        sortModel,
        filterModel,
      };
      const cached = activeDataSourceCache?.get(queryParams);
      if (cached) {
        setServerTreeChildrenMap((prev) => ({
          ...prev,
          [pathKey]: cached.rows ?? [],
        }));
        return;
      }

      setServerTreeLoadingMap((prev) => ({ ...prev, [pathKey]: true }));
      try {
        const res = await dataSource.getRows(queryParams);
        const childRows = res.rows ?? [];
        activeDataSourceCache?.set(queryParams, {
          rows: childRows,
          rowCount: res.rowCount ?? childRows.length,
        });
        setServerTreeChildrenMap((prev) => ({
          ...prev,
          [pathKey]: childRows,
        }));
      } catch (err) {
        setServerTreeExpandedMap((prev) => ({ ...prev, [pathKey]: false }));
        onDataSourceErrorRef.current?.(err);
      } finally {
        setServerTreeLoadingMap((prev) => ({ ...prev, [pathKey]: false }));
      }
    },
    [
      activeDataSourceCache,
      dataSource,
      filterModel,
      isServerTreeMode,
      serverTreeChildrenMap,
      serverTreeExpandedMap,
      sortModel,
    ],
  );

  // Official MUI X Pro Viewport Chunked Lazy Loading: reset & fetch initial chunk on query change
  useEffect(() => {
    if (!isViewportLazy || !dataSource) {
      return;
    }
    const epoch = ++lazyQueryEpochRef.current;
    lazyInFlightChunksRef.current.clear();
    setLazyRowMap(new Map());
    setLazyInitialLoading(true);
    setDsError(null);

    const endIdx = Math.max(0, lazyLoadingChunkSize - 1);
    lazyInFlightChunksRef.current.add(0);

    Promise.resolve(
      dataSource.getRows({
        start: 0,
        end: endIdx,
        sortModel,
        filterModel,
      }),
    )
      .then((res) => {
        lazyInFlightChunksRef.current.delete(0);
        if (lazyQueryEpochRef.current !== epoch) return;
        const fetched = res.rows ?? [];
        const total =
          typeof res.rowCount === 'number' ? res.rowCount : fetched.length;
        setLazyTotalCount(total);
        setLazyRowMap((prev) => mergeLazyRowsIntoMap(prev, 0, fetched));
        setLazyInitialLoading(false);
      })
      .catch((err) => {
        lazyInFlightChunksRef.current.delete(0);
        if (lazyQueryEpochRef.current !== epoch) return;
        setDsError(err instanceof Error ? err.message : '分片懒加载失败');
        setLazyInitialLoading(false);
        onDataSourceErrorRef.current?.(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isViewportLazy,
    dataSource,
    lazyLoadingChunkSize,
    sortModelSig,
    filterModelSig,
    dsRetryTick,
  ]);

  const hasHierarchy = hasTreeData || hasRowGrouping;
  const effectiveListView = Boolean(
    listView && !pivotMode && !hasHierarchy && !isViewportLazy,
  );

  const baseDensityMetrics = getDensityMetrics(density);
  const densityMetrics = useMemo(
    () => ({
      ...baseDensityMetrics,
      rowHeight:
        typeof rowHeight === 'number' && rowHeight > 0
          ? rowHeight
          : baseDensityMetrics.rowHeight,
      headerHeight:
        typeof columnHeaderHeight === 'number' && columnHeaderHeight > 0
          ? columnHeaderHeight
          : baseDensityMetrics.headerHeight,
    }),
    [baseDensityMetrics, columnHeaderHeight, rowHeight],
  );
  const stickyHeaderTotalHeight =
    columnGroupHeaderRows.length * columnGroupHeaderHeight +
    densityMetrics.headerHeight +
    (effectiveHeaderFilters ? 54 : 0);
  const hasAggregationRow = Object.keys(aggregationModel).length > 0;
  const bottomPinnedHeight =
    (effectivePinnedRows?.bottom?.length ?? 0) * densityMetrics.rowHeight;
  const aggregationRowHeight = hasAggregationRow
    ? Math.max(densityMetrics.rowHeight, 48)
    : 0;

  // Toolbar popovers & column header menu state
  const columnsButtonRef = useRef<HTMLButtonElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const [columnsAnchor, setColumnsAnchor] = useState<HTMLElement | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [columnMenuState, setColumnMenuState] = useState<{
    anchorEl: HTMLElement | null;
    field: string | null;
  }>({ anchorEl: null, field: null });
  const [cellContextMenu, setCellContextMenu] =
    useState<CellContextMenuState | null>(null);

  // Edit History Undo / Redo state (tracks cell edit, row edit, paste, and autofill)
  const [editHistory, setEditHistory] = useState<EditHistoryState<R>>(() =>
    createEditHistoryState<R>(50),
  );
  const editHistoryRef = useRef(editHistory);
  editHistoryRef.current = editHistory;
  const isApplyingHistoryRef = useRef(false);

  const recordEditBatch = useCallback(
    (label: string, changes: GridEditHistoryChange<R>[]) => {
      if (isApplyingHistoryRef.current || changes.length === 0) return;
      const next = pushEditHistoryEntry(editHistoryRef.current, {
        label,
        changes,
      });
      editHistoryRef.current = next;
      setEditHistory(next);
    },
    [],
  );

  const handleUndo = useCallback(async () => {
    if (!processRowUpdate || pivotMode || isApplyingHistoryRef.current) return;
    const { state: nextState, batch } = undoEditHistory(editHistoryRef.current);
    if (!batch) return;
    isApplyingHistoryRef.current = true;
    try {
      for (let i = batch.changes.length - 1; i >= 0; i -= 1) {
        const change = batch.changes[i];
        await processRowUpdate(change.oldRow, change.newRow);
      }
      editHistoryRef.current = nextState;
      setEditHistory(nextState);
      onUndoRedo?.({
        action: 'undo',
        rowCount: batch.changes.length,
        label: batch.label,
      });
    } catch (err) {
      onProcessRowUpdateError?.(err);
    } finally {
      isApplyingHistoryRef.current = false;
    }
  }, [onProcessRowUpdateError, onUndoRedo, pivotMode, processRowUpdate]);

  const handleRedo = useCallback(async () => {
    if (!processRowUpdate || pivotMode || isApplyingHistoryRef.current) return;
    const { state: nextState, batch } = redoEditHistory(editHistoryRef.current);
    if (!batch) return;
    isApplyingHistoryRef.current = true;
    try {
      for (const change of batch.changes) {
        await processRowUpdate(change.newRow, change.oldRow);
      }
      editHistoryRef.current = nextState;
      setEditHistory(nextState);
      onUndoRedo?.({
        action: 'redo',
        rowCount: batch.changes.length,
        label: batch.label,
      });
    } catch (err) {
      onProcessRowUpdateError?.(err);
    } finally {
      isApplyingHistoryRef.current = false;
    }
  }, [onProcessRowUpdateError, onUndoRedo, pivotMode, processRowUpdate]);

  const [quickInput, setQuickInput] = useState(() =>
    (filterModel.quickFilterValues ?? []).join(' '),
  );

  // Official MUI X live column drag-reorder state + swap cooldown to prevent width-mismatch jitter
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const lastSwapRef = useRef<{ target: string; ts: number }>({
    target: '',
    ts: 0,
  });

  // Official MUI X Pro row drag-reorder state (+ synchronous ref for fast drags)
  const [draggedRowId, setDraggedRowId] = useState<GridRowId | null>(null);
  const draggedRowIdRef = useRef<GridRowId | null>(null);
  const [rowDropTarget, setRowDropTarget] = useState<{
    rowId: GridRowId;
    position: 'before' | 'after';
  } | null>(null);

  // Inline cell editing state (editMode="cell")
  const [editingCell, setEditingCell] = useState<{
    rowId: GridRowId;
    field: string;
    initialTypedValue?: string;
  } | null>(null);

  // Full row editing state (editMode="row")
  const [editingRow, setEditingRow] = useState<{
    rowId: GridRowId;
    focusField: string;
    initialTypedValue?: string;
    drafts: Record<string, unknown>;
  } | null>(null);

  useEffect(() => {
    setEditingCell(null);
    setEditingRow(null);
  }, [editMode]);

  // Official MUI X Excel-style cell range selection + Fill Handle state
  const [cellRange, setCellRange] = useState<GridCellRange | null>(null);
  const [fillPreviewRange, setFillPreviewRange] = useState<GridCellRange | null>(
    null,
  );
  const isDraggingSelectionRef = useRef(false);
  const isFillDraggingRef = useRef(false);
  const fillSourceRangeRef = useRef<GridCellRange | null>(null);
  const fillPreviewRangeRef = useRef<GridCellRange | null>(null);
  const commitAutoFillRef = useRef<
    (source: GridCellRange, target: GridCellRange) => Promise<void>
  >(async () => {});

  // Official MUI X Shift+Click checkbox range selection anchor
  const lastCheckedRowIdRef = useRef<string | null>(null);
  const shiftClickHandledRef = useRef(false);

  useEffect(() => {
    if (!effectiveCellSelection) {
      setCellRange(null);
      setFillPreviewRange(null);
      isDraggingSelectionRef.current = false;
      isFillDraggingRef.current = false;
      fillSourceRangeRef.current = null;
      fillPreviewRangeRef.current = null;
      return;
    }
    const handleGlobalMouseUp = () => {
      isDraggingSelectionRef.current = false;
      if (isFillDraggingRef.current) {
        isFillDraggingRef.current = false;
        const src = fillSourceRangeRef.current;
        const target = fillPreviewRangeRef.current;
        fillSourceRangeRef.current = null;
        fillPreviewRangeRef.current = null;
        setFillPreviewRange(null);
        if (src && target) {
          void commitAutoFillRef.current(src, target);
        }
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [effectiveCellSelection]);

  // Clear cell selection when view geometry changes
  const paginationPageIndex = table.state.pagination.pageIndex;
  const paginationPageSize = table.state.pagination.pageSize;
  useEffect(() => {
    setCellRange(null);
    setFillPreviewRange(null);
  }, [
    hasHierarchy,
    rowGroupingModel,
    rowGroupingColumnMode,
    paginationPageIndex,
    paginationPageSize,
    filteredRows.length,
  ]);

  // Scroll edge, viewport metrics & row virtualization window state
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const scrollEndNotifiedRef = useRef(false);
  const [scrollMetrics, setScrollMetrics] = useState({
    scrollTop: 0,
    scrollLeft: 0,
    viewportHeight: 520,
  });
  const [scrollState, setScrollState] = useState({
    isScrolledLeft: false,
    isScrolledRight: false,
    isScrolledTop: false,
    isScrolledBottom: false,
  });

  const shouldVirtualizeRef = useRef(false);
  const shouldVirtualizeColumnsRef = useRef(false);
  const rowHeightRef = useRef(52);
  const columnBufferPxRef = useRef(columnBufferPx);
  columnBufferPxRef.current = columnBufferPx;
  const everExpandedDetailIdsRef = useRef<Set<string>>(new Set());
  for (let i = 0; i < expandedRowIds.length; i += 1) {
    everExpandedDetailIdsRef.current.add(String(expandedRowIds[i]));
  }

  const syncScrollMetrics = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    const isScrolledLeft = el.scrollLeft > 1;
    const isScrolledRight = maxScrollLeft - el.scrollLeft > 1;
    const isScrolledTop = el.scrollTop > 1;
    const remainingBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
    const isScrolledBottom = remainingBottom > 1;

    setViewportWidth((prev) =>
      prev === el.clientWidth ? prev : el.clientWidth,
    );
    setScrollMetrics((prev) => {
      const rowH = Math.max(1, rowHeightRef.current);
      const nextScrollTop = shouldVirtualizeRef.current
        ? el.scrollTop === 0 ||
          Math.floor(el.scrollTop / rowH) !== Math.floor(prev.scrollTop / rowH)
          ? el.scrollTop
          : prev.scrollTop
        : prev.scrollTop;

      const colStep = Math.max(48, Math.floor(columnBufferPxRef.current / 3));
      const nextScrollLeft = shouldVirtualizeColumnsRef.current
        ? el.scrollLeft === 0 ||
          el.scrollLeft >= maxScrollLeft ||
          Math.abs(el.scrollLeft - prev.scrollLeft) >= colStep
          ? el.scrollLeft
          : prev.scrollLeft
        : prev.scrollLeft;

      if (
        prev.scrollTop === nextScrollTop &&
        prev.scrollLeft === nextScrollLeft &&
        prev.viewportHeight === el.clientHeight
      ) {
        return prev;
      }
      return {
        scrollTop: nextScrollTop,
        scrollLeft: nextScrollLeft,
        viewportHeight: el.clientHeight,
      };
    });
    setScrollState((prev) =>
      prev.isScrolledLeft === isScrolledLeft &&
      prev.isScrolledRight === isScrolledRight &&
      prev.isScrolledTop === isScrolledTop &&
      prev.isScrolledBottom === isScrolledBottom
        ? prev
        : { isScrolledLeft, isScrolledRight, isScrolledTop, isScrolledBottom },
    );

    // Official MUI X Pro onRowsScrollEnd trigger with GridRowScrollEndParams
    if (
      onRowsScrollEnd &&
      !effectiveLoading &&
      el.scrollHeight > el.clientHeight
    ) {
      if (remainingBottom <= scrollEndThreshold) {
        if (!scrollEndNotifiedRef.current) {
          scrollEndNotifiedRef.current = true;
          onRowsScrollEnd({
            viewportPageSize: Math.max(
              1,
              Math.floor(el.clientHeight / Math.max(1, densityMetrics.rowHeight)),
            ),
            virtualRowsCount: effectiveSourceRows.length,
          });
        }
      } else {
        scrollEndNotifiedRef.current = false;
      }
    }
  }, [
    densityMetrics.rowHeight,
    effectiveLoading,
    effectiveSourceRows.length,
    onRowsScrollEnd,
    scrollEndThreshold,
  ]);

  // Reset scroll-end notification lock whenever a new lazy batch finishes appending
  useEffect(() => {
    scrollEndNotifiedRef.current = false;
  }, [effectiveSourceRows.length]);

  const handleScrollerScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      syncScrollMetrics();
    });
  }, [syncScrollMetrics]);

  useEffect(() => {
    syncScrollMetrics();
    const el = scrollerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(syncScrollMetrics);
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, [
    syncScrollMetrics,
    columns,
    effectiveSourceRows.length,
    pinnedRows,
    hasHierarchy,
    treeFlatRows?.length,
  ]);

  const handleQuickFilterInput = useCallback(
    (nextVal: string) => {
      setQuickInput(nextVal);
      React.startTransition(() => {
        setQuickFilterText(nextVal);
      });
    },
    [setQuickFilterText],
  );

  const handleClearAllFilters = useCallback(() => {
    setQuickInput('');
    clearAllFilters();
  }, [clearAllFilters]);

  const handleExportCsv = useCallback(
    (selectedOnly: boolean) => {
      const exportRows = selectedOnly
        ? table.getSelectedRowModel().rows.map((r) => r.original)
        : table.getPrePaginatedRowModel().rows.map((r) => r.original);
      const visibleCols = getVisibleDataColDefs();
      const csvContent = serializeRowsToCsv(exportRows, visibleCols);
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${slotProps?.toolbar?.csvFileName ?? 'datagrid-export'}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      onExport?.({ format: 'csv', rowCount: exportRows.length, selectedOnly });
    },
    [getVisibleDataColDefs, onExport, slotProps?.toolbar?.csvFileName, table],
  );

  const handleExportXlsx = useCallback(
    (selectedOnly: boolean) => {
      const exportRows = selectedOnly
        ? table.getSelectedRowModel().rows.map((r) => r.original)
        : table.getPrePaginatedRowModel().rows.map((r) => r.original);
      const visibleCols = getVisibleDataColDefs();
      const bytes = serializeRowsToXlsxBytes(exportRows, visibleCols, '订单台账', {
        columnGroupingModel: effectiveHookProps.columnGroupingModel,
        rowSpanning: props.rowSpanning && !pivotMode,
      });
      const blob = new Blob([bytes.buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const baseName =
        slotProps?.toolbar?.excelFileName ??
        slotProps?.toolbar?.csvFileName ??
        'datagrid-export';
      anchor.download = `${baseName}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      onExport?.({ format: 'xlsx', rowCount: exportRows.length, selectedOnly });
    },
    [
      effectiveHookProps.columnGroupingModel,
      getVisibleDataColDefs,
      onExport,
      pivotMode,
      props.rowSpanning,
      slotProps?.toolbar?.csvFileName,
      slotProps?.toolbar?.excelFileName,
      table,
    ],
  );

  const handleExportJson = useCallback(
    (selectedOnly: boolean) => {
      const exportRows = selectedOnly
        ? table.getSelectedRowModel().rows.map((r) => r.original)
        : table.getPrePaginatedRowModel().rows.map((r) => r.original);
      const visibleCols = getVisibleDataColDefs();
      const jsonContent = serializeRowsToJson(exportRows, visibleCols);
      const blob = new Blob([jsonContent], {
        type: 'application/json;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${slotProps?.toolbar?.csvFileName ?? 'datagrid-export'}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      onExport?.({ format: 'json', rowCount: exportRows.length, selectedOnly });
    },
    [getVisibleDataColDefs, onExport, slotProps?.toolbar?.csvFileName, table],
  );

  const handleOpenColumnMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, field: string) => {
      setColumnMenuState({ anchorEl: event.currentTarget, field });
    },
    [],
  );

  const handleCloseColumnMenu = useCallback(() => {
    setColumnMenuState({ anchorEl: null, field: null });
  }, []);

  const handleFilterFromMenu = useCallback(
    (field: string) => {
      addFilterForColumn(field);
      if (filterButtonRef.current) {
        setFilterAnchor(filterButtonRef.current);
      }
    },
    [addFilterForColumn],
  );

  // Compute total left/right pinned widths so keyboard navigation auto-scrolls clear of pinned columns
  const visibleLeafColumns = table.getVisibleLeafColumns();
  let pinnedLeftTotalWidth = 0;
  let pinnedRightTotalWidth = 0;
  for (const col of visibleLeafColumns) {
    const info = pinnedLayout[col.id];
    if (info?.side === 'left') pinnedLeftTotalWidth += col.getSize();
    if (info?.side === 'right') pinnedRightTotalWidth += col.getSize();
  }

  const focusCellAt = useCallback(
    (rowIdx: number, colIdx: number) => {
      const container = scrollerRef.current;
      if (!container) return;
      const target = container.querySelector<HTMLElement>(
        `[data-row-index="${rowIdx}"][data-col-index="${colIdx}"]`,
      );
      if (!target) return;

      target.focus({ preventScroll: true });

      const field = target.getAttribute('data-field');
      const isPinnedTarget = field ? pinnedLayout[field]?.side !== false : false;
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      // Horizontal auto-scroll avoiding pinned left/right overlays
      if (!isPinnedTarget) {
        const visibleLeftEdge = containerRect.left + pinnedLeftTotalWidth;
        const visibleRightEdge = containerRect.right - pinnedRightTotalWidth;
        if (targetRect.left < visibleLeftEdge) {
          container.scrollLeft -= visibleLeftEdge - targetRect.left + 4;
        } else if (targetRect.right > visibleRightEdge) {
          container.scrollLeft += targetRect.right - visibleRightEdge + 4;
        }
      }

      // Vertical auto-scroll avoiding sticky column headers (+ group headers + header filter row + top pinned rows + bottom aggregation/pinned rows)
      const topPinnedHeight = (pinnedRows?.top?.length ?? 0) * densityMetrics.rowHeight;
      const visibleTopEdge =
        containerRect.top + stickyHeaderTotalHeight + topPinnedHeight;
      const visibleBottomEdge =
        containerRect.bottom - bottomPinnedHeight - aggregationRowHeight;
      if (targetRect.top < visibleTopEdge) {
        container.scrollTop -= visibleTopEdge - targetRect.top + 4;
      } else if (targetRect.bottom > visibleBottomEdge) {
        container.scrollTop += targetRect.bottom - visibleBottomEdge + 4;
      }
    },
    [
      aggregationRowHeight,
      bottomPinnedHeight,
      densityMetrics.rowHeight,
      pinnedLayout,
      pinnedLeftTotalWidth,
      pinnedRightTotalWidth,
      pinnedRows?.top?.length,
      stickyHeaderTotalHeight,
    ],
  );

  const displayRows = table.getRowModel().rows;
  const headerGroups = table.getHeaderGroups();
  const totalWidth = table.getTotalSize();

  // Exact visual leaf column order ([startPinned, center, endPinned]) matching
  // `headerGroups[0].headers` and `row.getVisibleCells()` 1-to-1 even when columns
  // are dynamically appended or pinned out of `columnOrder` sequence.
  const visualLeafColumns = useMemo(
    () =>
      headerGroups[0]?.headers.map((h) => h.column) ?? visibleLeafColumns,
    [headerGroups, visibleLeafColumns],
  );

  // Map rowId -> TanStack Row for Tree Data, Row Grouping, and Viewport Lazy Loading
  const prePaginatedRows = table.getPrePaginatedRowModel().rows;
  const rowByIdMap = useMemo(() => {
    const map = new Map<string, Row<DataGridFeatures, R>>();
    if (!hasHierarchy && !isViewportLazy) return map;
    for (const r of prePaginatedRows) {
      map.set(r.id, r);
    }
    return map;
  }, [hasHierarchy, isViewportLazy, prePaginatedRows]);

  // Unified list of renderable entries (flat rows, tree groups, or viewport lazy skeletons)
  type RenderEntry =
    | { kind: 'data'; row: Row<DataGridFeatures, R>; treeNode?: TreeFlatRow<R> }
    | { kind: 'tree-group'; treeNode: TreeFlatRow<R> }
    | { kind: 'lazy-skeleton'; absIndex: number };

  const allRenderEntries = useMemo<RenderEntry[]>(() => {
    if (hasHierarchy && treeFlatRows) {
      const entries: RenderEntry[] = [];
      for (const node of treeFlatRows) {
        if (node.isGroup) {
          entries.push({ kind: 'tree-group', treeNode: node });
        } else {
          const matchedRow = rowByIdMap.get(String(node.rowId));
          if (matchedRow) {
            entries.push({ kind: 'data', row: matchedRow, treeNode: node });
          }
        }
      }
      return entries;
    }
    return displayRows.map((row) => ({ kind: 'data', row }));
  }, [displayRows, hasHierarchy, rowByIdMap, treeFlatRows]);

  // Matrix projections for Excel range statistics, range copy, paste & autofill
  const renderRowsForMatrix = useMemo<Array<R | null>>(
    () => allRenderEntries.map((e) => (e.kind === 'data' ? e.row.original : null)),
    [allRenderEntries],
  );
  const orderedVisibleDataRowIds = useMemo<string[]>(
    () =>
      allRenderEntries
        .filter(
          (e): e is Extract<RenderEntry, { kind: 'data' }> =>
            e.kind === 'data' && e.row.getCanSelect(),
        )
        .map((e) => e.row.id),
    [allRenderEntries],
  );
  const visibleColDefsForMatrix = useMemo<Array<GridColDef<R> | undefined>>(
    () =>
      visualLeafColumns.map(
        (c) => (c.columnDef.meta as ColumnMetaExt<R> | undefined)?.colDef,
      ),
    [visualLeafColumns],
  );

  const canEditRowCell = useCallback(
    (row: R, colDef: GridColDef<R>): boolean => {
      if (!colDef.editable || colDef.type === 'actions') return false;
      if (
        isServerTreeMode &&
        Boolean((row as Record<string, unknown>).__isServerTreeGroup)
      ) {
        return false;
      }
      if (!isCellEditable) return true;
      const rowId = resolveRowId(row, 0, effectiveGetRowId);
      return isCellEditable({
        id: rowId,
        field: colDef.field,
        value: resolveCellValue(row, colDef),
        row,
        colDef,
      });
    },
    [effectiveGetRowId, isCellEditable, isServerTreeMode],
  );

  const commitAutoFill = useCallback(
    async (sourceRange: GridCellRange, targetRange: GridCellRange) => {
      if (!processRowUpdate || pivotMode) return;
      const { updates, updatedCells } = computeAutoFillUpdates(
        renderRowsForMatrix,
        visibleColDefsForMatrix,
        sourceRange,
        targetRange,
        canEditRowCell,
      );
      if (updates.length === 0 || updatedCells === 0) return;

      const appliedChanges: GridEditHistoryChange<R>[] = [];
      for (const item of updates) {
        try {
          const confirmed = await processRowUpdate(item.nextRow, item.oldRow);
          appliedChanges.push({
            oldRow: item.oldRow,
            newRow: confirmed ?? item.nextRow,
          });
        } catch (err) {
          onProcessRowUpdateError?.(err);
        }
      }
      if (appliedChanges.length > 0) {
        recordEditBatch(`智能填充 ${appliedChanges.length} 行`, appliedChanges);
        setCellRange(targetRange);
        onCellAutoFill?.({ updatedRows: appliedChanges.length, updatedCells });
      }
    },
    [
      canEditRowCell,
      onCellAutoFill,
      onProcessRowUpdateError,
      pivotMode,
      processRowUpdate,
      recordEditBatch,
      renderRowsForMatrix,
      visibleColDefsForMatrix,
    ],
  );
  commitAutoFillRef.current = commitAutoFill;

  const normalizedCellRange = useMemo(
    () => (cellRange ? normalizeCellRange(cellRange) : null),
    [cellRange],
  );

  const isMultiCellRange = Boolean(
    effectiveCellSelection &&
      cellRange &&
      (cellRange.start.rowIndex !== cellRange.end.rowIndex ||
        cellRange.start.colIndex !== cellRange.end.colIndex),
  );

  const cellRangeStats = useMemo(() => {
    if (!effectiveCellSelection || !cellRange) return null;
    return computeCellRangeStats(
      renderRowsForMatrix,
      visibleColDefsForMatrix,
      cellRange,
    );
  }, [
    cellRange,
    effectiveCellSelection,
    renderRowsForMatrix,
    visibleColDefsForMatrix,
  ]);

  const hasDynamicRowHeight = Boolean(getRowHeight) && !pivotMode;
  const effectiveRowSpanning =
    rowSpanning &&
    !pivotMode &&
    !hasHierarchy &&
    editMode !== 'row' &&
    !hasDynamicRowHeight;

  const totalRenderedRows = isViewportLazy
    ? lazyTotalCount
    : allRenderEntries.length;
  const shouldVirtualize = isViewportLazy
    ? !disableVirtualization && !autoHeight && lazyTotalCount > 0
    : !disableVirtualization &&
      !autoHeight &&
      totalRenderedRows > virtualizeThreshold &&
      expandedRowIds.length === 0 &&
      !effectiveRowSpanning &&
      !hasDynamicRowHeight;
  shouldVirtualizeRef.current = shouldVirtualize;
  rowHeightRef.current = densityMetrics.rowHeight;
  const effectiveBodyViewportHeight = Math.max(
    180,
    scrollMetrics.viewportHeight -
      stickyHeaderTotalHeight -
      bottomPinnedHeight -
      aggregationRowHeight,
  );

  // Official MUI X autoPageSize: dynamically fit pageSize to available grid viewport height
  useEffect(() => {
    if (
      !autoPageSize ||
      !effectivePagination ||
      autoHeight ||
      hasHierarchy ||
      isViewportLazy
    ) {
      return;
    }
    const nextSize = computeAutoPageSize(
      effectiveBodyViewportHeight,
      densityMetrics.rowHeight,
    );
    if (nextSize !== table.state.pagination.pageSize) {
      table.setPageSize(nextSize);
    }
  }, [
    autoHeight,
    autoPageSize,
    densityMetrics.rowHeight,
    effectiveBodyViewportHeight,
    effectivePagination,
    hasHierarchy,
    isViewportLazy,
    table,
  ]);

  const virtualWindow = shouldVirtualize
    ? computeVirtualRowWindow({
        totalRows: totalRenderedRows,
        scrollTop: scrollMetrics.scrollTop,
        viewportHeight: effectiveBodyViewportHeight,
        rowHeight: densityMetrics.rowHeight,
        overscan: 6,
      })
    : {
        startIndex: 0,
        endIndex: totalRenderedRows,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
      };

  // Trigger chunked DataSource fetches for any uncached rows in the active virtual viewport
  useEffect(() => {
    if (!isViewportLazy || !dataSource || lazyTotalCount <= 0) return;
    const loadedIndices = new Set<number>(lazyRowMap.keys());
    const { ranges, chunkIds } = computeMissingChunkRanges({
      startIndex: virtualWindow.startIndex,
      endIndex: Math.max(virtualWindow.startIndex, virtualWindow.endIndex - 1),
      totalRowCount: lazyTotalCount,
      chunkSize: lazyLoadingChunkSize,
      loadedIndices,
      inFlightChunkIds: lazyInFlightChunksRef.current,
    });
    if (ranges.length === 0) return;

    const epoch = lazyQueryEpochRef.current;
    for (const cid of chunkIds) {
      lazyInFlightChunksRef.current.add(cid);
    }

    for (const range of ranges) {
      const rangeChunkStart = Math.floor(range.start / lazyLoadingChunkSize);
      const rangeChunkEnd = Math.floor(range.end / lazyLoadingChunkSize);
      Promise.resolve(
        dataSource.getRows({
          start: range.start,
          end: range.end,
          sortModel,
          filterModel,
        }),
      )
        .then((res) => {
          for (let c = rangeChunkStart; c <= rangeChunkEnd; c += 1) {
            lazyInFlightChunksRef.current.delete(c);
          }
          if (lazyQueryEpochRef.current !== epoch) return;
          const fetched = res.rows ?? [];
          if (typeof res.rowCount === 'number' && res.rowCount !== lazyTotalCount) {
            setLazyTotalCount(res.rowCount);
          }
          setLazyRowMap((prev) =>
            mergeLazyRowsIntoMap(prev, range.start, fetched),
          );
        })
        .catch((err) => {
          for (let c = rangeChunkStart; c <= rangeChunkEnd; c += 1) {
            lazyInFlightChunksRef.current.delete(c);
          }
          if (lazyQueryEpochRef.current !== epoch) return;
          onDataSourceErrorRef.current?.(err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isViewportLazy,
    dataSource,
    lazyTotalCount,
    lazyLoadingChunkSize,
    lazyRowMap,
    virtualWindow.startIndex,
    virtualWindow.endIndex,
    sortModelSig,
    filterModelSig,
  ]);

  const visibleRenderEntries = useMemo<RenderEntry[]>(() => {
    if (isViewportLazy) {
      const entries: RenderEntry[] = [];
      for (
        let absIdx = virtualWindow.startIndex;
        absIdx < virtualWindow.endIndex;
        absIdx += 1
      ) {
        const loadedRow = lazyRowMap.get(absIdx);
        if (loadedRow) {
          const rid = String(
            resolveRowId(loadedRow, absIdx, effectiveGetRowId),
          );
          const matched = rowByIdMap.get(rid);
          if (matched) {
            entries.push({ kind: 'data', row: matched });
            continue;
          }
        }
        entries.push({ kind: 'lazy-skeleton', absIndex: absIdx });
      }
      return entries;
    }
    return allRenderEntries.slice(
      virtualWindow.startIndex,
      virtualWindow.endIndex,
    );
  }, [
    allRenderEntries,
    effectiveGetRowId,
    isViewportLazy,
    lazyRowMap,
    rowByIdMap,
    virtualWindow.endIndex,
    virtualWindow.startIndex,
  ]);

  // Official MUI X Pro Horizontal Column Virtualization (pinned left/right preserved)
  const hasAnyColSpan = useMemo(
    () => effectiveColumns.some((c) => Boolean(c.colSpan)),
    [effectiveColumns],
  );
  const shouldVirtualizeColumns =
    !disableVirtualization &&
    !pivotMode &&
    columnGroupHeaderRows.length === 0 &&
    !hasAnyColSpan &&
    visualLeafColumns.length >= columnVirtualizeThreshold;
  shouldVirtualizeColumnsRef.current = shouldVirtualizeColumns;
  const firstDataColId = useMemo(
    () => effectiveColumns.find((c) => c.type !== 'actions')?.field,
    [effectiveColumns],
  );

  const columnWindow = useMemo(
    () =>
      computeVirtualColumnWindow({
        columns: visualLeafColumns.map((col) => ({
          id: col.id,
          width: col.getSize(),
          pinnedSide: pinnedLayout[col.id]?.side ?? false,
        })),
        scrollLeft: scrollMetrics.scrollLeft,
        viewportWidth,
        columnBufferPx,
        enabled: shouldVirtualizeColumns,
      }),
    [
      columnBufferPx,
      pinnedLayout,
      scrollMetrics.scrollLeft,
      shouldVirtualizeColumns,
      viewportWidth,
      visualLeafColumns,
    ],
  );

  // Clamp horizontal scroll offset cleanly whenever total grid width shrinks (e.g. leaving wide-column mode)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    if (el.scrollLeft > maxScrollLeft) {
      el.scrollLeft = maxScrollLeft;
      setScrollMetrics((prev) =>
        prev.scrollLeft === maxScrollLeft
          ? prev
          : { ...prev, scrollLeft: maxScrollLeft },
      );
    }
  }, [totalWidth, viewportWidth]);

  // Reset vertical scroll position cleanly when switching view modes (table / listView / lazyLoading)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (el.scrollTop !== 0) {
      el.scrollTop = 0;
      setScrollMetrics((prev) =>
        prev.scrollTop === 0 ? prev : { ...prev, scrollTop: 0 },
      );
    }
  }, [effectiveListView, isViewportLazy]);

  // Official MUI X rowSpanning map over rendered rows
  const rowSpanMatrix = useMemo(
    () =>
      computeRowSpanMatrix(
        renderRowsForMatrix,
        visibleColDefsForMatrix,
        effectiveRowSpanning,
      ),
    [effectiveRowSpanning, renderRowsForMatrix, visibleColDefsForMatrix],
  );

  // Charts Integration: active cross-filter item & context-preserving chart rows
  const activeChartCrossFilter = useMemo(() => {
    if (pivotMode || !chartModel.dimensionField) return null;
    const item = filterModel.items.find(
      (f) =>
        f.field === chartModel.dimensionField &&
        (f.operator === 'is' || f.operator === 'equals') &&
        f.value !== undefined &&
        f.value !== null &&
        !Array.isArray(f.value) &&
        String(f.value).trim() !== '',
    );
    return item ?? null;
  }, [chartModel.dimensionField, filterModel.items, pivotMode]);

  const chartRows = useMemo<R[]>(() => {
    if (pivotMode) return rows;
    if (!activeChartCrossFilter) return filteredRows;
    const peerFilterModel = {
      ...filterModel,
      items: filterModel.items.filter(
        (f) => f.id !== activeChartCrossFilter.id,
      ),
    };
    const predicate = createRowFilterPredicate(peerFilterModel, columns);
    return rows.filter(predicate);
  }, [activeChartCrossFilter, columns, filterModel, filteredRows, pivotMode, rows]);

  // Publish lifecycle events to apiRef.current.subscribeEvent listeners (skipping initial mount)
  const eventBusMountedRef = useRef(false);
  useEffect(() => {
    eventBusMountedRef.current = true;
  }, []);
  useEffect(() => {
    if (!eventBusMountedRef.current) return;
    eventBusRef.current.publish('sortModelChange', sortModel);
  }, [sortModelSig]);
  useEffect(() => {
    if (!eventBusMountedRef.current) return;
    eventBusRef.current.publish('filterModelChange', filterModel);
  }, [filterModelSig]);
  useEffect(() => {
    if (!eventBusMountedRef.current) return;
    eventBusRef.current.publish('paginationModelChange', paginationModel);
  }, [paginationModel.page, paginationModel.pageSize]);
  const selectedIdsSig = selectedIds.map(String).join(',');
  useEffect(() => {
    if (!eventBusMountedRef.current) return;
    eventBusRef.current.publish('rowSelectionChange', selectedIds);
  }, [selectedIdsSig]);
  useEffect(() => {
    if (!eventBusMountedRef.current) return;
    eventBusRef.current.publish('densityChange', density);
  }, [density]);
  const colVisSig = JSON.stringify(columnVisibility);
  useEffect(() => {
    if (!eventBusMountedRef.current) return;
    eventBusRef.current.publish('columnVisibilityModelChange', columnVisibility);
  }, [colVisSig]);

  // Official MUI X imperative apiRef population
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      // State persistence
      exportState,
      restoreState,

      // Rows
      getRow: (id) => {
        const key = String(id);
        for (let i = 0; i < effectiveSourceRows.length; i += 1) {
          const row = effectiveSourceRows[i];
          if (String(resolveRowId(row, i, effectiveGetRowId)) === key) {
            return row;
          }
        }
        return null;
      },
      getAllRowIds: () =>
        effectiveSourceRows.map((row, idx) =>
          resolveRowId(row, idx, effectiveGetRowId),
        ),
      getRowsCount: () =>
        typeof effectiveRowCount === 'number'
          ? effectiveRowCount
          : effectiveSourceRows.length,
      getSelectedRows: () =>
        table.getSelectedRowModel().rows.map((r) => r.original),
      setRowSelectionModel,
      selectRow,
      updateRows: (updates) => {
        if (!updates.length) return;
        const nextRows = applyRowUpdates(
          effectiveSourceRows,
          updates,
          (r, idx) => resolveRowId(r, idx, effectiveGetRowId),
        );
        if (hasDataSource) {
          setDsRows(nextRows);
        } else if (onRowsUpdate) {
          onRowsUpdate(nextRows);
        } else {
          setInternalRowOverride(nextRows);
        }
        eventBusRef.current.publish('rowsUpdate', updates);
      },

      // Columns
      getColumn: (field) =>
        effectiveColumns.find((c) => c.field === field) ?? null,
      getAllColumns: () => [...effectiveColumns],
      getVisibleColumns: () => getVisibleDataColDefs(),
      setColumnVisibility: setColumnVisibilityField,
      setColumnVisibilityModel,
      setColumnWidth,
      pinColumn,
      autosizeColumns: autosizeAllColumns,

      // Sorting, Filtering, Pagination, Grouping, Aggregation, Density
      setFilterModel,
      setSortModel,
      getSortModel: () => sortModel,
      setPage: (page) => table.setPageIndex(Math.max(0, page)),
      setPageSize: (pageSize) => table.setPageSize(Math.max(1, pageSize)),
      setPaginationModel,
      setDensity,
      setRowGroupingModel,
      setAggregationModel,

      // Scrolling, Focus & Editing
      scrollToIndexes: ({ rowIndex, colIndex }) => {
        const el = scrollerRef.current;
        if (!el) return;
        if (typeof rowIndex === 'number') {
          const clampedRow = Math.max(
            0,
            Math.min(Math.max(0, totalRenderedRows - 1), rowIndex),
          );
          el.scrollTop = Math.max(0, clampedRow * densityMetrics.rowHeight);
        }
        if (typeof rowIndex === 'number' && typeof colIndex === 'number') {
          requestAnimationFrame(() => focusCellAt(rowIndex, colIndex));
        }
      },
      setCellFocus: (id, field) => {
        const key = String(id);
        const rowIndex = displayRows.findIndex((r) => r.id === key);
        const colIndex = visibleLeafColumns.findIndex((c) => c.id === field);
        if (rowIndex !== -1 && colIndex !== -1) {
          focusCellAt(rowIndex, colIndex);
        }
      },
      startCellEditMode: ({ id, field }) => {
        setEditingCell({ rowId: String(id), field });
        eventBusRef.current.publish('cellEditStart', { id, field });
      },
      stopCellEditMode: ({ id, field, ignoreModifications }) => {
        setEditingCell((prev) =>
          prev && prev.rowId === String(id) && prev.field === field
            ? null
            : prev,
        );
        eventBusRef.current.publish('cellEditStop', {
          id,
          field,
          ignoreModifications: Boolean(ignoreModifications),
        });
      },
      startRowEditMode: ({ id, fieldToFocus }) => {
        const key = String(id);
        const target = displayRows.find((r) => r.id === key);
        if (!target) return;
        const focusField =
          fieldToFocus ??
          effectiveColumns.find((c) => canEditRowCell(target.original, c))
            ?.field ??
          '';
        if (focusField) {
          startRowEditRef.current(target.original, id, focusField);
        }
      },
      stopRowEditMode: ({ id, ignoreModifications }) => {
        if (ignoreModifications) {
          setEditingRow((prev) =>
            prev && String(prev.rowId) === String(id) ? null : prev,
          );
          return;
        }
        const key = String(id);
        const target = displayRows.find((r) => r.id === key);
        if (target) {
          void commitRowEditRef.current(target.original);
        } else {
          setEditingRow(null);
        }
      },

      // Events
      subscribeEvent: (event, handler) =>
        eventBusRef.current.subscribe(event, handler),
      publishEvent: (event, params) =>
        eventBusRef.current.publish(event, params),

      // Server DataSource
      dataSource: {
        fetchRows: () => {
          activeDataSourceCache?.clear();
          setDsRetryTick((t) => t + 1);
        },
        clearCache: () => {
          activeDataSourceCache?.clear();
        },
      },
    };
  }, [
    activeDataSourceCache,
    apiRef,
    autosizeAllColumns,
    densityMetrics.rowHeight,
    displayRows,
    effectiveColumns,
    effectiveGetRowId,
    effectiveRowCount,
    effectiveSourceRows,
    exportState,
    focusCellAt,
    getVisibleDataColDefs,
    hasDataSource,
    onRowsUpdate,
    pinColumn,
    restoreState,
    selectRow,
    setAggregationModel,
    setColumnVisibilityField,
    setColumnVisibilityModel,
    setColumnWidth,
    setDensity,
    setFilterModel,
    setPaginationModel,
    setRowGroupingModel,
    setRowSelectionModel,
    setSortModel,
    sortModel,
    table,
    totalRenderedRows,
    visibleLeafColumns,
  ]);

  // Official MUI X Premium Delete/Backspace bulk cell range clear with Undo/Redo support
  const handleClearCellRange = useCallback(async () => {
    if (!effectiveCellSelection || !cellRange || !processRowUpdate || pivotMode) {
      return;
    }
    const { updates, updatedCells } = buildCellRangeClearUpdates(
      renderRowsForMatrix,
      visibleColDefsForMatrix,
      cellRange,
      canEditRowCell,
    );
    if (updates.length === 0 || updatedCells === 0) return;

    const appliedChanges: GridEditHistoryChange<R>[] = [];
    for (const item of updates) {
      try {
        const confirmed = await processRowUpdate(item.nextRow, item.oldRow);
        appliedChanges.push({
          oldRow: item.oldRow,
          newRow: confirmed ?? item.nextRow,
        });
      } catch (err) {
        onProcessRowUpdateError?.(err);
      }
    }
    if (appliedChanges.length > 0) {
      recordEditBatch(`清空选区 (${updatedCells} 格)`, appliedChanges);
      onClipboardClear?.({
        updatedRows: appliedChanges.length,
        updatedCells,
      });
    }
  }, [
    canEditRowCell,
    cellRange,
    effectiveCellSelection,
    onClipboardClear,
    onProcessRowUpdateError,
    pivotMode,
    processRowUpdate,
    recordEditBatch,
    renderRowsForMatrix,
    visibleColDefsForMatrix,
  ]);

  // Official MUI X Excel-compatible Ctrl+C / Ctrl+Z / Ctrl+Y / Delete keyboard handler
  const handleGridClipboardCopy = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape' && cellRange) {
        setCellRange(null);
        return;
      }
      const target = e.target as HTMLElement | null;
      const isInputTarget = Boolean(
        target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable),
      );
      if (isInputTarget) return;

      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        effectiveCellSelection &&
        cellRange &&
        processRowUpdate &&
        !pivotMode &&
        !editingCell &&
        !editingRow
      ) {
        e.preventDefault();
        void handleClearCellRange();
        return;
      }

      const lowerKey = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && lowerKey === 'z') {
        if (editHistoryRef.current.past.length > 0 && !pivotMode) {
          e.preventDefault();
          void handleUndo();
        }
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (lowerKey === 'y' || (e.shiftKey && lowerKey === 'z'))
      ) {
        if (editHistoryRef.current.future.length > 0 && !pivotMode) {
          e.preventDefault();
          void handleRedo();
        }
        return;
      }

      if (!(e.ctrlKey || e.metaKey) || lowerKey !== 'c') return;

      const writeClipboard = (
        text: string,
        rowCount: number,
        colCount: number,
      ) => {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          void navigator.clipboard.writeText(text).catch(() => {});
        }
        onClipboardCopy?.({ rowCount, colCount });
      };

      if (effectiveCellSelection && cellRange && isMultiCellRange) {
        const tsv = serializeCellRangeToTsv(
          renderRowsForMatrix,
          visibleColDefsForMatrix,
          cellRange,
        );
        if (tsv) {
          e.preventDefault();
          const lines = tsv.split('\n');
          const cols = lines[0]?.split('\t').length ?? 1;
          writeClipboard(tsv, lines.length, cols);
          return;
        }
      }

      if (selectedIds.length > 0) {
        const selectedRows = table
          .getSelectedRowModel()
          .rows.map((r) => r.original);
        if (selectedRows.length > 0) {
          e.preventDefault();
          const visibleDataCols = getVisibleDataColDefs();
          const tsv = serializeCellsToTsv(selectedRows, visibleDataCols);
          writeClipboard(tsv, selectedRows.length, visibleDataCols.length);
          return;
        }
      }

      const cellEl = target?.closest<HTMLElement>('[role="gridcell"]');
      if (cellEl) {
        const copyVal =
          cellEl.getAttribute('data-copy-value') ??
          cellEl.textContent?.trim() ??
          '';
        if (copyVal) {
          e.preventDefault();
          writeClipboard(copyVal, 1, 1);
        }
      }
    },
    [
      cellRange,
      editingCell,
      editingRow,
      effectiveCellSelection,
      getVisibleDataColDefs,
      handleClearCellRange,
      handleRedo,
      handleUndo,
      isMultiCellRange,
      onClipboardCopy,
      pivotMode,
      processRowUpdate,
      renderRowsForMatrix,
      selectedIds.length,
      table,
      visibleColDefsForMatrix,
    ],
  );

  // Official MUI X Excel-compatible Ctrl+V / Cmd+V multi-cell clipboard paste
  const handleGridClipboardPaste = useCallback(
    async (e: React.ClipboardEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (!processRowUpdate || pivotMode) return;
      const rawText = e.clipboardData?.getData('text/plain') ?? '';
      if (!rawText) return;

      let startRowIdx = -1;
      let startColIdx = -1;
      if (effectiveCellSelection && cellRange) {
        const norm = normalizeCellRange(cellRange);
        startRowIdx = norm.minRow;
        startColIdx = norm.minCol;
      } else {
        const cellEl = target?.closest<HTMLElement>('[role="gridcell"]');
        if (cellEl) {
          startRowIdx = Number(cellEl.getAttribute('data-row-index') ?? -1);
          startColIdx = Number(cellEl.getAttribute('data-col-index') ?? -1);
        }
      }
      if (startRowIdx < 0 || startColIdx < 0) return;

      const matrix = splitClipboardPastedText
        ? splitClipboardPastedText(rawText)
        : parseTsvClipboardMatrix(rawText);
      if (matrix.length === 0) return;

      const { updates, updatedCells } = applyClipboardPasteMatrix(
        renderRowsForMatrix,
        visibleColDefsForMatrix,
        startRowIdx,
        startColIdx,
        matrix,
        canEditRowCell,
        processCellPaste,
      );
      if (updates.length === 0 || updatedCells === 0) return;

      e.preventDefault();
      const appliedChanges: GridEditHistoryChange<R>[] = [];
      for (const item of updates) {
        try {
          const confirmed = await processRowUpdate(item.nextRow, item.oldRow);
          appliedChanges.push({
            oldRow: item.oldRow,
            newRow: confirmed ?? item.nextRow,
          });
        } catch (err) {
          onProcessRowUpdateError?.(err);
        }
      }
      if (appliedChanges.length > 0) {
        recordEditBatch(`粘贴 ${appliedChanges.length} 行`, appliedChanges);
        onClipboardPaste?.({
          updatedRows: appliedChanges.length,
          updatedCells,
        });
      }
    },
    [
      canEditRowCell,
      cellRange,
      effectiveCellSelection,
      onClipboardPaste,
      onProcessRowUpdateError,
      pivotMode,
      processCellPaste,
      processRowUpdate,
      recordEditBatch,
      renderRowsForMatrix,
      splitClipboardPastedText,
      visibleColDefsForMatrix,
    ],
  );

  const handleCommitCellEdit = useCallback(
    async (
      row: R,
      colDef: GridColDef<R>,
      rawNextValue: unknown,
      rowIdx: number,
      colIdx: number,
      totalCols: number,
      nav: EditCommitNavigation,
    ) => {
      setEditingCell(null);

      // Move focus like official MUI X DataGrid (Enter -> down, Tab -> next, Shift+Tab -> prev)
      const moveFocus = () => {
        if (nav === 'down') {
          focusCellAt(Math.min(displayRows.length - 1, rowIdx + 1), colIdx);
        } else if (nav === 'next') {
          focusCellAt(rowIdx, Math.min(totalCols - 1, colIdx + 1));
        } else if (nav === 'prev') {
          focusCellAt(rowIdx, Math.max(0, colIdx - 1));
        } else {
          focusCellAt(rowIdx, colIdx);
        }
      };

      const rowId = resolveRowId(row, rowIdx, effectiveGetRowId);
      const validation = evaluateEditCellValidation(
        rawNextValue,
        row,
        rowId,
        colDef,
      );
      if (!validation.valid) {
        onProcessRowUpdateError?.(
          new Error(validation.errorMessage ?? '输入值无效'),
        );
        requestAnimationFrame(moveFocus);
        return;
      }

      const oldVal = resolveCellValue(row, colDef);
      if (Object.is(oldVal, validation.value)) {
        requestAnimationFrame(moveFocus);
        return;
      }

      const nextRow = applyValueSetter(row, validation.value, colDef);
      if (processRowUpdate) {
        try {
          const confirmed = await processRowUpdate(nextRow, row);
          recordEditBatch(`编辑「${colDef.headerName ?? colDef.field}」`, [
            { oldRow: row, newRow: confirmed ?? nextRow },
          ]);
        } catch (err) {
          onProcessRowUpdateError?.(err);
        }
      }
      requestAnimationFrame(moveFocus);
    },
    [
      displayRows.length,
      effectiveGetRowId,
      focusCellAt,
      onProcessRowUpdateError,
      processRowUpdate,
      recordEditBatch,
    ],
  );

  const startRowEdit = useCallback(
    (
      row: R,
      rowId: GridRowId,
      focusField: string,
      initialTypedValue?: string,
    ) => {
      const drafts: Record<string, unknown> = {};
      for (const colDef of effectiveColumns) {
        if (canEditRowCell(row, colDef)) {
          drafts[colDef.field] =
            colDef.field === focusField && initialTypedValue !== undefined
              ? initialTypedValue
              : resolveCellValue(row, colDef);
        }
      }
      if (Object.keys(drafts).length === 0) return;
      setEditingRow({ rowId, focusField, initialTypedValue, drafts });
    },
    [canEditRowCell, effectiveColumns],
  );

  const commitRowEdit = useCallback(
    async (
      row: R,
      draftsOverride?: Record<string, unknown>,
      rowIdx?: number,
      colIdx?: number,
      nav: EditCommitNavigation = 'stay',
    ) => {
      const activeDrafts = draftsOverride ?? editingRow?.drafts;
      setEditingRow(null);
      if (!activeDrafts) return;

      const rowId = resolveRowId(row, rowIdx ?? 0, effectiveGetRowId);
      const merged = validateAndMergeRowEdits(
        row,
        activeDrafts,
        effectiveColumns,
        rowId,
        canEditRowCell,
      );
      if (!merged.valid) {
        onProcessRowUpdateError?.(new Error(merged.error ?? '输入值无效'));
      } else if (merged.changed && processRowUpdate) {
        try {
          const confirmed = await processRowUpdate(merged.nextRow, row);
          recordEditBatch('整行编辑', [
            { oldRow: row, newRow: confirmed ?? merged.nextRow },
          ]);
        } catch (err) {
          onProcessRowUpdateError?.(err);
        }
      }

      if (rowIdx !== undefined && colIdx !== undefined) {
        requestAnimationFrame(() => {
          if (nav === 'down') {
            focusCellAt(Math.min(displayRows.length - 1, rowIdx + 1), colIdx);
          } else {
            focusCellAt(rowIdx, colIdx);
          }
        });
      }
    },
    [
      canEditRowCell,
      displayRows.length,
      editingRow?.drafts,
      effectiveColumns,
      effectiveGetRowId,
      focusCellAt,
      onProcessRowUpdateError,
      processRowUpdate,
      recordEditBatch,
    ],
  );

  const startRowEditRef = useRef(startRowEdit);
  startRowEditRef.current = startRowEdit;
  const commitRowEditRef = useRef(commitRowEdit);
  commitRowEditRef.current = commitRowEdit;

  // Official MUI X controlled `cellModesModel` bidirectional sync
  const lastCellModesSigRef = useRef<string>('');
  useEffect(() => {
    if (!cellModesModel) return;
    let foundEdit: { rowId: GridRowId; field: string } | null = null;
    for (const [rid, fields] of Object.entries(cellModesModel)) {
      for (const [field, cfg] of Object.entries(fields ?? {})) {
        if (cfg?.mode === GridCellModes.Edit) {
          foundEdit = { rowId: rid, field };
          break;
        }
      }
      if (foundEdit) break;
    }
    setEditingCell((prev) => {
      if (!foundEdit) return prev ? null : prev;
      if (
        prev &&
        String(prev.rowId) === String(foundEdit.rowId) &&
        prev.field === foundEdit.field
      ) {
        return prev;
      }
      return { rowId: foundEdit.rowId, field: foundEdit.field };
    });
  }, [cellModesModel]);

  useEffect(() => {
    const nextModel: GridCellModesModel = editingCell
      ? {
          [editingCell.rowId]: {
            [editingCell.field]: { mode: GridCellModes.Edit },
          },
        }
      : {};
    const sig = JSON.stringify(nextModel);
    if (sig === lastCellModesSigRef.current) return;
    lastCellModesSigRef.current = sig;
    onCellModesModelChange?.(nextModel);
    eventBusRef.current.publish('cellModesModelChange', nextModel);
  }, [editingCell, onCellModesModelChange]);

  // Official MUI X controlled `rowModesModel` bidirectional sync
  const lastRowModesSigRef = useRef<string>('');
  useEffect(() => {
    if (!rowModesModel) return;
    let foundEdit: { rowId: GridRowId; fieldToFocus?: string } | null = null;
    let ignoreOnStop = false;
    for (const [rid, cfg] of Object.entries(rowModesModel)) {
      if (cfg?.mode === GridRowModes.Edit) {
        foundEdit = { rowId: rid, fieldToFocus: cfg.fieldToFocus };
        break;
      }
      if (cfg?.mode === GridRowModes.View && cfg.ignoreModifications) {
        ignoreOnStop = true;
      }
    }
    if (!foundEdit) {
      if (editingRow) {
        if (ignoreOnStop) {
          setEditingRow(null);
        } else {
          const target = displayRows.find(
            (r) => String(r.id) === String(editingRow.rowId),
          );
          if (target) {
            void commitRowEditRef.current(target.original);
          } else {
            setEditingRow(null);
          }
        }
      }
      return;
    }
    if (editingRow && String(editingRow.rowId) === String(foundEdit.rowId)) {
      return;
    }
    const target = displayRows.find(
      (r) => String(r.id) === String(foundEdit!.rowId),
    );
    if (target) {
      const focusField =
        foundEdit.fieldToFocus ??
        effectiveColumns.find((c) => canEditRowCell(target.original, c))
          ?.field ??
        '';
      if (focusField) {
        startRowEditRef.current(target.original, foundEdit.rowId, focusField);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowModesModel]);

  useEffect(() => {
    const nextModel: GridRowModesModel = editingRow
      ? {
          [editingRow.rowId]: {
            mode: GridRowModes.Edit,
            fieldToFocus: editingRow.focusField,
          },
        }
      : {};
    const sig = JSON.stringify(nextModel);
    if (sig === lastRowModesSigRef.current) return;
    lastRowModesSigRef.current = sig;
    onRowModesModelChange?.(nextModel);
    eventBusRef.current.publish('rowModesModelChange', nextModel);
  }, [editingRow, onRowModesModelChange]);

  const handleRowReorderDrop = useCallback(
    (
      targetRowId: GridRowId,
      position: 'before' | 'after',
      fallbackDraggedId?: string,
    ) => {
      const activeDragged =
        draggedRowIdRef.current ??
        draggedRowId ??
        (fallbackDraggedId ? fallbackDraggedId : null);
      draggedRowIdRef.current = null;
      setDraggedRowId(null);
      setRowDropTarget(null);

      if (
        activeDragged === null ||
        String(activeDragged) === String(targetRowId) ||
        isSortedOrFiltered ||
        !onRowOrderChange
      ) {
        return;
      }

      const oldIndex = rows.findIndex(
        (r, i) => String(resolveRowId(r, i, getRowId)) === String(activeDragged),
      );
      const rawTargetIndex = rows.findIndex(
        (r, i) => String(resolveRowId(r, i, getRowId)) === String(targetRowId),
      );

      if (oldIndex !== -1 && rawTargetIndex !== -1) {
        let targetIndex =
          position === 'after' ? rawTargetIndex + 1 : rawTargetIndex;
        if (oldIndex < targetIndex) {
          targetIndex -= 1;
        }
        targetIndex = Math.max(0, Math.min(rows.length - 1, targetIndex));
        if (oldIndex !== targetIndex) {
          onRowOrderChange({
            row: rows[oldIndex],
            oldIndex,
            targetIndex,
          });
        }
      }
    },
    [draggedRowId, getRowId, isSortedOrFiltered, onRowOrderChange, rows],
  );

  const handleLiveColumnDragEnter = useCallback(
    (targetField: string) => {
      if (!draggedField || draggedField === targetField) return;
      const now = Date.now();
      if (
        lastSwapRef.current.target === targetField &&
        now - lastSwapRef.current.ts < 90
      ) {
        return;
      }
      lastSwapRef.current = { target: targetField, ts: now };
      swapColumns(draggedField, targetField);
    },
    [draggedField, swapColumns],
  );

  const activeMenuColumn = columnMenuState.field
    ? table.getColumn(columnMenuState.field) ?? null
    : null;

  const hiddenColumnCount = table
    .getAllLeafColumns()
    .filter(
      (c) =>
        c.id !== GRID_CHECKBOX_SELECTION_FIELD &&
        c.id !== GRID_REORDER_COL_FIELD &&
        c.id !== GRID_DETAIL_PANEL_TOGGLE_FIELD &&
        !isHierarchyColId(c.id) &&
        !c.getIsVisible(),
    ).length;

  return (
    <Paper
      variant="outlined"
      role="grid"
      className="MuiDataGrid-root"
      aria-label={ariaLabel}
      aria-rowcount={filteredRows.length + 1}
      aria-colcount={visibleLeafColumns.length}
      data-testid="datagrid-pro-root"
      data-density={density}
      data-auto-height={autoHeight ? 'true' : 'false'}
      data-col-virtualized={columnWindow.isVirtualized ? 'true' : 'false'}
      data-rendered-col-count={columnWindow.renderedCount}
      data-list-view={effectiveListView ? 'true' : 'false'}
      data-lazy-loading={isViewportLazy ? 'true' : 'false'}
      data-server-tree={isServerTreeMode ? 'true' : 'false'}
      data-sidebar-open={activeSidebarPanel ? 'true' : 'false'}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: autoHeight ? 'auto' : height,
        borderRadius: '4px',
        overflow: 'hidden',
        bgcolor: 'var(--DataGrid-containerBackground, #FFFFFF)',
        borderColor: 'var(--DataGrid-rowBorderColor, #E0E0E0)',
        fontSize: '0.875rem',
        color: 'rgba(0, 0, 0, 0.87)',
      }}
    >
      {/* Slot: Toolbar */}
      {!disableToolbar &&
        (() => {
          const customToolbar = renderGridSlot(
            slots?.toolbar,
            {
              density,
              onDensityChange: setDensity,
              quickFilterText: quickInput,
              onQuickFilterChange: handleQuickFilterInput,
              selectedCount: selectedIds.length,
              onClearSelection: clearSelection,
              activeFilterCount,
              hiddenColumnCount,
              localeText,
            },
            slotProps?.toolbar,
          );
          if (customToolbar !== undefined) return customToolbar;
          return (
            <GridToolbar
              columnsButtonRef={columnsButtonRef}
              filterButtonRef={filterButtonRef}
              onOpenColumns={(el) => setColumnsAnchor(el)}
              onOpenFilters={(el) => setFilterAnchor(el)}
              hiddenColumnCount={hiddenColumnCount}
              activeFilterCount={activeFilterCount}
              density={density}
              onDensityChange={setDensity}
              quickFilterText={quickInput}
              onQuickFilterChange={handleQuickFilterInput}
              showQuickFilter={slotProps?.toolbar?.showQuickFilter ?? true}
              quickFilterPlaceholder={slotProps?.toolbar?.quickFilterPlaceholder}
              onExportCsv={handleExportCsv}
              onExportXlsx={handleExportXlsx}
              onExportJson={handleExportJson}
              onPrint={() => setPrintPreviewOpen(true)}
              selectedCount={selectedIds.length}
              onClearSelection={clearSelection}
              onDeleteSelected={
                onDeleteSelectedRows
                  ? () => {
                      onDeleteSelectedRows(selectedIds);
                      clearSelection();
                    }
                  : undefined
              }
              canUndo={editHistory.past.length > 0}
              canRedo={editHistory.future.length > 0}
              onUndo={
                processRowUpdate && !pivotMode
                  ? () => void handleUndo()
                  : undefined
              }
              onRedo={
                processRowUpdate && !pivotMode
                  ? () => void handleRedo()
                  : undefined
              }
              pivotMode={pivotMode}
              pivotPanelOpen={activeSidebarPanel === 'pivot'}
              onTogglePivotPanel={() => {
                if (activeSidebarPanel === 'pivot') {
                  setActiveSidebarPanel(null);
                } else {
                  setActiveSidebarPanel('pivot');
                  setChartsPanelOpen(false);
                }
              }}
              chartsIntegration={chartsIntegration}
              chartsPanelOpen={chartsPanelOpen}
              onToggleChartsPanel={() => {
                setChartsPanelOpen((prev) => {
                  const next = !prev;
                  if (next) setActiveSidebarPanel(null);
                  return next;
                });
              }}
              sidebarOpen={Boolean(activeSidebarPanel)}
              onToggleSidebar={() => {
                if (activeSidebarPanel) {
                  setActiveSidebarPanel(null);
                } else {
                  setActiveSidebarPanel(pivotMode ? 'pivot' : 'columns');
                  setChartsPanelOpen(false);
                }
              }}
              disableColumnSelector={disableColumnSelector}
              disableColumnFilter={disableColumnFilter}
              disableDensitySelector={disableDensitySelector}
              localeText={localeText}
            />
          );
        })()}

      {/* Official MUI X Row Grouping Dimension Bar (with Column Drop Zone & Single/Multiple Mode) */}
      {!pivotMode && (
        <GridRowGroupingBar
          rowGroupingModel={rowGroupingModel}
          columns={columns}
          isColumnDragging={Boolean(draggedField)}
          hasTreeData={hasTreeData}
          rowGroupingColumnMode={rowGroupingColumnMode}
          onRowGroupingColumnModeChange={setRowGroupingColumnMode}
          onAddGroupField={addRowGroupingColumn}
          onReorderGroupFields={reorderRowGroupingColumn}
          onRemoveGroupField={removeRowGroupingColumn}
          onClearGrouping={clearRowGrouping}
        />
      )}

      {/* Horizontal Body Wrapper: Main Scroll Viewport + Optional Docked Right Pivot Configurator */}
      <Box
        sx={{
          display: 'flex',
          flex: autoHeight ? '0 0 auto' : 1,
          minHeight: 0,
          overflow: autoHeight ? 'visible' : 'hidden',
        }}
      >
      {/* Main Scroll Viewport (Header + Header Filters + Rows + Detail Panels + Overlays) */}
      <Box
        ref={scrollerRef}
        onScroll={handleScrollerScroll}
        onKeyDown={handleGridClipboardCopy}
        onPaste={handleGridClipboardPaste}
        className="datagrid-scroller MuiDataGrid-main"
        sx={{
          position: 'relative',
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflowX: 'auto',
          overflowY: autoHeight ? 'visible' : 'auto',
          bgcolor: '#FFFFFF',
        }}
      >
        {effectiveListView ? (
          effectiveLoading ? (
            <GridLoadingOverlay
              densityMetrics={densityMetrics}
              columnWidths={[Math.max(320, viewportWidth || 640)]}
              localeText={localeText}
            />
          ) : displayRows.length === 0 ? (
            <GridEmptyOverlay
              hasActiveFilter={hasActiveFilter}
              onClearFilters={handleClearAllFilters}
              emptyStateAction={emptyStateAction}
              localeText={localeText}
            />
          ) : (
            <GridListView
              rows={displayRows}
              columns={effectiveColumns}
              listViewColumn={listViewColumn}
              checkboxSelection={effectiveCheckboxSelection}
              disableRowSelectionOnClick={disableRowSelectionOnClick}
              onRowClick={onRowClick}
              onRowDoubleClick={(params) => {
                onRowDoubleClick?.(params);
                eventBusRef.current.publish('rowDoubleClick', params);
              }}
              resolveRowIdForRow={(row, idx) =>
                resolveRowId(row, idx, effectiveGetRowId)
              }
              allSelected={table.getIsAllPageRowsSelected()}
              someSelected={table.getIsSomePageRowsSelected()}
              onToggleAll={() => table.toggleAllPageRowsSelected()}
            />
          )
        ) : (
        <Box
          sx={{
            minWidth: '100%',
            width: Math.max(totalWidth, 100),
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Sticky Column Group Headers + Leaf Column Headers + Optional Header Filter Row */}
          <Box
            role="rowgroup"
            className="MuiDataGrid-columnHeaders"
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 6,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'var(--DataGrid-containerBackground, #FFFFFF)',
            }}
          >
            {columnGroupHeaderRows.map((groupCells, depthIdx) => (
              <GridColumnGroupHeaderRow
                key={`col-group-row-${depthIdx}`}
                cells={groupCells}
                height={columnGroupHeaderHeight}
                pinnedColumnsSectionSeparator={pinnedColumnsSectionSeparator}
                showColumnVerticalBorder={showColumnVerticalBorder}
                isScrolledLeft={scrollState.isScrolledLeft}
                isScrolledRight={scrollState.isScrolledRight}
              />
            ))}

            {headerGroups.map((headerGroup) => {
              const renderHeaderItem = (
                header: (typeof headerGroup.headers)[number],
              ) => (
                <GridColumnHeader
                  key={header.id}
                  header={header}
                  table={table}
                  densityMetrics={densityMetrics}
                  pinnedInfo={pinnedLayout[header.column.id]}
                  pinnedColumnsSectionSeparator={pinnedColumnsSectionSeparator}
                  showColumnVerticalBorder={showColumnVerticalBorder}
                  isScrolledLeft={scrollState.isScrolledLeft}
                  isScrolledRight={scrollState.isScrolledRight}
                  onOpenMenu={handleOpenColumnMenu}
                  isMenuOpenForColumn={
                    columnMenuState.field === header.column.id &&
                    Boolean(columnMenuState.anchorEl)
                  }
                  disableColumnReorder={disableColumnReorder}
                  disableColumnMenu={disableColumnMenu}
                  onToggleSort={toggleColumnSort}
                  onColumnHeaderClick={(field) => {
                    const colDef = (
                      header.column.columnDef.meta as
                        | ColumnMetaExt<R>
                        | undefined
                    )?.colDef;
                    if (colDef) {
                      onColumnHeaderClick?.({ field, colDef });
                      eventBusRef.current.publish('columnHeaderClick', {
                        field,
                        colDef,
                      });
                    }
                  }}
                  isDragging={draggedField === header.column.id}
                  onColumnDragStart={(field) => {
                    lastSwapRef.current = { target: '', ts: 0 };
                    setDraggedField(field);
                  }}
                  onColumnDragEnter={handleLiveColumnDragEnter}
                  onColumnDragEnd={() => {
                    setDraggedField(null);
                    lastSwapRef.current = { target: '', ts: 0 };
                  }}
                  isFirstHierarchyCol={header.column.id === hierarchyFields[0]}
                  isAnyTreeGroupExpanded={expandedTreeGroups.size > 0}
                  disableMultipleRowSelection={disableMultipleRowSelection}
                  onToggleAllTreeGroups={
                    hasHierarchy
                      ? () => {
                          if (expandedTreeGroups.size > 0) {
                            collapseAllTreeGroups();
                          } else {
                            expandAllTreeGroups();
                          }
                        }
                      : undefined
                  }
                />
              );

              return (
                <Box
                  key={headerGroup.id}
                  role="row"
                  sx={{ display: 'flex', width: '100%' }}
                >
                  {columnWindow.isVirtualized ? (
                    <>
                      {columnWindow.leftIndices.map((idx) =>
                        headerGroup.headers[idx]
                          ? renderHeaderItem(headerGroup.headers[idx])
                          : null,
                      )}
                      {columnWindow.leftSpacerWidth > 0 && (
                        <Box
                          aria-hidden="true"
                          data-col-spacer="left"
                          sx={{
                            width: columnWindow.leftSpacerWidth,
                            minWidth: columnWindow.leftSpacerWidth,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {columnWindow.centerIndices.map((idx) =>
                        headerGroup.headers[idx]
                          ? renderHeaderItem(headerGroup.headers[idx])
                          : null,
                      )}
                      {columnWindow.rightSpacerWidth > 0 && (
                        <Box
                          aria-hidden="true"
                          data-col-spacer="right"
                          sx={{
                            width: columnWindow.rightSpacerWidth,
                            minWidth: columnWindow.rightSpacerWidth,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {columnWindow.rightIndices.map((idx) =>
                        headerGroup.headers[idx]
                          ? renderHeaderItem(headerGroup.headers[idx])
                          : null,
                      )}
                    </>
                  ) : (
                    headerGroup.headers.map((header) =>
                      renderHeaderItem(header),
                    )
                  )}
                </Box>
              );
            })}

            {effectiveHeaderFilters && headerGroups[0] && (
              <GridHeaderFilterRow
                headerGroup={headerGroups[0]}
                filterModel={filterModel}
                onHeaderFilterChange={setHeaderFilterValue}
                onHeaderFilterOperatorChange={setHeaderFilterOperator}
                pinnedLayout={pinnedLayout}
                pinnedColumnsSectionSeparator={pinnedColumnsSectionSeparator}
                showColumnVerticalBorder={showColumnVerticalBorder}
                isScrolledLeft={scrollState.isScrolledLeft}
                isScrolledRight={scrollState.isScrolledRight}
                columnWindow={columnWindow}
              />
            )}
          </Box>

          {/* Official MUI X Pro Top Pinned Rows */}
          {effectivePinnedRows?.top && effectivePinnedRows.top.length > 0 && (
            <GridPinnedRowsSection
              position="top"
              rows={effectivePinnedRows.top}
              visibleColumns={visibleLeafColumns}
              getRowId={effectiveGetRowId}
              densityMetrics={densityMetrics}
              stickyTopOffset={stickyHeaderTotalHeight}
              pinnedLayout={pinnedLayout}
              pinnedColumnsSectionSeparator={pinnedColumnsSectionSeparator}
              showCellVerticalBorder={showCellVerticalBorder}
              isScrolledLeft={scrollState.isScrolledLeft}
              isScrolledRight={scrollState.isScrolledRight}
              showVerticalShadow={scrollState.isScrolledTop}
            />
          )}

          {/* Body Rows (Flat or Tree Data, with Automatic Window Virtualization) or Overlay */}
          <Box
            role="rowgroup"
            className="MuiDataGrid-virtualScrollerRenderZone"
            data-virtualized={shouldVirtualize ? 'true' : 'false'}
            data-col-virtualized={columnWindow.isVirtualized ? 'true' : 'false'}
            data-rendered-col-count={columnWindow.renderedCount}
            sx={{ position: 'relative', flex: 1, zIndex: 1 }}
          >
            {/* Non-destructive top LinearProgress when reloading existing rows */}
            {effectiveLoading &&
              totalRenderedRows > 0 &&
              loadingOverlayVariant !== 'skeleton' && (
                <LinearProgress
                  aria-label={localeText.loadingOverlayLabel}
                  data-testid="grid-linear-progress"
                  sx={{
                    position: 'sticky',
                    top: stickyHeaderTotalHeight,
                    left: 0,
                    width: viewportWidth > 0 ? `${viewportWidth}px` : '100%',
                    height: 2.5,
                    zIndex: 7,
                    mb: '-2.5px',
                  }}
                />
              )}

            {effectiveLoading &&
              (totalRenderedRows === 0 ||
                loadingOverlayVariant === 'skeleton') &&
              (renderGridSlot(
                slots?.loadingOverlay,
                { densityMetrics, localeText },
                slotProps?.loadingOverlay,
              ) ?? (
                <GridLoadingOverlay
                  densityMetrics={densityMetrics}
                  columnWidths={visibleLeafColumns.map((c) => c.getSize())}
                  localeText={localeText}
                />
              ))}

            {dsError && !effectiveLoading ? (
              <Box
                role="alert"
                sx={{
                  py: 6,
                  px: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  width: viewportWidth > 0 ? `${viewportWidth}px` : '100%',
                  position: 'sticky',
                  left: 0,
                }}
              >
                <Typography sx={{ fontSize: '0.875rem', color: '#D32F2F' }}>
                  {dsError}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    activeDataSourceCache?.clear();
                    setDsRetryTick((t) => t + 1);
                  }}
                >
                  {localeText.dataSourceErrorRetry}
                </Button>
              </Box>
            ) : !effectiveLoading && totalRenderedRows === 0 ? (
              hasActiveFilter && slots?.noResultsOverlay !== undefined ? (
                renderGridSlot(
                  slots.noResultsOverlay,
                  { onClearFilters: handleClearAllFilters, localeText },
                  slotProps?.noResultsOverlay,
                )
              ) : !hasActiveFilter && slots?.noRowsOverlay !== undefined ? (
                renderGridSlot(
                  slots.noRowsOverlay,
                  { emptyStateAction, localeText },
                  slotProps?.noRowsOverlay,
                )
              ) : (
                <GridEmptyOverlay
                  hasActiveFilter={hasActiveFilter}
                  onClearFilters={handleClearAllFilters}
                  emptyStateAction={emptyStateAction}
                  localeText={localeText}
                />
              )
            ) : (
              <Box
                sx={{
                  opacity:
                    effectiveLoading &&
                    totalRenderedRows > 0 &&
                    loadingOverlayVariant !== 'skeleton'
                      ? 0.58
                      : 1,
                  transition: 'opacity 140ms ease',
                }}
              >
                {virtualWindow.topSpacerHeight > 0 && (
                  <Box
                    aria-hidden="true"
                    data-virtual-spacer="top"
                    sx={{
                      height: `${virtualWindow.topSpacerHeight}px`,
                      flexShrink: 0,
                    }}
                  />
                )}
                {visibleRenderEntries.map((entry, sliceIdx) => {
                  const rowIndex = virtualWindow.startIndex + sliceIdx;

                  if (entry.kind === 'lazy-skeleton') {
                    return (
                      <Box
                        key={`lazy-skel-${entry.absIndex}`}
                        role="row"
                        className="MuiDataGrid-row MuiDataGrid-row--skeleton"
                        data-rowindex={entry.absIndex}
                        data-skeleton-row="true"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          height: densityMetrics.rowHeight,
                          borderBottom:
                            '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
                          bgcolor: '#FFFFFF',
                        }}
                      >
                        {visualLeafColumns.map((col, cIdx) => {
                          const w = col.getSize();
                          return (
                            <Box
                              key={`skel-cell-${entry.absIndex}-${col.id}`}
                              role="gridcell"
                              sx={{
                                width: w,
                                minWidth: w,
                                maxWidth: w,
                                px: 1.25,
                                display: 'flex',
                                alignItems: 'center',
                                boxSizing: 'border-box',
                              }}
                            >
                              <Skeleton
                                variant="rounded"
                                height={14}
                                width={`${52 + ((entry.absIndex * 17 + cIdx * 23) % 34)}%`}
                                sx={{ borderRadius: '3px' }}
                              />
                            </Box>
                          );
                        })}
                      </Box>
                    );
                  }

                  if (entry.kind === 'tree-group') {
                    return (
                      <GridTreeGroupRow
                        key={`tree-grp-${entry.treeNode.id}`}
                        node={entry.treeNode}
                        rowIndex={rowIndex}
                        isExpanded={expandedTreeGroups.has(entry.treeNode.id)}
                        onToggle={toggleTreeGroup}
                        visibleColumns={visibleLeafColumns}
                        aggregationModel={aggregationModel}
                        groupingColDef={groupingColDef}
                        rowGroupingModel={
                          hasRowGrouping ? rowGroupingModel : undefined
                        }
                        rowGroupingColumnMode={rowGroupingColumnMode}
                        densityMetrics={densityMetrics}
                        pinnedLayout={pinnedLayout}
                        pinnedColumnsSectionSeparator={
                          pinnedColumnsSectionSeparator
                        }
                        showCellVerticalBorder={showCellVerticalBorder}
                        isScrolledLeft={scrollState.isScrolledLeft}
                        isScrolledRight={scrollState.isScrolledRight}
                        onFocusCell={focusCellAt}
                        totalRenderedRows={totalRenderedRows}
                      />
                    );
                  }

                  const row = entry.row;
                  const treeLeafNode = entry.treeNode;
                  const isSelected = row.getIsSelected();
                  const canSelectRow = row.getCanSelect();
                  const rowId = resolveRowId(
                    row.original,
                    rowIndex,
                    effectiveGetRowId,
                  );
                  const rowHeightCfg = resolveRowHeightConfig(
                    row.original,
                    rowId,
                    densityMetrics.rowHeight,
                    pivotMode ? undefined : getRowHeight,
                  );
                  const customRowClassName = getRowClassName
                    ? getRowClassName({ id: rowId, row: row.original })
                    : '';
                  const isRowInEditMode =
                    editMode === 'row' && editingRow?.rowId === rowId;
                const isExpanded =
                  Boolean(effectiveDetailPanelContent) &&
                  expandedRowIds.includes(rowId);
                const isRowDragged = draggedRowId === rowId;
                const rowDropPos =
                  rowDropTarget?.rowId === rowId && !isRowDragged
                    ? rowDropTarget.position
                    : null;
                const rowBg = isRowInEditMode
                  ? '#F5F9FF'
                  : isRowDragged
                    ? '#EDF4FC'
                    : isSelected
                      ? '#EDF4FC'
                      : '#FFFFFF';
                const rowHoverBg = isRowInEditMode
                  ? '#F5F9FF'
                  : isSelected
                    ? '#E3EFFB'
                    : '#F5F5F5';
                const visibleCells = row.getVisibleCells();
                const colSpanLayouts = computeColSpanRow(
                  row.original,
                  visibleColDefsForMatrix,
                  visibleCells.map((c) => c.column.getSize()),
                );
                const detailHeight =
                  isExpanded && getDetailPanelHeight
                    ? getDetailPanelHeight({ id: rowId, row: row.original })
                    : 'auto';
                const rowSpacing = getRowSpacing
                  ? getRowSpacing({
                      id: rowId,
                      model: row.original,
                      isFirstVisible: rowIndex === 0,
                      isLastVisible: rowIndex === totalRenderedRows - 1,
                      indexRelativeToCurrentPage: rowIndex,
                    })
                  : undefined;

                const renderBodyCell = (
                  cell: (typeof visibleCells)[number],
                  colIndex: number,
                ) => {
                        const colSpanInfo = colSpanLayouts[colIndex];
                        if (colSpanInfo?.covered) {
                          return null;
                        }
                        const colId = cell.column.id;
                        const rowSpanVal = effectiveRowSpanning
                          ? (rowSpanMatrix.get(`${rowIndex}:${colId}`) ?? 1)
                          : 1;
                        if (rowSpanVal === 0) {
                          const cellWidth =
                            colSpanInfo?.totalWidth ?? cell.column.getSize();
                          return (
                            <Box
                              key={cell.id}
                              role="gridcell"
                              aria-hidden="true"
                              data-field={colId}
                              data-row-index={rowIndex}
                              data-col-index={colIndex}
                              data-row-spanned="true"
                              sx={{
                                width: cellWidth,
                                minWidth: cellWidth,
                                maxWidth: cellWidth,
                                height: '100%',
                                flexShrink: 0,
                                pointerEvents: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          );
                        }
                        const isRowSpanAnchor = rowSpanVal > 1;
                        const cellRenderWidth =
                          colSpanInfo && colSpanInfo.spanCount > 1
                            ? colSpanInfo.totalWidth
                            : cell.column.getSize();
                        const meta = cell.column.columnDef.meta as
                          | ColumnMetaExt<R>
                          | undefined;
                        const colDef = meta?.colDef;
                        const isCheckboxCol =
                          colId === GRID_CHECKBOX_SELECTION_FIELD;
                        const isReorderCol = colId === GRID_REORDER_COL_FIELD;
                        const isDetailToggleCol =
                          colId === GRID_DETAIL_PANEL_TOGGLE_FIELD;
                        const isHierarchyCol = isHierarchyColId(colId);
                        const isUtilityCol =
                          isCheckboxCol || isReorderCol || isDetailToggleCol;
                        const isSelectableDataCell =
                          !isUtilityCol &&
                          !isHierarchyCol &&
                          colDef?.type !== 'actions';
                        const isColumnEditable =
                          Boolean(colDef?.editable) &&
                          !isUtilityCol &&
                          !isHierarchyCol &&
                          colDef?.type !== 'actions';
                        const isEditable =
                          isColumnEditable &&
                          Boolean(colDef && canEditRowCell(row.original, colDef));
                        const isCellEditLocked = isColumnEditable && !isEditable;
                        const isEditing =
                          (editMode === 'cell' &&
                            editingCell?.rowId === rowId &&
                            editingCell?.field === colId) ||
                          (isRowInEditMode && isEditable);
                        const isColumnBeingDragged = draggedField === colId;
                        const rangeEdges =
                          effectiveCellSelection &&
                          isSelectableDataCell &&
                          !isEditing
                            ? getCellRangeEdges(rowIndex, colIndex, cellRange)
                            : null;
                        const isInRangeHighlight =
                          Boolean(rangeEdges) && isMultiCellRange;
                        const isSingleSelectedCell =
                          Boolean(rangeEdges) && !isMultiCellRange;
                        const fillPreviewEdges =
                          effectiveCellSelection &&
                          fillPreviewRange &&
                          isSelectableDataCell
                            ? getCellRangeEdges(
                                rowIndex,
                                colIndex,
                                fillPreviewRange,
                              )
                            : null;
                        const isInFillPreview = Boolean(
                          fillPreviewEdges &&
                            cellRange &&
                            !isCellInRange(rowIndex, colIndex, cellRange),
                        );
                        const isFillHandleCorner = Boolean(
                          effectiveCellSelection &&
                            processRowUpdate &&
                            !isEditing &&
                            isSelectableDataCell &&
                            normalizedCellRange &&
                            rowIndex === normalizedCellRange.maxRow &&
                            colIndex === normalizedCellRange.maxCol,
                        );
                        const rangeBorderShadows: string[] = [];
                        if (isInRangeHighlight && rangeEdges) {
                          if (rangeEdges.top) {
                            rangeBorderShadows.push('inset 0 1px 0 0 #1976D2');
                          }
                          if (rangeEdges.right) {
                            rangeBorderShadows.push('inset -1px 0 0 0 #1976D2');
                          }
                          if (rangeEdges.bottom) {
                            rangeBorderShadows.push('inset 0 -1px 0 0 #1976D2');
                          }
                          if (rangeEdges.left) {
                            rangeBorderShadows.push('inset 1px 0 0 0 #1976D2');
                          }
                        } else if (isSingleSelectedCell) {
                          rangeBorderShadows.push('inset 0 0 0 1.5px #1976D2');
                        }
                        const rangeBoxShadow =
                          rangeBorderShadows.length > 0
                            ? rangeBorderShadows.join(', ')
                            : undefined;

                        const pinnedInfo = pinnedLayout[colId];
                        const isPinned = pinnedInfo && pinnedInfo.side !== false;
                        const isLeftBoundary =
                          pinnedInfo?.side === 'left' && pinnedInfo.isBoundary;
                        const isRightBoundary =
                          pinnedInfo?.side === 'right' && pinnedInfo.isBoundary;
                        const showPinnedBorder =
                          pinnedColumnsSectionSeparator === 'border-and-shadow' ||
                          pinnedColumnsSectionSeparator === 'border';
                        const showPinnedShadow =
                          pinnedColumnsSectionSeparator === 'border-and-shadow' ||
                          pinnedColumnsSectionSeparator === 'shadow';
                        const hasLeftSectionBorder =
                          isLeftBoundary && showPinnedBorder;
                        const hasRightSectionBorder =
                          isRightBoundary && showPinnedBorder;
                        const isPinnedBoundary =
                          isLeftBoundary || isRightBoundary;

                        const align =
                          colDef?.align ?? getDefaultAlignForType(colDef?.type);
                        const isTabular =
                          colDef?.type === 'number' || colDef?.type === 'date';

                        const rawValue = cell.getValue();
                        const formattedValue = colDef
                          ? formatCellValue(rawValue, row.original, colDef)
                          : String(rawValue ?? '');

                        const contentJustify = isUtilityCol
                          ? 'center'
                          : align === 'right'
                            ? 'flex-end'
                            : align === 'center'
                              ? 'center'
                              : 'flex-start';

                        const cellContent = isEditing && colDef ? (
                          <GridEditCell
                            row={row.original}
                            rowId={rowId}
                            value={
                              isRowInEditMode
                                ? editingRow?.drafts[colId] ?? rawValue
                                : rawValue
                            }
                            initialTypedValue={
                              isRowInEditMode
                                ? editingRow?.focusField === colId
                                  ? editingRow.initialTypedValue
                                  : undefined
                                : editingCell?.initialTypedValue
                            }
                            colDef={colDef}
                            fontSize={densityMetrics.fontSize}
                            mode={isRowInEditMode ? 'row' : 'cell'}
                            autoFocus={
                              isRowInEditMode
                                ? editingRow?.focusField === colId
                                : true
                            }
                            onDraftChange={
                              isRowInEditMode
                                ? (nextDraftVal) => {
                                    setEditingRow((prev) =>
                                      prev && prev.rowId === rowId
                                        ? {
                                            ...prev,
                                            drafts: {
                                              ...prev.drafts,
                                              [colId]: nextDraftVal,
                                            },
                                          }
                                        : prev,
                                    );
                                  }
                                : undefined
                            }
                            onCommit={(nextVal, nav) => {
                              if (isRowInEditMode) {
                                const mergedDrafts = {
                                  ...(editingRow?.drafts ?? {}),
                                  [colId]: nextVal,
                                };
                                void commitRowEdit(
                                  row.original,
                                  mergedDrafts,
                                  rowIndex,
                                  colIndex,
                                  nav,
                                );
                              } else {
                                void handleCommitCellEdit(
                                  row.original,
                                  colDef,
                                  nextVal,
                                  rowIndex,
                                  colIndex,
                                  visibleCells.length,
                                  nav,
                                );
                              }
                            }}
                            onCancel={() => {
                              if (isRowInEditMode) {
                                setEditingRow(null);
                              } else {
                                setEditingCell(null);
                              }
                              requestAnimationFrame(() =>
                                focusCellAt(rowIndex, colIndex),
                              );
                            }}
                          />
                        ) : isCheckboxCol ? (
                          <label
                            className={`MuiDataGrid-checkboxWrap${
                              isSelected ? ' MuiDataGrid-checkboxWrap--checked' : ''
                            }${
                              !canSelectRow ? ' MuiDataGrid-checkboxWrap--disabled' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!canSelectRow) return;
                              if (
                                !disableMultipleRowSelection &&
                                e.shiftKey &&
                                lastCheckedRowIdRef.current
                              ) {
                                e.preventDefault();
                                shiftClickHandledRef.current = true;
                                selectRowRange(
                                  orderedVisibleDataRowIds,
                                  lastCheckedRowIdRef.current,
                                  row.id,
                                  !isSelected,
                                );
                                lastCheckedRowIdRef.current = row.id;
                                requestAnimationFrame(() => {
                                  shiftClickHandledRef.current = false;
                                });
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              className="MuiDataGrid-checkboxInput"
                              checked={isSelected}
                              disabled={!canSelectRow}
                              aria-label={
                                canSelectRow
                                  ? `选择行 ${rowId}`
                                  : `行 ${rowId} 已锁定不可选择`
                              }
                              onChange={(e) => {
                                if (!canSelectRow || shiftClickHandledRef.current)
                                  return;
                                row.toggleSelected(e.target.checked);
                                lastCheckedRowIdRef.current = row.id;
                              }}
                            />
                            <svg
                              className="MuiDataGrid-checkboxSvg"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              {isSelected ? (
                                <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              ) : (
                                <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                              )}
                            </svg>
                          </label>
                        ) : isReorderCol ? (
                          <div
                            role="button"
                            className={`MuiDataGrid-dragHandle${
                              isSortedOrFiltered
                                ? ' MuiDataGrid-dragHandle--disabled'
                                : ''
                            }`}
                            title={
                              isSortedOrFiltered
                                ? '排序或筛选生效时暂不支持拖拽排序'
                                : '拖拽调整行顺序'
                            }
                            aria-label={`拖拽调整行 ${rowId} 顺序`}
                            draggable={!isSortedOrFiltered}
                            onClick={(e) => e.stopPropagation()}
                            onDragStart={(e) => {
                              if (isSortedOrFiltered) {
                                e.preventDefault();
                                return;
                              }
                              e.stopPropagation();
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData(
                                'text/plain',
                                String(rowId),
                              );
                              const firstCol = columns[0];
                              const label = firstCol
                                ? `${row.original[firstCol.field] ?? rowId}`
                                : String(rowId);
                              attachRowDragGhost(e, label);
                              draggedRowIdRef.current = rowId;
                              setDraggedRowId(rowId);
                            }}
                            onDragEnd={() => {
                              draggedRowIdRef.current = null;
                              setDraggedRowId(null);
                              setRowDropTarget(null);
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="18"
                              height="18"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </div>
                        ) : isDetailToggleCol ? (
                          <button
                            type="button"
                            className="MuiDataGrid-detailToggleBtn"
                            aria-label={
                              isExpanded
                                ? `收起行 ${rowId} 明细`
                                : `展开行 ${rowId} 明细`
                            }
                            aria-expanded={isExpanded}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDetailPanel(rowId);
                            }}
                          >
                            <svg
                              className="MuiDataGrid-detailToggleIcon"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                            </svg>
                          </button>
                        ) : isHierarchyCol ? (
                          hasRowGrouping &&
                          rowGroupingColumnMode === 'multiple' ? null : (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                pl: `${(treeLeafNode?.depth ?? 0) * 24 + 28}px`,
                                minWidth: 0,
                                width: '100%',
                              }}
                            >
                              <Typography
                                component="span"
                                noWrap
                                className="font-mono-tabular"
                                sx={{
                                  fontSize: `${densityMetrics.fontSize}px`,
                                  color: 'rgba(0, 0, 0, 0.87)',
                                }}
                              >
                                {treeLeafNode?.label ?? String(rowId)}
                              </Typography>
                            </Box>
                          )
                        ) : colDef?.type === 'actions' && colDef.getActions ? (
                          <GridActionsCell
                            rowId={rowId}
                            items={colDef.getActions({
                              id: rowId,
                              row: row.original,
                            })}
                            moreMenuLabel={
                              localeText.toolbarColumns === 'Columns'
                                ? 'More actions'
                                : '更多操作'
                            }
                          />
                        ) : colDef?.renderCell ? (
                          colDef.renderCell({
                            id: rowId,
                            field: colId,
                            value: rawValue,
                            formattedValue,
                            row: row.original,
                            colDef,
                          })
                        ) : colDef?.type === 'boolean' ? (
                          rawValue ? (
                            <CheckIcon
                              aria-label="是"
                              sx={{ fontSize: 18, color: 'rgba(0, 0, 0, 0.6)' }}
                            />
                          ) : (
                            <CloseIcon
                              aria-label="否"
                              sx={{ fontSize: 18, color: 'rgba(0, 0, 0, 0.38)' }}
                            />
                          )
                        ) : (
                          <Typography
                            component="span"
                            noWrap={!rowHeightCfg.isAuto}
                            title={
                              isCellEditLocked
                                ? `${formattedValue}（当前行此字段已锁定，不可编辑）`
                                : isEditable
                                  ? `${formattedValue}（双击或直接键入编辑）`
                                  : formattedValue
                            }
                            className={isTabular ? 'tabular-nums' : undefined}
                            sx={{
                              fontSize: `${densityMetrics.fontSize}px`,
                              color: isCellEditLocked
                                ? 'rgba(0, 0, 0, 0.56)'
                                : 'rgba(0, 0, 0, 0.87)',
                              whiteSpace: rowHeightCfg.isAuto
                                ? 'normal'
                                : undefined,
                              wordBreak: rowHeightCfg.isAuto
                                ? 'break-word'
                                : undefined,
                              lineHeight: rowHeightCfg.isAuto ? 1.45 : undefined,
                              fontVariantNumeric: isTabular
                                ? 'tabular-nums'
                                : undefined,
                            }}
                          >
                            {formattedValue}
                          </Typography>
                        );

                        // Official MUI X Pro Server-Side Tree Data chevron + depth indent on the first data column
                        const serverTreeNode = isServerTreeMode
                          ? serverTreeMetaById.get(String(rowId))
                          : undefined;
                        const isSyntheticServerGroupRow = Boolean(
                          serverTreeNode &&
                            (row.original as Record<string, unknown>)
                              .__isServerTreeGroup,
                        );
                        const renderedCellContent =
                          isSyntheticServerGroupRow &&
                          (colId === GRID_DETAIL_PANEL_TOGGLE_FIELD ||
                            colDef?.type === 'actions') ? null : serverTreeNode &&
                            colId === firstDataColId ? (
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                pl: `${serverTreeNode.depth * 20}px`,
                                minWidth: 0,
                                width: '100%',
                              }}
                            >
                              {serverTreeNode.hasChildren ? (
                                <IconButton
                                  size="small"
                                  aria-label={
                                    serverTreeNode.isExpanded
                                      ? `收起节点 ${serverTreeNode.groupKey}`
                                      : `展开节点 ${serverTreeNode.groupKey}`
                                  }
                                  data-server-tree-toggle={serverTreeNode.pathKey}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleToggleServerTreeNode(serverTreeNode);
                                  }}
                                  sx={{
                                    p: 0.25,
                                    color: '#1976D2',
                                    flexShrink: 0,
                                  }}
                                >
                                  {serverTreeNode.isLoading ? (
                                    <CircularProgress size={14} thickness={5} />
                                  ) : (
                                    <KeyboardArrowRightIcon
                                      sx={{
                                        fontSize: 18,
                                        transform: serverTreeNode.isExpanded
                                          ? 'rotate(90deg)'
                                          : 'rotate(0deg)',
                                        transition: 'transform 140ms ease',
                                      }}
                                    />
                                  )}
                                </IconButton>
                              ) : (
                                <Box sx={{ width: 22, flexShrink: 0 }} />
                              )}
                              <Box
                                sx={{
                                  minWidth: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  fontWeight: serverTreeNode.hasChildren
                                    ? 600
                                    : undefined,
                                }}
                              >
                                {cellContent}
                              </Box>
                            </Box>
                          ) : (
                            cellContent
                          );

                        const customCellClassName =
                          getCellClassName && colDef
                            ? getCellClassName({
                                id: rowId,
                                field: colId,
                                value: rawValue,
                                row: row.original,
                                colDef,
                              })
                            : '';

                        const needsVisibleOverflow =
                          isPinnedBoundary || isFillHandleCorner;

                        const cellStyle: React.CSSProperties = {
                          width: cellRenderWidth,
                          minWidth: cellRenderWidth,
                          maxWidth: cellRenderWidth,
                          height: isRowSpanAnchor
                            ? rowSpanVal * densityMetrics.rowHeight
                            : rowHeightCfg.isAuto
                              ? 'auto'
                              : '100%',
                          paddingTop:
                            rowHeightCfg.isAuto && !isUtilityCol && !isEditing
                              ? 8
                              : 0,
                          paddingBottom:
                            rowHeightCfg.isAuto && !isUtilityCol && !isEditing
                              ? 8
                              : 0,
                          paddingLeft: isUtilityCol ? 0 : densityMetrics.cellPaddingX,
                          paddingRight: isUtilityCol ? 0 : densityMetrics.cellPaddingX,
                          justifyContent: contentJustify,
                          borderRight:
                            isInFillPreview && fillPreviewEdges?.right
                              ? '1.5px dashed #1976D2'
                              : showCellVerticalBorder ||
                                  hasLeftSectionBorder ||
                                  isRowSpanAnchor
                                ? '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)'
                                : 'none',
                          borderLeft:
                            isInFillPreview && fillPreviewEdges?.left
                              ? '1.5px dashed #1976D2'
                              : hasRightSectionBorder || isRowSpanAnchor
                                ? '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)'
                                : 'none',
                          borderTop:
                            isInFillPreview && fillPreviewEdges?.top
                              ? '1.5px dashed #1976D2'
                              : undefined,
                          borderBottom:
                            isInFillPreview && fillPreviewEdges?.bottom
                              ? '1.5px dashed #1976D2'
                              : isRowSpanAnchor
                                ? '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)'
                                : undefined,
                          overflow: needsVisibleOverflow ? 'visible' : 'hidden',
                          userSelect:
                            cellSelection && !isEditing ? 'none' : undefined,
                        };
                        if (isPinned) {
                          cellStyle.position = 'sticky';
                          if (pinnedInfo.side === 'left') {
                            cellStyle.left = pinnedInfo.offset;
                          } else {
                            cellStyle.right = pinnedInfo.offset;
                          }
                          cellStyle.zIndex = isEditing
                            ? 6
                            : isFillHandleCorner
                              ? 7
                              : 5;
                          cellStyle.backgroundColor = isEditing
                            ? '#FFFFFF'
                            : isInRangeHighlight
                              ? '#E3EFFB'
                              : isInFillPreview
                                ? '#EEF5FC'
                                : isColumnBeingDragged
                                  ? '#EDF4FC'
                                  : isRowSpanAnchor
                                    ? '#FFFFFF'
                                    : rowBg;
                        } else if (isRowSpanAnchor) {
                          cellStyle.position = 'relative';
                          cellStyle.zIndex = isEditing ? 3 : 2;
                          cellStyle.backgroundColor = '#FFFFFF';
                          cellStyle.alignSelf = 'flex-start';
                        } else if (isEditing) {
                          cellStyle.position = 'relative';
                          cellStyle.zIndex = 1;
                          cellStyle.backgroundColor = '#FFFFFF';
                        } else if (isInRangeHighlight) {
                          cellStyle.position = 'relative';
                          cellStyle.zIndex = isFillHandleCorner ? 3 : 1;
                          cellStyle.backgroundColor = 'rgba(25, 118, 210, 0.12)';
                        } else if (isInFillPreview) {
                          cellStyle.position = 'relative';
                          cellStyle.zIndex = 1;
                          cellStyle.backgroundColor = 'rgba(25, 118, 210, 0.06)';
                        } else if (isFillHandleCorner) {
                          cellStyle.position = 'relative';
                          cellStyle.zIndex = 3;
                        } else if (isColumnBeingDragged) {
                          cellStyle.backgroundColor = 'rgba(25, 118, 210, 0.04)';
                        }
                        if (!isEditing && rangeBoxShadow) {
                          cellStyle.boxShadow = rangeBoxShadow;
                        }

                        return (
                          <div
                            key={cell.id}
                            role="gridcell"
                            tabIndex={0}
                            data-field={colId}
                            data-row-index={rowIndex}
                            data-col-index={colIndex}
                            data-row-span={isRowSpanAnchor ? rowSpanVal : undefined}
                            data-col-span={
                              colSpanInfo && colSpanInfo.spanCount > 1
                                ? colSpanInfo.spanCount
                                : undefined
                            }
                            data-editable={
                              isEditable
                                ? 'true'
                                : isCellEditLocked
                                  ? 'false'
                                  : undefined
                            }
                            data-cell-selected={
                              isInRangeHighlight ? 'true' : undefined
                            }
                            data-cell-fill-preview={
                              isInFillPreview ? 'true' : undefined
                            }
                            data-copy-value={
                              isHierarchyCol
                                ? treeLeafNode?.label
                                : !isUtilityCol && colDef?.type !== 'actions'
                                  ? formattedValue
                                  : undefined
                            }
                            className={[
                              'MuiDataGrid-cell',
                              isPinned ? 'MuiDataGrid-cell--pinned' : '',
                              pinnedInfo?.side === 'left'
                                ? 'MuiDataGrid-cell--pinnedLeft'
                                : pinnedInfo?.side === 'right'
                                  ? 'MuiDataGrid-cell--pinnedRight'
                                  : '',
                              isEditing ? 'MuiDataGrid-cell--editing' : '',
                              isEditing && !isRowInEditMode
                                ? 'MuiDataGrid-cell--editing-cell'
                                : '',
                              isEditing && isRowInEditMode
                                ? 'MuiDataGrid-cell--editing-row'
                                : '',
                              isCellEditLocked
                                ? 'MuiDataGrid-cell--locked'
                                : '',
                              isInRangeHighlight
                                ? 'MuiDataGrid-cell--rangeSelected'
                                : '',
                              isInFillPreview
                                ? 'MuiDataGrid-cell--fillPreview'
                                : '',
                              customCellClassName,
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            style={cellStyle}
                            onContextMenu={(e) => {
                              if (!isSelectableDataCell || !colDef || isEditing) {
                                return;
                              }
                              e.preventDefault();
                              e.stopPropagation();
                              if (
                                effectiveCellSelection &&
                                (!cellRange ||
                                  !isCellInRange(rowIndex, colIndex, cellRange))
                              ) {
                                setCellRange({
                                  start: { rowIndex, colIndex },
                                  end: { rowIndex, colIndex },
                                });
                              }
                              setCellContextMenu({
                                mouseX: e.clientX + 2,
                                mouseY: e.clientY - 4,
                                field: colId,
                                headerName: colDef.headerName ?? colId,
                                rawValue,
                                formattedValue,
                                canFilter:
                                  !pivotMode && colDef.filterable !== false,
                                canGroup:
                                  !pivotMode &&
                                  !hasTreeData &&
                                  colDef.groupable !== false,
                                isGrouped: rowGroupingModel.includes(colId),
                                canPin: !pivotMode && colDef.pinnable !== false,
                                pinnedSide: pinnedInfo?.side ?? false,
                              });
                            }}
                            onMouseDown={(e) => {
                              if (
                                !effectiveCellSelection ||
                                isEditing ||
                                e.button !== 0 ||
                                !isSelectableDataCell
                              ) {
                                return;
                              }
                              if (e.shiftKey && cellRange) {
                                e.preventDefault();
                                setCellRange({
                                  start: cellRange.start,
                                  end: { rowIndex, colIndex },
                                });
                                focusCellAt(rowIndex, colIndex);
                              } else {
                                isDraggingSelectionRef.current = true;
                                setCellRange({
                                  start: { rowIndex, colIndex },
                                  end: { rowIndex, colIndex },
                                });
                              }
                            }}
                            onMouseEnter={() => {
                              if (!cellSelection || !isSelectableDataCell) {
                                return;
                              }
                              if (
                                isFillDraggingRef.current &&
                                fillSourceRangeRef.current
                              ) {
                                const src = normalizeCellRange(
                                  fillSourceRangeRef.current,
                                );
                                const verticalDist = Math.max(
                                  Math.max(0, rowIndex - src.maxRow),
                                  Math.max(0, src.minRow - rowIndex),
                                );
                                const horizontalDist = Math.max(
                                  Math.max(0, colIndex - src.maxCol),
                                  Math.max(0, src.minCol - colIndex),
                                );
                                let nextTarget: GridCellRange;
                                if (verticalDist === 0 && horizontalDist === 0) {
                                  nextTarget = fillSourceRangeRef.current;
                                } else if (verticalDist >= horizontalDist) {
                                  nextTarget = {
                                    start: {
                                      rowIndex: Math.min(src.minRow, rowIndex),
                                      colIndex: src.minCol,
                                    },
                                    end: {
                                      rowIndex: Math.max(src.maxRow, rowIndex),
                                      colIndex: src.maxCol,
                                    },
                                  };
                                } else {
                                  nextTarget = {
                                    start: {
                                      rowIndex: src.minRow,
                                      colIndex: Math.min(src.minCol, colIndex),
                                    },
                                    end: {
                                      rowIndex: src.maxRow,
                                      colIndex: Math.max(src.maxCol, colIndex),
                                    },
                                  };
                                }
                                fillPreviewRangeRef.current = nextTarget;
                                setFillPreviewRange(nextTarget);
                                return;
                              }
                              if (!isDraggingSelectionRef.current) {
                                return;
                              }
                              setCellRange((prev) =>
                                prev
                                  ? {
                                      start: prev.start,
                                      end: { rowIndex, colIndex },
                                    }
                                  : {
                                      start: { rowIndex, colIndex },
                                      end: { rowIndex, colIndex },
                                    },
                              );
                            }}
                            onClick={() => {
                              if (colDef && !pivotMode) {
                                const params = {
                                  id: rowId,
                                  field: colId,
                                  value: rawValue,
                                  row: row.original,
                                  colDef,
                                };
                                onCellClick?.(params);
                                eventBusRef.current.publish('cellClick', params);
                              }
                            }}
                            onDoubleClick={(e) => {
                              if (colDef && !pivotMode) {
                                const params = {
                                  id: rowId,
                                  field: colId,
                                  value: rawValue,
                                  row: row.original,
                                  colDef,
                                };
                                onCellDoubleClick?.(params);
                                eventBusRef.current.publish(
                                  'cellDoubleClick',
                                  params,
                                );
                              }
                              if (!isEditable) return;
                              e.stopPropagation();
                              isDraggingSelectionRef.current = false;
                              setCellRange(null);
                              if (editMode === 'row') {
                                startRowEdit(row.original, rowId, colId);
                              } else {
                                setEditingCell({ rowId, field: colId });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (isEditing) return;
                              const moveOrExtend = (
                                nextRow: number,
                                nextCol: number,
                              ) => {
                                if (cellSelection && e.shiftKey) {
                                  setCellRange((prev) => ({
                                    start: prev?.start ?? {
                                      rowIndex,
                                      colIndex,
                                    },
                                    end: { rowIndex: nextRow, colIndex: nextCol },
                                  }));
                                } else if (cellSelection) {
                                  setCellRange({
                                    start: { rowIndex: nextRow, colIndex: nextCol },
                                    end: { rowIndex: nextRow, colIndex: nextCol },
                                  });
                                }
                                focusCellAt(nextRow, nextCol);
                              };
                              if (e.key === 'ArrowRight') {
                                e.preventDefault();
                                moveOrExtend(
                                  rowIndex,
                                  Math.min(visibleCells.length - 1, colIndex + 1),
                                );
                              } else if (e.key === 'ArrowLeft') {
                                e.preventDefault();
                                moveOrExtend(rowIndex, Math.max(0, colIndex - 1));
                              } else if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                moveOrExtend(
                                  Math.min(totalRenderedRows - 1, rowIndex + 1),
                                  colIndex,
                                );
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                moveOrExtend(Math.max(0, rowIndex - 1), colIndex);
                              } else if (e.key === 'Home') {
                                e.preventDefault();
                                moveOrExtend(rowIndex, 0);
                              } else if (e.key === 'End') {
                                e.preventDefault();
                                moveOrExtend(rowIndex, visibleCells.length - 1);
                              } else if (
                                (e.key === 'Enter' || e.key === 'F2') &&
                                isEditable
                              ) {
                                e.preventDefault();
                                setCellRange(null);
                                if (editMode === 'row') {
                                  startRowEdit(row.original, rowId, colId);
                                } else {
                                  setEditingCell({ rowId, field: colId });
                                }
                              } else if (
                                (e.key === 'Backspace' || e.key === 'Delete') &&
                                !(cellSelection && cellRange) &&
                                isEditable &&
                                (colDef?.type === undefined ||
                                  colDef?.type === 'string' ||
                                  colDef?.type === 'number')
                              ) {
                                e.preventDefault();
                                setCellRange(null);
                                if (editMode === 'row') {
                                  startRowEdit(row.original, rowId, colId, '');
                                } else {
                                  setEditingCell({
                                    rowId,
                                    field: colId,
                                    initialTypedValue: '',
                                  });
                                }
                              } else if (
                                e.key.length === 1 &&
                                !e.ctrlKey &&
                                !e.metaKey &&
                                !e.altKey &&
                                e.key !== ' ' &&
                                isEditable &&
                                (colDef?.type === undefined ||
                                  colDef?.type === 'string' ||
                                  colDef?.type === 'number')
                              ) {
                                e.preventDefault();
                                setCellRange(null);
                                if (editMode === 'row') {
                                  startRowEdit(row.original, rowId, colId, e.key);
                                } else {
                                  setEditingCell({
                                    rowId,
                                    field: colId,
                                    initialTypedValue: e.key,
                                  });
                                }
                              } else if (e.key === ' ') {
                                if (isCheckboxCol && canSelectRow) {
                                  e.preventDefault();
                                  row.toggleSelected();
                                } else if (isDetailToggleCol) {
                                  e.preventDefault();
                                  toggleDetailPanel(rowId);
                                }
                              }
                            }}
                          >
                            {needsVisibleOverflow ? (
                              <div
                                className="MuiDataGrid-cellInner"
                                style={{ justifyContent: contentJustify }}
                              >
                                {renderedCellContent}
                              </div>
                            ) : (
                              renderedCellContent
                            )}

                            {/* Official MUI X Excel-Style Cell Fill Handle */}
                            {isFillHandleCorner && cellRange && (
                              <Box
                                role="presentation"
                                data-testid="cell-fill-handle"
                                className="MuiDataGrid-cellFillHandle"
                                title="拖拽智能填充数值/序列，双击向下填充至末行"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  isFillDraggingRef.current = true;
                                  fillSourceRangeRef.current = cellRange;
                                  fillPreviewRangeRef.current = cellRange;
                                  setFillPreviewRange(cellRange);
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  isFillDraggingRef.current = false;
                                  setFillPreviewRange(null);
                                  const src = normalizeCellRange(cellRange);
                                  let lastDataRowIdx = src.maxRow;
                                  for (
                                    let r = allRenderEntries.length - 1;
                                    r >= src.maxRow;
                                    r -= 1
                                  ) {
                                    if (allRenderEntries[r]?.kind === 'data') {
                                      lastDataRowIdx = r;
                                      break;
                                    }
                                  }
                                  if (lastDataRowIdx > src.maxRow) {
                                    void commitAutoFill(cellRange, {
                                      start: {
                                        rowIndex: src.minRow,
                                        colIndex: src.minCol,
                                      },
                                      end: {
                                        rowIndex: lastDataRowIdx,
                                        colIndex: src.maxCol,
                                      },
                                    });
                                  }
                                }}
                                sx={{
                                  position: 'absolute',
                                  right: -3,
                                  bottom: -3,
                                  width: 8,
                                  height: 8,
                                  bgcolor: '#1976D2',
                                  border: '1.5px solid #FFFFFF',
                                  boxSizing: 'border-box',
                                  cursor: 'crosshair',
                                  zIndex: 6,
                                  transition: 'transform 100ms ease',
                                  '&:hover': {
                                    transform: 'scale(1.25)',
                                  },
                                }}
                              />
                            )}

                            {/* Official MUI X DataGrid Pro continuous pinned-column scroll shadow */}
                            {isLeftBoundary && showPinnedShadow && (
                              <div
                                aria-hidden="true"
                                className="MuiDataGrid-scrollShadow MuiDataGrid-scrollShadow--left"
                                style={{
                                  left: hasLeftSectionBorder
                                    ? 'calc(100% + 1px)'
                                    : '100%',
                                  opacity: scrollState.isScrolledLeft ? 1 : 0,
                                }}
                              />
                            )}
                            {isRightBoundary && showPinnedShadow && (
                              <div
                                aria-hidden="true"
                                className="MuiDataGrid-scrollShadow MuiDataGrid-scrollShadow--right"
                                style={{
                                  right: hasRightSectionBorder
                                    ? 'calc(100% + 1px)'
                                    : '100%',
                                  opacity: scrollState.isScrolledRight ? 1 : 0,
                                }}
                              />
                            )}
                          </div>
                        );
                };

                return (
                  <React.Fragment key={row.id}>
                    <div
                      role="row"
                      className={[
                        'MuiDataGrid-row',
                        isSelected ? 'Mui-selected' : '',
                        isRowInEditMode ? 'MuiDataGrid-row--editing' : '',
                        isRowDragged ? 'MuiDataGrid-row--dragging' : '',
                        rowHeightCfg.isAuto
                          ? 'MuiDataGrid-row--dynamicHeight'
                          : '',
                        customRowClassName,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-selected={
                        effectiveCheckboxSelection ? isSelected : undefined
                      }
                      data-row-id={rowId}
                      data-rowindex={rowIndex}
                      data-row-height={
                        rowHeightCfg.isAuto
                          ? 'auto'
                          : String(rowHeightCfg.height)
                      }
                      data-row-selectable={canSelectRow ? 'true' : 'false'}
                      data-row-editing={isRowInEditMode ? 'true' : undefined}
                      onDragOver={(e) => {
                        if (
                          !effectiveRowReordering ||
                          (draggedRowIdRef.current === null &&
                            draggedRowId === null) ||
                          isSortedOrFiltered
                        ) {
                          return;
                        }
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos: 'before' | 'after' =
                          e.clientY >= rect.top + rect.height / 2
                            ? 'after'
                            : 'before';
                        setRowDropTarget((prev) =>
                          prev?.rowId === rowId && prev.position === pos
                            ? prev
                            : { rowId, position: pos },
                        );
                      }}
                      onDrop={(e) => {
                        if (
                          !effectiveRowReordering ||
                          (draggedRowIdRef.current === null &&
                            draggedRowId === null) ||
                          isSortedOrFiltered
                        ) {
                          return;
                        }
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos: 'before' | 'after' =
                          e.clientY >= rect.top + rect.height / 2
                            ? 'after'
                            : 'before';
                        handleRowReorderDrop(
                          rowId,
                          pos,
                          e.dataTransfer.getData('text/plain'),
                        );
                      }}
                      onClick={() => {
                        // Official MUI X editMode="row": clicking another row commits the active editing row
                        if (
                          editMode === 'row' &&
                          editingRow &&
                          editingRow.rowId !== rowId
                        ) {
                          const prevEditingRowObj = displayRows.find(
                            (r, idx) =>
                              resolveRowId(
                                r.original,
                                idx,
                                effectiveGetRowId,
                              ) === editingRow.rowId,
                          );
                          if (prevEditingRowObj) {
                            void commitRowEdit(prevEditingRowObj.original);
                          } else {
                            setEditingRow(null);
                          }
                        }
                        if (
                          effectiveCheckboxSelection &&
                          !disableRowSelectionOnClick &&
                          canSelectRow
                        ) {
                          row.toggleSelected();
                        }
                        if (!pivotMode) {
                          onRowClick?.(row.original, rowId);
                        }
                      }}
                      onDoubleClick={() => {
                        if (!pivotMode) {
                          const params = { id: rowId, row: row.original };
                          onRowDoubleClick?.(params);
                          eventBusRef.current.publish('rowDoubleClick', params);
                        }
                      }}
                      style={
                        {
                          alignItems: rowHeightCfg.isAuto ? 'stretch' : undefined,
                          height: rowHeightCfg.isAuto
                            ? 'auto'
                            : rowHeightCfg.height,
                          minHeight: rowHeightCfg.minHeight,
                          marginTop: rowSpacing?.top ? rowSpacing.top : undefined,
                          marginBottom: rowSpacing?.bottom
                            ? rowSpacing.bottom
                            : undefined,
                          backgroundColor: rowBg,
                          boxShadow:
                            rowDropPos === 'before'
                              ? 'inset 0 2px 0 0 #1976D2'
                              : rowDropPos === 'after'
                                ? 'inset 0 -2px 0 0 #1976D2'
                                : isRowInEditMode
                                  ? 'inset 0 1px 0 0 rgba(25, 118, 210, 0.35), inset 0 -1px 0 0 rgba(25, 118, 210, 0.35)'
                                  : 'none',
                          cursor:
                            (effectiveCheckboxSelection &&
                              !disableRowSelectionOnClick) ||
                            (!pivotMode && onRowClick)
                              ? 'pointer'
                              : 'default',
                          '--row-hover-bg': rowHoverBg,
                        } as React.CSSProperties
                      }
                    >
                      {columnWindow.isVirtualized ? (
                        <>
                          {columnWindow.leftIndices.map((idx) =>
                            visibleCells[idx]
                              ? renderBodyCell(visibleCells[idx], idx)
                              : null,
                          )}
                          {columnWindow.leftSpacerWidth > 0 && (
                            <div
                              aria-hidden="true"
                              data-col-spacer="left"
                              style={{
                                width: columnWindow.leftSpacerWidth,
                                minWidth: columnWindow.leftSpacerWidth,
                                flexShrink: 0,
                              }}
                            />
                          )}
                          {columnWindow.centerIndices.map((idx) =>
                            visibleCells[idx]
                              ? renderBodyCell(visibleCells[idx], idx)
                              : null,
                          )}
                          {columnWindow.rightSpacerWidth > 0 && (
                            <div
                              aria-hidden="true"
                              data-col-spacer="right"
                              style={{
                                width: columnWindow.rightSpacerWidth,
                                minWidth: columnWindow.rightSpacerWidth,
                                flexShrink: 0,
                              }}
                            />
                          )}
                          {columnWindow.rightIndices.map((idx) =>
                            visibleCells[idx]
                              ? renderBodyCell(visibleCells[idx], idx)
                              : null,
                          )}
                        </>
                      ) : (
                        visibleCells.map((cell, colIndex) =>
                          renderBodyCell(cell, colIndex),
                        )
                      )}
                    </div>

                    {/* Official MUI X DataGrid Pro Master-Detail Expanded Panel (lazy-mounted on first expand) */}
                    {effectiveDetailPanelContent &&
                      (isExpanded ||
                        everExpandedDetailIdsRef.current.has(String(rowId))) && (
                        <Collapse
                          in={isExpanded}
                          timeout={180}
                          unmountOnExit={!keepDetailContentMounted}
                        >
                        <Box
                          role="row"
                          className="MuiDataGrid-detailPanel"
                          data-detail-row-id={rowId}
                          sx={{
                            width: '100%',
                            bgcolor: '#FAFAFA',
                            borderBottom:
                              '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
                            boxSizing: 'border-box',
                          }}
                        >
                          <Box
                            role="gridcell"
                            sx={{
                              position: 'sticky',
                              left: 0,
                              width:
                                viewportWidth > 0 ? `${viewportWidth}px` : '100%',
                              height: detailHeight,
                              overflowY:
                                typeof detailHeight === 'number'
                                  ? 'auto'
                                  : undefined,
                              boxSizing: 'border-box',
                            }}
                          >
                            {effectiveDetailPanelContent({
                              id: rowId,
                              row: row.original,
                            })}
                          </Box>
                        </Box>
                      </Collapse>
                    )}
                  </React.Fragment>
                );
              })}
                {virtualWindow.bottomSpacerHeight > 0 && (
                  <Box
                    aria-hidden="true"
                    data-virtual-spacer="bottom"
                    sx={{
                      height: `${virtualWindow.bottomSpacerHeight}px`,
                      flexShrink: 0,
                    }}
                  />
                )}
                {/* Infinite Scroll / Lazy Loading Bottom Spinner Strip */}
                {!effectivePagination &&
                  effectiveLoading &&
                  totalRenderedRows > 0 && (
                    <Box
                      data-testid="grid-lazy-loading-row"
                      sx={{
                        position: 'sticky',
                        left: 0,
                        width:
                          viewportWidth > 0 ? `${viewportWidth}px` : '100%',
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        borderTop: '1px solid #F1F5F9',
                        bgcolor: '#FAFCFF',
                      }}
                    >
                      <CircularProgress size={16} thickness={4.5} />
                      <Typography
                        sx={{ fontSize: '0.8125rem', color: '#475569' }}
                      >
                        {localeText.lazyLoadingLabel}
                      </Typography>
                    </Box>
                  )}
              </Box>
            )}
          </Box>

          {/* Official MUI X Sticky Bottom Aggregation Footer Row */}
          {hasAggregationRow && (
            <GridAggregationFooterRow
              rows={filteredRows}
              visibleColumns={visibleLeafColumns}
              aggregationModel={aggregationModel}
              densityMetrics={densityMetrics}
              stickyBottomOffset={bottomPinnedHeight}
              pinnedLayout={pinnedLayout}
              pinnedColumnsSectionSeparator={pinnedColumnsSectionSeparator}
              showCellVerticalBorder={showCellVerticalBorder}
              isScrolledLeft={scrollState.isScrolledLeft}
              isScrolledRight={scrollState.isScrolledRight}
              showVerticalShadow={
                scrollState.isScrolledBottom && bottomPinnedHeight === 0
              }
            />
          )}

          {/* Official MUI X Pro Bottom Pinned Rows (e.g. Live Summary Row) */}
          {effectivePinnedRows?.bottom &&
            effectivePinnedRows.bottom.length > 0 && (
              <GridPinnedRowsSection
                position="bottom"
                rows={effectivePinnedRows.bottom}
                visibleColumns={visibleLeafColumns}
                getRowId={effectiveGetRowId}
                densityMetrics={densityMetrics}
                stickyTopOffset={0}
                pinnedLayout={pinnedLayout}
                pinnedColumnsSectionSeparator={pinnedColumnsSectionSeparator}
                showCellVerticalBorder={showCellVerticalBorder}
                isScrolledLeft={scrollState.isScrolledLeft}
                isScrolledRight={scrollState.isScrolledRight}
                showVerticalShadow={scrollState.isScrolledBottom}
              />
            )}
        </Box>
        )}
      </Box>

      {/* Official MUI X Premium Unified Right-Docked Sidebar (Columns / Filters / Pivot) */}
      {activeSidebarPanel && (
        <GridSidebar
          activePanel={activeSidebarPanel}
          onPanelChange={(next) => {
            setActiveSidebarPanel(next);
            setChartsPanelOpen(false);
          }}
          onClose={() => setActiveSidebarPanel(null)}
          columns={columns}
          columnVisibilityModel={columnVisibility}
          onToggleColumnVisibility={(field) =>
            setColumnVisibilityField(field, columnVisibility[field] === false)
          }
          onShowAllColumns={showAllColumns}
          onResetColumns={() => {
            showAllColumns();
            resetColumnWidths();
          }}
          pinnedColumns={{
            left: Object.entries(pinnedLayout)
              .filter(([, info]) => info.side === 'left')
              .map(([f]) => f),
            right: Object.entries(pinnedLayout)
              .filter(([, info]) => info.side === 'right')
              .map(([f]) => f),
          }}
          onPinColumn={pinColumn}
          disableColumnPinning={disableColumnPinning}
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          pivotMode={pivotMode}
          onPivotModeChange={onPivotModeChange}
          pivotModel={effectivePivotModel}
          onPivotModelChange={handlePivotModelChange}
          localeText={localeText}
        />
      )}

      {/* Official MUI X Premium Right-Docked Charts Integration Sidebar */}
      {chartsIntegration && chartsPanelOpen && (
        <GridChartsPanel
          rows={chartRows}
          columns={columns}
          chartModel={chartModel}
          onChartModelChange={setChartModel}
          activeCrossFilterValue={
            activeChartCrossFilter ? String(activeChartCrossFilter.value) : null
          }
          onCrossFilterSelect={
            pivotMode
              ? undefined
              : (field, rawKey) => {
                  const targetCol = columns.find((c) => c.field === field);
                  setFilterModel((prev) =>
                    upsertExactValueFilter(prev, field, rawKey, targetCol),
                  );
                }
          }
          onClearCrossFilter={
            pivotMode
              ? undefined
              : (field) => {
                  setFilterModel((prev) => ({
                    ...prev,
                    items: prev.items.filter((i) => i.field !== field),
                  }));
                }
          }
          onClose={() => setChartsPanelOpen(false)}
        />
      )}
      </Box>

      {/* Footer & Pagination (with official slots.footer / slots.pagination & hideFooter support) */}
      {!hideFooter &&
        (() => {
          const footerTotalFilteredRows =
            effectivePaginationMode === 'server' &&
            typeof effectiveRowCount === 'number'
              ? effectiveRowCount
              : filteredRows.length;
          const footerTotalRows =
            typeof effectiveRowCount === 'number'
              ? effectiveRowCount
              : pivotMode && pivotResult
                ? pivotResult.rows.length
                : effectiveSourceRows.length;
          const footerPaginationEnabled =
            effectivePagination && !hideFooterPagination && !hasHierarchy;
          const footerBaseProps = {
            totalFilteredRows: footerTotalFilteredRows,
            totalRows: footerTotalRows,
            loadedRowCount: effectiveSourceRows.length,
            serverMode:
              effectivePaginationMode === 'server' ||
              effectiveSortingMode === 'server' ||
              effectiveFilterMode === 'server',
            selectedCount: selectedIds.length,
            paginationEnabled: footerPaginationEnabled,
            hideSelectedRowCount: hideFooterSelectedRowCount,
            page: table.state.pagination.pageIndex,
            pageSize: table.state.pagination.pageSize,
            pageSizeOptions,
            onPageChange: (nextPage: number) => table.setPageIndex(nextPage),
            onPageSizeChange: (nextSize: number) => table.setPageSize(nextSize),
            treeVisibleRowCount:
              hasHierarchy && treeFlatRows ? treeFlatRows.length : null,
            hierarchyMode: hasTreeData
              ? ('tree' as const)
              : hasRowGrouping
                ? ('rowGrouping' as const)
                : null,
            cellRangeStats,
            localeText,
            paginationSlot: slots?.pagination,
            paginationSlotProps: slotProps?.pagination,
          };
          const customFooter = renderGridSlot(
            slots?.footer,
            footerBaseProps,
            slotProps?.footer,
          );
          if (customFooter !== undefined) return customFooter;
          return <GridFooter {...footerBaseProps} />;
        })()}

      {/* Popover: Column Visibility, Pinning & Drag-Reorder Management */}
      <GridColumnsPanel
        anchorEl={columnsAnchor}
        onClose={() => setColumnsAnchor(null)}
        table={table}
        pinnedLayout={pinnedLayout}
        onPinColumn={pivotMode || disableColumnPinning ? undefined : pinColumn}
        onReorderColumn={
          pivotMode || disableColumnReorder ? undefined : reorderColumn
        }
        onShowAll={showAllColumns}
        onResetWidths={resetColumnWidths}
        onAutosizeAll={autosizeAllColumns}
        localeText={localeText}
      />

      {/* Popover: Multi-Condition Filter Panel (with isAnyOf Multi-Select Support) */}
      <GridFilterPanel
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        columns={effectiveColumns}
        rows={pivotMode && pivotResult ? (pivotResult.rows as unknown as R[]) : rows}
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        localeText={localeText}
      />

      {/* Menu: Per-Column Context Menu */}
      <GridColumnMenu
        anchorEl={columnMenuState.anchorEl}
        column={activeMenuColumn}
        onClose={handleCloseColumnMenu}
        onSort={setColumnSort}
        onFilterByColumn={handleFilterFromMenu}
        onPinColumn={pinColumn}
        onHideColumn={hideColumn}
        onAutosizeColumn={autosizeColumn}
        onOpenManageColumns={() => {
          if (columnsButtonRef.current) {
            setColumnsAnchor(columnsButtonRef.current);
          }
        }}
        aggregationFunction={
          activeMenuColumn ? aggregationModel[activeMenuColumn.id] : undefined
        }
        onAggregationChange={setColumnAggregation}
        canGroupByColumn={!hasTreeData && !pivotMode}
        isGroupedByColumn={
          activeMenuColumn
            ? rowGroupingModel.includes(activeMenuColumn.id)
            : false
        }
        onToggleGroupByColumn={toggleRowGroupingColumn}
        disableColumnFilter={disableColumnFilter}
        disableColumnSelector={disableColumnSelector}
        localeText={localeText}
      />

      {/* Menu: Enterprise Cell Right-Click Context Menu */}
      <GridCellContextMenu
        menuState={cellContextMenu}
        rangeLabel={
          isMultiCellRange && normalizedCellRange
            ? `${normalizedCellRange.maxRow - normalizedCellRange.minRow + 1}×${normalizedCellRange.maxCol - normalizedCellRange.minCol + 1}`
            : undefined
        }
        onClose={() => setCellContextMenu(null)}
        onCopy={() => {
          if (effectiveCellSelection && cellRange && isMultiCellRange) {
            const tsv = serializeCellRangeToTsv(
              renderRowsForMatrix,
              visibleColDefsForMatrix,
              cellRange,
            );
            if (tsv) {
              if (
                typeof navigator !== 'undefined' &&
                navigator.clipboard?.writeText
              ) {
                void navigator.clipboard.writeText(tsv).catch(() => {});
              }
              const lines = tsv.split('\n');
              const cols = lines[0]?.split('\t').length ?? 1;
              onClipboardCopy?.({ rowCount: lines.length, colCount: cols });
              return;
            }
          }
          if (cellContextMenu?.formattedValue) {
            if (
              typeof navigator !== 'undefined' &&
              navigator.clipboard?.writeText
            ) {
              void navigator.clipboard
                .writeText(cellContextMenu.formattedValue)
                .catch(() => {});
            }
            onClipboardCopy?.({ rowCount: 1, colCount: 1 });
          }
        }}
        onFilterByValue={(field, rawVal) => {
          const targetCol = columns.find((c) => c.field === field);
          setFilterModel((prev) =>
            upsertExactValueFilter(prev, field, rawVal, targetCol),
          );
        }}
        onToggleGroupBy={toggleRowGroupingColumn}
        onPinColumn={pinColumn}
        onOpenChartForColumn={
          chartsIntegration
            ? (field) => {
                const { valueColumns } = getChartEligibleFields(columns);
                const targetCol = columns.find((c) => c.field === field);
                if (targetCol?.type === 'number') {
                  setChartModel((prev) => ({
                    ...prev,
                    valueField: field,
                    aggFunc: 'sum',
                  }));
                } else {
                  setChartModel((prev) => ({
                    ...prev,
                    dimensionField: field,
                    valueField:
                      prev.valueField ||
                      valueColumns[0]?.field ||
                      columns[0]?.field ||
                      '',
                  }));
                }
                setActiveSidebarPanel(null);
                setChartsPanelOpen(true);
              }
            : undefined
        }
        onExportXlsx={() => handleExportXlsx(false)}
      />

      {/* Dialog: Official MUI X Print Preview & Export */}
      <GridPrintPreviewDialog
        open={printPreviewOpen}
        onClose={() => setPrintPreviewOpen(false)}
        title={ariaLabel}
        rows={
          printPreviewOpen
            ? table.getPrePaginatedRowModel().rows.map((r) => r.original)
            : []
        }
        selectedRows={
          printPreviewOpen
            ? table.getSelectedRowModel().rows.map((r) => r.original)
            : []
        }
        columns={getVisibleDataColDefs()}
        aggregationModel={aggregationModel}
      />
    </Paper>
  );
}
