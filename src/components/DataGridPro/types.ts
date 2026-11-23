import type {
  ComponentType,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
  RefObject,
} from 'react';
import type { GridLocaleTextInput } from './core/localeText';

export type GridRowId = string | number;

export type GridValidRowModel = Record<string, unknown>;

export type GridColType =
  | 'string'
  | 'number'
  | 'date'
  | 'dateTime'
  | 'boolean'
  | 'singleSelect'
  | 'actions';

export type GridAlignment = 'left' | 'right' | 'center';

export type GridDensity = 'compact' | 'standard' | 'comfortable';

export type GridEditMode = 'cell' | 'row';

export const GridCellModes = {
  Edit: 'edit',
  View: 'view',
} as const;

export const GridRowModes = {
  Edit: 'edit',
  View: 'view',
} as const;

export type GridCellMode = (typeof GridCellModes)[keyof typeof GridCellModes];
export type GridRowMode = (typeof GridRowModes)[keyof typeof GridRowModes];

export interface GridCellModesModelProps {
  mode: GridCellMode;
  ignoreModifications?: boolean;
}

export type GridCellModesModel = Record<
  GridRowId,
  Record<string, GridCellModesModelProps>
>;

export interface GridRowModesModelProps {
  mode: GridRowMode;
  fieldToFocus?: string;
  ignoreModifications?: boolean;
}

export type GridRowModesModel = Record<GridRowId, GridRowModesModelProps>;

export type GridAggregationFunctionName =
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'size';

export type GridAggregationModel = Record<string, GridAggregationFunctionName>;

export interface GridGroupingColDef {
  headerName?: string;
  width?: number;
  hideDescendantCount?: boolean;
}

export type GridRowGroupingModel = string[];

export type GridRowGroupingColumnMode = 'single' | 'multiple';

export interface GridCellCoord {
  rowIndex: number;
  colIndex: number;
}

export interface GridCellRange {
  start: GridCellCoord;
  end: GridCellCoord;
}

export interface GridCellRangeStats {
  cellCount: number;
  numericCount: number;
  sum: number | null;
  avg: number | null;
}

export interface GridPersistedState {
  sorting?: GridSortModel;
  filterModel?: GridFilterModel;
  columnVisibilityModel?: GridColumnVisibilityModel;
  columnOrder?: string[];
  pinnedColumns?: GridPinnedColumnFields;
  columnSizing?: Record<string, number>;
  density?: GridDensity;
  rowGroupingModel?: GridRowGroupingModel;
  aggregationModel?: GridAggregationModel;
}

export type GridRowUpdate<R extends GridValidRowModel = GridValidRowModel> =
  Partial<R> & {
    id: GridRowId;
    _action?: 'delete';
  };

export type GridEventName =
  | 'sortModelChange'
  | 'filterModelChange'
  | 'paginationModelChange'
  | 'rowSelectionChange'
  | 'densityChange'
  | 'columnVisibilityModelChange'
  | 'cellEditStart'
  | 'cellEditStop'
  | 'rowsUpdate'
  | 'cellClick'
  | 'cellDoubleClick'
  | 'rowDoubleClick'
  | 'columnHeaderClick'
  | 'columnOrderChange'
  | 'columnWidthChange'
  | 'cellModesModelChange'
  | 'rowModesModelChange'
  | (string & {});

export interface GridApiPro<R extends GridValidRowModel = GridValidRowModel> {
  // State persistence
  exportState: () => GridPersistedState;
  restoreState: (state: GridPersistedState) => void;

  // Rows
  getRow: (id: GridRowId) => R | null;
  getAllRowIds: () => GridRowId[];
  getRowsCount: () => number;
  getSelectedRows: () => R[];
  setRowSelectionModel: (rowSelectionModel: GridRowSelectionModel) => void;
  selectRow: (
    id: GridRowId,
    isSelected?: boolean,
    resetSelection?: boolean,
  ) => void;
  updateRows: (updates: GridRowUpdate<R>[]) => void;

  // Columns
  getColumn: (field: string) => GridColDef<R> | null;
  getAllColumns: () => GridColDef<R>[];
  getVisibleColumns: () => GridColDef<R>[];
  setColumnVisibility: (field: string, isVisible: boolean) => void;
  setColumnVisibilityModel: (model: GridColumnVisibilityModel) => void;
  setColumnWidth: (field: string, width: number) => void;
  pinColumn: (field: string, side: 'left' | 'right' | false) => void;
  autosizeColumns: () => void;

