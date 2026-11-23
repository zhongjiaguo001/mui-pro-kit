# DataGridPro Component Documentation (AI-Ready Reference)

> **Target Audience**: AI coding assistants, LLM agents, and frontend engineers integrating or extending `DataGridPro`.
> **Architecture**: MUI X DataGrid Community / Pro / Premium API-aligned enterprise data grid built on React 19 + TypeScript + TanStack Table v8 + Material UI v7 + static zero-Emotion hot-path CSS.

---

## 1. Module Entry & Dependencies

### Import Path
```ts
import {
  DataGridPro,
  GridActionsCellItem,
  useGridApiRef,
  GridCellModes,
  GridRowModes,
  GRID_ZH_CN_LOCALE_TEXT,
  GRID_EN_US_LOCALE_TEXT,
  createDataSourceCache,
  type DataGridProProps,
  type GridColDef,
  type GridApiPro,
  type GridDataSource,
} from './components/DataGridPro';
```

### Required Stylesheet
The component relies on `.MuiDataGrid-*` static CSS rules and `--DataGrid-*` CSS custom properties defined in `src/index.css` (imported at application entry). Do not remove `.MuiDataGrid-row`, `.MuiDataGrid-cell`, `.MuiDataGrid-checkboxWrap`, `.MuiDataGrid-detailToggleBtn`, or `.MuiDataGrid-actionBtn` rules.

### Peer Dependencies
- `react` >= 18 / 19
- `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`
- `@tanstack/react-table`

---

## 2. Critical Rules & Invariants for AI Code Generation

Follow these rules strictly when generating code that consumes `DataGridPro`:

1. **Stable Row Identity (REQUIRED)**: Every item in `rows` must have a unique `id: string | number` property, OR you MUST pass `getRowId={(row) => row.customKey}`.
2. **Memoize `columns` & Callbacks**: Always wrap `columns`, `getActions`, `renderCell`, `processRowUpdate`, and `dataSource` in `useMemo` / `useCallback` to avoid unnecessary TanStack Table rebuilds.
3. **Editing Prerequisite**: Setting `editable: true` on a column is NOT enough to persist edits. You MUST pass `processRowUpdate={(newRow, oldRow) => ...}` (or `dataSource.updateRow`) to commit edits, clipboard paste, cell autofill, `Delete` range clear, and Undo/Redo.
4. **Controlled vs Uncontrolled Models**: All state models (`sortModel`, `filterModel`, `paginationModel`, `columnVisibilityModel`, `pinnedColumns`, `density`, `rowSelectionModel`, `detailPanelExpandedRowIds`, `rowGroupingModel`, `aggregationModel`, `pivotModel`, `sidebarPanel`, `cellModesModel`, `rowModesModel`) work uncontrolled by default (optionally seeded via `initialState`) or controlled when paired with their `on*Change` callback.
5. **Feature Mode Precedence & Mutual Exclusions**:
   - `pivotMode={true}` automatically transforms displayed rows/columns via `buildPivotTable`, disables `checkboxSelection`, disables inline editing, and opens the right sidebar to the `'pivot'` tab.
   - `treeData={true}` with `getTreeDataPath` and `rowGroupingModel.length > 0` are hierarchy modes; avoid enabling both simultaneously unless intentionally switching modes.
   - When `dataSource` is provided, `paginationMode`, `sortingMode`, and `filterMode` automatically default to `'server'`.
   - `lazyLoading={true}` requires `dataSource` and `rowCount` (viewport chunk fetching via `start`/`end` inclusive indices) and automatically activates vertical row virtualization.
   - Server-Side Tree Lazy Loading activates when `dataSource` provides both `getGroupKey` and `getChildrenCount`.
   - `listView={true}` requires `listViewColumn={{ field, renderCell }}` and renders single-column responsive card rows.
   - Horizontal column virtualization (`columnVirtualizeThreshold`, default `20`) auto-disables when `pivotMode`, `columnGroupingModel`, or `colSpan` is active.
6. **High-Performance `renderCell` Rule**: For grids with 100+ rows or virtualization enabled, use plain HTML elements (`<span>`, `<div>`) with inline `style` or CSS classes inside `renderCell`, and hoist constant icons outside render. Avoid MUI `<Box sx={...}>`, `<Typography sx={...}>`, `<Tooltip>`, or `<Menu>` inside high-frequency cell renderers.
7. **Zero-Modal Actions Pattern**: Use `<GridActionsCellItem showInMenu />` inside `colDef.getActions` for secondary row actions—the overflow `<Menu>` mounts lazily only when clicked.
8. **Detail Panel Memory Safety**: `keepDetailContentMounted={true}` mounts detail content lazily on the row's **first expansion** and retains state afterward (unexpanded rows incur zero DOM cost).

---

## 3. Minimal Quick Start

