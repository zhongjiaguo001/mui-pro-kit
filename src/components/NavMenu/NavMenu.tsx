import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Box,
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {
  buildMenuTreeIndex,
  computeHorizontalOverflow,
  computeNextOpenKeys,
  computeNextSelectedKeys,
  getActiveAncestorKeys,
  getKeyPath,
  getNextFocusableKey,
  isDividerItem,
  isGroupItem,
  isSubMenuItem,
} from './core/menuCore';
import {
  NavMenuPopupSubMenu,
  type PopupMenuSharedContext,
} from './NavMenuPopupSubMenu';
import { NAV_MENU_PALETTES } from './themeTokens';
import type {
  NavMenuExpandIconProps,
  NavMenuItem,
  NavMenuItemLeaf,
  NavMenuProps,
  NavMenuSubMenuItem,
} from './types';

function renderInlineExpandIcon(
  expandIcon: NavMenuProps['expandIcon'],
  props: NavMenuExpandIconProps,
) {
  if (typeof expandIcon === 'function') {
    return expandIcon(props);
  }
  if (expandIcon !== undefined) {
    return expandIcon;
  }
  return (
    <KeyboardArrowDownIcon
      sx={{
        fontSize: 17,
        opacity: 0.72,
        transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        transform: props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      }}
    />
  );
}

/**
 * Ant Design v5-compatible Navigation Menu implemented cleanly with Material UI v7.
 * Supports `inline` (with smooth Collapse, accordion, and `inlineCollapsed` icon rail),
 * `vertical` (cascading right-side Popper flyouts), `horizontal` (top bar with
 * ResizeObserver responsive `···` overflow), `light` / `dark` themes, `multiple`
 * selection, `group` / `divider`, `danger` / `disabled` / `extra`, and WAI-ARIA keyboard nav.
 */
