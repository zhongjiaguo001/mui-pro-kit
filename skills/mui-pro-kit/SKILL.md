---
name: mui-pro-kit
description: Build and integrate UI with the `mui-pro-kit` React component library (`DataGridPro`, `DatePicker`, `RangePicker`, `CalendarPanel`, `message`, `useMessage`, `NavMenu`). Use when installing, configuring, styling, or writing React/TypeScript code with `mui-pro-kit`, or migrating Ant Design / MUI X DataGrid patterns onto Material UI v7/v9.
---

# Using `mui-pro-kit`

`mui-pro-kit` is an enterprise React UI kit built on Material UI (v7 / v9) and TanStack Table v9.

## 1. Setup & Imports

- **Peer dependencies** (installed in the host app, never bundled): `react`, `react-dom`, `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`.
- **Stylesheet**: Import once at the host application entry whenever using `DataGridPro` (or tabular numeral styling):
  ```ts
  import 'mui-pro-kit/styles.css';
  ```
- **Prefer subpath imports** for clearest intent and optimal tree-shaking:
  - `mui-pro-kit/data-grid`
  - `mui-pro-kit/date-picker`
  - `mui-pro-kit/message`
  - `mui-pro-kit/nav-menu`
  - (Or root barrel `mui-pro-kit`)

## 2. Read Component Reference Before Writing Complex Usage

When working on a specific component, read the corresponding reference doc shipped alongside this package (in `node_modules/mui-pro-kit/docs/` or repository `docs/`):

| Component(s) | Reference Document |
| --- | --- |
| `DataGridPro`, `GridActionsCellItem`, `useGridApiRef`, server `dataSource`, pivot, tree, grouping | `../../docs/data-grid.md` |
| `DatePicker`, `DatePicker.RangePicker`, `RangePicker`, `CalendarPanel` | `../../docs/date-picker.md` |
| `message`, `useMessage`, `MessageGlobalHost`, `MessageStore` | `../../docs/message.md` |
| `NavMenu`, `NAV_MENU_PALETTES`, `menuCore` | `../../docs/nav-menu.md` |

## 3. Non-Negotiable Invariants

### `DataGridPro`
1. **Row IDs**: Every row needs a unique `id: string | number` or an explicit `getRowId`.
2. **Memoization**: Always memoize `columns`, `dataSource`, `processRowUpdate`, `getActions`, and custom renderers (`useMemo` / `useCallback`).
3. **Editing persistence**: `editable: true` on a column is never sufficient alone—always wire `processRowUpdate` (or `dataSource.updateRow`).
4. **Hot-path performance**: Inside `renderCell`, prefer plain HTML (`<span>`, `<div>`) with inline `style` / CSS classes and hoist constant icons out of render. Avoid MUI `<Box sx>`, `<Typography sx>`, `<Tooltip>`, or `<Menu>` inside cells of large/virtualized tables.
5. **Mode compatibility**: Do not enable `treeData` and `rowGroupingModel` simultaneously; `pivotMode` disables `checkboxSelection` and inline editing; `lazyLoading` requires `dataSource` and `rowCount`.

### `DatePicker` / `RangePicker` / `CalendarPanel`
1. **Native `Date` objects**: Always pass native JS `Date` instances (never Day.js/Moment objects).
2. **Value shapes**: `DatePicker` uses `Date | null` (or `Date[]` when `multiple={true}`); `RangePicker` uses `[Date | null, Date | null] | null`.
3. **Time confirmation**: `showTime` defaults `needConfirm` to `true` in single `date` mode; changes commit on "确定" unless `needConfirm={false}`.

### `Message`
1. **Theme inheritance**: Inside React components, prefer `const [messageApi, contextHolder] = useMessage()` and render `{contextHolder}` under `<ThemeProvider>`.
2. **Imperative static calls**: Mount `<MessageGlobalHost />` inside the app's `<ThemeProvider>` (or call `message.config({ theme })`) so `message.success(...)` inherits the host MUI theme.
3. **Async loading updates**: Use a stable `key` with `duration: 0` for `loading`, then call `open` with the same `key` and `type: 'success' | 'error'` to update in place.

### `NavMenu`
1. **Unique keys**: Every leaf and `submenu` requires a unique string `key`.
2. **Delays in seconds**: `subMenuOpenDelay` and `subMenuCloseDelay` are specified in **seconds** (e.g. `0.08`, `0.14`), matching Ant Design.
3. **Collapsible sidebar**: Use `mode="inline"` + `inlineCollapsed` (and optionally `accordion`); open keys are preserved automatically across collapse/expand.