```tsx
import { useMemo, useState } from 'react';
import { DataGridPro, type GridColDef } from './components/DataGridPro';

interface OrderRow {
  id: string;
  orderNo: string;
  customer: string;
  amount: number;
  status: 'settled' | 'processing' | 'pending';
  createdAt: string;
}

export function OrdersTable() {
  const [rows, setRows] = useState<OrderRow[]>([
    { id: '1', orderNo: 'SO-1001', customer: '星河智造', amount: 128000, status: 'settled', createdAt: '2026-03-10' },
    { id: '2', orderNo: 'SO-1002', customer: '博雅半导体', amount: 368500, status: 'processing', createdAt: '2026-03-12' },
  ]);

  const columns = useMemo<GridColDef<OrderRow>[]>(
    () => [
      { field: 'orderNo', headerName: '订单号', width: 140 },
      { field: 'customer', headerName: '客户名称', flex: 1, minWidth: 180, editable: true },
      {
        field: 'amount',
        headerName: '金额',
        type: 'number',
        width: 140,
        editable: true,
        valueFormatter: (v) => `¥${Number(v ?? 0).toLocaleString('zh-CN')}`,
      },
      {
        field: 'status',
        headerName: '状态',
        type: 'singleSelect',
        width: 120,
        editable: true,
        valueOptions: [
          { value: 'settled', label: '已结算' },
          { value: 'processing', label: '履行中' },
          { value: 'pending', label: '待审核' },
        ],
      },
      { field: 'createdAt', headerName: '创建日期', type: 'date', width: 130 },
    ],
    [],
  );

  return (
    <DataGridPro<OrderRow>
      rows={rows}
      columns={columns}
      height={560}
      checkboxSelection
      cellSelection
      processRowUpdate={(newRow) => {
        setRows((prev) => prev.map((r) => (r.id === newRow.id ? newRow : r)));
        return newRow;
      }}
    />
  );
}
```

---

## 4. Complete `DataGridProProps<R>` API Reference

### 4.1 Core Data, Layout & Sizing

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `rows` | `R[]` | **Required** | Row dataset (`Record<string, unknown>`). Can be `[]` when using `dataSource`. |
| `columns` | `GridColDef<R>[]` | **Required** | Column definitions array. Memoize with `useMemo`. |
| `getRowId` | `(row: R) => GridRowId` | `row.id` | Custom row ID resolver (`string \| number`). |
| `apiRef` | `RefObject<GridApiPro<R> \| null>` | `undefined` | Imperative API ref created via `useGridApiRef<R>()`. |
| `height` | `number \| string` | `620` | Container height (ignored when `autoHeight={true}`). |
| `autoHeight` | `boolean` | `false` | Grows grid height dynamically to fit all visible rows without vertical scrolling. |
| `rowHeight` | `number` | Density-based (`36`/`52`/`64`) | Explicit fixed data row height in px. |
| `getRowHeight` | `(params: GridRowHeightParams<R>) => number \| 'auto' \| null \| undefined` | `undefined` | Per-row fixed px height or `'auto'` dynamic content height. |
| `getRowSpacing` | `(params: GridRowSpacingParams<R>) => { top?: number; bottom?: number }` | `undefined` | Per-row top/bottom margin spacing. |
| `columnHeaderHeight` | `number` | Density-based | Explicit column header height in px. |
| `columnGroupHeaderHeight` | `number` | `46` | Height of each column-group header tier in px. |
| `density` | `'compact' \| 'standard' \| 'comfortable'` | `'standard'` | Controlled row/header density. |
| `onDensityChange` | `(density: GridDensity) => void` | `undefined` | Callback when density changes. |
| `showCellVerticalBorder` | `boolean` | `false` | Renders vertical gridlines between body cells. |
| `showColumnVerticalBorder` | `boolean` | `false` | Renders vertical borders between column headers. |
| `getRowClassName` | `(params: GridRowParams<R>) => string` | `undefined` | Custom CSS class per row. |
| `getCellClassName` | `(params: GridCellParams<R>) => string` | `undefined` | Custom CSS class per cell. |
| `ariaLabel` | `string` | `'企业级数据表格'` | Accessible `aria-label` on `[role="grid"]`. |

