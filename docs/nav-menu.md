# NavMenu Documentation (AI-Ready Reference)

> **Architecture**: Ant Design v5-compatible declarative navigation menu built on Material UI (`Box`, `Collapse`, `Popper`, `Paper`, `Tooltip`, `Divider`) with a pure headless tree/overflow/keyboard engine (`menuCore`).

---

## 1. Module Entry

```ts
import {
  NavMenu,
  NAV_MENU_PALETTES,
  type NavMenuProps,
  type NavMenuItem,
  type NavMenuItemLeaf,
  type NavMenuSubMenuItem,
  type NavMenuItemGroup,
  type NavMenuDividerItem,
  type NavMenuMode,
  type NavMenuTheme,
  type NavMenuInfo,
  type NavMenuSelectInfo,
  type NavMenuPalette,
} from 'mui-pro-kit/nav-menu';
// Also re-exported from 'mui-pro-kit'
```

### Theming & Styles
- Styled with MUI components + built-in Ant Design-aligned `light` and `dark` palettes (`NAV_MENU_PALETTES`).
- Does **not** require `mui-pro-kit/styles.css`.

---

## 2. Critical Rules for AI Code Generation

1. **Unique String Keys**: Every leaf item (`type?: 'item'`) and submenu (`type: 'submenu'` or having `children` without `type: 'group'`) must have a unique string `key`. `group` (`type: 'group'`) and `divider` (`type: 'divider'`) keys are optional.
2. **Mode Behavior**:
   - `mode="inline"` (default): Vertical sidebar with smooth `Collapse` expansion. Supports `accordion={true}` and `inlineCollapsed={true}` (switches to a compact icon rail with hover/click flyout popups while preserving `openKeys` across collapse/expand).
   - `mode="vertical"`: Vertical rail with cascading right-side `Popper` submenus.
   - `mode="horizontal"`: Top navigation bar with `ResizeObserver`-powered automatic responsive `···` overflow submenu.
3. **Controlled vs Uncontrolled**: Pair `selectedKeys` with `onSelect` (and `onDeselect` when `multiple={true}`), and `openKeys` with `onOpenChange`. For uncontrolled usage, seed with `defaultSelectedKeys` / `defaultOpenKeys`.
4. **Hover Delays Are in Seconds**: Following Ant Design convention, `subMenuOpenDelay` (default `0.08`) and `subMenuCloseDelay` (default `0.14`) are in **seconds**, not milliseconds.
5. **Action-Only Menus**: Set `selectable={false}` when using `NavMenu` purely for command triggers (`onClick`) without persistent selected highlighting.

---

## 3. Quick Start Examples

### Collapsible Dark Sidebar (`inline` + `accordion` + `inlineCollapsed`)
```tsx
import { useState } from 'react';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { NavMenu, type NavMenuItem } from 'mui-pro-kit/nav-menu';

const MENU_ITEMS: NavMenuItem[] = [
  { key: 'dashboard', label: '工作台', icon: <DashboardOutlinedIcon fontSize="small" /> },
  {
    key: 'orders',
    label: '订单管理',
    icon: <ShoppingCartOutlinedIcon fontSize="small" />,
    children: [
      { key: 'orders-list', label: '订单列表', extra: '128' },
      { key: 'orders-refund', label: '售后退款' },
    ],
  },
  { type: 'divider' },
  {
    type: 'group',
    label: '系统设置',
    children: [
      { key: 'settings', label: '参数配置', icon: <SettingsOutlinedIcon fontSize="small" /> },
      { key: 'danger-reset', label: '重置环境', danger: true },
    ],
  },
];

export function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const [selectedKeys, setSelectedKeys] = useState(['orders-list']);

  return (
    <NavMenu
      mode="inline"
      theme="dark"
      accordion
      inlineCollapsed={collapsed}
      items={MENU_ITEMS}
      selectedKeys={selectedKeys}
      defaultOpenKeys={['orders']}
      onSelect={({ selectedKeys: next }) => setSelectedKeys(next)}
      onClick={({ key, keyPath }) => console.log('Navigate:', key, keyPath)}
    />
  );
}
```

