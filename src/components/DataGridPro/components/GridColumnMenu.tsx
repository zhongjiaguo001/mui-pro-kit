import React from 'react';
import {
  Divider,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FitScreenOutlinedIcon from '@mui/icons-material/FitScreenOutlined';
import FunctionsIcon from '@mui/icons-material/Functions';
import CheckIcon from '@mui/icons-material/Check';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import type { Column } from '@tanstack/react-table';
import type {
  GridAggregationFunctionName,
  GridSortDirection,
  GridValidRowModel,
} from '../types';
import type { ColumnMetaExt, DataGridFeatures } from '../core/useDataGridPro';
import { AGGREGATION_FUNCTION_LABELS } from '../core/gridCore';
import {
  GRID_ZH_CN_LOCALE_TEXT,
  type GridLocaleText,
} from '../core/localeText';

interface GridColumnMenuProps<R extends GridValidRowModel> {
  anchorEl: HTMLElement | null;
  column: Column<DataGridFeatures, R, unknown> | null;
  onClose: () => void;
  onSort: (field: string, direction: GridSortDirection | null) => void;
  onFilterByColumn: (field: string) => void;
  onPinColumn: (field: string, side: 'left' | 'right' | false) => void;
  onHideColumn: (field: string) => void;
  onAutosizeColumn?: (field: string) => void;
  onOpenManageColumns: () => void;
  aggregationFunction?: GridAggregationFunctionName;
  onAggregationChange?: (
    field: string,
    fn: GridAggregationFunctionName | null,
  ) => void;
  isGroupedByColumn?: boolean;
  canGroupByColumn?: boolean;
  onToggleGroupByColumn?: (field: string) => void;
  disableColumnFilter?: boolean;
  disableColumnSelector?: boolean;
  localeText?: GridLocaleText;
}

const NUMERIC_AGGREGATIONS: GridAggregationFunctionName[] = [
  'sum',
  'avg',
  'max',
  'min',
  'size',
];

const GENERAL_AGGREGATIONS: GridAggregationFunctionName[] = ['size'];

export function GridColumnMenu<R extends GridValidRowModel>({
  anchorEl,
  column,
  onClose,
  onSort,
  onFilterByColumn,
  onPinColumn,
  onHideColumn,
  onAutosizeColumn,
  onOpenManageColumns,
  aggregationFunction,
  onAggregationChange,
  isGroupedByColumn = false,
  canGroupByColumn = false,
  onToggleGroupByColumn,
  disableColumnFilter = false,
  disableColumnSelector = false,
  localeText = GRID_ZH_CN_LOCALE_TEXT,
}: GridColumnMenuProps<R>) {
  if (!column) return null;

  const meta = column.columnDef.meta as ColumnMetaExt<R> | undefined;
  const colDef = meta?.colDef;
  const field = column.id;
  const sortDir = column.getIsSorted();
  const canSort = column.getCanSort();
  const canFilter =
    !disableColumnFilter &&
    colDef?.filterable !== false &&
    colDef?.type !== 'actions';
  const canHide = column.getCanHide();
  const canPin = column.getCanPin();
  const pinnedSide = column.getIsPinned();
  const canResize = column.getCanResize();
  const canGroup =
    canGroupByColumn &&
    Boolean(onToggleGroupByColumn) &&
    colDef?.groupable !== false &&
    colDef?.type !== 'actions';
  const canAggregate =
    Boolean(onAggregationChange) &&
    colDef?.aggregable !== false &&
    colDef?.type !== 'actions';
  const availableAggregations =
    colDef?.type === 'number' ? NUMERIC_AGGREGATIONS : GENERAL_AGGREGATIONS;

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          elevation: 8,
          sx: {
            minWidth: 204,
            borderRadius: '4px',
            mt: 0.5,
          },
        },
      }}
    >
      {canSort && [
        <MenuItem
          key="sort-asc"
          disabled={sortDir === 'asc'}
          onClick={() => {
            onSort(field, 'asc');
            onClose();
          }}
        >
          <ListItemIcon>
            <ArrowUpwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{localeText.columnMenuSortAsc}</ListItemText>
        </MenuItem>,
        <MenuItem
          key="sort-desc"
          disabled={sortDir === 'desc'}
          onClick={() => {
            onSort(field, 'desc');
            onClose();
          }}
        >
          <ListItemIcon>
            <ArrowDownwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{localeText.columnMenuSortDesc}</ListItemText>
        </MenuItem>,
        sortDir ? (
          <MenuItem
            key="sort-clear"
            onClick={() => {
              onSort(field, null);
              onClose();
            }}
          >
            <ListItemIcon>
              <SwapVertIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{localeText.columnMenuUnsort}</ListItemText>
          </MenuItem>
        ) : null,
        <Divider key="sort-divider" sx={{ my: 0.5 }} />,
      ]}

      {canFilter && (
        <MenuItem
          onClick={() => {
            onFilterByColumn(field);
            onClose();
          }}
        >
          <ListItemIcon>
            <FilterAltOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{localeText.columnMenuFilter}</ListItemText>
        </MenuItem>
      )}

      {canGroup && onToggleGroupByColumn && (
        <MenuItem
          onClick={() => {
            onToggleGroupByColumn(field);
            onClose();
          }}
        >
          <ListItemIcon>
            <AccountTreeOutlinedIcon
              fontSize="small"
              sx={{ color: isGroupedByColumn ? '#1976D2' : undefined }}
            />
          </ListItemIcon>
          <ListItemText>
            {isGroupedByColumn
              ? localeText.columnMenuUngroupBy
              : localeText.columnMenuGroupBy}
          </ListItemText>
        </MenuItem>
      )}

      {canAggregate && onAggregationChange && [
        <Divider key="agg-divider" sx={{ my: 0.5 }} />,
        <ListSubheader
          key="agg-header"
          disableSticky
          sx={{
            lineHeight: '28px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'rgba(0, 0, 0, 0.54)',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          <FunctionsIcon sx={{ fontSize: 15 }} />
          {localeText.columnMenuAggregation}
        </ListSubheader>,
        ...availableAggregations.map((fn) => {
          const isSelected = aggregationFunction === fn;
          return (
            <MenuItem
              key={`agg-${fn}`}
              selected={isSelected}
              onClick={() => {
                onAggregationChange(field, isSelected ? null : fn);
                onClose();
              }}
              sx={{ py: 0.6 }}
            >
              <ListItemIcon sx={{ minWidth: 30 }}>
                {isSelected ? (
                  <CheckIcon fontSize="small" sx={{ color: '#1976D2' }} />
                ) : null}
              </ListItemIcon>
              <ListItemText
                primary={`${AGGREGATION_FUNCTION_LABELS[fn]} (${fn})`}
                slotProps={{ primary: { sx: { fontSize: '0.85rem' } } }}
              />
            </MenuItem>
          );
        }),
        aggregationFunction ? (
          <MenuItem
            key="agg-clear"
            onClick={() => {
              onAggregationChange(field, null);
              onClose();
            }}
            sx={{ py: 0.6, color: 'rgba(0, 0, 0, 0.6)' }}
          >
            <ListItemIcon sx={{ minWidth: 30 }} />
            <ListItemText
              primary={localeText.columnMenuAggregationNone}
              slotProps={{ primary: { sx: { fontSize: '0.85rem' } } }}
            />
          </MenuItem>
        ) : null,
      ]}

      {canPin && [
        <Divider key="pin-divider" sx={{ my: 0.5 }} />,
        pinnedSide !== 'start' ? (
          <MenuItem
            key="pin-left"
            onClick={() => {
              onPinColumn(field, 'left');
              onClose();
            }}
          >
            <ListItemIcon>
              <PushPinOutlinedIcon
                fontSize="small"
                sx={{ transform: 'rotate(-45deg)' }}
              />
            </ListItemIcon>
            <ListItemText>{localeText.columnMenuPinLeft}</ListItemText>
          </MenuItem>
        ) : null,
        pinnedSide !== 'end' ? (
          <MenuItem
            key="pin-right"
            onClick={() => {
              onPinColumn(field, 'right');
              onClose();
            }}
          >
            <ListItemIcon>
              <PushPinOutlinedIcon
                fontSize="small"
                sx={{ transform: 'rotate(45deg)' }}
              />
            </ListItemIcon>
            <ListItemText>{localeText.columnMenuPinRight}</ListItemText>
          </MenuItem>
        ) : null,
        pinnedSide ? (
          <MenuItem
            key="unpin"
            onClick={() => {
              onPinColumn(field, false);
              onClose();
            }}
          >
            <ListItemIcon>
              <PushPinOutlinedIcon fontSize="small" sx={{ opacity: 0.5 }} />
            </ListItemIcon>
            <ListItemText>{localeText.columnMenuUnpin}</ListItemText>
          </MenuItem>
        ) : null,
      ]}

      <Divider sx={{ my: 0.5 }} />

      {canResize && onAutosizeColumn && (
        <MenuItem
          onClick={() => {
            onAutosizeColumn(field);
            onClose();
          }}
        >
          <ListItemIcon>
            <FitScreenOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{localeText.columnMenuAutosize}</ListItemText>
        </MenuItem>
      )}

      {canResize && (
        <MenuItem
          onClick={() => {
            column.resetSize();
            onClose();
          }}
        >
          <ListItemIcon>
            <RestartAltIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{localeText.columnMenuResetWidth}</ListItemText>
        </MenuItem>
      )}

      {canHide && (
        <MenuItem
          onClick={() => {
            onHideColumn(field);
            onClose();
          }}
        >
          <ListItemIcon>
            <VisibilityOffOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{localeText.columnMenuHideColumn}</ListItemText>
        </MenuItem>
      )}

      {!disableColumnSelector && (
        <MenuItem
          onClick={() => {
            onClose();
            onOpenManageColumns();
          }}
        >
          <ListItemIcon>
            <ViewColumnOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{localeText.columnMenuManageColumns}</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
}