  // Sorting, Filtering, Pagination, Grouping, Aggregation, Density
  setFilterModel: (model: GridFilterModel) => void;
  setSortModel: (model: GridSortModel) => void;
  getSortModel: () => GridSortModel;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setPaginationModel: (model: GridPaginationModel) => void;
  setDensity: (density: GridDensity) => void;
  setRowGroupingModel: (model: GridRowGroupingModel) => void;
  setAggregationModel: (model: GridAggregationModel) => void;

  // Scrolling, Focus & Editing
  scrollToIndexes: (params: { rowIndex?: number; colIndex?: number }) => void;
  setCellFocus: (id: GridRowId, field: string) => void;
  startCellEditMode: (params: { id: GridRowId; field: string }) => void;
  stopCellEditMode: (params: {
    id: GridRowId;
    field: string;
    ignoreModifications?: boolean;
  }) => void;
  startRowEditMode: (params: {
    id: GridRowId;
    fieldToFocus?: string;
  }) => void;
  stopRowEditMode: (params: {
    id: GridRowId;
    ignoreModifications?: boolean;
  }) => void;

  // Events
  subscribeEvent: <P = unknown>(
    event: GridEventName,
    handler: (params: P) => void,
  ) => () => void;
  publishEvent: <P = unknown>(event: GridEventName, params?: P) => void;

  // Server DataSource
  dataSource?: {
    fetchRows: () => void;
    clearCache: () => void;
  };
}

export type GridSortDirection = 'asc' | 'desc';

export interface GridSortItem {
  field: string;
  sort: GridSortDirection;
}

export type GridSortModel = GridSortItem[];

export type GridLogicOperator = 'and' | 'or';

export type GridFilterOperatorValue =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isAnyOf'
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'is'
  | 'not'
  | 'after'
  | 'onOrAfter'
  | 'before'
  | 'onOrBefore'
  | (string & {});

