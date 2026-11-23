import React from 'react';
import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';

export interface CellContextMenuState {
  mouseX: number;
  mouseY: number;
  field: string;
  headerName: string;
  rawValue: unknown;
  formattedValue: string;
  canFilter: boolean;
  canGroup: boolean;
  isGrouped: boolean;
  canPin: boolean;
  pinnedSide: 'left' | 'right' | false;
}

interface GridCellContextMenuProps {
  menuState: CellContextMenuState | null;
  rangeLabel?: string;
  onClose: () => void;
  onCopy: () => void;
  onFilterByValue: (field: string, rawValue: unknown) => void;
  onToggleGroupBy: (field: string) => void;
  onPinColumn: (field: string, side: 'left' | 'right' | false) => void;
  onOpenChartForColumn?: (field: string) => void;
  onExportXlsx: () => void;
}

export function GridCellContextMenu({
  menuState,
  rangeLabel,
  onClose,
  onCopy,
  onFilterByValue,
  onToggleGroupBy,
  onPinColumn,
  onOpenChartForColumn,
  onExportXlsx,
}: GridCellContextMenuProps) {
  const open = Boolean(menuState);
  const displayVal =
    menuState && menuState.formattedValue.length > 14
      ? `${menuState.formattedValue.slice(0, 14)}…`
      : menuState?.formattedValue ?? '';

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        menuState ? { top: menuState.mouseY, left: menuState.mouseX } : undefined
      }
      slotProps={{
        paper: {
          elevation: 8,
          'data-testid': 'cell-context-menu',
          sx: { minWidth: 220, borderRadius: '4px' },
        } as Record<string, unknown>,
      }}
    >
      <MenuItem
        onClick={() => {
          onCopy();
          onClose();
        }}
        sx={{ fontSize: '0.84rem', py: 0.75 }}
      >
        <ListItemIcon sx={{ minWidth: 30 }}>
          <ContentCopyIcon sx={{ fontSize: 17 }} />
        </ListItemIcon>
        <ListItemText
          primary={rangeLabel ? `复制选区 (${rangeLabel})` : '复制单元格'}
          slotProps={{ primary: { sx: { fontSize: '0.84rem' } } }}
        />
        <Typography
          className="font-mono-tabular"
          sx={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.45)', ml: 2 }}
        >
          Ctrl+C
        </Typography>
      </MenuItem>

      {menuState?.canFilter && displayVal && (
        <MenuItem
          onClick={() => {
            onFilterByValue(menuState.field, menuState.rawValue);
            onClose();
          }}
          sx={{ fontSize: '0.84rem', py: 0.75 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <FilterAltOutlinedIcon sx={{ fontSize: 18, color: '#1976D2' }} />
          </ListItemIcon>
          <ListItemText
            primary={`筛选「${displayVal}」`}
            slotProps={{ primary: { sx: { fontSize: '0.84rem' } } }}
          />
        </MenuItem>
      )}

      {menuState?.canGroup && (
        <MenuItem
          onClick={() => {
            onToggleGroupBy(menuState.field);
            onClose();
          }}
          sx={{ fontSize: '0.84rem', py: 0.75 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <AccountTreeOutlinedIcon
              sx={{
                fontSize: 17,
                color: menuState.isGrouped ? '#1976D2' : undefined,
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary={
              menuState.isGrouped
                ? `取消按「${menuState.headerName}」分组`
                : `按「${menuState.headerName}」分组`
            }
            slotProps={{ primary: { sx: { fontSize: '0.84rem' } } }}
          />
        </MenuItem>
      )}

      {menuState?.canPin && <Divider sx={{ my: 0.5 }} />}

      {menuState?.canPin && menuState.pinnedSide !== 'left' && (
        <MenuItem
          onClick={() => {
            onPinColumn(menuState.field, 'left');
            onClose();
          }}
          sx={{ fontSize: '0.84rem', py: 0.75 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <PushPinOutlinedIcon
              sx={{ fontSize: 17, transform: 'rotate(-45deg)' }}
            />
          </ListItemIcon>
          <ListItemText
            primary={`固定「${menuState.headerName}」到左侧`}
            slotProps={{ primary: { sx: { fontSize: '0.84rem' } } }}
          />
        </MenuItem>
      )}

      {menuState?.canPin && menuState.pinnedSide !== 'right' && (
        <MenuItem
          onClick={() => {
            onPinColumn(menuState.field, 'right');
            onClose();
          }}
          sx={{ fontSize: '0.84rem', py: 0.75 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <PushPinOutlinedIcon
              sx={{ fontSize: 17, transform: 'rotate(45deg)' }}
            />
          </ListItemIcon>
          <ListItemText
            primary={`固定「${menuState.headerName}」到右侧`}
            slotProps={{ primary: { sx: { fontSize: '0.84rem' } } }}
          />
        </MenuItem>
      )}

      {menuState?.canPin && menuState.pinnedSide !== false && (
        <MenuItem
          onClick={() => {
            onPinColumn(menuState.field, false);
            onClose();
          }}
          sx={{ fontSize: '0.84rem', py: 0.75 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <PushPinOutlinedIcon sx={{ fontSize: 17 }} />
          </ListItemIcon>
          <ListItemText
            primary={`取消固定「${menuState.headerName}」`}
            slotProps={{ primary: { sx: { fontSize: '0.84rem' } } }}
          />
        </MenuItem>
      )}

      <Divider sx={{ my: 0.5 }} />

      {onOpenChartForColumn && menuState?.canFilter && (
        <MenuItem
          onClick={() => {
            onOpenChartForColumn(menuState.field);
            onClose();
          }}
          sx={{ fontSize: '0.84rem', py: 0.75 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <BarChartIcon sx={{ fontSize: 18, color: '#1976D2' }} />
          </ListItemIcon>
          <ListItemText
            primary={`生成「${menuState.headerName}」分布图表`}
            slotProps={{ primary: { sx: { fontSize: '0.84rem' } } }}
          />
        </MenuItem>
      )}

      <MenuItem
        onClick={() => {
          onExportXlsx();
          onClose();
        }}
        sx={{ fontSize: '0.84rem', py: 0.75 }}
      >
        <ListItemIcon sx={{ minWidth: 30 }}>
          <TableViewOutlinedIcon sx={{ fontSize: 18, color: '#15803D' }} />
        </ListItemIcon>
        <ListItemText
          primary="导出为 Excel (.xlsx)"
          slotProps={{ primary: { sx: { fontSize: '0.84rem' } } }}
        />
      </MenuItem>
    </Menu>
  );
}
