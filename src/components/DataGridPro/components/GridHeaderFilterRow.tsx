import React, { useState } from 'react';
import {
  Box,
  Checkbox,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import CheckIcon from '@mui/icons-material/Check';
import type { HeaderGroup } from '@tanstack/react-table';
import type {
  GridFilterModel,
  GridFilterOperatorValue,
  GridPinnedColumnsSectionSeparator,
  GridValidRowModel,
} from '../types';
import type { ColumnMetaExt, DataGridFeatures } from '../core/useDataGridPro';
import {
  GRID_CHECKBOX_SELECTION_FIELD,
  GRID_DETAIL_PANEL_TOGGLE_FIELD,
  GRID_REORDER_COL_FIELD,
  getHeaderFilterOperator,
  getHeaderFilterValue,
  getOperatorsForColumn,
  isHierarchyColId,
  normalizeValueOptions,
  type PinnedColumnLayout,
} from '../core/gridCore';
import type { VirtualColumnWindow } from '../core/columnVirtualizer';

interface GridHeaderFilterRowProps<R extends GridValidRowModel> {
  headerGroup: HeaderGroup<DataGridFeatures, R>;
  filterModel: GridFilterModel;
  onHeaderFilterChange: (field: string, value: string) => void;
  onHeaderFilterOperatorChange: (
    field: string,
    operator: GridFilterOperatorValue,
  ) => void;
  pinnedLayout: Record<string, PinnedColumnLayout>;
  pinnedColumnsSectionSeparator: GridPinnedColumnsSectionSeparator;
  showColumnVerticalBorder: boolean;
  isScrolledLeft: boolean;
  isScrolledRight: boolean;
  columnWindow?: VirtualColumnWindow;
}

export function GridHeaderFilterRow<R extends GridValidRowModel>({
  headerGroup,
  filterModel,
  onHeaderFilterChange,
  onHeaderFilterOperatorChange,
  pinnedLayout,
  pinnedColumnsSectionSeparator,
  showColumnVerticalBorder,
  isScrolledLeft,
  isScrolledRight,
  columnWindow,
}: GridHeaderFilterRowProps<R>) {
  const [operatorMenuState, setOperatorMenuState] = useState<{
    anchorEl: HTMLElement | null;
    field: string | null;
  }>({ anchorEl: null, field: null });

  const showPinnedBorder =
    pinnedColumnsSectionSeparator === 'border-and-shadow' ||
    pinnedColumnsSectionSeparator === 'border';
  const showPinnedShadow =
    pinnedColumnsSectionSeparator === 'border-and-shadow' ||
    pinnedColumnsSectionSeparator === 'shadow';

  const activeMenuHeader = operatorMenuState.field
    ? headerGroup.headers.find((h) => h.column.id === operatorMenuState.field) ??
      null
    : null;
  const activeMenuColDef = activeMenuHeader
    ? (activeMenuHeader.column.columnDef.meta as ColumnMetaExt<R> | undefined)
        ?.colDef
    : undefined;
  const activeMenuOperators = getOperatorsForColumn(activeMenuColDef);
  const activeMenuCurrentOp = operatorMenuState.field
    ? getHeaderFilterOperator(
        filterModel,
        operatorMenuState.field,
        activeMenuColDef,
      )
    : 'contains';

  const isColVirtualized = Boolean(columnWindow?.isVirtualized);
  const leftHeaders = isColVirtualized && columnWindow
    ? columnWindow.leftIndices
        .map((i) => headerGroup.headers[i])
        .filter(Boolean)
    : [];
  const centerHeaders = isColVirtualized && columnWindow
    ? columnWindow.centerIndices
        .map((i) => headerGroup.headers[i])
        .filter(Boolean)
    : headerGroup.headers;
  const rightHeaders = isColVirtualized && columnWindow
    ? columnWindow.rightIndices
        .map((i) => headerGroup.headers[i])
        .filter(Boolean)
    : [];

  const renderHeaderFilterCell = (
    header: HeaderGroup<DataGridFeatures, R>['headers'][number],
  ) => {
    const colId = header.column.id;
    const meta = header.column.columnDef.meta as ColumnMetaExt<R> | undefined;
    const colDef = meta?.colDef;
          const isUtilityCol =
            colId === GRID_CHECKBOX_SELECTION_FIELD ||
            colId === GRID_REORDER_COL_FIELD ||
            colId === GRID_DETAIL_PANEL_TOGGLE_FIELD ||
            isHierarchyColId(colId) ||
            colDef?.type === 'actions';
          const isFilterable = !isUtilityCol && colDef?.filterable !== false;

          const pinnedInfo = pinnedLayout[colId];
          const isPinned = pinnedInfo && pinnedInfo.side !== false;
          const isLeftBoundary =
            pinnedInfo?.side === 'left' && pinnedInfo.isBoundary;
          const isRightBoundary =
            pinnedInfo?.side === 'right' && pinnedInfo.isBoundary;
          const hasLeftSectionBorder = isLeftBoundary && showPinnedBorder;
          const hasRightSectionBorder = isRightBoundary && showPinnedBorder;

          const currentValue = getHeaderFilterValue(filterModel, colId);
          const currentOperator = getHeaderFilterOperator(
            filterModel,
            colId,
            colDef,
          );
          const colType = colDef?.type ?? 'string';
          const operators = getOperatorsForColumn(colDef);
          const activeOpOption =
            operators.find((o) => o.value === currentOperator) ?? operators[0];
          const requiresValue = activeOpOption?.requiresValue ?? true;
          const isColumnFiltered =
            !requiresValue || currentValue.trim().length > 0;
          const selectOptions =
            colType === 'singleSelect'
              ? normalizeValueOptions(colDef?.valueOptions)
              : [];

          return (
            <Box
              key={`hdr-filter-${header.id}`}
              role="columnheader"
              className="MuiDataGrid-headerFilterCell"
              sx={{
                ...(isPinned
                  ? {
                      position: 'sticky',
                      [pinnedInfo.side as 'left' | 'right']:
                        `${pinnedInfo.offset}px`,
                      zIndex: 4,
                    }
                  : {
                      position: 'relative',
                      zIndex: 2,
                    }),
                width: header.getSize(),
                minWidth: header.getSize(),
                maxWidth: header.getSize(),
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                px: isUtilityCol ? 0 : '6px',
                bgcolor: 'var(--DataGrid-containerBackground, #FFFFFF)',
                borderRight:
                  showColumnVerticalBorder || hasLeftSectionBorder
                    ? '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)'
                    : 'none',
                borderLeft: hasRightSectionBorder
                  ? '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)'
                  : 'none',
                boxSizing: 'border-box',
              }}
            >
              {isFilterable && (
                <>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {!requiresValue ? (
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        disabled
                        value={activeOpOption?.label ?? ''}
                        slotProps={{
                          input: {
                            'aria-label': `列头筛选 ${colDef?.headerName ?? colId}`,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  aria-label={`清空${colDef?.headerName ?? colId}列头筛选`}
                                  onClick={() => onHeaderFilterChange(colId, '')}
                                  sx={{ p: 0.2, pointerEvents: 'auto' }}
                                >
                                  <CloseIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </InputAdornment>
                            ),
                            sx: {
                              height: 32,
                              fontSize: '0.8125rem',
                              pr: 0.5,
                              '& input': { py: 0.5, px: 1 },
                            },
                          },
                        }}
                      />
                    ) : colType === 'singleSelect' &&
                      currentOperator === 'isAnyOf' ? (
                      (() => {
                        const selectedValues = currentValue
                          ? currentValue
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : [];
                        return (
                          <TextField
                            select
                            fullWidth
                            size="small"
                            variant="outlined"
                            value={selectedValues}
                            onChange={(e) => {
                              const next = e.target.value as unknown;
                              const arr = Array.isArray(next)
                                ? next.map(String)
                                : String(next).split(',').filter(Boolean);
                              onHeaderFilterChange(colId, arr.join(','));
                            }}
                            slotProps={{
                              select: {
                                multiple: true,
                                displayEmpty: true,
                                renderValue: (val) => {
                                  const arr = Array.isArray(val)
                                    ? val.map(String)
                                    : [];
                                  if (arr.length === 0) {
                                    return (
                                      <Box
                                        component="span"
                                        sx={{ color: 'rgba(0, 0, 0, 0.38)' }}
                                      >
                                        属于任一...
                                      </Box>
                                    );
                                  }
                                  return arr
                                    .map(
                                      (v) =>
                                        selectOptions.find(
                                          (o) => String(o.value) === v,
                                        )?.label ?? v,
                                    )
                                    .join('、');
                                },
                              },
                              input: {
                                'aria-label': `列头筛选 ${colDef?.headerName ?? colId}`,
                                sx: {
                                  height: 32,
                                  fontSize: '0.8125rem',
                                  '& .MuiSelect-select': {
                                    py: 0.5,
                                    pl: 1,
                                  },
                                },
                              },
                            }}
                          >
                            {selectOptions.map((opt) => {
                              const valStr = String(opt.value);
                              return (
                                <MenuItem
                                  key={valStr}
                                  value={valStr}
                                  dense
                                  sx={{ fontSize: '0.8125rem', py: 0.2 }}
                                >
                                  <Checkbox
                                    size="small"
                                    checked={selectedValues.includes(valStr)}
                                    sx={{ p: 0.35, mr: 0.5 }}
                                  />
                                  {opt.label}
                                </MenuItem>
                              );
                            })}
                          </TextField>
                        );
                      })()
                    ) : colType === 'singleSelect' ? (
                      <TextField
                        select
                        fullWidth
                        size="small"
                        variant="outlined"
                        value={currentValue}
                        onChange={(e) =>
                          onHeaderFilterChange(colId, e.target.value)
                        }
                        slotProps={{
                          select: {
                            displayEmpty: true,
                            renderValue: (val) => {
                              const s = String(val ?? '');
                              if (!s) {
                                return (
                                  <Box
                                    component="span"
                                    sx={{ color: 'rgba(0, 0, 0, 0.38)' }}
                                  >
                                    {activeOpOption?.label ?? '全部'}
                                  </Box>
                                );
                              }
                              const matched = selectOptions.find(
                                (o) => String(o.value) === s,
                              );
                              return matched ? matched.label : s;
                            },
                          },
                          input: {
                            'aria-label': `列头筛选 ${colDef?.headerName ?? colId}`,
                            sx: {
                              height: 32,
                              fontSize: '0.8125rem',
                              '& .MuiSelect-select': {
                                py: 0.5,
                                pl: 1,
                              },
                            },
                          },
                        }}
                      >
                        <MenuItem value="" sx={{ fontSize: '0.8125rem' }}>
                          全部
                        </MenuItem>
                        {selectOptions.map((opt) => (
                          <MenuItem
                            key={String(opt.value)}
                            value={String(opt.value)}
                            sx={{ fontSize: '0.8125rem' }}
                          >
                            {opt.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : colType === 'boolean' ? (
                      <TextField
                        select
                        fullWidth
                        size="small"
                        variant="outlined"
                        value={currentValue}
                        onChange={(e) =>
                          onHeaderFilterChange(colId, e.target.value)
                        }
                        slotProps={{
                          select: {
                            displayEmpty: true,
                            renderValue: (val) => {
                              const s = String(val ?? '');
                              if (!s) {
                                return (
                                  <Box
                                    component="span"
                                    sx={{ color: 'rgba(0, 0, 0, 0.38)' }}
                                  >
                                    全部
                                  </Box>
                                );
                              }
                              return s === 'true' ? '是' : '否';
                            },
                          },
                          input: {
                            'aria-label': `列头筛选 ${colDef?.headerName ?? colId}`,
                            sx: {
                              height: 32,
                              fontSize: '0.8125rem',
                              '& .MuiSelect-select': {
                                py: 0.5,
                                pl: 1,
                              },
                            },
                          },
                        }}
                      >
                        <MenuItem value="" sx={{ fontSize: '0.8125rem' }}>
                          全部
                        </MenuItem>
                        <MenuItem value="true" sx={{ fontSize: '0.8125rem' }}>
                          是
                        </MenuItem>
                        <MenuItem value="false" sx={{ fontSize: '0.8125rem' }}>
                          否
                        </MenuItem>
                      </TextField>
                    ) : (
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        type={colType === 'number' ? 'number' : 'text'}
                        placeholder={
                          colType === 'date'
                            ? 'YYYY-MM-DD'
                            : colType === 'dateTime'
                              ? 'YYYY-MM-DD HH:mm'
                              : activeOpOption?.label ?? '筛选...'
                        }
                        value={currentValue}
                        onChange={(e) =>
                          onHeaderFilterChange(colId, e.target.value)
                        }
                        slotProps={{
                          input: {
                            'aria-label': `列头筛选 ${colDef?.headerName ?? colId}`,
                            sx: {
                              height: 32,
                              fontSize: '0.8125rem',
                              pr: currentValue ? 0.4 : 0.75,
                              '& input': {
                                py: 0.5,
                                pl: 1,
                                pr: 0.25,
                              },
                            },
                            endAdornment: currentValue ? (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  aria-label={`清空${colDef?.headerName ?? colId}列头筛选`}
                                  onClick={() =>
                                    onHeaderFilterChange(colId, '')
                                  }
                                  sx={{ p: 0.2 }}
                                >
                                  <CloseIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </InputAdornment>
                            ) : null,
                          },
                        }}
                      />
                    )}
                  </Box>

                  {/* Official MUI X Pro Per-Column Operator Picker Button */}
                  {operators.length > 1 && (
                    <Tooltip
                      title={`操作符：${activeOpOption?.label ?? currentOperator}`}
                      enterDelay={400}
                    >
                      <IconButton
                        size="small"
                        aria-label={`选择${colDef?.headerName ?? colId}筛选操作符`}
                        aria-haspopup="menu"
                        onClick={(e) =>
                          setOperatorMenuState({
                            anchorEl: e.currentTarget,
                            field: colId,
                          })
                        }
                        sx={{
                          p: 0.35,
                          flexShrink: 0,
                          color: isColumnFiltered
                            ? '#1976D2'
                            : 'rgba(0, 0, 0, 0.42)',
                          '&:hover': {
                            color: '#1976D2',
                            bgcolor: 'rgba(25, 118, 210, 0.06)',
                          },
                        }}
                      >
                        <FilterAltOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )}

              {isLeftBoundary && showPinnedShadow && (
                <Box
                  aria-hidden="true"
                  className="MuiDataGrid-scrollShadow MuiDataGrid-scrollShadow--left"
                  sx={{
                    left: hasLeftSectionBorder ? 'calc(100% + 1px)' : '100%',
                    opacity: isScrolledLeft ? 1 : 0,
                  }}
                />
              )}
              {isRightBoundary && showPinnedShadow && (
                <Box
                  aria-hidden="true"
                  className="MuiDataGrid-scrollShadow MuiDataGrid-scrollShadow--right"
                  sx={{
                    right: hasRightSectionBorder ? 'calc(100% + 1px)' : '100%',
                    opacity: isScrolledRight ? 1 : 0,
                  }}
                />
              )}
            </Box>
          );
        };

  return (
    <>
      <Box
        role="row"
        className="MuiDataGrid-headerFilterRow"
        sx={{
          display: 'flex',
          width: '100%',
          height: 54,
          bgcolor: 'var(--DataGrid-containerBackground, #FFFFFF)',
          borderBottom: '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
        }}
      >
        {isColVirtualized && leftHeaders.map((h) => renderHeaderFilterCell(h))}
        {isColVirtualized && columnWindow && columnWindow.leftSpacerWidth > 0 && (
          <Box
            aria-hidden="true"
            sx={{
              width: columnWindow.leftSpacerWidth,
              minWidth: columnWindow.leftSpacerWidth,
              flexShrink: 0,
            }}
          />
        )}
        {centerHeaders.map((h) => renderHeaderFilterCell(h))}
        {isColVirtualized && columnWindow && columnWindow.rightSpacerWidth > 0 && (
          <Box
            aria-hidden="true"
            sx={{
              width: columnWindow.rightSpacerWidth,
              minWidth: columnWindow.rightSpacerWidth,
              flexShrink: 0,
            }}
          />
        )}
        {isColVirtualized && rightHeaders.map((h) => renderHeaderFilterCell(h))}
      </Box>

      {/* Operator Picker Popover Menu matching MUI X GridHeaderFilterMenu */}
      <Menu
        anchorEl={operatorMenuState.anchorEl}
        open={Boolean(operatorMenuState.anchorEl)}
        onClose={() => setOperatorMenuState({ anchorEl: null, field: null })}
        slotProps={{
          paper: {
            elevation: 8,
            sx: { minWidth: 152, borderRadius: '4px', mt: 0.5 },
          },
        }}
      >
        {activeMenuOperators.map((op) => {
          const isSelected = op.value === activeMenuCurrentOp;
          return (
            <MenuItem
              key={op.value}
              selected={isSelected}
              onClick={() => {
                if (operatorMenuState.field) {
                  onHeaderFilterOperatorChange(
                    operatorMenuState.field,
                    op.value,
                  );
                }
                setOperatorMenuState({ anchorEl: null, field: null });
              }}
              sx={{ fontSize: '0.8125rem', py: 0.75 }}
            >
              <ListItemIcon sx={{ minWidth: 26 }}>
                {isSelected ? (
                  <CheckIcon sx={{ fontSize: 16, color: '#1976D2' }} />
                ) : null}
              </ListItemIcon>
              <ListItemText
                primary={op.label}
                slotProps={{ primary: { sx: { fontSize: '0.8125rem' } } }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
