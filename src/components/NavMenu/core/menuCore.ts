import type {
  NavMenuDividerItem,
  NavMenuItem,
  NavMenuItemGroup,
  NavMenuItemLeaf,
  NavMenuSubMenuItem,
} from '../types';

export function isDividerItem(item: NavMenuItem): item is NavMenuDividerItem {
  return item.type === 'divider';
}

export function isGroupItem(item: NavMenuItem): item is NavMenuItemGroup {
  return item.type === 'group';
}

export function isSubMenuItem(item: NavMenuItem): item is NavMenuSubMenuItem {
  return (
    !isDividerItem(item) &&
    !isGroupItem(item) &&
    Array.isArray((item as NavMenuSubMenuItem).children)
  );
}

export function isLeafItem(item: NavMenuItem): item is NavMenuItemLeaf {
  return !isDividerItem(item) && !isGroupItem(item) && !isSubMenuItem(item);
}

export interface MenuTreeIndex {
  /** Map of item key -> NavMenuItem (leaf or submenu) */
  itemByKey: Map<string, NavMenuItemLeaf | NavMenuSubMenuItem>;
  /** Direct parent submenu key (skipping transparent groups) */
  parentByKey: Map<string, string | null>;
  /** AntD-style keyPath: [selfKey, parentKey, ..., rootKey] */
  keyPathByKey: Map<string, string[]>;
  /** SubMenu nesting depth (root = 1, child submenu = 2, ...) */
  levelByKey: Map<string, number>;
  /** Ordered list of all leaf keys in tree traversal order */
  leafKeys: string[];
  /** Disabled item keys set */
  disabledKeys: Set<string>;
}

/**
 * Traverses the declarative `items` tree once and builds O(1) lookup tables
 * for `keyPath`, ancestor highlighting, accordion level resolution, and keyboard nav.
 */
export function buildMenuTreeIndex(items: readonly NavMenuItem[]): MenuTreeIndex {
  const itemByKey = new Map<string, NavMenuItemLeaf | NavMenuSubMenuItem>();
  const parentByKey = new Map<string, string | null>();
  const keyPathByKey = new Map<string, string[]>();
  const levelByKey = new Map<string, number>();
  const leafKeys: string[] = [];
  const disabledKeys = new Set<string>();

  const walk = (
    nodes: readonly NavMenuItem[],
    parentSubMenuKey: string | null,
    ancestorPath: string[],
    level: number,
  ) => {
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (!node || isDividerItem(node)) continue;

      if (isGroupItem(node)) {
        if (node.children && node.children.length > 0) {
          walk(node.children, parentSubMenuKey, ancestorPath, level);
        }
        continue;
      }

      const key = node.key;
      const nextPath = [key, ...ancestorPath];
      itemByKey.set(key, node);
      parentByKey.set(key, parentSubMenuKey);
      keyPathByKey.set(key, nextPath);
      levelByKey.set(key, level);
      if (node.disabled) {
        disabledKeys.add(key);
      }

      if (isSubMenuItem(node)) {
        walk(node.children, key, nextPath, level + 1);
      } else {
        leafKeys.push(key);
      }
    }
  };

  walk(items, null, [], 1);

  return {
    itemByKey,
    parentByKey,
    keyPathByKey,
    levelByKey,
    leafKeys,
    disabledKeys,
  };
}

/**
 * Returns Ant Design-compatible `keyPath` (`[key, parentKey, ..., rootKey]`).
 */
export function getKeyPath(index: MenuTreeIndex, key: string): string[] {
  return index.keyPathByKey.get(key) ?? [key];
}

/**
 * Returns a Set of all ancestor SubMenu keys for the currently selected keys
 * (used to highlight parent SubMenu titles when a descendant is selected).
 */
export function getActiveAncestorKeys(
  index: MenuTreeIndex,
  selectedKeys: readonly string[],
): Set<string> {
  const ancestors = new Set<string>();
  for (let i = 0; i < selectedKeys.length; i += 1) {
    const path = index.keyPathByKey.get(selectedKeys[i]);
    if (!path) continue;
    for (let j = 1; j < path.length; j += 1) {
      ancestors.add(path[j]);
    }
  }
  return ancestors;
}

export interface ComputeSelectedKeysResult {
  nextSelectedKeys: string[];
  action: 'select' | 'deselect' | 'noop';
}

/**
 * Computes next `selectedKeys` supporting single selection, multi-selection,
 * and `selectable: false` action-only menus.
 */
export function computeNextSelectedKeys(
  currentSelectedKeys: readonly string[],
  targetKey: string,
  options: { multiple?: boolean; selectable?: boolean },
): ComputeSelectedKeysResult {
  if (options.selectable === false) {
    return { nextSelectedKeys: [...currentSelectedKeys], action: 'noop' };
  }

  const alreadySelected = currentSelectedKeys.includes(targetKey);
  if (options.multiple) {
    if (alreadySelected) {
      return {
        nextSelectedKeys: currentSelectedKeys.filter((k) => k !== targetKey),
        action: 'deselect',
      };
    }
    return {
      nextSelectedKeys: [...currentSelectedKeys, targetKey],
      action: 'select',
    };
  }

  if (alreadySelected && currentSelectedKeys.length === 1) {
    return { nextSelectedKeys: [...currentSelectedKeys], action: 'select' };
  }

  return { nextSelectedKeys: [targetKey], action: 'select' };
}

/**
 * Computes next `openKeys` when toggling a SubMenu.
 * When `accordion` is true, mirrors Ant Design's official `getLevelKeys` pattern:
 * closing sibling branches at the same or deeper level while keeping ancestor chain open.
 */
