import React from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PivotTableChartIcon from '@mui/icons-material/PivotTableChart';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type {
  GridAggregationFunctionName,
  GridColDef,
  GridPivotModel,
  GridValidRowModel,
} from '../types';
import { AGGREGATION_FUNCTION_LABELS } from '../core/gridCore';

interface GridPivotPanelProps<R extends GridValidRowModel> {
  columns: GridColDef<R>[];
  pivotModel: GridPivotModel;
  onPivotModelChange: (next: GridPivotModel) => void;
  onResetPivotModel?: () => void;
  onClose: () => void;
  embedded?: boolean;
}

const NUMERIC_AGG_OPTIONS: GridAggregationFunctionName[] = [
  'sum',
  'avg',
  'min',
  'max',
  'size',
];

const GENERAL_AGG_OPTIONS: GridAggregationFunctionName[] = ['size'];

export function GridPivotPanel<R extends GridValidRowModel>({
  columns,
  pivotModel,
  onPivotModelChange,
  onResetPivotModel,
  onClose,
  embedded = false,
}: GridPivotPanelProps<R>) {
  const usableCols = columns.filter((c) => c.type !== 'actions');
  const colMap = new Map(usableCols.map((c) => [c.field, c]));

  const dimensionCandidates = usableCols.filter(
    (c) => c.type !== 'number' && c.groupable !== false,
  );
  const availableRowCandidates = dimensionCandidates.filter(
    (c) =>
      !pivotModel.rows.includes(c.field) &&
      !pivotModel.columns.includes(c.field),
  );
  const availableColCandidates = dimensionCandidates.filter(
    (c) =>
      !pivotModel.columns.includes(c.field) &&
      !pivotModel.rows.includes(c.field),
  );
  const availableValueCandidates = usableCols.filter(
    (c) => !pivotModel.values.some((v) => v.field === c.field),
  );

  const handleAddRowDim = (field: string) => {
    if (!field || pivotModel.rows.includes(field)) return;
    onPivotModelChange({
      ...pivotModel,
      rows: [...pivotModel.rows, field],
      columns: pivotModel.columns.filter((f) => f !== field),
    });
  };

  const handleRemoveRowDim = (field: string) => {
    onPivotModelChange({
      ...pivotModel,
      rows: pivotModel.rows.filter((f) => f !== field),
    });
  };

  const handleAddColDim = (field: string) => {
    if (!field || pivotModel.columns.includes(field)) return;
    onPivotModelChange({
      ...pivotModel,
      columns: [...pivotModel.columns, field],
      rows: pivotModel.rows.filter((f) => f !== field),
    });
  };

  const handleRemoveColDim = (field: string) => {
    onPivotModelChange({
      ...pivotModel,
      columns: pivotModel.columns.filter((f) => f !== field),
    });
  };

  const handleAddValueField = (field: string) => {
    if (!field || pivotModel.values.some((v) => v.field === field)) return;
    const colDef = colMap.get(field);
    const defaultAgg: GridAggregationFunctionName =
      colDef?.type === 'number' ? 'sum' : 'size';
    onPivotModelChange({
      ...pivotModel,
      values: [...pivotModel.values, { field, aggFunc: defaultAgg }],
    });
  };

  const handleChangeValueAgg = (
    field: string,
    aggFunc: GridAggregationFunctionName,
  ) => {
    onPivotModelChange({
      ...pivotModel,
      values: pivotModel.values.map((v) =>
        v.field === field ? { ...v, aggFunc } : v,
      ),
    });
  };

  const handleRemoveValueField = (field: string) => {
    onPivotModelChange({
      ...pivotModel,
      values: pivotModel.values.filter((v) => v.field !== field),
    });
  };

  return (
    <Box
      component="aside"
      aria-label="透视表配置面板"
      data-testid="pivot-panel"
      className="MuiDataGrid-pivotPanel"
      sx={{
        width: embedded ? '100%' : 280,
        minWidth: embedded ? 0 : 280,
        borderLeft: embedded
          ? 'none'
          : '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
        bgcolor: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      {!embedded && (
        <Box
          sx={{
            px: 1.5,
            py: 1.15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#FFFFFF',
            borderBottom: '1px solid #E0E0E0',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <PivotTableChartIcon sx={{ fontSize: 18, color: '#1976D2' }} />
            <Typography
              sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}
            >
              透视表配置
            </Typography>
          </Box>
          <IconButton
            size="small"
            aria-label="收起透视表配置面板"
            onClick={onClose}
            sx={{ p: 0.4, color: 'rgba(0, 0, 0, 0.54)' }}
          >
            <CloseIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>
      )}

      {/* Scrollable Pivot Zones */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.75,
        }}
      >
        {/* Row Dimensions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#475569',
              letterSpacing: '0.02em',
            }}
          >
            行维度 (Rows)
          </Typography>
          <Box
            sx={{
              p: 1,
              minHeight: 42,
              borderRadius: '4px',
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.65,
              alignItems: 'center',
            }}
          >
            {pivotModel.rows.length === 0 ? (
              <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                全部数据汇总为单行
              </Typography>
            ) : (
              pivotModel.rows.map((field) => {
                const label = colMap.get(field)?.headerName ?? field;
                return (
                  <Chip
                    key={field}
                    size="small"
                    variant="outlined"
                    label={label}
                    data-pivot-row-chip={field}
                    onDelete={() => handleRemoveRowDim(field)}
                    sx={{
                      height: 24,
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      color: '#1976D2',
                      bgcolor: 'rgba(25, 118, 210, 0.06)',
                      borderColor: 'rgba(25, 118, 210, 0.32)',
                    }}
                  />
                );
              })
            )}
          </Box>
          {availableRowCandidates.length > 0 && (
            <Select
              size="small"
              displayEmpty
              value=""
              aria-label="添加行维度"
              onChange={(e) => handleAddRowDim(String(e.target.value))}
              sx={{
                height: 30,
                fontSize: '0.78rem',
                bgcolor: '#FFFFFF',
              }}
            >
              <MenuItem value="" disabled sx={{ fontSize: '0.78rem' }}>
                + 添加行维度...
              </MenuItem>
              {availableRowCandidates.map((c) => (
                <MenuItem
                  key={c.field}
                  value={c.field}
                  sx={{ fontSize: '0.8125rem' }}
                >
                  {c.headerName ?? c.field}
                </MenuItem>
              ))}
            </Select>
          )}
        </Box>

        <Divider />

        {/* Column Dimensions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#475569',
              letterSpacing: '0.02em',
            }}
          >
            列维度 (Columns)
          </Typography>
          <Box
            sx={{
              p: 1,
              minHeight: 42,
              borderRadius: '4px',
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.65,
              alignItems: 'center',
            }}
          >
            {pivotModel.columns.length === 0 ? (
              <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                未拆分列透视维度
              </Typography>
            ) : (
              pivotModel.columns.map((field) => {
                const label = colMap.get(field)?.headerName ?? field;
                return (
                  <Chip
                    key={field}
                    size="small"
                    variant="outlined"
                    label={label}
                    data-pivot-col-chip={field}
                    onDelete={() => handleRemoveColDim(field)}
                    sx={{
                      height: 24,
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      color: '#0F766E',
                      bgcolor: 'rgba(15, 118, 110, 0.06)',
                      borderColor: 'rgba(15, 118, 110, 0.32)',
                    }}
                  />
                );
              })
            )}
          </Box>
          {availableColCandidates.length > 0 && (
            <Select
              size="small"
              displayEmpty
              value=""
              aria-label="添加列维度"
              onChange={(e) => handleAddColDim(String(e.target.value))}
              sx={{
                height: 30,
                fontSize: '0.78rem',
                bgcolor: '#FFFFFF',
              }}
            >
              <MenuItem value="" disabled sx={{ fontSize: '0.78rem' }}>
                + 添加列维度...
              </MenuItem>
              {availableColCandidates.map((c) => (
                <MenuItem
                  key={c.field}
                  value={c.field}
                  sx={{ fontSize: '0.8125rem' }}
                >
                  {c.headerName ?? c.field}
                </MenuItem>
              ))}
            </Select>
          )}
        </Box>

        <Divider />

        {/* Value Aggregations */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#475569',
              letterSpacing: '0.02em',
            }}
          >
            数值指标 (Values)
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {pivotModel.values.map((valSpec) => {
              const colDef = colMap.get(valSpec.field);
              const label = colDef?.headerName ?? valSpec.field;
              const options =
                colDef?.type === 'number'
                  ? NUMERIC_AGG_OPTIONS
                  : GENERAL_AGG_OPTIONS;
              return (
                <Box
                  key={valSpec.field}
                  data-pivot-value={valSpec.field}
                  sx={{
                    px: 1,
                    py: 0.65,
                    borderRadius: '4px',
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 0.75,
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: '#0F172A',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {label}
                  </Typography>
                  <Select
                    size="small"
                    value={valSpec.aggFunc}
                    aria-label={`${label}聚合函数`}
                    onChange={(e) =>
                      handleChangeValueAgg(
                        valSpec.field,
                        e.target.value as GridAggregationFunctionName,
                      )
                    }
                    sx={{
                      height: 26,
                      minWidth: 68,
                      fontSize: '0.75rem',
                      '& .MuiSelect-select': { py: 0.25, px: 0.75 },
                    }}
                  >
                    {options.map((fn) => (
                      <MenuItem
                        key={fn}
                        value={fn}
                        sx={{ fontSize: '0.78rem' }}
                      >
                        {AGGREGATION_FUNCTION_LABELS[fn]}
                      </MenuItem>
                    ))}
                  </Select>
                  <IconButton
                    size="small"
                    aria-label={`移除指标 ${label}`}
                    onClick={() => handleRemoveValueField(valSpec.field)}
                    disabled={pivotModel.values.length <= 1}
                    sx={{ p: 0.25, color: 'rgba(0, 0, 0, 0.45)' }}
                  >
                    <CloseIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
          {availableValueCandidates.length > 0 && (
            <Select
              size="small"
              displayEmpty
              value=""
              aria-label="添加统计指标"
              onChange={(e) => handleAddValueField(String(e.target.value))}
              sx={{
                height: 30,
                fontSize: '0.78rem',
                bgcolor: '#FFFFFF',
              }}
            >
              <MenuItem value="" disabled sx={{ fontSize: '0.78rem' }}>
                + 添加数值指标...
              </MenuItem>
              {availableValueCandidates.map((c) => (
                <MenuItem
                  key={c.field}
                  value={c.field}
                  sx={{ fontSize: '0.8125rem' }}
                >
                  {c.headerName ?? c.field}
                </MenuItem>
              ))}
            </Select>
          )}
        </Box>
      </Box>

      {/* Footer */}
      {onResetPivotModel && (
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderTop: '1px solid #E0E0E0',
            bgcolor: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <Button
            size="small"
            fullWidth
            variant="outlined"
            startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
            onClick={onResetPivotModel}
            sx={{
              fontSize: '0.78rem',
              color: '#475569',
              borderColor: '#CBD5E1',
            }}
          >
            恢复默认透视配置
          </Button>
        </Box>
      )}
    </Box>
  );
}
