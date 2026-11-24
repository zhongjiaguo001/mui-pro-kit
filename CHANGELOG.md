# Changelog

## 0.1.2 - 2026-11-24

### Features
- Add MUI X v8-aligned `showToolbar` prop on `DataGridPro` (takes precedence over legacy `disableToolbar`, preserving backward compatibility).
- Extend `apiRef` (`GridApiPro`) for complete headless/external toolbar control:
  - Quick filter: `setQuickFilterValues(values)`
  - Panels & preferences: `showFilterPanel(field?, anchorEl?)`, `hideFilterPanel()`, `showColumnsPanel(anchorEl?)`, `hideColumnsPanel()`, `showPreferences(panel, anchorEl?)`, `hidePreferences()`, `setSidebarPanel(panel)`, `setChartsPanelOpen(open)`, `toggleChartsPanel()`
  - Export & print: `exportDataAsCsv(options?)`, `exportDataAsExcel(options?)`, `exportDataAsJson(options?)`, `exportDataAsPrint()`
  - Edit history: `undo()`, `redo()`, `getEditHistoryState()`
- Add controlled `chartsPanelOpen`, `onChartsPanelOpenChange`, and `defaultChartsPanelOpen` props, plus `editHistoryChange`, `sidebarPanelChange`, and `chartsPanelOpenChange` grid events.
- Forward full `GridToolbarRenderProps` to custom `slots.toolbar` components and export `GridToolbar`, `GridPreferencePanelsValue`, and panel/toolbar helper utilities.
- Update demo showcase (`App.tsx` & `StateInspector.tsx`) with a clean external control bar (`showToolbar={false}`) and expanded `apiRef` command actions.

### Fixes
- Fix column header menu "Filter" and "Manage Columns" actions when the built-in toolbar is hidden by gracefully falling back to the docked right sidebar (`GridSidebar`).
- Fix `setQuickFilterText` and `clearAllFilters` dependency arrays in `useDataGridPro`, keep internal quick filter input synced with external `filterModel.quickFilterValues`, and clear detached popover anchors when toggling toolbar visibility.

### Documentation
- Document `showToolbar`, controlled `chartsPanelOpen`, external-control `apiRef` methods, full `slots.toolbar` props, and an external toolbar integration recipe in `docs/data-grid.md` and `src/components/DataGridPro/README.md`.
