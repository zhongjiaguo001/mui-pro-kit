import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Popover,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import type {
  GridColDef,
  GridFilterItem,
  GridFilterModel,
  GridFilterOperatorValue,
  GridLogicOperator,
  GridValidRowModel,
} from '../types';
import {
  formatCellValue,
  getOperatorsForColumn,
  normalizeValueOptions,
  resolveCellValue,
} from '../core/gridCore';
import {
  GRID_ZH_CN_LOCALE_TEXT,
  type GridLocaleText,
} from '../core/localeText';

interface GridFilterPanelProps<R extends GridValidRowModel> {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  columns: GridColDef<R>[];
  rows?: R[];
  filterModel: GridFilterModel;
  onFilterModelChange: (next: GridFilterModel) => void;
  localeText?: GridLocaleText;
}

export function GridFilterPanel<R extends GridValidRowModel>({
  anchorEl,
  onClose,
  columns,
  rows = [],
  filterModel,
  onFilterModelChange,
  localeText = GRID_ZH_CN_LOCALE_TEXT,
}: GridFilterPanelProps<R>) {
  const filterableColumns = columns.filter(
    (c) => c.filterable !== false && c.type !== 'actions',
  );

  const items = filterModel.items;
  const logicOperator: GridLogicOperator = filterModel.logicOperator ?? 'and';

  // Official MUI X FilterPanel behavior: auto-initialize 1 ready-to-edit rule on open if empty
  React.useEffect(() => {
    if (!anchorEl || items.length > 0 || filterableColumns.length === 0) return;
    const firstCol = filterableColumns[0];
    const ops = getOperatorsForColumn(firstCol);
    onFilterModelChange({
      ...filterModel,
      items: [
        {
          id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          field: firstCol.field,
          operator: ops[0]?.value ?? 'contains',
          value: '',
        },
      ],
    });
  }, [anchorEl]);

  const handleAddRule = () => {
    const firstCol = filterableColumns[0];
    if (!firstCol) return;
    const ops = getOperatorsForColumn(firstCol);
    const nextItem: GridFilterItem = {
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      field: firstCol.field,
      operator: ops[0]?.value ?? 'contains',
      value: firstCol.type === 'boolean' ? 'true' : '',
    };
    onFilterModelChange({
      ...filterModel,
      items: [...items, nextItem],
    });
  };

  const handleRemoveRule = (id: string) => {
    onFilterModelChange({
      ...filterModel,
      items: items.filter((item) => item.id !== id),
    });
  };

  const handleUpdateRule = (id: string, patch: Partial<GridFilterItem>) => {
    onFilterModelChange({
      ...filterModel,
      items: items.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...patch };
        if (patch.field && patch.field !== item.field) {
          const targetCol = filterableColumns.find((c) => c.field === patch.field);
          const ops = getOperatorsForColumn(targetCol);
          merged.operator = ops[0]?.value ?? 'contains';
          merged.value = targetCol?.type === 'boolean' ? 'true' : '';
        } else if (patch.operator && patch.operator !== item.operator) {
          if (patch.operator === 'isAnyOf') {
            if (Array.isArray(item.value)) {
              merged.value = item.value;
            } else if (
              item.value !== undefined &&
              item.value !== null &&
              String(item.value).trim() !== ''
            ) {
              merged.value = [String(item.value).trim()];
            } else {
              merged.value = [];
            }
          } else if (Array.isArray(item.value)) {
            merged.value = item.value[0] !== undefined ? String(item.value[0]) : '';
          }
        }
        return merged;
      }),
    });
  };

  const handleLogicChange = (nextLogic: GridLogicOperator) => {
    onFilterModelChange({
      ...filterModel,
      logicOperator: nextLogic,
    });
  };

  const handleClearAll = () => {
    onFilterModelChange({
      ...filterModel,
      items: [],
    });
  };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          elevation: 8,
          className: 'MuiDataGrid-panel',
          sx: {
            width: { xs: 'calc(100vw - 32px)', sm: 624 },
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: '4px',
            mt: 0.5,
            bgcolor: '#FFFFFF',
          },
        },
      }}
    >
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {items.length === 0 ? (
          <Box
            sx={{
              py: 1.5,
              px: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Typography sx={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>
              当前未添加筛选条件
            </Typography>
            <Button
              size="small"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddRule}
            >
              {localeText.filterPanelAddFilter}
            </Button>
          </Box>
        ) : (
          items.map((item, idx) => {
            const colDef = filterableColumns.find((c) => c.field === item.field);
            const operators = getOperatorsForColumn(colDef);
            const activeOp =
              operators.find((o) => o.value === item.operator) ?? operators[0];
            const requiresValue = activeOp?.requiresValue ?? true;
            const CustomInputComponent = activeOp?.customOperator?.InputComponent;
            const customInputProps = activeOp?.customOperator?.InputComponentProps;
            const valueOptions = normalizeValueOptions(colDef?.valueOptions);

            return (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 1.25,
                  flexWrap: { xs: 'wrap', sm: 'nowrap' },
                }}
              >
                {/* Remove rule button */}
                <IconButton
                  size="small"
                  aria-label={`${localeText.filterPanelDeleteIconLabel} ${idx + 1}`}
                  onClick={() => handleRemoveRule(item.id)}
                  sx={{
                    mb: 0.25,
                    color: 'rgba(0, 0, 0, 0.54)',
                    '&:hover': { color: 'rgba(0, 0, 0, 0.87)' },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>

                {/* Logic operator (AND / OR) matching MUI X FilterPanel */}
                {items.length > 1 && (
                  <Box sx={{ width: 68, flexShrink: 0 }}>
                    {idx === 0 ? (
                      <Box sx={{ height: 32 }} />
                    ) : idx === 1 ? (
                      <FormControl variant="standard" fullWidth>
                        <Select
                          aria-label={localeText.filterPanelLogicOperator}
                          value={logicOperator}
                          onChange={(e) =>
                            handleLogicChange(e.target.value as GridLogicOperator)
                          }
                          sx={{ fontSize: '0.875rem' }}
                        >
                          <MenuItem value="and">
                            {localeText.filterPanelLogicAnd}
                          </MenuItem>
                          <MenuItem value="or">
                            {localeText.filterPanelLogicOr}
                          </MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          color: 'rgba(0, 0, 0, 0.6)',
                          pb: 0.75,
                          pl: 0.5,
                        }}
                      >
                        {logicOperator === 'and'
                          ? localeText.filterPanelLogicAnd
                          : localeText.filterPanelLogicOr}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Column selector (MUI standard underline variant) */}
                <FormControl
                  variant="standard"
                  sx={{ minWidth: 136, flex: '1 1 136px' }}
                >
                  <InputLabel id={`filter-col-label-${item.id}`}>
                    {localeText.filterPanelColumns}
                  </InputLabel>
                  <Select
                    labelId={`filter-col-label-${item.id}`}
                    value={item.field}
                    onChange={(e) =>
                      handleUpdateRule(item.id, { field: e.target.value })
                    }
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {filterableColumns.map((col) => (
                      <MenuItem key={col.field} value={col.field}>
                        {col.headerName ?? col.field}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Operator selector (MUI standard underline variant) */}
                <FormControl
                  variant="standard"
                  sx={{ minWidth: 168, flex: '0 0 168px' }}
                >
                  <InputLabel id={`filter-op-label-${item.id}`}>
                    {localeText.filterPanelOperator}
                  </InputLabel>
                  <Select
                    labelId={`filter-op-label-${item.id}`}
                    value={item.operator}
                    onChange={(e) =>
                      handleUpdateRule(item.id, {
                        operator: e.target.value as GridFilterOperatorValue,
                      })
                    }
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {operators.map((op) => (
                      <MenuItem key={op.value} value={op.value}>
                        {localeText.filterOperatorLabels[op.value] ?? op.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Value editor (MUI standard underline variant) */}
                <Box sx={{ flex: '1 1 160px', minWidth: 144 }}>
                  {!requiresValue ? (
                    <TextField
                      variant="standard"
                      fullWidth
                      disabled
                      value=""
                      label={localeText.filterPanelInputLabel}
                      placeholder="—"
                      slotProps={{
                        inputLabel: { shrink: true },
                        input: { sx: { fontSize: '0.875rem' } },
                      }}
                    />
                  ) : CustomInputComponent ? (
                    <CustomInputComponent
                      item={item}
                      applyValue={(nextItem) =>
                        handleUpdateRule(item.id, nextItem)
                      }
                      {...(customInputProps ?? {})}
                    />
                  ) : item.operator === 'isAnyOf' ? (
                    (() => {
                      const multiOptions =
                        valueOptions.length > 0
                          ? valueOptions
                          : Array.from(
                              new Set(
                                rows
                                  .map((r) => {
                                    if (!colDef) return '';
                                    const raw = resolveCellValue(r, colDef);
                                    return formatCellValue(raw, r, colDef).trim();
                                  })
                                  .filter(Boolean),
                              ),
                            )
                              .sort((a, b) => a.localeCompare(b, 'zh-CN'))
                              .slice(0, 60)
                              .map((v) => ({ value: v, label: v }));

                      const selectedArr: string[] = Array.isArray(item.value)
                        ? item.value.map((v) => String(v))
                        : item.value !== undefined &&
                            item.value !== null &&
                            String(item.value).trim() !== ''
                          ? String(item.value)
                              .split(/[,，]/)
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : [];

                      return (
                        <FormControl variant="standard" fullWidth>
                          <InputLabel id={`filter-anyof-label-${item.id}`} shrink>
                            多选筛选值
                          </InputLabel>
                          <Select
                            labelId={`filter-anyof-label-${item.id}`}
                            multiple
                            displayEmpty
                            value={selectedArr}
                            onChange={(e) => {
                              const next = e.target.value;
                              handleUpdateRule(item.id, {
                                value: Array.isArray(next)
                                  ? next.map(String)
                                  : String(next).split(',').filter(Boolean),
                              });
                            }}
                            renderValue={(selected) => {
                              const arr = selected as string[];
                              if (arr.length === 0) {
                                return (
                                  <Box
                                    component="span"
                                    sx={{ color: 'rgba(0, 0, 0, 0.38)' }}
                                  >
                                    选择多个选项...
                                  </Box>
                                );
                              }
                              const labels = arr.map(
                                (val) =>
                                  multiOptions.find(
                                    (o) => String(o.value) === val,
                                  )?.label ?? val,
                              );
                              return labels.join('、');
                            }}
                            MenuProps={{
                              slotProps: { paper: { sx: { maxHeight: 280 } } },
                            }}
                            sx={{ fontSize: '0.875rem' }}
                          >
                            {multiOptions.map((opt) => {
                              const valStr = String(opt.value);
                              const checked = selectedArr.includes(valStr);
                              return (
                                <MenuItem
                                  key={valStr}
                                  value={valStr}
                                  dense
                                  sx={{ py: 0.25 }}
                                >
                                  <Checkbox
                                    size="small"
                                    checked={checked}
                                    sx={{ p: 0.4, mr: 0.75 }}
                                  />
                                  <ListItemText
                                    primary={opt.label}
                                    slotProps={{
                                      primary: { sx: { fontSize: '0.84rem' } },
                                    }}
                                  />
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      );
                    })()
                  ) : colDef?.type === 'singleSelect' ? (
                    <FormControl variant="standard" fullWidth>
                      <InputLabel id={`filter-val-label-${item.id}`}>
                        筛选值
                      </InputLabel>
                      <Select
                        labelId={`filter-val-label-${item.id}`}
                        value={String(item.value ?? '')}
                        onChange={(e) =>
                          handleUpdateRule(item.id, { value: e.target.value })
                        }
                        sx={{ fontSize: '0.875rem' }}
                      >
                        <MenuItem value="">
                          <em>全部</em>
                        </MenuItem>
                        {valueOptions.map((opt) => (
                          <MenuItem
                            key={String(opt.value)}
                            value={String(opt.value)}
                          >
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : colDef?.type === 'boolean' ? (
                    <FormControl variant="standard" fullWidth>
                      <InputLabel id={`filter-bool-label-${item.id}`}>
                        筛选值
                      </InputLabel>
                      <Select
                        labelId={`filter-bool-label-${item.id}`}
                        value={String(item.value ?? 'true')}
                        onChange={(e) =>
                          handleUpdateRule(item.id, { value: e.target.value })
                        }
                        sx={{ fontSize: '0.875rem' }}
                      >
                        <MenuItem value="true">是</MenuItem>
                        <MenuItem value="false">否</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      variant="standard"
                      fullWidth
                      label={localeText.filterPanelInputLabel}
                      type={
                        colDef?.type === 'number'
                          ? 'number'
                          : colDef?.type === 'date'
                            ? 'date'
                            : colDef?.type === 'dateTime'
                              ? 'datetime-local'
                              : 'text'
                      }
                      value={item.value ?? ''}
                      onChange={(e) =>
                        handleUpdateRule(item.id, { value: e.target.value })
                      }
                      placeholder={localeText.filterPanelInputPlaceholder}
                      slotProps={{
                        inputLabel: { shrink: true },
                        input: { sx: { fontSize: '0.875rem' } },
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* Official MUI X FilterPanel Footer */}
      {items.length > 0 && (
        <Box
          sx={{
            px: 1.5,
            py: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button
            size="small"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddRule}
            sx={{ fontSize: '0.8125rem' }}
          >
            {localeText.filterPanelAddFilter}
          </Button>
          <Button
            size="small"
            color="primary"
            startIcon={<DeleteOutlineIcon fontSize="small" />}
            onClick={handleClearAll}
            sx={{ fontSize: '0.8125rem' }}
          >
            {localeText.filterPanelRemoveAll}
          </Button>
        </Box>
      )}
    </Popover>
  );
}