### Responsive Horizontal Top Navigation
```tsx
<NavMenu
  mode="horizontal"
  theme="light"
  items={MENU_ITEMS}
  defaultSelectedKeys={['dashboard']}
  onClick={({ key }) => navigate(`/${key}`)}
/>
```

---

## 4. API Reference

### 4.1 `NavMenuProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `NavMenuItem[]` | **Required** | Declarative menu tree. |
| `mode` | `'inline' \| 'vertical' \| 'horizontal'` | `'inline'` | Navigation layout mode. |
| `theme` | `'light' \| 'dark'` | `'light'` | Built-in light or dark navigation palette. |
| `selectedKeys` / `defaultSelectedKeys` | `string[]` | `[]` | Controlled / initial selected leaf keys. |
| `openKeys` / `defaultOpenKeys` | `string[]` | `[]` | Controlled / initial expanded submenu keys. |
| `inlineCollapsed` | `boolean` | `false` | Collapses `inline` sidebar into an icon rail with flyout popups. |
| `inlineIndent` | `number` | `24` | Per-level left indentation in px (`inline` mode). |
| `accordion` | `boolean` | `false` | Keeps only the active ancestor chain expanded in `inline` mode. |
| `multiple` | `boolean` | `false` | Allows toggling multiple selected keys simultaneously. |
| `selectable` | `boolean` | `true` | Enables selected state tracking. |
| `triggerSubMenuAction` | `'hover' \| 'click'` | `'hover'` | Trigger mode for popup submenus (`horizontal`, `vertical`, `inlineCollapsed`). |
| `subMenuOpenDelay` | `number` | `0.08` | Hover open delay in seconds. |
| `subMenuCloseDelay` | `number` | `0.14` | Hover close delay in seconds. |
| `expandIcon` | `ReactNode \| ((props: NavMenuExpandIconProps) => ReactNode)` | Chevron icon | Custom submenu expand indicator. |
| `overflowedIndicator` | `ReactNode` | `···` icon | Custom overflow trigger in `horizontal` responsive mode. |
| `ariaLabel` | `string` | `'导航菜单'` | Accessible label on root menu. |
| `onClick` | `(info: { key, keyPath, domEvent }) => void` | `undefined` | Fired when any leaf item is activated. |
| `onSelect` / `onDeselect` | `(info: { key, keyPath, selectedKeys, domEvent }) => void` | `undefined` | Selection state change callbacks. |
| `onOpenChange` | `(openKeys: string[]) => void` | `undefined` | Submenu open state change callback. |

### 4.2 `NavMenuItem` Union Variants

- **Leaf (`NavMenuItemLeaf`)**: `{ type?: 'item', key, label, icon?, title?, extra?, disabled?, danger?, className?, style?, onClick? }`
- **SubMenu (`NavMenuSubMenuItem`)**: `{ type?: 'submenu', key, label, icon?, title?, disabled?, theme?, popupClassName?, popupOffset?, children, className?, style?, onTitleClick? }`
- **Group (`NavMenuItemGroup`)**: `{ type: 'group', key?, label?, children?, className?, style? }`
- **Divider (`NavMenuDividerItem`)**: `{ type: 'divider', key?, dashed?, className?, style? }`

---

## 5. Exported Pure Headless Utilities (`menuCore`)

Exported from `mui-pro-kit/nav-menu`:
`buildMenuTreeIndex`, `getKeyPath`, `getActiveAncestorKeys`, `computeNextSelectedKeys`, `computeNextOpenKeys`, `computeHorizontalOverflow`, `getNextFocusableKey`, `filterMenuItems`, `isDividerItem`, `isGroupItem`, `isSubMenuItem`, `isLeafItem`.
