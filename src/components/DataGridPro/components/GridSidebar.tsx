import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import PivotTableChartIcon from '@mui/icons-material/PivotTableChart';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type {
  GridColDef,
  GridColumnVisibilityModel,
  GridFilterItem,
  GridFilterModel,
  GridFilterOperatorValue,
  GridLogicOperator,
  GridPinnedColumnFields,
  GridPivotModel,
  GridSidebarPanel,
  GridValidRowModel,
} from '../types';
import {
  getOperatorsForColumn,
  normalizeValueOptions,
} from '../core/gridCore';
import {
  GRID_ZH_CN_LOCALE_TEXT,
  type GridLocaleText,
} from '../core/localeText';
import { GridPivotPanel } from './GridPivotPanel';

interface GridSidebarProps<R extends GridValidRowModel> {
  activePanel: GridSidebarPanel;
  onPanelChange: (panel: GridSidebarPanel) => void;
  onClose: () => void;
  columns: GridColDef<R>[];
  columnVisibilityModel: GridColumnVisibilityModel;
  onToggleColumnVisibility: (field: string) => void;
  onShowAllColumns: () => void;
  onResetColumns: () => void;
  pinnedColumns: GridPinnedColumnFields;
  onPinColumn: (field: string, side: 'left' | 'right' | false) => void;
  disableColumnPinning?: boolean;
  filterModel: GridFilterModel;
  onFilterModelChange: (model: GridFilterModel) => void;
  pivotMode: boolean;
  onPivotModeChange?: (enabled: boolean) => void;
  pivotModel: GridPivotModel;
  onPivotModelChange: (next: GridPivotModel) => void;
  onResetPivotModel?: () => void;
  localeText?: GridLocaleText;
}

/**
 * Official MUI X Premium Docked Right Sidebar supporting Columns Management,
 * Live Filter Builder, and Pivot Table Configurator side-by-side with the grid.
 */
