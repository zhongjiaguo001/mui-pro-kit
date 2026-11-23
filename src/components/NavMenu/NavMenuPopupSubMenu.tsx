import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  ClickAwayListener,
  Divider,
  Grow,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { NAV_MENU_PALETTES } from './themeTokens';
import { isDividerItem, isGroupItem, isSubMenuItem } from './core/menuCore';
import type {
  NavMenuExpandIconProps,
  NavMenuItem,
  NavMenuItemLeaf,
  NavMenuMode,
  NavMenuSubMenuItem,
  NavMenuTheme,
  NavMenuTriggerSubMenuAction,
} from './types';

export interface PopupMenuSharedContext {
  theme: NavMenuTheme;
  selectedSet: ReadonlySet<string>;
  ancestorSet: ReadonlySet<string>;
  triggerSubMenuAction: NavMenuTriggerSubMenuAction;
  subMenuOpenDelayMs: number;
  subMenuCloseDelayMs: number;
  expandIcon?: React.ReactNode | ((props: NavMenuExpandIconProps) => React.ReactNode);
  onLeafActivate: (
    item: NavMenuItemLeaf,
    domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
  ) => void;
  onSubMenuTitleClick?: (
    item: NavMenuSubMenuItem,
    domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
  ) => void;
  onPopupOpenChange?: (key: string, open: boolean) => void;
}

interface NavMenuPopupSubMenuProps {
  item: NavMenuSubMenuItem;
  placement: 'bottom-start' | 'right-start';
  mode: NavMenuMode;
  isRootHorizontal?: boolean;
  isCollapsedRail?: boolean;
  isOverflowTrigger?: boolean;
  shared: PopupMenuSharedContext;
  closeParentPopup?: () => void;
  customTriggerContent?: React.ReactNode;
}