### 4.2 Virtualization, Pagination & Infinite Scroll

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `pagination` | `boolean` | `true` | Enables pagination (`false` shows all rows with virtualization). |
| `paginationMode` | `'client' \| 'server'` | `'client'` (`'server'` if `dataSource`) | Client-side or server-side pagination. |
| `paginationModel` | `{ page: number; pageSize: number }` | `{ page: 0, pageSize: 10 }` | Controlled pagination model (`page` is 0-indexed). |
| `onPaginationModelChange` | `(model: GridPaginationModel) => void` | `undefined` | Pagination change callback. |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` | Page size selector choices. |
| `autoPageSize` | `boolean` | `false` | Automatically computes `pageSize` from viewport height. |
| `rowCount` | `number` | `rows.length` | Total server row count (required in server/lazy mode). |
| `disableVirtualization` | `boolean` | `false` | Disables both vertical row and horizontal column virtualization. |
| `virtualizeThreshold` | `number` | `40` | Row count threshold to activate vertical window virtualization. |
| `columnVirtualizeThreshold` | `number` | `20` | Visible leaf column count threshold to activate horizontal column virtualization. |
| `columnBufferPx` | `number` | `150` | Overscan pixel buffer on left/right of horizontal viewport. |
| `onRowsScrollEnd` | `(params: { viewportPageSize: number; virtualRowsCount: number }) => void` | `undefined` | Infinite-scroll trigger near vertical scroll bottom. |
| `scrollEndThreshold` | `number` | `80` | Distance from bottom (px) to fire `onRowsScrollEnd`. |

### 4.3 Sorting, Filtering & Header Filters

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `sortingMode` | `'client' \| 'server'` | `'client'` (`'server'` if `dataSource`) | Client-side or server-side multi-column sorting. |
| `sortModel` | `Array<{ field: string; sort: 'asc' \| 'desc' }>` | `[]` | Controlled multi-sort model (hold `Shift` + click for multi-sort). |
| `onSortModelChange` | `(model: GridSortModel) => void` | `undefined` | Sort model change callback. |
| `sortingOrder` | `Array<'asc' \| 'desc' \| null>` | `['asc', 'desc', null]` | Sort cycle sequence on header click. |
| `disableColumnSorting` | `boolean` | `false` | Disables all column sorting. |
| `filterMode` | `'client' \| 'server'` | `'client'` (`'server'` if `dataSource`) | Client-side or server-side filtering. |
| `filterModel` | `GridFilterModel` | `{ items: [], logicOperator: 'and', quickFilterValues: [] }` | Controlled compound filter + quick-filter model. |
| `onFilterModelChange` | `(model: GridFilterModel) => void` | `undefined` | Filter model change callback. |
| `headerFilters` | `boolean` | `false` | Shows Pro per-column inline header filter bar with operator switcher. |
| `disableColumnFilter` | `boolean` | `false` | Disables filter panel and filter column menu actions. |

### 4.4 Server-Side DataSource, Caching & Viewport Lazy Loading

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `dataSource` | `GridDataSource<R>` | `undefined` | Official server datasource: `{ getRows, getGroupKey?, getChildrenCount?, updateRow? }`. |
| `dataSourceCache` | `GridDataSourceCache<R> \| null` | Built-in LRU+TTL cache | Custom cache (`createDataSourceCache({ ttl, maxEntries })`) or `null` to disable caching. |
| `onDataSourceError` | `(error: unknown) => void` | `undefined` | Error callback when `dataSource.getRows` rejects. |
| `lazyLoading` | `boolean` | `false` | Viewport chunk lazy loading (fetches `{ start, end }` chunks on scroll with skeleton rows). |
| `lazyLoadingChunkSize` | `number` | `25` | Number of rows fetched per lazy chunk request. |
| `loading` | `boolean` | `false` | Controlled loading overlay state. |
| `loadingOverlayVariant` | `'skeleton' \| 'linear-progress'` | `'linear-progress'` | Skeleton placeholder rows or top linear progress bar. |

### 4.5 Row Selection, Cell Range Selection, Clipboard & Autofill

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `checkboxSelection` | `boolean` | `false` | Prepends pinned-left selection checkbox column (supports `Shift+Click` range selection). |
| `rowSelectionModel` | `GridRowId[]` | `[]` | Controlled selected row IDs. |
| `onRowSelectionModelChange` | `(selection: GridRowSelectionModel) => void` | `undefined` | Row selection change callback. |
| `disableRowSelectionOnClick` | `boolean` | `false` | Prevents clicking row body from toggling selection. |
| `disableMultipleRowSelection` | `boolean` | `false` | Enforces single-row radio-like selection. |
| `keepNonExistentRowsSelected` | `boolean` | `false` | Preserves selected IDs not present on the current page/filter. |
| `isRowSelectable` | `(params: GridRowParams<R>) => boolean` | `undefined` | Locks specific rows from selection. |
| `onDeleteSelectedRows` | `(ids: GridRowId[]) => void` | `undefined` | Enables bulk "Delete Selected" button in selection action bar. |
| `cellSelection` | `boolean` | `false` | Enables Excel-like rectangular cell range selection, live sum/avg stats, drag fill handle, and TSV copy/paste. |
| `splitClipboardPastedText` | `(text: string) => string[][]` | TSV parser | Custom clipboard text matrix parser. |
| `processCellPaste` | `(params: GridProcessCellPasteParams<R>) => unknown` | `undefined` | Intercepts/transforms each pasted cell value before commit. |
| `onClipboardCopy` | `(info: { rowCount: number; colCount: number }) => void` | `undefined` | Fired after `Ctrl+C` range copy. |
| `onClipboardPaste` | `(info: { updatedRows: number; updatedCells: number }) => void` | `undefined` | Fired after `Ctrl+V` matrix paste. |
| `onClipboardClear` | `(info: { updatedRows: number; updatedCells: number }) => void` | `undefined` | Fired after `Delete`/`Backspace` range clear. |
| `onCellAutoFill` | `(info: { updatedRows: number; updatedCells: number }) => void` | `undefined` | Fired after fill-handle drag (auto-extrapolates numeric series). |

### 4.6 Editing, Validation & Undo/Redo History

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `editMode` | `'cell' \| 'row'` | `'cell'` | Single-cell editing or atomic full-row editing. |
| `cellModesModel` | `GridCellModesModel` | `undefined` | Controlled cell edit modes (`{ [rowId]: { [field]: { mode: 'edit' \| 'view', ignoreModifications? } } }`). |
| `onCellModesModelChange` | `(model: GridCellModesModel) => void` | `undefined` | Cell modes change callback. |
| `rowModesModel` | `GridRowModesModel` | `undefined` | Controlled row edit modes (`{ [rowId]: { mode: 'edit' \| 'view', fieldToFocus?, ignoreModifications? } }`). |
| `onRowModesModelChange` | `(model: GridRowModesModel) => void` | `undefined` | Row modes change callback. |
| `isCellEditable` | `(params: GridCellParams<R>) => boolean` | `undefined` | Per-cell edit lock (also enforced during row edit, paste, and autofill). |
| `processRowUpdate` | `(newRow: R, oldRow: R) => R \| Promise<R>` | `undefined` | Async/sync commit hook. Throw/reject to automatically roll back. |
| `onProcessRowUpdateError` | `(error: unknown) => void` | `undefined` | Error handler when `processRowUpdate` or `dataSource.updateRow` throws. |
| `onUndoRedo` | `(info: { action: 'undo' \| 'redo'; rowCount: number; label: string }) => void` | `undefined` | Fired after `Ctrl+Z` / `Ctrl+Y` or toolbar Undo/Redo click. |
| `onRowsUpdate` | `(nextRows: R[]) => void` | `undefined` | Invoked when `apiRef.current.updateRows(...)` mutates rows. |

### 4.7 Column Management, Pinning, Grouping & Row Pinning/Reordering

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `columnVisibilityModel` | `Record<string, boolean>` | `{}` | Controlled column visibility (`false` hides column). |
| `onColumnVisibilityModelChange` | `(model: GridColumnVisibilityModel) => void` | `undefined` | Column visibility change callback. |
| `pinnedColumns` | `{ left?: string[]; right?: string[] }` | `{}` | Controlled sticky pinned columns. |
| `onPinnedColumnsChange` | `(model: GridPinnedColumnFields) => void` | `undefined` | Pinned columns change callback. |
| `pinnedColumnsSectionSeparator` | `'border-and-shadow' \| 'border' \| 'shadow'` | `'border-and-shadow'` | Visual separator on pinned column edges during horizontal scroll. |
| `columnGroupingModel` | `GridColumnGroupingModel` | `undefined` | Multi-level column header grouping tree. |
| `pinnedRows` | `{ top?: Array<Partial<R>>; bottom?: Array<Partial<R>> }` | `undefined` | Sticky top/bottom summary or frozen rows. |
| `rowReordering` | `boolean` | `false` | Enables drag-and-drop row reordering handle column. |
| `onRowOrderChange` | `(params: { row: R; oldIndex: number; targetIndex: number }) => void` | `undefined` | Fired when a row is reordered via drag-and-drop. |
| `disableColumnReorder` | `boolean` | `false` | Disables column header drag-to-reorder. |
| `disableColumnMenu` | `boolean` | `false` | Hides the `⋮` column header menu. |
| `disableColumnSelector` | `boolean` | `false` | Hides column manager button in toolbar. |
| `disableDensitySelector` | `boolean` | `false` | Hides density button in toolbar. |
| `disableColumnResize` | `boolean` | `false` | Disables column border drag resize & double-click autosize. |
| `disableColumnPinning` | `boolean` | `false` | Disables left/right column pinning actions. |

### 4.8 Master-Detail, Tree Data, Row Grouping, Aggregation, Pivot, Charts & Span

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `getDetailPanelContent` | `(params: { id: GridRowId; row: R }) => ReactNode` | `undefined` | Enables Master-Detail toggle column and renders expandable panel. |
| `getDetailPanelHeight` | `(params: GridDetailPanelParams<R>) => number \| 'auto'` | `'auto'` | Fixed pixel height or `'auto'` for detail panel. |
| `detailPanelExpandedRowIds` | `GridRowId[]` | `[]` | Controlled expanded row IDs. |
| `onDetailPanelExpandedRowIdsChange` | `(ids: GridRowId[]) => void` | `undefined` | Detail expansion change callback. |
| `keepDetailContentMounted` | `boolean` | `false` | Retains detail content after first expansion (lazy-mounted on first expand). |
| `treeData` | `boolean` | `false` | Enables client-side hierarchical tree data view. |
| `getTreeDataPath` | `(row: R) => string[]` | `undefined` | Returns hierarchy path segments (e.g. `['华东', '智能制造', 'SO-1001']`). |
| `groupingColDef` | `{ headerName?: string; width?: number; hideDescendantCount?: boolean }` | `undefined` | Customizes the auto-generated hierarchy/grouping column. |
| `defaultGroupingExpansionDepth` | `number` | `0` (`-1` expands all) | Initial expanded depth for Tree Data & Row Grouping. |
| `rowGroupingModel` | `string[]` | `[]` | Controlled list of column fields to group by (supports multi-level). |
| `onRowGroupingModelChange` | `(model: GridRowGroupingModel) => void` | `undefined` | Row grouping change callback. |
| `rowGroupingColumnMode` | `'single' \| 'multiple'` | `'single'` | Single hierarchy column vs one column per grouping dimension. |
| `onRowGroupingColumnModeChange` | `(mode: GridRowGroupingColumnMode) => void` | `undefined` | Grouping column mode callback. |
| `aggregationModel` | `Record<string, 'sum' \| 'avg' \| 'min' \| 'max' \| 'size'>` | `{}` | Column rollup functions (renders group rollups + sticky summary footer). |
| `onAggregationModelChange` | `(model: GridAggregationModel) => void` | `undefined` | Aggregation change callback. |
| `pivotMode` | `boolean` | `false` | Switches grid into interactive Pivot Table mode. |
| `onPivotModeChange` | `(enabled: boolean) => void` | `undefined` | Pivot mode toggle callback. |
| `pivotModel` | `{ rows: string[]; columns: string[]; values: Array<{ field: string; aggFunc: GridAggregationFunctionName }> }` | `undefined` | Controlled pivot dimensions & value metrics. |
| `onPivotModelChange` | `(model: GridPivotModel) => void` | `undefined` | Pivot model change callback. |
| `sidebarPanel` | `'pivot' \| 'columns' \| 'filters' \| null` | `undefined` | Controlled right docked sidebar tab. |
| `onSidebarPanelChange` | `(panel: GridSidebarPanel \| null) => void` | `undefined` | Sidebar tab change callback. |
| `defaultSidebarPanel` | `'pivot' \| 'columns' \| 'filters' \| null` | `null` | Initial sidebar panel for uncontrolled usage. |
| `chartsIntegration` | `boolean` | `true` | Enables toolbar "Charts" toggle with live bar/line/area/pie cross-filtering. |
| `rowSpanning` | `boolean` | `false` | Merges adjacent equal cell values vertically (opt-out per column via `rowSpan: false`). |
| `listView` | `boolean` | `false` | Responsive single-column list/card mode. |
| `listViewColumn` | `{ field: string; renderCell: (params: GridRenderCellParams<R>) => ReactNode }` | `undefined` | Card renderer used when `listView={true}`. |

### 4.9 Slots, Toolbar, Footer, Locale & Events

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `initialState` | `object` | `undefined` | Initial seed for `pagination`, `sorting`, `filter`, `columns` (`columnVisibilityModel`, `orderedFields`), `pinnedColumns`, `detailPanel`, `density`. |
| `localeText` | `GridLocaleTextInput` | `GRID_ZH_CN_LOCALE_TEXT` | Deep-merged i18n dictionary (built-in: `GRID_ZH_CN_LOCALE_TEXT`, `GRID_EN_US_LOCALE_TEXT`). |
| `disableToolbar` | `boolean` | `false` | Hides top toolbar completely. |
| `hideFooter` | `boolean` | `false` | Hides entire footer bar. |
| `hideFooterPagination` | `boolean` | `false` | Hides pagination controls in footer. |
| `hideFooterSelectedRowCount` | `boolean` | `false` | Hides selected row count indicator in footer. |
| `slots` | `GridSlots` | `undefined` | Custom replacements for `toolbar`, `footer`, `pagination`, `noRowsOverlay`, `noResultsOverlay`, `loadingOverlay`. Pass `null` to omit a slot. |
| `slotProps` | `GridSlotProps` | `undefined` | Props forwarded to built-in or custom slots (e.g., `slotProps.toolbar = { showQuickFilter, quickFilterPlaceholder, csvFileName, excelFileName }`). |
| `emptyStateAction` | `{ label: string; onClick: () => void }` | `undefined` | Optional CTA button shown inside default `noRowsOverlay`. |
| `onRowClick` | `(row: R, id: GridRowId) => void` | `undefined` | Row click handler. |
| `onRowDoubleClick` | `(params: GridRowParams<R>) => void` | `undefined` | Row double-click handler. |
| `onCellClick` | `(params: GridCellParams<R>) => void` | `undefined` | Cell click handler. |
| `onCellDoubleClick` | `(params: GridCellParams<R>) => void` | `undefined` | Cell double-click handler. |
| `onColumnHeaderClick` | `(params: GridColumnHeaderParams<R>) => void` | `undefined` | Column header click handler. |
| `onColumnOrderChange` | `(params: GridColumnOrderChangeParams<R>) => void` | `undefined` | Fired after column drag reorder. |
| `onColumnWidthChange` | `(params: GridColumnResizeParams<R>) => void` | `undefined` | Fired after column resize/autosize. |
| `onStateChange` | `(state: GridStateSnapshot) => void` | `undefined` | Emits complete state snapshot on grid state updates. |
| `onExport` | `(info: { format: 'xlsx' \| 'csv' \| 'json'; rowCount: number; selectedOnly: boolean }) => void` | `undefined` | Fired after CSV, native OOXML `.xlsx`, or JSON export. |

---

## 5. `GridColDef<R, V>` Column Definition Reference

```ts
interface GridColDef<R, V = unknown> {
  field: string;                           // Unique key (matches property on R unless valueGetter is used)
  headerName?: string;                     // Display label (defaults to field)
  description?: string;                    // Header tooltip text
  type?: 'string' | 'number' | 'date' | 'dateTime' | 'boolean' | 'singleSelect' | 'actions';
  width?: number;                          // Fixed width in px (default 150)
  minWidth?: number;                       // Minimum resize width in px
  maxWidth?: number;                       // Maximum resize width in px
  flex?: number;                           // Proportional flex width (fills remaining viewport width)
  align?: 'left' | 'right' | 'center';     // Cell alignment (defaults: 'right' for number, 'center' for boolean/actions)
  headerAlign?: 'left' | 'right' | 'center';