export function GridSidebar<R extends GridValidRowModel>({
  activePanel,
  onPanelChange,
  onClose,
  columns,
  columnVisibilityModel,
  onToggleColumnVisibility,
  onShowAllColumns,
  onResetColumns,
  pinnedColumns,
  onPinColumn,
  disableColumnPinning = false,
  filterModel,
  onFilterModelChange,
  pivotMode,
  onPivotModeChange,
  pivotModel,
  onPivotModelChange,
  onResetPivotModel,
  localeText = GRID_ZH_CN_LOCALE_TEXT,
}: GridSidebarProps<R>) {
  const [colSearch, setColSearch] = useState('');

  const manageableCols = useMemo(
    () => columns.filter((c) => c.type !== 'actions'),
    [columns],
  );

  const filteredCols = useMemo(() => {
    const q = colSearch.trim().toLowerCase();
    if (!q) return manageableCols;
    return manageableCols.filter((c) =>
      `${c.headerName ?? ''} ${c.field}`.toLowerCase().includes(q),
    );
  }, [colSearch, manageableCols]);

  const filterableCols = useMemo(
    () =>
      columns.filter((c) => c.type !== 'actions' && c.filterable !== false),
    [columns],
  );

  const leftPinSet = useMemo(
    () => new Set(pinnedColumns.left ?? []),
    [pinnedColumns.left],
  );
  const rightPinSet = useMemo(
    () => new Set(pinnedColumns.right ?? []),
    [pinnedColumns.right],
  );

  const filterItems = filterModel.items ?? [];
  const logicOperator: GridLogicOperator = filterModel.logicOperator ?? 'and';

  const handleAddFilterRule = () => {
    const firstCol = filterableCols[0];
    if (!firstCol) return;
    const ops = getOperatorsForColumn(firstCol);
    const nextItem: GridFilterItem = {
      id: `sb_flt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      field: firstCol.field,
      operator: ops[0]?.value ?? 'contains',
      value: '',
    };
    onFilterModelChange({
      ...filterModel,
      items: [...filterItems, nextItem],
    });
  };

  const handleUpdateFilterRule = (
    id: string,
    patch: Partial<GridFilterItem>,
  ) => {
    const nextItems = filterItems.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, ...patch };
      if (patch.field && patch.field !== item.field) {
        const nextCol = filterableCols.find((c) => c.field === patch.field);
        const nextOps = getOperatorsForColumn(nextCol);
        updated.operator = nextOps[0]?.value ?? 'contains';
        updated.value = '';
      }
      return updated;
    });
    onFilterModelChange({
      ...filterModel,
      items: nextItems,
    });
  };

  const handleRemoveFilterRule = (id: string) => {
    onFilterModelChange({
      ...filterModel,
      items: filterItems.filter((it) => it.id !== id),
    });
  };

  return (
    <Box
      component="aside"
      aria-label="表格侧边栏配置面板"
      data-testid="datagrid-sidebar"
      data-sidebar-panel={activePanel}
      className="MuiDataGrid-sidebar"
      sx={{
        width: 316,
        minWidth: 316,
        borderLeft: '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
        bgcolor: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Top Tab Bar + Close */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E0E0E0',
          px: 0.75,
          minHeight: 44,
          flexShrink: 0,
        }}
      >
        <Tabs
          value={activePanel}
          onChange={(_e, val: GridSidebarPanel) => onPanelChange(val)}
          variant="standard"
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
              minWidth: 74,
              px: 1.1,
              py: 0.5,
              fontSize: '0.78rem',
              fontWeight: 500,
              textTransform: 'none',
            },
          }}
        >
          <Tab
            value="columns"
            icon={<ViewColumnIcon sx={{ fontSize: 15 }} />}
            iconPosition="start"
            label={localeText.toolbarColumns}
          />
          <Tab
            value="filters"
            icon={<FilterListIcon sx={{ fontSize: 15 }} />}
            iconPosition="start"
            label={localeText.toolbarFilters}
          />
          <Tab
            value="pivot"
            icon={<PivotTableChartIcon sx={{ fontSize: 15 }} />}
            iconPosition="start"
            label="透视"
          />
        </Tabs>

        <IconButton
          size="small"
          aria-label="关闭侧边栏"
          onClick={onClose}
          sx={{ p: 0.45, color: 'rgba(0, 0, 0, 0.54)' }}
        >
          <CloseIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      {/* Panel Body */}
      {activePanel === 'columns' && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 1.25, bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
            <TextField
              size="small"
              fullWidth
              placeholder={localeText.columnsManagementSearchPlaceholder}
              value={colSearch}
              onChange={(e) => setColSearch(e.target.value)}
              slotProps={{
                input: {
                  sx: { fontSize: '0.8125rem' },
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: '#64748B' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 1, py: 0.75 }}>
            {filteredCols.length === 0 ? (
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  color: '#94A3B8',
                  textAlign: 'center',
                  py: 3,
                }}
              >
                {localeText.columnsManagementNoColumns}
              </Typography>
            ) : (
              filteredCols.map((col) => {
                const isVisible = columnVisibilityModel[col.field] !== false;
                const isPinnedLeft = leftPinSet.has(col.field);
                const isPinnedRight = rightPinSet.has(col.field);
                const canHide = col.hideable !== false;
                const canPin = !disableColumnPinning && col.pinnable !== false;
                return (
                  <Box
                    key={col.field}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 0.75,
                      py: 0.35,
                      borderRadius: '4px',
                      '&:hover': { bgcolor: '#F1F5F9' },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        minWidth: 0,
                        flex: 1,
                        cursor: canHide ? 'pointer' : 'default',
                      }}
                      onClick={() => {
                        if (canHide) onToggleColumnVisibility(col.field);
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={isVisible}
                        disabled={!canHide}
                        sx={{ p: 0.35 }}
                      />
                      <Typography
                        noWrap
                        sx={{
                          fontSize: '0.8125rem',
                          color: isVisible ? '#0F172A' : '#94A3B8',
                        }}
                      >
                        {col.headerName ?? col.field}
                      </Typography>
                    </Box>

                    {canPin && (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
                        <Tooltip
                          title={
                            isPinnedLeft
                              ? localeText.columnsManagementUnpinTooltip
                              : localeText.columnsManagementPinLeftTooltip
                          }
                        >
                          <IconButton
                            size="small"
                            aria-label={`左侧固定 ${col.headerName ?? col.field}`}
                            onClick={() =>
                              onPinColumn(
                                col.field,
                                isPinnedLeft ? false : 'left',
                              )
                            }
                            sx={{
                              p: 0.35,
                              color: isPinnedLeft ? '#1976D2' : '#94A3B8',
                            }}
                          >
                            {isPinnedLeft ? (
                              <PushPinIcon
                                sx={{ fontSize: 14, transform: 'rotate(-45deg)' }}
                              />
                            ) : (
                              <PushPinOutlinedIcon
                                sx={{ fontSize: 14, transform: 'rotate(-45deg)' }}
                              />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            isPinnedRight
                              ? localeText.columnsManagementUnpinTooltip
                              : localeText.columnsManagementPinRightTooltip
                          }
                        >
                          <IconButton
                            size="small"
                            aria-label={`右侧固定 ${col.headerName ?? col.field}`}
                            onClick={() =>
                              onPinColumn(
                                col.field,
                                isPinnedRight ? false : 'right',
                              )
                            }
                            sx={{
                              p: 0.35,
                              color: isPinnedRight ? '#1976D2' : '#94A3B8',
                            }}
                          >
                            {isPinnedRight ? (
                              <PushPinIcon
                                sx={{ fontSize: 14, transform: 'rotate(45deg)' }}
                              />
                            ) : (
                              <PushPinOutlinedIcon
                                sx={{ fontSize: 14, transform: 'rotate(45deg)' }}
                              />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                );
              })
            )}
          </Box>

          <Divider />
          <Box
            sx={{
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: '#FFFFFF',
            }}
          >
            <Button size="small" onClick={onShowAllColumns} sx={{ fontSize: '0.78rem' }}>
              {localeText.columnsManagementShowAll}
            </Button>
            <Button
              size="small"
              color="inherit"
              startIcon={<RestartAltIcon sx={{ fontSize: 15 }} />}
              onClick={onResetColumns}
              sx={{ fontSize: '0.78rem', color: '#475569' }}
            >
              {localeText.columnsManagementReset}
            </Button>
          </Box>
        </Box>
      )}

      {activePanel === 'filters' && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 1.25,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
            }}
          >
            {filterItems.length > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 0.5,
                }}
              >
                <Typography sx={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                  多条件逻辑
                </Typography>
                <Select
                  size="small"
                  value={logicOperator}
                  onChange={(e) =>
                    onFilterModelChange({
                      ...filterModel,
                      logicOperator: e.target.value as GridLogicOperator,
                    })
                  }
                  sx={{ height: 28, fontSize: '0.78rem', bgcolor: '#FFFFFF' }}
                >
                  <MenuItem value="and" sx={{ fontSize: '0.78rem' }}>
                    满足全部 ({localeText.filterPanelLogicAnd})
                  </MenuItem>
                  <MenuItem value="or" sx={{ fontSize: '0.78rem' }}>
                    满足任一 ({localeText.filterPanelLogicOr})
                  </MenuItem>
                </Select>
              </Box>
            )}

            {filterItems.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  px: 1.5,
                  textAlign: 'center',
                  border: '1px dashed #CBD5E1',
                  borderRadius: '4px',
                  bgcolor: '#FFFFFF',
                }}
              >
                <Typography sx={{ fontSize: '0.8rem', color: '#64748B', mb: 1 }}>
                  暂无常驻筛选规则
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddFilterRule}
                  sx={{ fontSize: '0.78rem' }}
                >
                  {localeText.filterPanelAddFilter}
                </Button>
              </Box>
            ) : (
              filterItems.map((item, idx) => {
                const colDef = filterableCols.find((c) => c.field === item.field);
                const operators = getOperatorsForColumn(colDef);
                const activeOp =
                  operators.find((o) => o.value === item.operator) ??
                  operators[0];
                const requiresValue = activeOp?.requiresValue ?? true;
                const valueOptions = normalizeValueOptions(colDef?.valueOptions);

                return (
                  <Box
                    key={item.id}
                    sx={{
                      p: 1.15,
                      bgcolor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography
                        sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}
                      >
                        条件 #{idx + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        aria-label={`移除条件 ${idx + 1}`}
                        onClick={() => handleRemoveFilterRule(item.id)}
                        sx={{ p: 0.25, color: '#94A3B8' }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>

                    <FormControl size="small" fullWidth>
                      <Select
                        value={item.field}
                        onChange={(e) =>
                          handleUpdateFilterRule(item.id, {
                            field: String(e.target.value),
                          })
                        }
                        sx={{ fontSize: '0.8rem', height: 32 }}
                      >
                        {filterableCols.map((col) => (
                          <MenuItem
                            key={col.field}
                            value={col.field}
                            sx={{ fontSize: '0.8rem' }}
                          >
                            {col.headerName ?? col.field}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth>
                      <Select
                        value={item.operator}
                        onChange={(e) =>
                          handleUpdateFilterRule(item.id, {
                            operator: e.target.value as GridFilterOperatorValue,
                          })
                        }
                        sx={{ fontSize: '0.8rem', height: 32 }}
                      >
                        {operators.map((op) => (
                          <MenuItem
                            key={op.value}
                            value={op.value}
                            sx={{ fontSize: '0.8rem' }}
                          >
                            {localeText.filterOperatorLabels[op.value] ??
                              op.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {!requiresValue ? (
                      <TextField
                        size="small"
                        fullWidth
                        disabled
                        value=""
                        placeholder="无需输入值"
                        slotProps={{ input: { sx: { fontSize: '0.8rem', height: 32 } } }}
                      />
                    ) : colDef?.type === 'singleSelect' &&
                      valueOptions.length > 0 &&
                      item.operator !== 'isAnyOf' ? (
                      <Select
                        size="small"
                        fullWidth
                        displayEmpty
                        value={String(item.value ?? '')}
                        onChange={(e) =>
                          handleUpdateFilterRule(item.id, {
                            value: e.target.value,
                          })
                        }
                        sx={{ fontSize: '0.8rem', height: 32 }}
                      >
                        <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
                          <em>全部</em>
                        </MenuItem>
                        {valueOptions.map((opt) => (
                          <MenuItem
                            key={String(opt.value)}
                            value={String(opt.value)}
                            sx={{ fontSize: '0.8rem' }}
                          >
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <TextField
                        size="small"
                        fullWidth
                        placeholder={localeText.filterPanelInputPlaceholder}
                        value={
                          Array.isArray(item.value)
                            ? item.value.join(',')
                            : String(item.value ?? '')
                        }
                        onChange={(e) =>
                          handleUpdateFilterRule(item.id, {
                            value: e.target.value,
                          })
                        }
                        slotProps={{ input: { sx: { fontSize: '0.8rem', height: 32 } } }}
                      />
                    )}
                  </Box>
                );
              })
            )}
          </Box>

          <Divider />
          <Box
            sx={{
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: '#FFFFFF',
            }}
          >
            <Button
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 15 }} />}
              onClick={handleAddFilterRule}
              sx={{ fontSize: '0.78rem' }}
            >
              {localeText.filterPanelAddFilter}
            </Button>
            {filterItems.length > 0 && (
              <Button
                size="small"
                color="error"
                onClick={() =>
                  onFilterModelChange({ ...filterModel, items: [] })
                }
                sx={{ fontSize: '0.78rem' }}
              >
                {localeText.filterPanelRemoveAll}
              </Button>
            )}
          </Box>
        </Box>
      )}

      {activePanel === 'pivot' && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {onPivotModeChange && (
            <Box
              sx={{
                px: 1.5,
                py: 0.9,
                bgcolor: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>
                启用透视分析模式
              </Typography>
              <Switch
                size="small"
                checked={pivotMode}
                onChange={(e) => onPivotModeChange(e.target.checked)}
                slotProps={{ input: { 'aria-label': '切换透视模式' } }}
              />
            </Box>
          )}
          <Box sx={{ flex: 1, overflow: 'hidden', '& aside': { width: '100%', minWidth: 0, borderLeft: 'none' } }}>
            <GridPivotPanel
              embedded
              columns={columns}
              pivotModel={pivotModel}
              onPivotModelChange={onPivotModelChange}
              onResetPivotModel={onResetPivotModel}
              onClose={onClose}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