function renderExpandChevron(
  expandIcon: PopupMenuSharedContext['expandIcon'],
  props: NavMenuExpandIconProps,
  isHorizontalRoot: boolean,
) {
  if (typeof expandIcon === 'function') {
    return expandIcon(props);
  }
  if (expandIcon !== undefined) {
    return expandIcon;
  }
  if (isHorizontalRoot) {
    return (
      <KeyboardArrowDownIcon
        sx={{
          fontSize: 16,
          ml: 0.25,
          transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          transform: props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      />
    );
  }
  return (
    <KeyboardArrowRightIcon
      sx={{
        fontSize: 16,
        opacity: 0.72,
      }}
    />
  );
}

/**
 * MUI Popper-based cascading flyout SubMenu supporting:
 * - Horizontal top dropdowns (`bottom-start`) + nested right flyouts (`right-start`)
 * - Vertical flyout menus & collapsed inline icon-rail flyouts
 * - Hover-intent open/close timers + click trigger mode + Escape/ClickAway dismissal
 */
export const NavMenuPopupSubMenu: React.FC<NavMenuPopupSubMenuProps> = ({
  item,
  placement,
  mode,
  isRootHorizontal = false,
  isCollapsedRail = false,
  isOverflowTrigger = false,
  shared,
  closeParentPopup,
  customTriggerContent,
}) => {
  const effectiveTheme = item.theme ?? shared.theme;
  const palette = NAV_MENU_PALETTES[effectiveTheme];
  const triggerPalette = NAV_MENU_PALETTES[shared.theme];

  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const setOpenWithNotify = useCallback(
    (next: boolean) => {
      if (openRef.current === next) return;
      openRef.current = next;
      setOpen(next);
      shared.onPopupOpenChange?.(item.key, next);
    },
    [item.key, shared],
  );

  const scheduleOpen = useCallback(() => {
    if (item.disabled) return;
    clearTimers();
    if (shared.subMenuOpenDelayMs <= 0) {
      setOpenWithNotify(true);
      return;
    }
    openTimerRef.current = window.setTimeout(() => {
      setOpenWithNotify(true);
    }, shared.subMenuOpenDelayMs);
  }, [clearTimers, item.disabled, setOpenWithNotify, shared.subMenuOpenDelayMs]);

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimerRef.current = window.setTimeout(() => {
      setOpenWithNotify(false);
    }, shared.subMenuCloseDelayMs);
  }, [clearTimers, setOpenWithNotify, shared.subMenuCloseDelayMs]);

  const closeImmediately = useCallback(() => {
    clearTimers();
    setOpenWithNotify(false);
  }, [clearTimers, setOpenWithNotify]);

  // Dismiss any open hover/click popup on Escape even when focus is outside the trigger
  useEffect(() => {
    if (!open) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeImmediately();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [closeImmediately, open]);

  const handleCloseChain = useCallback(() => {
    closeImmediately();
    closeParentPopup?.();
  }, [closeImmediately, closeParentPopup]);

  const isHoverMode = shared.triggerSubMenuAction === 'hover';
  const hasSelectedDescendant = shared.ancestorSet.has(item.key);
  const [offsetX, offsetY] = item.popupOffset ?? (placement === 'bottom-start' ? [0, 6] : [6, 0]);

  const renderPopupItems = (nodes: NavMenuItem[], depth: number): React.ReactNode =>
    nodes.map((child, idx) => {
      if (isDividerItem(child)) {
        return (
          <Divider
            key={child.key ?? `div-${depth}-${idx}`}
            sx={{
              my: 0.75,
              borderColor: palette.dividerColor,
              borderStyle: child.dashed ? 'dashed' : 'solid',
            }}
          />
        );
      }

      if (isGroupItem(child)) {
        return (
          <Box key={child.key ?? `grp-${depth}-${idx}`} sx={{ py: 0.25 }}>
            {child.label && (
              <Typography
                component="div"
                sx={{
                  px: 1.75,
                  py: 0.75,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: palette.groupTitleText,
                  userSelect: 'none',
                }}
              >
                {child.label}
              </Typography>
            )}
            {child.children && renderPopupItems(child.children, depth + 1)}
          </Box>
        );
      }

      if (isSubMenuItem(child)) {
        return (
          <NavMenuPopupSubMenu
            key={child.key}
            item={child}
            placement="right-start"
            mode="vertical"
            shared={shared}
            closeParentPopup={handleCloseChain}
          />
        );
      }

      const isSelected = shared.selectedSet.has(child.key);
      const isDanger = Boolean(child.danger);
      const isDisabled = Boolean(child.disabled);

      return (
        <ListItemButton
          key={child.key}
          role="menuitem"
          data-menu-key={child.key}
          disabled={isDisabled}
          selected={isSelected}
          aria-current={isSelected ? 'page' : undefined}
          title={
            child.title ??
            (typeof child.label === 'string' ? child.label : undefined)
          }
          onClick={(e) => {
            if (isDisabled) return;
            shared.onLeafActivate(child, e);
            handleCloseChain();
          }}
          sx={{
            mx: 0.75,
            my: 0.25,
            px: 1.5,
            py: 0.85,
            minHeight: 36,
            borderRadius: '6px',
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
          {child.icon && (
            <ListItemIcon
              sx={{
                minWidth: 26,
                color: 'inherit',
                '& svg': { fontSize: 17 },
              }}
            >
              {child.icon}
            </ListItemIcon>
          )}
          <ListItemText
            primary={child.label}
            slotProps={{
              primary: {
                sx: {
                  fontSize: '0.84rem',
                  fontWeight: isSelected ? 600 : 400,
                  whiteSpace: 'nowrap',
                },
              },
            }}
          />
          {child.extra && (
            <Box
              component="span"
              sx={{
                ml: 2,
                fontSize: '0.75rem',
                color: isSelected ? 'inherit' : palette.textMuted,
                opacity: isSelected ? 0.85 : 1,
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              }}
            >
              {child.extra}
            </Box>
          )}
        </ListItemButton>
      );
    });

  return (
    <Box
      ref={anchorRef}
      component="div"
      onMouseEnter={isHoverMode ? scheduleOpen : undefined}
      onMouseLeave={isHoverMode ? scheduleClose : undefined}
      sx={{
        position: 'relative',
        display: isRootHorizontal ? 'inline-flex' : 'block',
        alignItems: isRootHorizontal ? 'center' : undefined,
        flexShrink: isRootHorizontal ? 0 : undefined,
      }}
    >
      <ListItemButton
        role="menuitem"
        data-menu-key={item.key}
        data-submenu-trigger="true"
        disabled={item.disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title={
          item.title ??
          (typeof item.label === 'string' ? item.label : undefined)
        }
        onClick={(e) => {
          if (item.disabled) return;
          shared.onSubMenuTitleClick?.(item, e);
          item.onTitleClick?.({ key: item.key, domEvent: e });
          if (!isHoverMode || isOverflowTrigger) {
            clearTimers();
            setOpenWithNotify(!open);
          } else {
            clearTimers();
            setOpenWithNotify(true);
          }
        }}
        onKeyDown={(e) => {
          if (item.disabled) return;
          if (
            e.key === 'Enter' ||
            e.key === ' ' ||
            (placement === 'right-start' && e.key === 'ArrowRight') ||
            (placement === 'bottom-start' && e.key === 'ArrowDown')
          ) {
            e.preventDefault();
            e.stopPropagation();
            setOpenWithNotify(true);
          } else if (e.key === 'Escape' && open) {
            e.preventDefault();
            e.stopPropagation();
            closeImmediately();
          }
        }}
        sx={
          isRootHorizontal
            ? {
                position: 'relative',
                height: 46,
                px: isOverflowTrigger ? 1.15 : 1.35,
                py: 0,
                borderRadius: 0,
                whiteSpace: 'nowrap',
                color: item.disabled
                  ? triggerPalette.disabledText
                  : hasSelectedDescendant || open
                    ? triggerPalette.ancestorSelectedText
                    : triggerPalette.text,
                fontWeight: hasSelectedDescendant ? 600 : 500,
                transition: 'color 140ms ease',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 12,
                  right: 12,
                  bottom: 0,
                  height: '2px',
                  bgcolor:
                    hasSelectedDescendant || open
                      ? triggerPalette.activeIndicator
                      : 'transparent',
                  transition: 'background-color 160ms ease',
                },
                '&:hover': item.disabled
                  ? undefined
                  : {
                      bgcolor: 'transparent',
                      color:
                        shared.theme === 'dark'
                          ? '#FFFFFF'
                          : triggerPalette.ancestorSelectedText,
                      '&::after': {
                        bgcolor: triggerPalette.activeIndicator,
                      },
                    },
              }
            : {
                mx: isCollapsedRail ? 0.75 : 0.75,
                my: 0.25,
                px: isCollapsedRail ? 0 : 1.5,
                py: 0.9,
                minHeight: 40,
                borderRadius: '6px',
                justifyContent: isCollapsedRail ? 'center' : 'flex-start',
                color: item.disabled
                  ? triggerPalette.disabledText
                  : hasSelectedDescendant || open
                    ? triggerPalette.ancestorSelectedText
                    : triggerPalette.text,
                bgcolor:
                  isCollapsedRail && hasSelectedDescendant
                    ? triggerPalette.itemSelectedBg
                    : 'transparent',
                transition: 'background-color 140ms ease, color 140ms ease',
                '&:hover': item.disabled
                  ? undefined
                  : {
                      bgcolor: triggerPalette.itemHoverBg,
                      color: triggerPalette.textHover,
                    },
              }
        }
      >
        {customTriggerContent ?? (
          <>
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
                      fontWeight: hasSelectedDescendant ? 600 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  },
                }}
              />
            )}
            {!isCollapsedRail && (
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  ml: isRootHorizontal ? 0.25 : 1,
                  color: 'inherit',
                }}
              >
                {renderExpandChevron(
                  shared.expandIcon,
                  {
                    isOpen: open,
                    isSubMenu: true,
                    disabled: item.disabled,
                    mode,
                  },
                  isRootHorizontal,
                )}
              </Box>
            )}
          </>
        )}
      </ListItemButton>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement={placement}
        transition
        modifiers={[
          { name: 'offset', options: { offset: [offsetX, offsetY] } },
          {
            name: 'preventOverflow',
            options: { padding: 8, boundary: 'viewport' },
          },
          { name: 'flip', options: { fallbackPlacements: ['left-start', 'bottom-end'] } },
        ]}
        sx={{ zIndex: 1350 }}
      >
        {({ TransitionProps }) => (
          <Grow
            {...TransitionProps}
            timeout={{ enter: 160, exit: 110 }}
            style={{
              transformOrigin:
                placement === 'bottom-start' ? 'top left' : 'top left',
            }}
          >
            <div>
              <ClickAwayListener
                onClickAway={(ev) => {
                  if (
                    anchorRef.current &&
                    ev.target instanceof Node &&
                    anchorRef.current.contains(ev.target)
                  ) {
                    return;
                  }
                  closeImmediately();
                }}
              >
                <Paper
                  elevation={0}
                  className={item.popupClassName}
                  onMouseEnter={isHoverMode ? scheduleOpen : undefined}
                  onMouseLeave={isHoverMode ? scheduleClose : undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      e.stopPropagation();
                      closeImmediately();
                    }
                  }}
                  sx={{
                    minWidth: 184,
                    maxWidth: 280,
                    py: 0.75,
                    borderRadius: '8px',
                    bgcolor: palette.popupBg,
                    border: `1px solid ${palette.borderColor}`,
                    boxShadow: palette.popupShadow,
                  }}
                >
                  <List
                    component="div"
                    role="menu"
                    aria-label={
                      typeof item.label === 'string' ? item.label : item.key
                    }
                    disablePadding
                  >
                    {renderPopupItems(item.children, 1)}
                  </List>
                </Paper>
              </ClickAwayListener>
            </div>
          </Grow>
        )}
      </Popper>
    </Box>
  );
};