  // Capability flags (all default true unless type === 'actions')
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  hideable?: boolean;
  pinnable?: boolean;
  editable?: boolean;                      // Default false
  disableReorder?: boolean;
  aggregable?: boolean;
  groupable?: boolean;

  // Spanning
  rowSpan?: boolean;                       // Set false to opt out when rowSpanning={true}
  rowSpanValueGetter?: (value: unknown, row: R) => unknown;
  colSpan?: number | ((value: unknown, row: R, column: GridColDef<R, V>) => number);

  // Value pipeline
  valueOptions?: Array<string | { value: string | number; label: string }>; // Required for type: 'singleSelect'
  valueGetter?: (value: unknown, row: R) => V;
  valueSetter?: (value: V, row: R) => R;
  valueParser?: (value: unknown, row: R) => V;
  valueFormatter?: (value: V, row: R) => string;

  // Sorting & Filtering customization
  sortComparator?: (v1: V, v2: V, rowA: R, rowB: R) => number;
  sortingOrder?: Array<'asc' | 'desc' | null>;
  filterOperators?: GridFilterOperator<R, V>[];

  // Editing validation & Custom renderers
  preProcessEditCellProps?: (params: GridPreProcessEditCellPropsParams<R>) => { value: unknown; error?: boolean | string };
  getActions?: (params: GridRowParams<R>) => ReactElement<GridActionsCellItemProps>[]; // Required for type: 'actions'
  renderCell?: (params: GridRenderCellParams<R, V>) => ReactNode;
  renderEditCell?: (params: GridRenderEditCellParams<R, V>) => ReactNode;
  renderHeader?: (params: GridRenderHeaderParams<R>) => ReactNode;
}
```

### Built-in Filter Operators by Column `type`
- **`string`**: `contains`, `equals`, `startsWith`, `endsWith`, `isEmpty`, `isNotEmpty`, `isAnyOf`
- **`number`**: `=`, `!=`, `>`, `>=`, `<`, `<=`, `isEmpty`, `isNotEmpty`, `isAnyOf`
- **`date` / `dateTime`**: `is`, `not`, `after`, `onOrAfter`, `before`, `onOrBefore`, `isEmpty`, `isNotEmpty`
- **`singleSelect`**: `is`, `not`, `isAnyOf`, `isEmpty`, `isNotEmpty`
- **`boolean`**: `is`

### Declarative Actions Column (`GridActionsCellItem`)
```tsx
{
  field: 'actions',
  type: 'actions',
  headerName: '操作',
  width: 112,
  getActions: ({ row }) => [
    <GridActionsCellItem key="view" icon={VIEW_ICON} label="查看" onClick={() => onView(row)} />,
    <GridActionsCellItem key="del" icon={DEL_ICON} label="删除" color="error" onClick={() => onDelete(row.id)} />,
    <GridActionsCellItem key="copy" icon={COPY_ICON} label="复制单号" showInMenu onClick={() => onCopy(row)} />,
  ],
}
```

---

## 6. Imperative `apiRef` (`useGridApiRef`) & Event Bus

Initialize with `const apiRef = useGridApiRef<MyRow>();` and pass `<DataGridPro apiRef={apiRef} ... />`.

### Methods on `apiRef.current`
- **State Persistence**:
  - `exportState(): GridPersistedState` — serializes sorting, filterModel, columnVisibilityModel, columnOrder, pinnedColumns, columnSizing, density, rowGroupingModel, aggregationModel.
  - `restoreState(state: GridPersistedState): void` — restores a saved view snapshot atomically.
- **Rows & Selection**:
  - `getRow(id)` / `getAllRowIds()` / `getRowsCount()`
  - `getSelectedRows()` / `setRowSelectionModel(ids)` / `selectRow(id, isSelected?, resetSelection?)`
  - `updateRows(updates: Array<Partial<R> & { id: GridRowId; _action?: 'delete' }>)` — upserts or deletes rows via `onRowsUpdate`.
- **Columns**:
  - `getColumn(field)` / `getAllColumns()` / `getVisibleColumns()`
  - `setColumnVisibility(field, isVisible)` / `setColumnVisibilityModel(model)`
  - `setColumnWidth(field, width)` / `pinColumn(field, 'left' | 'right' | false)` / `autosizeColumns()`
- **Query & Presentation Models**:
  - `setFilterModel(model)` / `setSortModel(model)` / `getSortModel()`
  - `setPage(page)` / `setPageSize(pageSize)` / `setPaginationModel(model)`
  - `setDensity(density)` / `setRowGroupingModel(model)` / `setAggregationModel(model)`
- **Scroll, Focus & Programmatic Edit**:
  - `scrollToIndexes({ rowIndex?, colIndex? })`
  - `setCellFocus(id, field)`
  - `startCellEditMode({ id, field })` / `stopCellEditMode({ id, field, ignoreModifications? })`
  - `startRowEditMode({ id, fieldToFocus? })` / `stopRowEditMode({ id, ignoreModifications? })`
- **Server DataSource Control**:
  - `dataSource?.fetchRows()` — force re-fetch active query.
  - `dataSource?.clearCache()` — clear `dataSourceCache` entries.
- **Event Bus**:
  - `subscribeEvent(event, handler): () => void` — returns unsubscribe function.
  - `publishEvent(event, params?)`

### Built-in `GridEventName` Values
`sortModelChange` · `filterModelChange` · `paginationModelChange` · `rowSelectionChange` · `densityChange` · `columnVisibilityModelChange` · `cellEditStart` · `cellEditStop` · `rowsUpdate` · `cellClick` · `cellDoubleClick` · `rowDoubleClick` · `columnHeaderClick` · `columnOrderChange` · `columnWidthChange` · `cellModesModelChange` · `rowModesModelChange`

---

## 7. Slots, `slotProps` & Internationalization (`localeText`)

### Slots
Any slot accepts a React component, a `ReactNode`, or `null` (to suppress rendering):
- `slots.toolbar` — receives `slotProps.toolbar` (`showQuickFilter`, `quickFilterPlaceholder`, `csvFileName`, `excelFileName`, etc.)
- `slots.footer` — replaces entire footer; receives `{ totalFilteredRows, selectedCount, ...slotProps.footer }`
- `slots.pagination` — replaces only the pagination section inside footer
- `slots.noRowsOverlay` / `slots.noResultsOverlay` / `slots.loadingOverlay`

### Internationalization (`localeText`)
Default is Simplified Chinese (`GRID_ZH_CN_LOCALE_TEXT`). Switch to English or partially override any key (nested `MuiTablePagination` and `filterOperatorLabels` are deep-merged safely):
```tsx
<DataGridPro
  rows={rows}
  columns={columns}
  localeText={{
    ...GRID_EN_US_LOCALE_TEXT,
    noRowsLabel: 'No orders yet',
  }}
