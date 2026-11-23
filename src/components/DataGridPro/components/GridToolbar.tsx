import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import TableRowsIcon from '@mui/icons-material/TableRows';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import DataObjectIcon from '@mui/icons-material/DataObject';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CheckIcon from '@mui/icons-material/Check';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import PivotTableChartIcon from '@mui/icons-material/PivotTableChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import type { GridDensity } from '../types';
import {
  GRID_ZH_CN_LOCALE_TEXT,
  type GridLocaleText,
} from '../core/localeText';

interface GridToolbarProps {
  columnsButtonRef: React.RefObject<HTMLButtonElement | null>;
  filterButtonRef: React.RefObject<HTMLButtonElement | null>;
  onOpenColumns: (el: HTMLElement) => void;
  onOpenFilters: (el: HTMLElement) => void;
  hiddenColumnCount: number;
  activeFilterCount: number;
  density: GridDensity;
  onDensityChange: (density: GridDensity) => void;
  quickFilterText: string;
  onQuickFilterChange: (value: string) => void;
  showQuickFilter?: boolean;
  quickFilterPlaceholder?: string;
  onExportCsv: (selectedOnly: boolean) => void;
  onExportXlsx?: (selectedOnly: boolean) => void;
  onExportJson?: (selectedOnly: boolean) => void;
  onPrint?: () => void;
  selectedCount: number;
  onClearSelection: () => void;
  onDeleteSelected?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  pivotMode?: boolean;
  pivotPanelOpen?: boolean;
  onTogglePivotPanel?: () => void;
  chartsIntegration?: boolean;
  chartsPanelOpen?: boolean;
  onToggleChartsPanel?: () => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  disableColumnSelector?: boolean;
  disableColumnFilter?: boolean;
  disableDensitySelector?: boolean;
  localeText?: GridLocaleText;
}