export interface GridFilterInputValueProps {
  item: GridFilterItem;
  applyValue: (value: GridFilterItem) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface GridFilterOperator<
  R extends GridValidRowModel = GridValidRowModel,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  V = any,
> {
  label: string;
  value: string;
  requiresValue?: boolean;
  getApplyFilterFn: (
    filterItem: GridFilterItem,
    column: GridColDef<R, V>,
  ) => ((value: V, row: R, column: GridColDef<R, V>) => boolean) | null;
  InputComponent?: ComponentType<GridFilterInputValueProps>;
  InputComponentProps?: Record<string, unknown>;
}

export interface GridFilterOperatorOption<
  R extends GridValidRowModel = GridValidRowModel,
> {
  value: GridFilterOperatorValue;
  label: string;
  requiresValue: boolean;
  customOperator?: GridFilterOperator<R>;
}

export interface GridListViewColDef<
  R extends GridValidRowModel = GridValidRowModel,
> {
  field: string;
  renderCell: (params: GridRenderCellParams<R>) => ReactNode;
}

export interface GridFilterItem {
  id: string;
  field: string;
  operator: GridFilterOperatorValue;
  value?: string | number | boolean | Array<string | number> | null;
}

export interface GridFilterModel {
  items: GridFilterItem[];
  logicOperator?: GridLogicOperator;
  quickFilterValues?: string[];
}

export interface GridPinnedColumnFields {
  left?: string[];
  right?: string[];
}

export type GridPinnedColumnsSectionSeparator =
  | 'border-and-shadow'
  | 'border'
  | 'shadow';

export type GridColumnVisibilityModel = Record<string, boolean>;

export interface GridPaginationModel {
  page: number;
  pageSize: number;
}

export type GridRowSelectionModel = GridRowId[];

export interface GridValueOption {
  value: string | number;
  label: string;
}

export interface GridRenderCellParams<
  R extends GridValidRowModel = GridValidRowModel,
  V = unknown,
> {
  id: GridRowId;
  field: string;
  value: V;
  formattedValue: string;
  row: R;
  colDef: GridColDef<R, V>;
}

export interface GridRenderHeaderParams<
  R extends GridValidRowModel = GridValidRowModel,
> {
  field: string;
  colDef: GridColDef<R>;
}

export interface GridRowParams<
  R extends GridValidRowModel = GridValidRowModel,
> {
  id: GridRowId;
  row: R;
}

export interface GridCellParams<
  R extends GridValidRowModel = GridValidRowModel,
  V = unknown,
> {
  id: GridRowId;
  field: string;
  value: V;
  row: R;
  colDef: GridColDef<R, V>;
}

export interface GridRowHeightParams<
  R extends GridValidRowModel = GridValidRowModel,
> {
  id: GridRowId;
  model: R;
  densityFactor: number;
}

export type GridRowHeightReturnValue = number | 'auto' | null | undefined;

export interface GridRowSpacing {
  top?: number;
  bottom?: number;
}

export interface GridRowSpacingParams<
  R extends GridValidRowModel = GridValidRowModel,
> {
  id: GridRowId;
  model: R;
  isFirstVisible: boolean;
  isLastVisible: boolean;
  indexRelativeToCurrentPage: number;
}

export interface GridActionsCellItemProps {
  icon?: ReactElement;
  label: string;
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  showInMenu?: boolean;
  disabled?: boolean;
  color?: 'inherit' | 'primary' | 'error';
}

export interface GridColumnHeaderParams<
  R extends GridValidRowModel = GridValidRowModel,
> {
  field: string;
  colDef: GridColDef<R>;
}

export interface GridColumnOrderChangeParams<
  R extends GridValidRowModel = GridValidRowModel,
> {
  column: GridColDef<R>;
  targetIndex: number;
  oldIndex: number;
}

export interface GridColumnResizeParams<
  R extends GridValidRowModel = GridValidRowModel,
> {
  colDef: GridColDef<R>;
  width: number;
}

export interface GridEditCellProps {
  value: unknown;
  error?: boolean | string;
}

export interface GridPreProcessEditCellPropsParams<
  R extends GridValidRowModel = GridValidRowModel,
> {
  id: GridRowId;
  row: R;
  props: GridEditCellProps;
  hasChanged: boolean;
}

export interface GridRenderEditCellParams<
  R extends GridValidRowModel = GridValidRowModel,
  V = unknown,
> {
  id: GridRowId;
  field: string;
  value: V;
  row: R;
  colDef: GridColDef<R, V>;
  error?: boolean | string;
  onChange: (nextValue: unknown) => void;
  onCommit: (nextValue?: unknown) => void;
  onCancel: () => void;
}

export interface GridColDef<
  R extends GridValidRowModel = GridValidRowModel,
  V = unknown,
> {
  field: string;
  headerName?: string;
  description?: string;
  type?: GridColType;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  align?: GridAlignment;
  headerAlign?: GridAlignment;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  hideable?: boolean;
  pinnable?: boolean;
  editable?: boolean;
  disableReorder?: boolean;
  aggregable?: boolean;
  groupable?: boolean;
  rowSpan?: boolean;
  rowSpanValueGetter?: (value: unknown, row: R) => unknown;
  colSpan?: number | ((value: unknown, row: R, column: GridColDef<R, V>) => number);
  valueOptions?: Array<string | GridValueOption>;
  valueGetter?: (value: unknown, row: R) => V;
  valueSetter?: (value: V, row: R) => R;
  valueParser?: (value: unknown, row: R) => V;
  valueFormatter?: (value: V, row: R) => string;
  sortComparator?: (v1: V, v2: V, rowA: R, rowB: R) => number;
  sortingOrder?: Array<GridSortDirection | null>;
  filterOperators?: GridFilterOperator<R, V>[];
  preProcessEditCellProps?: (
    params: GridPreProcessEditCellPropsParams<R>,
  ) => GridEditCellProps;
  getActions?: (params: GridRowParams<R>) => ReactElement<GridActionsCellItemProps>[];
  renderCell?: (params: GridRenderCellParams<R, V>) => ReactNode;
  renderEditCell?: (params: GridRenderEditCellParams<R, V>) => ReactNode;
  renderHeader?: (params: GridRenderHeaderParams<R>) => ReactNode;
}

export interface GridDetailPanelParams<
  R extends GridValidRowModel = GridValidRowModel,
> {
  id: GridRowId;
  row: R;
}

export interface GridColumnGroupLeaf {
  field: string;
}

export interface GridColumnGroup {
  groupId: string;
  headerName?: string;
  description?: string;
  headerAlign?: GridAlignment;
  children: Array<GridColumnGroupLeaf | GridColumnGroup>;
}

export type GridColumnGroupingModel = GridColumnGroup[];

export interface GridPinnedRowsProp<
  R extends GridValidRowModel = GridValidRowModel,
> {
  top?: Array<Partial<R>>;
  bottom?: Array<Partial<R>>;
}

export interface GridRowOrderChangeParams<
  R extends GridValidRowModel = GridValidRowModel,
> {
  row: R;
  oldIndex: number;
  targetIndex: number;
}

export interface GridPivotValueField {
  field: string;
  aggFunc: GridAggregationFunctionName;
}

export interface GridPivotModel {
  rows: string[];
  columns: string[];
  values: GridPivotValueField[];
}

export type GridChartType = 'bar' | 'line' | 'area' | 'pie';

export interface GridChartModel {
  chartType: GridChartType;
  dimensionField: string;
  valueField: string;
  aggFunc: GridAggregationFunctionName;
}

export interface GridEditHistoryChange<
  R extends GridValidRowModel = GridValidRowModel,
> {
  oldRow: R;
  newRow: R;
}

export interface GridEditHistoryBatch<
  R extends GridValidRowModel = GridValidRowModel,
> {
  label: string;
  changes: GridEditHistoryChange<R>[];
}

export type GridFeatureMode = 'client' | 'server';

export type GridLoadingOverlayVariant = 'skeleton' | 'linear-progress';

export interface GridRowScrollEndParams {
  viewportPageSize: number;
  virtualRowsCount: number;
}

export type GridSidebarPanel = 'pivot' | 'columns' | 'filters';

export interface GridGetRowsParams {
  paginationModel?: GridPaginationModel;
  sortModel?: GridSortModel;
  filterModel?: GridFilterModel;
  start?: number;
  end?: number;
  groupKeys?: string[];
  groupFields?: string[];
  aggregationModel?: GridAggregationModel;
}

export interface GridGetRowsResponse<
  R extends GridValidRowModel = GridValidRowModel,
> {
  rows: R[];
  rowCount?: number;
}

export interface GridUpdateRowParams<
  R extends GridValidRowModel = GridValidRowModel,
> {
  newRow: R;
  oldRow: R;
  previousRow: R;
}

export interface GridDataSource<
  R extends GridValidRowModel = GridValidRowModel,
> {
  getRows: (params: GridGetRowsParams) => Promise<GridGetRowsResponse<R>>;
  getGroupKey?: (row: R) => string;
  getChildrenCount?: (row: R) => number;
  updateRow?: (params: GridUpdateRowParams<R>) => Promise<R> | R;
}

export interface GridProcessCellPasteParams<
  R extends GridValidRowModel = GridValidRowModel,
> {
  row: R;
  field: string;
  rawValue: string;
  parsedValue: unknown;
  colDef: GridColDef<R>;
}

export interface GridDataSourceCache<
  R extends GridValidRowModel = GridValidRowModel,
> {
  get: (params: GridGetRowsParams) => GridGetRowsResponse<R> | undefined;
  set: (params: GridGetRowsParams, value: GridGetRowsResponse<R>) => void;
  clear: () => void;
}

export interface GridStateSnapshot {
  sorting: GridSortModel;
  filterModel: GridFilterModel;
  columnVisibilityModel: GridColumnVisibilityModel;
  columnOrder: string[];
  pinnedColumns: GridPinnedColumnFields;
  columnSizing: Record<string, number>;
  paginationModel: GridPaginationModel;
  rowSelectionModel: GridRowSelectionModel;
  detailPanelExpandedRowIds: GridRowId[];
  rowGroupingModel: GridRowGroupingModel;
  aggregationModel: GridAggregationModel;
  pivotMode?: boolean;
  pivotModel?: GridPivotModel;
  density: GridDensity;
  filteredRowCount: number;
  totalRowCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GridSlotComponent<P = any> = ComponentType<P> | ReactNode | null;

export interface GridSlots {
  toolbar?: GridSlotComponent;
  footer?: GridSlotComponent;
  pagination?: GridSlotComponent;
  noRowsOverlay?: GridSlotComponent;
  noResultsOverlay?: GridSlotComponent;
  loadingOverlay?: GridSlotComponent;
}

export interface GridToolbarSlotProps {
  showQuickFilter?: boolean;
  quickFilterPlaceholder?: string;
  csvFileName?: string;
  excelFileName?: string;
  [key: string]: unknown;
}

export interface GridSlotProps {
  toolbar?: GridToolbarSlotProps;
  footer?: Record<string, unknown>;
  pagination?: Record<string, unknown>;
  noRowsOverlay?: Record<string, unknown>;
  noResultsOverlay?: Record<string, unknown>;
  loadingOverlay?: Record<string, unknown>;
}

export interface DataGridProProps<R extends GridValidRowModel = GridValidRowModel> {
  rows: R[];
  columns: GridColDef<R>[];
  getRowId?: (row: R) => GridRowId;
  height?: number | string;
  rowHeight?: number;
  columnHeaderHeight?: number;
  autoHeight?: boolean;
  autoPageSize?: boolean;
  disableVirtualization?: boolean;
  columnBufferPx?: number;
  columnVirtualizeThreshold?: number;
  sortingOrder?: Array<GridSortDirection | null>;
  loading?: boolean;
  loadingOverlayVariant?: GridLoadingOverlayVariant;
  paginationMode?: GridFeatureMode;
  sortingMode?: GridFeatureMode;
  filterMode?: GridFeatureMode;
  rowCount?: number;
  dataSource?: GridDataSource<R>;
  dataSourceCache?: GridDataSourceCache<R> | null;
  onDataSourceError?: (error: unknown) => void;
  lazyLoading?: boolean;
  lazyLoadingChunkSize?: number;
  listView?: boolean;
  listViewColumn?: GridListViewColDef<R>;
  checkboxSelection?: boolean;
  disableRowSelectionOnClick?: boolean;
  disableMultipleRowSelection?: boolean;
  keepNonExistentRowsSelected?: boolean;
  isRowSelectable?: (params: GridRowParams<R>) => boolean;
  isCellEditable?: (params: GridCellParams<R>) => boolean;
  getRowHeight?: (params: GridRowHeightParams<R>) => GridRowHeightReturnValue;
  getRowSpacing?: (params: GridRowSpacingParams<R>) => GridRowSpacing;
  getRowClassName?: (params: GridRowParams<R>) => string;
  getCellClassName?: (params: GridCellParams<R>) => string;
  showCellVerticalBorder?: boolean;
  showColumnVerticalBorder?: boolean;
  pinnedColumnsSectionSeparator?: GridPinnedColumnsSectionSeparator;
  disableColumnReorder?: boolean;
  disableColumnMenu?: boolean;
  disableColumnFilter?: boolean;
  disableColumnSelector?: boolean;
  disableDensitySelector?: boolean;
  disableColumnSorting?: boolean;
  disableColumnResize?: boolean;
  disableColumnPinning?: boolean;
  headerFilters?: boolean;
  columnGroupingModel?: GridColumnGroupingModel;
  columnGroupHeaderHeight?: number;
  pinnedRows?: GridPinnedRowsProp<R>;
  rowReordering?: boolean;
  onRowOrderChange?: (params: GridRowOrderChangeParams<R>) => void;
  editMode?: GridEditMode;
  cellModesModel?: GridCellModesModel;
  onCellModesModelChange?: (model: GridCellModesModel) => void;
  rowModesModel?: GridRowModesModel;
  onRowModesModelChange?: (model: GridRowModesModel) => void;
  apiRef?: RefObject<GridApiPro<R> | null>;
  treeData?: boolean;
  getTreeDataPath?: (row: R) => string[];
  groupingColDef?: GridGroupingColDef;
  defaultGroupingExpansionDepth?: number;
  rowGroupingModel?: GridRowGroupingModel;
  onRowGroupingModelChange?: (model: GridRowGroupingModel) => void;
  rowGroupingColumnMode?: GridRowGroupingColumnMode;
  onRowGroupingColumnModeChange?: (mode: GridRowGroupingColumnMode) => void;
  aggregationModel?: GridAggregationModel;
  onAggregationModelChange?: (model: GridAggregationModel) => void;
  cellSelection?: boolean;
  splitClipboardPastedText?: (text: string) => string[][];
  processCellPaste?: (params: GridProcessCellPasteParams<R>) => unknown;
  onClipboardCopy?: (info: { rowCount: number; colCount: number }) => void;
  onClipboardPaste?: (info: {
    updatedRows: number;
    updatedCells: number;
  }) => void;
  onClipboardClear?: (info: {
    updatedRows: number;
    updatedCells: number;
  }) => void;
  onCellAutoFill?: (info: {
    updatedRows: number;
    updatedCells: number;
  }) => void;
  onUndoRedo?: (info: {
    action: 'undo' | 'redo';
    rowCount: number;
    label: string;
  }) => void;
  onExport?: (info: {
    format: 'xlsx' | 'csv' | 'json';
    rowCount: number;
    selectedOnly: boolean;
  }) => void;
  pivotMode?: boolean;
  onPivotModeChange?: (enabled: boolean) => void;
  pivotModel?: GridPivotModel;
  onPivotModelChange?: (model: GridPivotModel) => void;
  sidebarPanel?: GridSidebarPanel | null;
  onSidebarPanelChange?: (panel: GridSidebarPanel | null) => void;
  defaultSidebarPanel?: GridSidebarPanel | null;
  chartsIntegration?: boolean;
  rowSpanning?: boolean;
  virtualizeThreshold?: number;
  onRowsScrollEnd?: (params: GridRowScrollEndParams) => void;
  scrollEndThreshold?: number;
  getDetailPanelContent?: (params: GridDetailPanelParams<R>) => ReactNode;
  getDetailPanelHeight?: (params: GridDetailPanelParams<R>) => number | 'auto';
  detailPanelExpandedRowIds?: GridRowId[];
  onDetailPanelExpandedRowIdsChange?: (ids: GridRowId[]) => void;
  keepDetailContentMounted?: boolean;
  processRowUpdate?: (newRow: R, oldRow: R) => R | Promise<R>;
  onProcessRowUpdateError?: (error: unknown) => void;
  pagination?: boolean;
  pageSizeOptions?: number[];
  initialState?: {
    pagination?: { paginationModel?: Partial<GridPaginationModel> };
    sorting?: { sortModel?: GridSortModel };
    filter?: { filterModel?: GridFilterModel };
    columns?: {
      columnVisibilityModel?: GridColumnVisibilityModel;
      orderedFields?: string[];
    };
    pinnedColumns?: GridPinnedColumnFields;
    detailPanel?: { expandedRowIds?: GridRowId[] };
    density?: GridDensity;
  };
  sortModel?: GridSortModel;
  onSortModelChange?: (model: GridSortModel) => void;
  filterModel?: GridFilterModel;
  onFilterModelChange?: (model: GridFilterModel) => void;
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  columnVisibilityModel?: GridColumnVisibilityModel;
  onColumnVisibilityModelChange?: (model: GridColumnVisibilityModel) => void;
  pinnedColumns?: GridPinnedColumnFields;
  onPinnedColumnsChange?: (model: GridPinnedColumnFields) => void;
  density?: GridDensity;
  onDensityChange?: (density: GridDensity) => void;
  rowSelectionModel?: GridRowSelectionModel;
  onRowSelectionModelChange?: (selection: GridRowSelectionModel) => void;
  onRowClick?: (row: R, id: GridRowId) => void;
  onRowDoubleClick?: (params: GridRowParams<R>) => void;
  onCellClick?: (params: GridCellParams<R>) => void;
  onCellDoubleClick?: (params: GridCellParams<R>) => void;
  onColumnHeaderClick?: (params: GridColumnHeaderParams<R>) => void;
  onColumnOrderChange?: (params: GridColumnOrderChangeParams<R>) => void;
  onColumnWidthChange?: (params: GridColumnResizeParams<R>) => void;
  onStateChange?: (state: GridStateSnapshot) => void;
  onDeleteSelectedRows?: (ids: GridRowId[]) => void;
  onRowsUpdate?: (nextRows: R[]) => void;
  localeText?: GridLocaleTextInput;
  hideFooter?: boolean;
  hideFooterPagination?: boolean;
  hideFooterSelectedRowCount?: boolean;
  slots?: GridSlots;
  slotProps?: GridSlotProps;
  disableToolbar?: boolean;
  emptyStateAction?: {
    label: string;
    onClick: () => void;
  };
  ariaLabel?: string;
}