export function computeNextOpenKeys(
  currentOpenKeys: readonly string[],
  targetKey: string,
  options: { accordion?: boolean; levelByKey: Map<string, number> },
): string[] {
  const isCurrentlyOpen = currentOpenKeys.includes(targetKey);
  if (isCurrentlyOpen) {
    return currentOpenKeys.filter((k) => k !== targetKey);
  }

  if (!options.accordion) {
    return [...currentOpenKeys, targetKey];
  }

  const targetLevel = options.levelByKey.get(targetKey) ?? 1;
  // Keep only strictly shallower ancestors (and remove siblings at same or deeper level)
  const retained = currentOpenKeys.filter((k) => {
    const lvl = options.levelByKey.get(k) ?? 1;
    return lvl < targetLevel;
  });

  return [...retained, targetKey];
}

export interface HorizontalOverflowResult {
  /** Number of leading top-level items that fit cleanly without overflowing */
  visibleCount: number;
  /** Whether the `···` overflow submenu button must be displayed */
  hasOverflow: boolean;
}

/**
 * Greedy horizontal responsive overflow layout engine matching Ant Design's
 * responsive top navigation bar (`ResizeObserver` -> `···` overflow submenu).
 */
export function computeHorizontalOverflow(
  itemWidths: readonly number[],
  containerWidth: number,
  overflowIndicatorWidth = 52,
  gapPx = 4,
): HorizontalOverflowResult {
  const totalItems = itemWidths.length;
  if (totalItems === 0 || containerWidth <= 0) {
    return { visibleCount: totalItems, hasOverflow: false };
  }

  // Fast path: check if all items fit without needing overflow button
  let totalWidth = 0;
  for (let i = 0; i < totalItems; i += 1) {
    totalWidth += itemWidths[i] + (i > 0 ? gapPx : 0);
  }
  if (totalWidth <= containerWidth) {
    return { visibleCount: totalItems, hasOverflow: false };
  }

  // Reserve room for the overflow indicator and fit as many leading items as possible
  const budget = Math.max(0, containerWidth - overflowIndicatorWidth - gapPx);
  let used = 0;
  let visibleCount = 0;
  for (let i = 0; i < totalItems; i += 1) {
    const nextUsed = used + itemWidths[i] + (i > 0 ? gapPx : 0);
    if (nextUsed > budget) break;
    used = nextUsed;
    visibleCount += 1;
  }

  return {
    visibleCount,
    hasOverflow: visibleCount < totalItems,
  };
}

/**
 * Circular keyboard focus traversal that skips disabled keys.
 */
export function getNextFocusableKey(
  orderedKeys: readonly string[],
  disabledKeys: ReadonlySet<string>,
  currentKey: string | null,
  direction: 'next' | 'prev' | 'first' | 'last',
): string | null {
  const len = orderedKeys.length;
  if (len === 0) return null;

  if (direction === 'first') {
    for (let i = 0; i < len; i += 1) {
      if (!disabledKeys.has(orderedKeys[i])) return orderedKeys[i];
    }
    return null;
  }

  if (direction === 'last') {
    for (let i = len - 1; i >= 0; i -= 1) {
      if (!disabledKeys.has(orderedKeys[i])) return orderedKeys[i];
    }
    return null;
  }

  const startIdx = currentKey !== null ? orderedKeys.indexOf(currentKey) : -1;
  if (startIdx === -1) {
    return direction === 'next'
      ? getNextFocusableKey(orderedKeys, disabledKeys, null, 'first')
      : getNextFocusableKey(orderedKeys, disabledKeys, null, 'last');
  }

  const step = direction === 'next' ? 1 : -1;
  for (let offset = 1; offset <= len; offset += 1) {
    const candidate = orderedKeys[(startIdx + step * offset + len) % len];
    if (!disabledKeys.has(candidate)) {
      return candidate;
    }
  }
  return null;
}

function extractText(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  return '';
}

/**
 * Filters a menu item tree by a search query while preserving matching ancestor SubMenus
 * and Groups, and returning the list of SubMenu keys that should auto-expand.
 */
export function filterMenuItems(
  items: readonly NavMenuItem[],
  query: string,
): { filteredItems: NavMenuItem[]; matchedOpenKeys: string[] } {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return { filteredItems: [...items], matchedOpenKeys: [] };
  }

  const matchedOpenKeys: string[] = [];

  const visit = (nodes: readonly NavMenuItem[]): NavMenuItem[] => {
    const out: NavMenuItem[] = [];
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (!node || isDividerItem(node)) continue;

      if (isGroupItem(node)) {
        const filteredChildren = node.children ? visit(node.children) : [];
        if (filteredChildren.length > 0) {
          out.push({ ...node, children: filteredChildren });
        }
        continue;
      }

      const labelText = (
        extractText(node.label) ||
        node.title ||
        node.key
      ).toLowerCase();
      const selfMatches = labelText.includes(normalized);

      if (isSubMenuItem(node)) {
        if (selfMatches) {
          matchedOpenKeys.push(node.key);
          out.push(node);
        } else {
          const filteredChildren = visit(node.children);
          if (filteredChildren.length > 0) {
            matchedOpenKeys.push(node.key);
            out.push({ ...node, children: filteredChildren });
          }
        }
      } else if (selfMatches) {
        out.push(node);
      }
    }
    return out;
  };

  return {
    filteredItems: visit(items),
    matchedOpenKeys,
  };
}