export function GridToolbar({
  columnsButtonRef,
  filterButtonRef,
  onOpenColumns,
  onOpenFilters,
  hiddenColumnCount,
  activeFilterCount,
  density,
  onDensityChange,
  quickFilterText,
  onQuickFilterChange,
  showQuickFilter = true,
  quickFilterPlaceholder,
  onExportCsv,
  onExportXlsx,
  onExportJson,
  onPrint,
  selectedCount,
  onClearSelection,
  onDeleteSelected,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  pivotMode = false,
  pivotPanelOpen = false,
  onTogglePivotPanel,
  chartsIntegration = false,
  chartsPanelOpen = false,
  onToggleChartsPanel,
  sidebarOpen = false,
  onToggleSidebar,
  disableColumnSelector = false,
  disableColumnFilter = false,
  disableDensitySelector = false,
  localeText = GRID_ZH_CN_LOCALE_TEXT,
}: GridToolbarProps) {
  const [densityAnchor, setDensityAnchor] = useState<HTMLElement | null>(null);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);

  const densityOptions: Array<{
    value: GridDensity;
    label: string;
    hint: string;
  }> = [
    { value: 'compact', label: localeText.toolbarDensityCompact, hint: '36px' },
    { value: 'standard', label: localeText.toolbarDensityStandard, hint: '52px' },
    {
      value: 'comfortable',
      label: localeText.toolbarDensityComfortable,
      hint: '67px',
    },
  ];
  const effectiveQuickPlaceholder =
    quickFilterPlaceholder ?? localeText.toolbarQuickFilterPlaceholder;

  return (
    <Box className="MuiDataGrid-toolbarWrapper">
      {/* Official MUI X MuiDataGrid-toolbarContainer */}
      <Box
        className="MuiDataGrid-toolbarContainer"
        sx={{
          minHeight: 50,
          px: 1,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          borderBottom: '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
          bgcolor: 'var(--DataGrid-containerBackground, #FFFFFF)',
        }}
      >
        {/* Left: Iconic MUI X Primary Blue Toolbar Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          {!disableColumnSelector && (
            <Button
              ref={columnsButtonRef}
              size="small"
              color="primary"
              startIcon={
                <Badge
                  color="primary"
                  badgeContent={hiddenColumnCount}
                  invisible={hiddenColumnCount === 0}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: 15,
                      minWidth: 15,
                    },
                  }}
                >
                  <ViewColumnIcon sx={{ fontSize: 18 }} />
                </Badge>
              }
              onClick={(e) => onOpenColumns(e.currentTarget)}
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                px: 1,
                py: 0.5,
              }}
            >
              {localeText.toolbarColumns}
            </Button>
          )}

          {!disableColumnFilter && (
            <Button
              ref={filterButtonRef}
              size="small"
              color="primary"
              startIcon={
                <Badge
                  color="primary"
                  badgeContent={activeFilterCount}
                  invisible={activeFilterCount === 0}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: 15,
                      minWidth: 15,
                    },
                  }}
                >
                  <FilterListIcon sx={{ fontSize: 18 }} />
                </Badge>
              }
              onClick={(e) => onOpenFilters(e.currentTarget)}
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                px: 1,
                py: 0.5,
              }}
            >
              {localeText.toolbarFilters}
            </Button>
          )}

          {!disableDensitySelector && (
            <Button
              size="small"
              color="primary"
              aria-haspopup="menu"
              aria-expanded={Boolean(densityAnchor) ? 'true' : undefined}
              startIcon={
                density === 'compact' ? (
                  <ViewHeadlineIcon sx={{ fontSize: 18 }} />
                ) : density === 'comfortable' ? (
                  <ViewStreamIcon sx={{ fontSize: 18 }} />
                ) : (
                  <TableRowsIcon sx={{ fontSize: 18 }} />
                )
              }
              onClick={(e) => setDensityAnchor(e.currentTarget)}
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                px: 1,
                py: 0.5,
              }}
            >
              {localeText.toolbarDensity}
            </Button>
          )}

          <Menu
            anchorEl={densityAnchor}
            open={Boolean(densityAnchor)}
            onClose={() => setDensityAnchor(null)}
            slotProps={{
              paper: {
                elevation: 8,
                sx: {
                  minWidth: 156,
                  borderRadius: '4px',
                  mt: 0.5,
                },
              },
            }}
          >
            {densityOptions.map((opt) => (
              <MenuItem
                key={opt.value}
                selected={density === opt.value}
                onClick={() => {
                  onDensityChange(opt.value);
                  setDensityAnchor(null);
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {density === opt.value ? (
                    <CheckIcon fontSize="small" color="primary" />
                  ) : null}
                </ListItemIcon>
                <ListItemText
                  primary={opt.label}
                  secondary={opt.hint}
                  slotProps={{
                    primary: { sx: { fontSize: '0.875rem' } },
                    secondary: {
                      sx: {
                        fontSize: '0.72rem',
                        fontFamily: 'JetBrains Mono, monospace',
                      },
                    },
                  }}
                />
              </MenuItem>
            ))}
          </Menu>

          <Button
            size="small"
            color="primary"
            aria-haspopup="menu"
            aria-expanded={Boolean(exportAnchor) ? 'true' : undefined}
            startIcon={<SaveAltIcon sx={{ fontSize: 18 }} />}
            onClick={(e) => setExportAnchor(e.currentTarget)}
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              px: 1,
              py: 0.5,
            }}
          >
            {localeText.toolbarExport}
          </Button>

          <Menu
            anchorEl={exportAnchor}
            open={Boolean(exportAnchor)}
            onClose={() => setExportAnchor(null)}
            slotProps={{
              paper: {
                elevation: 8,
                sx: {
                  minWidth: 184,
                  borderRadius: '4px',
                  mt: 0.5,
                },
              },
            }}
          >
            {onExportXlsx && (
              <MenuItem
                onClick={() => {
                  onExportXlsx(false);
                  setExportAnchor(null);
                }}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <TableViewOutlinedIcon fontSize="small" sx={{ color: '#15803D' }} />
                </ListItemIcon>
                <ListItemText
                  primary={localeText.toolbarExportExcel}
                  slotProps={{ primary: { sx: { fontSize: '0.875rem' } } }}
                />
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                onExportCsv(false);
                setExportAnchor(null);
              }}
            >
              <ListItemIcon sx={{ minWidth: 30 }}>
                <SaveAltIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={localeText.toolbarExportCSV}
                slotProps={{ primary: { sx: { fontSize: '0.875rem' } } }}
              />
            </MenuItem>
            {onExportJson && (
              <MenuItem
                onClick={() => {
                  onExportJson(false);
                  setExportAnchor(null);
                }}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <DataObjectIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={localeText.toolbarExportJSON}
                  slotProps={{ primary: { sx: { fontSize: '0.875rem' } } }}
                />
              </MenuItem>
            )}
            {onPrint && (
              <MenuItem
                onClick={() => {
                  setExportAnchor(null);
                  onPrint();
                }}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <PrintOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={localeText.toolbarExportPrint}
                  slotProps={{ primary: { sx: { fontSize: '0.875rem' } } }}
                />
              </MenuItem>
            )}
          </Menu>

          {chartsIntegration && onToggleChartsPanel && (
            <Button
              size="small"
              color="primary"
              aria-pressed={chartsPanelOpen}
              startIcon={<BarChartIcon sx={{ fontSize: 18 }} />}
              onClick={onToggleChartsPanel}
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                px: 1,
                py: 0.5,
                bgcolor: chartsPanelOpen
                  ? 'rgba(25, 118, 210, 0.1)'
                  : 'transparent',
              }}
            >
              {localeText.toolbarCharts}
            </Button>
          )}

          {pivotMode && onTogglePivotPanel && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 0.5, my: 0.75, borderColor: '#E0E0E0' }}
              />
              <Button
                size="small"
                color="primary"
                aria-pressed={pivotPanelOpen}
                startIcon={<PivotTableChartIcon sx={{ fontSize: 18 }} />}
                onClick={onTogglePivotPanel}
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  px: 1,
                  py: 0.5,
                  bgcolor: pivotPanelOpen
                    ? 'rgba(25, 118, 210, 0.1)'
                    : 'transparent',
                }}
              >
                {localeText.toolbarPivot}
              </Button>
            </>
          )}

          {onToggleSidebar && (
            <Button
              size="small"
              color="primary"
              aria-pressed={sidebarOpen}
              startIcon={<ViewSidebarOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={onToggleSidebar}
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                px: 1,
                py: 0.5,
                bgcolor: sidebarOpen
                  ? 'rgba(25, 118, 210, 0.1)'
                  : 'transparent',
              }}
            >
              侧边栏
            </Button>
          )}

          {!pivotMode && (onUndo || onRedo) && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 0.5, my: 0.75, borderColor: '#E0E0E0' }}
              />
              {onUndo && (
                <Tooltip title={localeText.toolbarUndo} enterDelay={350}>
                  <span>
                    <IconButton
                      size="small"
                      aria-label={localeText.toolbarUndo}
                      disabled={!canUndo}
                      onClick={onUndo}
                      sx={{
                        p: 0.55,
                        color: canUndo ? '#1976D2' : 'rgba(0, 0, 0, 0.26)',
                      }}
                    >
                      <UndoIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {onRedo && (
                <Tooltip title={localeText.toolbarRedo} enterDelay={350}>
                  <span>
                    <IconButton
                      size="small"
                      aria-label={localeText.toolbarRedo}
                      disabled={!canRedo}
                      onClick={onRedo}
                      sx={{
                        p: 0.55,
                        color: canRedo ? '#1976D2' : 'rgba(0, 0, 0, 0.26)',
                      }}
                    >
                      <RedoIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </>
          )}
        </Box>

        {/* Right: Classic MUI X Standard Underlined GridToolbarQuickFilter */}
        {showQuickFilter && (
          <TextField
            variant="standard"
            placeholder={effectiveQuickPlaceholder}
            value={quickFilterText}
            onChange={(e) => onQuickFilterChange(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 268 },
              mr: 0.5,
              '& .MuiInput-root': {
                fontSize: '0.875rem',
                color: 'rgba(0, 0, 0, 0.87)',
                pb: 0.25,
                '&:before': {
                  borderBottomColor: 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover:not(.Mui-disabled):before': {
                  borderBottomColor: 'rgba(0, 0, 0, 0.87)',
                },
              },
            }}
            slotProps={{
              input: {
                'aria-label': localeText.toolbarQuickFilterLabel,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'rgba(0, 0, 0, 0.54)' }} />
                  </InputAdornment>
                ),
                endAdornment: quickFilterText ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label={localeText.toolbarQuickFilterClearLabel}
                      onClick={() => onQuickFilterChange('')}
                      edge="end"
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />
        )}
      </Box>

      {/* Contextual Selection Action Bar (MUI Material Selected Tint) */}
      {selectedCount > 0 && (
        <Box
          role="region"
          aria-label={localeText.toolbarSelectionCount(selectedCount)}
          sx={{
            px: 1.5,
            py: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            bgcolor: 'rgba(25, 118, 210, 0.08)',
            borderBottom: '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
          }}
        >
          <Typography
            className="tabular-nums"
            sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1976D2' }}
          >
            {localeText.toolbarSelectionCount(selectedCount)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {onExportXlsx && (
              <Button
                size="small"
                color="primary"
                startIcon={<TableViewOutlinedIcon sx={{ fontSize: 17 }} />}
                onClick={() => onExportXlsx(true)}
                sx={{ fontSize: '0.8125rem' }}
              >
                {localeText.toolbarExportSelectedExcel}
              </Button>
            )}
            <Button
              size="small"
              color="primary"
              startIcon={<SaveAltIcon sx={{ fontSize: 17 }} />}
              onClick={() => onExportCsv(true)}
              sx={{ fontSize: '0.8125rem' }}
            >
              {localeText.toolbarExportSelectedCSV}
            </Button>
            {onDeleteSelected && (
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlineIcon sx={{ fontSize: 17 }} />}
                onClick={onDeleteSelected}
                sx={{ fontSize: '0.8125rem' }}
              >
                {localeText.toolbarDeleteSelected}
              </Button>
            )}
            <Button
              size="small"
              color="inherit"
              onClick={onClearSelection}
              sx={{ fontSize: '0.8125rem', color: 'rgba(0, 0, 0, 0.6)' }}
            >
              {localeText.toolbarClearSelection}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
