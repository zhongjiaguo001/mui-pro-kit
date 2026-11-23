import React, { memo, useState } from 'react';
import {
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import type { GridActionsCellItemProps, GridRowId } from '../types';

const MORE_VERT_SVG = (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

/**
 * Official MUI X `GridActionsCellItem` declarative element for `type: 'actions'` columns.
 * Can be rendered inline as an icon button or grouped into the row's overflow menu via `showInMenu`.
 */
export function GridActionsCellItem({
  icon,
  label,
  onClick,
  showInMenu = false,
  disabled = false,
  color = 'inherit',
}: GridActionsCellItemProps) {
  if (showInMenu) {
    return (
      <MenuItem
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        sx={{
          fontSize: '0.8125rem',
          color:
            color === 'error'
              ? '#D32F2F'
              : color === 'primary'
                ? '#1976D2'
                : 'rgba(0, 0, 0, 0.87)',
        }}
      >
        {icon && (
          <ListItemIcon
            sx={{
              minWidth: 30,
              color:
                color === 'error'
                  ? '#D32F2F'
                  : color === 'primary'
                    ? '#1976D2'
                    : 'rgba(0, 0, 0, 0.54)',
            }}
          >
            {icon}
          </ListItemIcon>
        )}
        <ListItemText
          primary={label}
          slotProps={{ primary: { sx: { fontSize: '0.8125rem' } } }}
        />
      </MenuItem>
    );
  }

  const colorClass =
    color === 'error'
      ? ' MuiDataGrid-actionBtn--error'
      : color === 'primary'
        ? ' MuiDataGrid-actionBtn--primary'
        : '';

  return (
    <button
      type="button"
      className={`MuiDataGrid-actionBtn${colorClass}`}
      disabled={disabled}
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      {icon}
    </button>
  );
}

interface GridActionsCellProps {
  rowId: GridRowId;
  items: React.ReactElement<GridActionsCellItemProps>[];
  moreMenuLabel?: string;
}

/**
 * Official MUI X `GridActionsCell` renderer: splits `getActions(params)` into inline
 * icon buttons and a single `MoreVertIcon` overflow menu for `showInMenu` items.
 * Lazily mounts the MUI `<Menu>` portal only when opened to eliminate per-row Modal/Popover overhead.
 */
export const GridActionsCell = memo(function GridActionsCell({
  rowId,
  items,
  moreMenuLabel = '更多操作',
}: GridActionsCellProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const inlineItems: React.ReactElement<GridActionsCellItemProps>[] = [];
  const menuItems: React.ReactElement<GridActionsCellItemProps>[] = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!React.isValidElement(item)) continue;
    if (item.props.showInMenu) {
      menuItems.push(item);
    } else {
      inlineItems.push(item);
    }
  }

  return (
    <div
      className="MuiDataGrid-actionsCell"
      onClick={(e) => e.stopPropagation()}
    >
      {inlineItems}
      {menuItems.length > 0 && (
        <>
          <button
            type="button"
            className="MuiDataGrid-actionBtn"
            title={moreMenuLabel}
            aria-label={`${moreMenuLabel} (${rowId})`}
            aria-haspopup="menu"
            aria-expanded={Boolean(menuAnchor) ? 'true' : undefined}
            onClick={(e) => {
              e.stopPropagation();
              setMenuAnchor(e.currentTarget);
            }}
          >
            {MORE_VERT_SVG}
          </button>
          {Boolean(menuAnchor) && (
            <Menu
              anchorEl={menuAnchor}
              open
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  elevation: 6,
                  sx: { minWidth: 164, borderRadius: '4px', mt: 0.5 },
                },
              }}
            >
              {menuItems.map((item, idx) =>
                React.cloneElement(item, {
                  key: item.key ?? `action-menu-${idx}`,
                  onClick: (e: React.MouseEvent<HTMLElement>) => {
                    setMenuAnchor(null);
                    item.props.onClick?.(e);
                  },
                }),
              )}
            </Menu>
          )}
        </>
      )}
    </div>
  );
});