/>
```

---

## 8. Keyboard Shortcuts & Accessibility Contract

| Interaction | Behavior |
| --- | --- |
| `ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight` | Roving grid cell focus navigation (`Home`/`End` jump row boundaries). |
| `Shift + Arrow` / `Shift + Click` cell | Extends rectangular cell range selection (`cellSelection={true}`). |
| `Shift + Click` row checkbox | Inclusive visual range row selection. |
| `Enter` / `F2` / Double-Click cell | Enters edit mode (cell or full-row according to `editMode`). |
| `Enter` (editing) / `Tab` / `Escape` | Commits edit / moves to next editable cell / cancels & reverts. |
| `Ctrl+C` / `Cmd+C` | Copies selected cell range (or focused cell) as Excel-ready TSV. |
| `Ctrl+V` / `Cmd+V` | Pastes TSV matrix from clipboard starting at active cell (respects `isCellEditable` & `processCellPaste`). |
| `Delete` / `Backspace` | Clears editable cells in active cell range (records atomic Undo batch). |
| `Ctrl+Z` / `Ctrl+Y` (or `Ctrl+Shift+Z`) | Undoes / redoes cell edits, pastes, clears, and autofill batches. |

### Key ARIA & Test Attributes
- Root: `.MuiDataGrid-root` (`[role="grid"]`)
- Scroller: `.datagrid-scroller.MuiDataGrid-main`
- Render zone: `.MuiDataGrid-virtualScrollerRenderZone[data-virtualized="true"|"false"]`
- Row: `[role="row"].MuiDataGrid-row`
- Cell: `[role="gridcell"][data-field="<field>"][data-row-index="<n>"][data-col-index="<n>"]`
- Detail panel: `.MuiDataGrid-detailPanel` / toggle button `.MuiDataGrid-detailToggleBtn[aria-expanded]`

---

## 9. Production Integration Recipes

### Recipe A: Server-Side DataSource + LRU Cache + Row Mutation
```tsx
const cache = useMemo(() => createDataSourceCache<OrderRow>({ ttl: 60_000, maxEntries: 100 }), []);