export const NavMenu: React.FC<NavMenuProps> = ({
  items,
  mode = 'inline',
  theme = 'light',
  selectedKeys: controlledSelectedKeys,
  defaultSelectedKeys = [],
  openKeys: controlledOpenKeys,
  defaultOpenKeys = [],
  inlineCollapsed = false,
  inlineIndent = 24,
  accordion = false,
  multiple = false,
  selectable = true,
  triggerSubMenuAction = 'hover',
  subMenuOpenDelay = 0.08,
  subMenuCloseDelay = 0.14,
  expandIcon,
  overflowedIndicator,
  ariaLabel = '导航菜单',
  className,
  style,
  onClick,
  onSelect,
  onDeselect,
  onOpenChange,
}) => {
  const palette = NAV_MENU_PALETTES[theme];
  const isCollapsedRail = mode === 'inline' && inlineCollapsed;
  const effectiveMode = isCollapsedRail ? 'vertical' : mode;

  // Build O(1) tree index once per items change
  const treeIndex = useMemo(() => buildMenuTreeIndex(items), [items]);

  // Controlled / uncontrolled selectedKeys
  const [internalSelectedKeys, setInternalSelectedKeys] =
    useState<string[]>(defaultSelectedKeys);
  const selectedKeys = controlledSelectedKeys ?? internalSelectedKeys;
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const ancestorSet = useMemo(
    () => getActiveAncestorKeys(treeIndex, selectedKeys),
    [treeIndex, selectedKeys],
  );

  // Controlled / uncontrolled openKeys
  const [internalOpenKeys, setInternalOpenKeys] =
    useState<string[]>(defaultOpenKeys);
  const openKeys = controlledOpenKeys ?? internalOpenKeys;
  const openSet = useMemo(() => new Set(openKeys), [openKeys]);

  const updateOpenKeys = useCallback(
    (next: string[]) => {
      if (controlledOpenKeys === undefined) {
        setInternalOpenKeys(next);
      }
      onOpenChange?.(next);
    },
    [controlledOpenKeys, onOpenChange],
  );

  // Preserve openKeys across inlineCollapsed transitions just like Ant Design:
  // hovering ephemeral collapsed-rail popups never pollutes inline openKeys,
  // and expanding restores the exact pre-collapse openKeys.
  const savedOpenKeysRef = useRef<string[]>(openKeys);
  const prevCollapsedRailRef = useRef<boolean>(isCollapsedRail);
  useEffect(() => {
    const wasCollapsed = prevCollapsedRailRef.current;
    prevCollapsedRailRef.current = isCollapsedRail;

    if (!wasCollapsed && !isCollapsedRail) {
      savedOpenKeysRef.current = openKeys;
      return;
    }

    if (wasCollapsed && !isCollapsedRail) {
      const saved = savedOpenKeysRef.current;
      const differs =
        saved.length !== openKeys.length ||
        saved.some((k, idx) => openKeys[idx] !== k);
      if (differs) {
        updateOpenKeys(saved);
      }
    }
  }, [isCollapsedRail, openKeys, updateOpenKeys]);

  const handleToggleInlineSubMenu = useCallback(
    (
      item: NavMenuSubMenuItem,
      domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    ) => {
      if (item.disabled) return;
      item.onTitleClick?.({ key: item.key, domEvent });
      const next = computeNextOpenKeys(openKeys, item.key, {
        accordion,
        levelByKey: treeIndex.levelByKey,
      });
      updateOpenKeys(next);
    },
    [accordion, openKeys, treeIndex.levelByKey, updateOpenKeys],
  );

  const handlePopupOpenChange = useCallback(
    (key: string, nextOpen: boolean) => {
      // Ephemeral flyouts in collapsed icon-rail mode must not overwrite saved inline openKeys
      if (isCollapsedRail) return;
      if (nextOpen) {
        if (!openKeys.includes(key)) {
          updateOpenKeys([...openKeys, key]);
        }
      } else if (openKeys.includes(key)) {
        updateOpenKeys(openKeys.filter((k) => k !== key));
      }
    },
    [isCollapsedRail, openKeys, updateOpenKeys],
  );

  const handleLeafActivate = useCallback(
    (
      item: NavMenuItemLeaf,
      domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    ) => {
      if (item.disabled) return;
      const keyPath = getKeyPath(treeIndex, item.key);
      const baseInfo = { key: item.key, keyPath, domEvent };
      item.onClick?.(baseInfo);
      onClick?.(baseInfo);

      const { nextSelectedKeys, action } = computeNextSelectedKeys(
        selectedKeys,
        item.key,
        { multiple, selectable },
      );

      if (action === 'noop') return;

      if (controlledSelectedKeys === undefined) {
        setInternalSelectedKeys(nextSelectedKeys);
      }
      if (action === 'select') {
        onSelect?.({ ...baseInfo, selectedKeys: nextSelectedKeys });
      } else if (action === 'deselect') {
        onDeselect?.({ ...baseInfo, selectedKeys: nextSelectedKeys });
      }
    },
    [
      controlledSelectedKeys,
      multiple,
      onClick,
      onDeselect,
      onSelect,
      selectable,
      selectedKeys,
      treeIndex,
    ],
  );

  const sharedPopupContext = useMemo<PopupMenuSharedContext>(
    () => ({
      theme,
      selectedSet,
      ancestorSet,
      triggerSubMenuAction,
      subMenuOpenDelayMs: Math.max(0, Math.round(subMenuOpenDelay * 1000)),
      subMenuCloseDelayMs: Math.max(0, Math.round(subMenuCloseDelay * 1000)),
      expandIcon,
      onLeafActivate: handleLeafActivate,
      onPopupOpenChange: handlePopupOpenChange,
    }),
    [
      ancestorSet,
      expandIcon,
      handleLeafActivate,
      handlePopupOpenChange,
      selectedSet,
      subMenuCloseDelay,
      subMenuOpenDelay,
      theme,
      triggerSubMenuAction,
    ],
  );

  // Horizontal responsive overflow measurement (`ResizeObserver` + hidden measurement mirror)
  const horizontalContainerRef = useRef<HTMLDivElement | null>(null);
  const measureMirrorRef = useRef<HTMLDivElement | null>(null);
  const [overflowState, setOverflowState] = useState<{
    visibleCount: number;
    hasOverflow: boolean;
  }>({ visibleCount: items.length, hasOverflow: false });

  const recomputeHorizontalOverflow = useCallback(() => {
    if (effectiveMode !== 'horizontal') return;
    const container = horizontalContainerRef.current;
    const mirror = measureMirrorRef.current;
    if (!container || !mirror) return;

    const containerWidth = container.clientWidth;
    const childEls = Array.from(
      mirror.querySelectorAll<HTMLElement>('[data-measure-index]'),
    );
    const widths = childEls.map((el) => Math.ceil(el.getBoundingClientRect().width));
    const result = computeHorizontalOverflow(widths, containerWidth, 48, 4);
    setOverflowState((prev) =>
      prev.visibleCount === result.visibleCount &&
      prev.hasOverflow === result.hasOverflow
        ? prev
        : result,
    );
  }, [effectiveMode]);

  useLayoutEffect(() => {
    if (effectiveMode !== 'horizontal') return;
    recomputeHorizontalOverflow();
  }, [effectiveMode, items, recomputeHorizontalOverflow]);

  useEffect(() => {
    if (effectiveMode !== 'horizontal') return;
    const container = horizontalContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      recomputeHorizontalOverflow();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [effectiveMode, recomputeHorizontalOverflow]);

  // Root keyboard navigation (ArrowUp/Down/Left/Right, Home, End)
  const rootListRef = useRef<HTMLUListElement | null>(null);
  const handleRootKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      const container = rootListRef.current;
      if (!container) return;

      const isHoriz = effectiveMode === 'horizontal';
      const nextKey = isHoriz ? 'ArrowRight' : 'ArrowDown';
      const prevKey = isHoriz ? 'ArrowLeft' : 'ArrowUp';

      if (
        e.key !== nextKey &&
        e.key !== prevKey &&
        e.key !== 'Home' &&
        e.key !== 'End'
      ) {
        return;
      }

      const focusableEls = Array.from(
        container.querySelectorAll<HTMLElement>(
          '[role="menuitem"][data-menu-key]',
        ),
      ).filter((el) => el.offsetParent !== null);

      const orderedKeys = focusableEls
        .map((el) => el.getAttribute('data-menu-key'))
        .filter((k): k is string => Boolean(k));
      const activeKey =
        document.activeElement?.getAttribute('data-menu-key') ?? null;

      const dir =
        e.key === 'Home'
          ? 'first'
          : e.key === 'End'
            ? 'last'
            : e.key === nextKey
              ? 'next'
              : 'prev';

      const targetKey = getNextFocusableKey(
        orderedKeys,
        treeIndex.disabledKeys,
        activeKey,
        dir,
      );
      if (!targetKey) return;

      const targetEl = focusableEls.find(
        (el) => el.getAttribute('data-menu-key') === targetKey,
      );
      if (targetEl) {
        e.preventDefault();
        targetEl.focus();
      }
    },
    [effectiveMode, treeIndex.disabledKeys],
  );

  // === HORIZONTAL MODE RENDER ===
  if (effectiveMode === 'horizontal') {
    const visibleItems = overflowState.hasOverflow
      ? items.slice(0, overflowState.visibleCount)
      : items;
    const overflowItems = overflowState.hasOverflow
      ? items.slice(overflowState.visibleCount)
      : [];

    const overflowSubMenu: NavMenuSubMenuItem | null =
      overflowItems.length > 0
        ? {
            key: '__nav_menu_overflow__',
            label: '更多菜单',
            children: overflowItems,
          }
        : null;

    const renderHorizontalLeaf = (
      item: NavMenuItemLeaf,
      measureIdx?: number,
    ) => {
      const isSelected = selectedSet.has(item.key);
      const isDanger = Boolean(item.danger);
      const isDisabled = Boolean(item.disabled);
      return (
        <ListItemButton
          key={item.key}
          role={measureIdx === undefined ? 'menuitem' : undefined}
          data-menu-key={measureIdx === undefined ? item.key : undefined}
          data-measure-index={measureIdx}
          disabled={isDisabled}
          selected={isSelected}
          aria-current={isSelected ? 'page' : undefined}
          title={
            item.title ??
            (typeof item.label === 'string' ? item.label : undefined)
          }
          onClick={
            measureIdx === undefined
              ? (e) => handleLeafActivate(item, e)
              : undefined
          }
          sx={{
            position: 'relative',
            flex: '0 0 auto',
            height: 46,
            px: 1.35,
            py: 0,
            borderRadius: 0,
            whiteSpace: 'nowrap',
            color: isDisabled
              ? palette.disabledText
              : isDanger
                ? palette.dangerText
                : isSelected
                  ? theme === 'dark'
                    ? '#FFFFFF'
                    : palette.itemSelectedText
                  : palette.text,
            bgcolor:
              isSelected && theme === 'dark'
                ? isDanger
                  ? palette.dangerSelectedBg
                  : palette.itemSelectedBg
                : 'transparent',
            transition: 'color 140ms ease, background-color 140ms ease',
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 12,
              right: 12,
              bottom: 0,
              height: '2px',
              bgcolor:
                isSelected && theme === 'light'
                  ? isDanger
                    ? palette.dangerText
                    : palette.activeIndicator
                  : 'transparent',
              transition: 'background-color 160ms ease',
            },
            '&:hover': isDisabled
              ? undefined
              : {
                  bgcolor:
                    theme === 'dark'
                      ? isSelected
                        ? isDanger
                          ? palette.dangerSelectedBg
                          : palette.itemSelectedBg
                        : palette.itemHoverBg
                      : 'transparent',
                  color: isDanger
                    ? theme === 'dark' && isSelected
                      ? '#FFFFFF'
                      : palette.dangerText
                    : theme === 'dark'
                      ? '#FFFFFF'
                      : palette.itemSelectedText,
                  '&::after': {
                    bgcolor:
                      theme === 'light'
                        ? isDanger
                          ? palette.dangerText
                          : palette.activeIndicator
                        : 'transparent',
                  },
                },
            '&.Mui-selected': {
              bgcolor:
                theme === 'dark'
                  ? isDanger
                    ? palette.dangerSelectedBg
                    : palette.itemSelectedBg
                  : 'transparent',
              '&:hover': {
                bgcolor:
                  theme === 'dark'
                    ? isDanger
                      ? palette.dangerSelectedBg
                      : palette.itemSelectedBg
                    : 'transparent',
              },
            },
          }}
        >
          {item.icon && (
            <ListItemIcon
              sx={{
                minWidth: 24,
                color: 'inherit',
                '& svg': { fontSize: 17 },
              }}
            >
              {item.icon}
            </ListItemIcon>
          )}
          <ListItemText
            primary={item.label}
            slotProps={{
              primary: {
                sx: {
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 600 : 500,
                  whiteSpace: 'nowrap',
                },
              },
            }}
          />
        </ListItemButton>
      );
    };

    return (
      <Box
        ref={horizontalContainerRef}
        className={className}
        style={style}
        data-menu-mode="horizontal"
        data-menu-theme={theme}
        sx={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          bgcolor: palette.bg,
          borderBottom: `1px solid ${palette.borderColor}`,
        }}
      >
        {/* Offscreen measurement mirror for exact ResizeObserver overflow calculation */}
        <Box
          ref={measureMirrorRef}
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            visibility: 'hidden',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            height: 0,
            overflow: 'hidden',
          }}
        >
          {items.map((item, idx) => {
            if (isDividerItem(item) || isGroupItem(item)) {
              return (
                <Box
                  key={`m-${idx}`}
                  data-measure-index={idx}
                  sx={{ width: 8, flexShrink: 0 }}
                />
              );
            }
            if (isSubMenuItem(item)) {
              return (
                <Box
                  key={`m-${item.key}`}
                  data-measure-index={idx}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: 1.35,
                    height: 46,
                    gap: 0.75,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.icon && <Box sx={{ width: 20, height: 17 }} />}
                  <span>{item.label}</span>
                  <Box sx={{ width: 18, height: 16 }} />
                </Box>
              );
            }
            return renderHorizontalLeaf(item, idx);
          })}
        </Box>

        <List
          ref={rootListRef}
          component="ul"
          role="menubar"
          aria-label={ariaLabel}
          disablePadding
          onKeyDown={handleRootKeyDown}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            width: '100%',
            minHeight: 46,
          }}
        >
          {visibleItems.map((item, idx) => {
            if (isDividerItem(item)) {
              return (
                <Divider
                  key={item.key ?? `h-div-${idx}`}
                  orientation="vertical"
                  flexItem
                  sx={{
                    my: 1.5,
                    mx: 0.5,
                    borderColor: palette.dividerColor,
                    borderStyle: item.dashed ? 'dashed' : 'solid',
                  }}
                />
              );
            }
            if (isGroupItem(item)) {
              return null;
            }
            if (isSubMenuItem(item)) {
              return (
                <NavMenuPopupSubMenu
                  key={item.key}
                  item={item}
                  placement="bottom-start"
                  mode="horizontal"
                  isRootHorizontal
                  shared={sharedPopupContext}
                />
              );
            }
            return renderHorizontalLeaf(item);
          })}

          {overflowSubMenu && (
            <NavMenuPopupSubMenu
              key="__nav_menu_overflow__"
              item={overflowSubMenu}
              placement="bottom-start"
              mode="horizontal"
              isRootHorizontal
              isOverflowTrigger
              shared={sharedPopupContext}
              customTriggerContent={
                <Box
                  component="span"
                  data-testid="nav-menu-overflow-trigger"
                  aria-label="更多导航项"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {overflowedIndicator ?? <MoreHorizIcon sx={{ fontSize: 20 }} />}
                </Box>
              }
            />
          )}
        </List>
      </Box>
    );
  }

  // === VERTICAL & INLINE (EXPANDED OR COLLAPSED RAIL) RENDER ===
  const renderVerticalOrInlineNodes = (
    nodes: readonly NavMenuItem[],
    level: number,
  ): React.ReactNode =>
    nodes.map((item, idx) => {
      if (isDividerItem(item)) {
        return (
          <Divider
            key={item.key ?? `v-div-${level}-${idx}`}
            sx={{
              my: 0.75,
              mx: isCollapsedRail ? 1.5 : 1.5,
              borderColor: palette.dividerColor,
              borderStyle: item.dashed ? 'dashed' : 'solid',
            }}
          />
        );
      }

      if (isGroupItem(item)) {
        return (
          <Box
            key={item.key ?? `v-grp-${level}-${idx}`}
            component="li"
            sx={{ listStyle: 'none', my: 0.5 }}
          >
            {!isCollapsedRail && item.label && (
              <Typography
                component="div"
                sx={{
                  pl: `${Math.max(16, (level - 1) * inlineIndent + 16)}px`,
                  pr: 2,
                  py: 0.75,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: palette.groupTitleText,
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.label}
              </Typography>
            )}
            {isCollapsedRail && (
              <Divider
                sx={{
                  my: 0.75,
                  mx: 2,
                  borderColor: palette.dividerColor,
                }}
              />
            )}
            {item.children && (
              <List component="ul" disablePadding>
                {renderVerticalOrInlineNodes(item.children, level)}
              </List>
            )}
          </Box>
        );
      }

      // SubMenu branch
      if (isSubMenuItem(item)) {
        if (effectiveMode === 'vertical' || isCollapsedRail) {
          return (
            <Box key={item.key} component="li" sx={{ listStyle: 'none' }}>
              <NavMenuPopupSubMenu
                item={item}
                placement="right-start"
                mode={mode}
                isCollapsedRail={isCollapsedRail}
                shared={sharedPopupContext}
              />
            </Box>
          );
        }

        const isOpen = openSet.has(item.key);
        const hasSelectedDescendant = ancestorSet.has(item.key);
        const paddingLeft = level === 1 ? 16 : (level - 1) * inlineIndent + 16;

        return (
          <Box key={item.key} component="li" sx={{ listStyle: 'none' }}>
            <ListItemButton
              role="menuitem"
              data-menu-key={item.key}
              data-submenu-trigger="true"
              disabled={item.disabled}
              aria-expanded={isOpen}
              aria-haspopup="menu"
              title={
                item.title ??
                (typeof item.label === 'string' ? item.label : undefined)
              }
              onClick={(e) => handleToggleInlineSubMenu(item, e)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggleInlineSubMenu(item, e);
                } else if (e.key === 'ArrowRight' && !isOpen) {
                  e.preventDefault();
                  handleToggleInlineSubMenu(item, e);
                } else if (e.key === 'ArrowLeft' && isOpen) {
                  e.preventDefault();
                  handleToggleInlineSubMenu(item, e);
                }
              }}
              sx={{
                mx: 0.75,
                my: 0.25,
                pl: `${paddingLeft}px`,
                pr: 1.5,
                py: 0.65,
                minHeight: 38,
                borderRadius: '6px',
                color: item.disabled
                  ? palette.disabledText
                  : hasSelectedDescendant
                    ? palette.ancestorSelectedText
                    : palette.text,
                transition: 'background-color 140ms ease, color 140ms ease',
                '&:hover': item.disabled
                  ? undefined
                  : {
                      bgcolor: palette.itemHoverBg,
                      color: palette.textHover,
                    },
              }}
            >
              {item.icon && (
                <ListItemIcon
                  sx={{
                    minWidth: 28,
                    color: 'inherit',
                    '& svg': { fontSize: 18 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
              )}
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: '0.875rem',
                      fontWeight: hasSelectedDescendant ? 600 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  },
                }}
              />
              <Box
                component="span"
                sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
              >
                {renderInlineExpandIcon(expandIcon, {
                  isOpen,
                  isSubMenu: true,
                  disabled: item.disabled,
                  mode,
                })}
              </Box>
            </ListItemButton>

            <Collapse in={isOpen} timeout={180} unmountOnExit>
              <List
                component="ul"
                role="menu"
                disablePadding
                sx={{
                  bgcolor:
                    theme === 'dark' ? palette.subMenuBg : 'transparent',
                  py: 0.25,
                }}
              >
                {renderVerticalOrInlineNodes(item.children, level + 1)}
              </List>
            </Collapse>
          </Box>
        );
      }

      // Leaf item
      const isSelected = selectedSet.has(item.key);
      const isDanger = Boolean(item.danger);
      const isDisabled = Boolean(item.disabled);
      const paddingLeft = isCollapsedRail
        ? 0
        : level === 1
          ? 16
          : (level - 1) * inlineIndent + 16;

      const leafButton = (
        <ListItemButton
          role="menuitem"
          data-menu-key={item.key}
          disabled={isDisabled}
          selected={isSelected}
          aria-current={isSelected ? 'page' : undefined}
          title={
            !isCollapsedRail
              ? (item.title ??
                (typeof item.label === 'string' ? item.label : undefined))
              : undefined
          }
          onClick={(e) => handleLeafActivate(item, e)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLeafActivate(item, e);
            }
          }}
          sx={{
            position: 'relative',
            mx: 0.75,
            my: 0.25,
            pl: isCollapsedRail ? 0 : `${paddingLeft}px`,
            pr: isCollapsedRail ? 0 : 1.5,
            py: 0.65,
            minHeight: 38,
            borderRadius: '6px',
            justifyContent: isCollapsedRail ? 'center' : 'flex-start',
            color: isDisabled
              ? palette.disabledText
              : isDanger
                ? isSelected
                  ? '#FFFFFF'
                  : palette.dangerText
                : isSelected
                  ? palette.itemSelectedText
                  : palette.text,
            bgcolor: isSelected
              ? isDanger
                ? palette.dangerSelectedBg
                : palette.itemSelectedBg
              : 'transparent',
            transition: 'background-color 140ms ease, color 140ms ease',
            '&:hover': isDisabled
              ? undefined
              : {
                  bgcolor: isDanger
                    ? isSelected
                      ? palette.dangerSelectedBg
                      : palette.dangerHoverBg
                    : isSelected
                      ? palette.itemSelectedBg
                      : palette.itemHoverBg,
                  color: isDanger
                    ? isSelected
                      ? '#FFFFFF'
                      : palette.dangerText
                    : isSelected
                      ? palette.itemSelectedText
                      : palette.textHover,
                },
            '&.Mui-selected': {
              bgcolor: isDanger
                ? palette.dangerSelectedBg
                : palette.itemSelectedBg,
              '&:hover': {
                bgcolor: isDanger
                  ? palette.dangerSelectedBg
                  : palette.itemSelectedBg,
              },
            },
          }}
        >
          {item.icon && (
            <ListItemIcon
              sx={{
                minWidth: isCollapsedRail ? 'auto' : 28,
                color: 'inherit',
                justifyContent: 'center',
                '& svg': { fontSize: isCollapsedRail ? 20 : 18 },
              }}
            >
              {item.icon}
            </ListItemIcon>
          )}
          {!isCollapsedRail && (
            <ListItemText
              primary={item.label}
              slotProps={{
                primary: {
                  sx: {
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                },
              }}
            />
          )}
          {!isCollapsedRail && item.extra && (
            <Box
              component="span"
              sx={{
                ml: 1.5,
                fontSize: '0.75rem',
                color: isSelected ? 'inherit' : palette.textMuted,
                opacity: isSelected ? 0.85 : 1,
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                flexShrink: 0,
              }}
            >
              {item.extra}
            </Box>
          )}
        </ListItemButton>
      );

      if (isCollapsedRail) {
        const tooltipLabel =
          item.title ?? (typeof item.label === 'string' ? item.label : item.key);
        return (
          <Box key={item.key} component="li" sx={{ listStyle: 'none' }}>
            <Tooltip title={tooltipLabel} placement="right" arrow>
              <span>{leafButton}</span>
            </Tooltip>
          </Box>
        );
      }

      return (
        <Box key={item.key} component="li" sx={{ listStyle: 'none' }}>
          {leafButton}
        </Box>
      );
    });

  return (
    <Box
      className={className}
      style={style}
      data-menu-mode={mode}
      data-menu-collapsed={isCollapsedRail ? 'true' : 'false'}
      data-menu-theme={theme}
      sx={{
        width: isCollapsedRail ? 68 : '100%',
        bgcolor: palette.bg,
        borderRight: `1px solid ${palette.borderColor}`,
        py: 1,
        transition: 'width 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        overflowX: 'hidden',
      }}
    >
      <List
        ref={rootListRef}
        component="ul"
        role="menu"
        aria-label={ariaLabel}
        disablePadding
        onKeyDown={handleRootKeyDown}
      >
        {renderVerticalOrInlineNodes(items, 1)}
      </List>
    </Box>
  );
};
