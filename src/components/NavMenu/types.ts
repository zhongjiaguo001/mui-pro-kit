import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react';

export type NavMenuMode = 'vertical' | 'horizontal' | 'inline';
export type NavMenuTheme = 'light' | 'dark';
export type NavMenuTriggerSubMenuAction = 'hover' | 'click';

export interface NavMenuInfo {
  key: string;
  keyPath: string[];
  domEvent: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>;
}

export interface NavMenuSelectInfo extends NavMenuInfo {
  selectedKeys: string[];
}

export interface NavMenuTitleEventInfo {
  key: string;
  domEvent: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>;
}

export interface NavMenuItemLeaf {
  type?: 'item';
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  title?: string;
  extra?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: (info: NavMenuInfo) => void;
}

export interface NavMenuSubMenuItem {
  type?: 'submenu';
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  title?: string;
  disabled?: boolean;
  theme?: NavMenuTheme;
  popupClassName?: string;
  popupOffset?: [number, number];
  children: NavMenuItem[];
  className?: string;
  style?: CSSProperties;
  onTitleClick?: (info: NavMenuTitleEventInfo) => void;
}

export interface NavMenuItemGroup {
  type: 'group';
  key?: string;
  label?: ReactNode;
  children?: NavMenuItem[];
  className?: string;
  style?: CSSProperties;
}

export interface NavMenuDividerItem {
  type: 'divider';
  key?: string;
  dashed?: boolean;
  className?: string;
  style?: CSSProperties;
}

export type NavMenuItem =
  | NavMenuItemLeaf
  | NavMenuSubMenuItem
  | NavMenuItemGroup
  | NavMenuDividerItem;

export interface NavMenuExpandIconProps {
  isOpen?: boolean;
  isSubMenu?: boolean;
  disabled?: boolean;
  mode?: NavMenuMode;
}

export interface NavMenuProps {
  /** Declarative Ant Design v5-compatible menu item tree */
  items: NavMenuItem[];
  /** Navigation layout mode */
  mode?: NavMenuMode;
  /** Color theme ('light' | 'dark') */
  theme?: NavMenuTheme;
  /** Controlled selected menu item keys */
  selectedKeys?: string[];
  /** Initial selected keys for uncontrolled usage */
  defaultSelectedKeys?: string[];
  /** Controlled expanded SubMenu keys */
  openKeys?: string[];
  /** Initial open SubMenu keys for uncontrolled usage */
  defaultOpenKeys?: string[];
  /** Collapse inline sidebar into icon rail with hover/click flyout popups */
  inlineCollapsed?: boolean;
  /** Indentation per nesting level in inline mode (px) */
  inlineIndent?: number;
  /** Accordion mode: keep only the active ancestor chain expanded */
  accordion?: boolean;
  /** Allow selecting multiple items */
  multiple?: boolean;
  /** Allow items to be selected (set false for pure action menus) */
  selectable?: boolean;
  /** How popup submenus open in horizontal / vertical / inlineCollapsed modes */
  triggerSubMenuAction?: NavMenuTriggerSubMenuAction;
  /** Hover open delay for popup submenus in seconds (AntD convention) */
  subMenuOpenDelay?: number;
  /** Hover close delay for popup submenus in seconds (AntD convention) */
  subMenuCloseDelay?: number;
  /** Custom expand/collapse chevron renderer */
  expandIcon?: ReactNode | ((props: NavMenuExpandIconProps) => ReactNode);
  /** Custom overflow indicator for horizontal responsive mode */
  overflowedIndicator?: ReactNode;
  /** Accessible label for the root menu */
  ariaLabel?: string;
  /** Optional root class name */
  className?: string;
  /** Optional root inline styles */
  style?: CSSProperties;
  /** Fired when any leaf menu item is clicked */
  onClick?: (info: NavMenuInfo) => void;
  /** Fired when an item is selected */
  onSelect?: (info: NavMenuSelectInfo) => void;
  /** Fired when an item is deselected (when multiple={true}) */
  onDeselect?: (info: NavMenuSelectInfo) => void;
  /** Fired when open SubMenu keys change */
  onOpenChange?: (openKeys: string[]) => void;
}