const dataSource = useMemo<GridDataSource<OrderRow>>(
  () => ({
    getRows: async ({ paginationModel, sortModel, filterModel }) => {
      const res = await fetch('/api/orders/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paginationModel, sortModel, filterModel }),
      });
      if (!res.ok) throw new Error('Failed to load orders');
      return res.json(); // { rows: OrderRow[], rowCount: number }
    },
    updateRow: async ({ newRow }) => {
      const res = await fetch(`/api/orders/${newRow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow),
      });
      if (!res.ok) throw new Error('Validation failed');
      return res.json();
    },
  }),
  [],
);

<DataGridPro
  rows={[]}
  columns={columns}
  dataSource={dataSource}
  dataSourceCache={cache}
  onDataSourceError={(err) => console.error(err)}
/>;
```

### Recipe B: Viewport Chunk Lazy Loading (Large Server Dataset)
```tsx
<DataGridPro
  rows={[]}
  columns={columns}
  dataSource={chunkDataSource} // uses params.start & params.end inclusive indices
  rowCount={10000}
  lazyLoading
  lazyLoadingChunkSize={25}
  pagination={false}
  height={600}
/>
```

### Recipe C: Server-Side Tree Data Lazy Expansion
```tsx
const treeDataSource = useMemo<GridDataSource<OrderRow>>(
  () => ({
    getRows: async ({ groupKeys = [], sortModel, filterModel }) =>
      fetchTreeLevel({ groupKeys, sortModel, filterModel }),
    getGroupKey: (row) => String(row.treeKey),
    getChildrenCount: (row) => Number(row.childrenCount ?? 0), // >0 or -1 shows expand chevron
  }),
  [],
);

<DataGridPro rows={[]} columns={columns} dataSource={treeDataSource} pagination={false} />;
```

### Recipe D: Row Grouping + Aggregation + Pivot Table + Sidebar
```tsx
<DataGridPro
  rows={rows}
  columns={columns}
  rowGroupingModel={['region', 'industry']}
  aggregationModel={{ amount: 'sum', collectionRate: 'avg' }}
  pivotMode={pivotEnabled}
  onPivotModeChange={setPivotEnabled}
  pivotModel={{
    rows: ['region'],
    columns: ['status'],
    values: [{ field: 'amount', aggFunc: 'sum' }],
  }}
  defaultSidebarPanel="columns"
/>
```

### Recipe E: Master-Detail with State Retention
```tsx
<DataGridPro
  rows={rows}
  columns={columns}
  getDetailPanelContent={({ row }) => <OrderItemsSubTable order={row} />}
  getDetailPanelHeight={() => 'auto'}
  keepDetailContentMounted // Lazy-mounted on first expand; zero hidden DOM on unexpanded rows
/>
```

### Recipe F: Saving & Restoring User Views via `apiRef`
```tsx
const apiRef = useGridApiRef<OrderRow>();

const saveView = () => {
  const snapshot = apiRef.current?.exportState();
  if (snapshot) localStorage.setItem('orders_grid_view', JSON.stringify(snapshot));
};

const loadView = () => {
  const raw = localStorage.getItem('orders_grid_view');
  if (raw) apiRef.current?.restoreState(JSON.parse(raw));
};
```

---

## 10. Exported Pure Headless Core Engines

All algorithmic engines are decoupled from React and exported from `./components/DataGridPro` for direct reuse or unit testing:

- **Filtering**: `createRowFilterPredicate`, `evaluateFilterModel`, `evaluateFilterItem`, `getOperatorsForColumn`, `upsertHeaderFilterItem`, `upsertHeaderFilterOperator`, `upsertExactValueFilter`
- **Hierarchy & Analytics**: `buildTreeDataRows`, `buildRowGroupingRows`, `computeColumnAggregation`, `formatAggregatedValue`, `buildPivotTable`, `buildChartSeries`
- **Virtualization & Layout**: `computeVirtualRowWindow`, `computeVirtualColumnWindow`, `computePinnedOffsets`, `computeFlexColumnWidths`, `computeRowSpanMatrix`, `computeColSpanRow`, `computeAutoPageSize`, `resolveRowHeightConfig`
- **Editing, Clipboard & History**: `parseEditedCellValue`, `evaluateEditCellValidation`, `applyValueSetter`, `validateAndMergeRowEdits`, `parseTsvClipboardMatrix`, `applyClipboardPasteMatrix`, `computeAutoFillUpdates`, `createEditHistoryState`, `pushEditHistoryEntry`, `undoEditHistory`, `redoEditHistory`
- **Server & Lazy Engines**: `executeServerQuery`, `executeServerGroupQuery`, `executeServerTreeQuery`, `buildServerTreeVisibleRows`, `createDataSourceCache`, `computeMissingChunkRanges`, `mergeLazyRowsIntoMap`
- **Export**: `serializeRowsToCsv`, `serializeCellsToTsv`, `serializeRowsToXlsxBytes` (native zero-dependency OOXML `.xlsx` ZIP builder), `serializeRowsToJson`

---

## 11. CSS Custom Properties & Styling Hooks

Override tokens on `.MuiDataGrid-root` or a parent wrapper:

```css
.MuiDataGrid-root {
  --DataGrid-containerBackground: #ffffff;
  --DataGrid-rowBorderColor: rgba(224, 224, 224, 1);
  --DataGrid-pinnedBackground: #ffffff;
  --DataGrid-rowHoverBackground: rgba(0, 0, 0, 0.04);
  --DataGrid-rowSelectedBackground: rgba(25, 118, 210, 0.08);
  --DataGrid-rowSelectedHoverBackground: rgba(25, 118, 210, 0.12);
  --DataGrid-focusOutlineColor: #1976d2;
}
```
