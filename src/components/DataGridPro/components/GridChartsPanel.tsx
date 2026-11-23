import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AreaChartIcon from '@mui/icons-material/AreaChart';
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutlined';
import CloseIcon from '@mui/icons-material/Close';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import type {
  GridAggregationFunctionName,
  GridChartModel,
  GridChartType,
  GridColDef,
  GridValidRowModel,
} from '../types';
import { AGGREGATION_FUNCTION_LABELS } from '../core/gridCore';
import {
  buildChartSeries,
  formatCompactAxisValue,
  getChartEligibleFields,
  type ChartDatum,
} from '../core/chartEngine';

interface GridChartsPanelProps<R extends GridValidRowModel> {
  rows: R[];
  columns: GridColDef<R>[];
  chartModel: GridChartModel;
  onChartModelChange: (next: GridChartModel) => void;
  activeCrossFilterValue?: string | null;
  onCrossFilterSelect?: (field: string, rawKey: unknown) => void;
  onClearCrossFilter?: (field: string) => void;
  onClose: () => void;
}

const CHART_PALETTE = [
  '#1976D2',
  '#0288D1',
  '#2E7D32',
  '#ED6C02',
  '#7B1FA2',
  '#00897B',
  '#C62828',
  '#546E7A',
];

const CHART_TYPES: Array<{
  type: GridChartType;
  label: string;
  icon: React.ReactNode;
}> = [
  { type: 'bar', label: '柱状图', icon: <BarChartIcon sx={{ fontSize: 17 }} /> },
  { type: 'line', label: '折线图', icon: <ShowChartIcon sx={{ fontSize: 17 }} /> },
  { type: 'area', label: '面积图', icon: <AreaChartIcon sx={{ fontSize: 17 }} /> },
  { type: 'pie', label: '饼图', icon: <PieChartOutlineIcon sx={{ fontSize: 17 }} /> },
];

const AGG_FUNCS: GridAggregationFunctionName[] = [
  'sum',
  'avg',
  'max',
  'min',
  'size',
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function buildDonutArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const safeEnd =
    endAngle - startAngle >= 359.99 ? startAngle + 359.95 : endAngle;
  const outerStart = polarToCartesian(cx, cy, outerR, safeEnd);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, safeEnd);
  const largeArc = safeEnd - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export function GridChartsPanel<R extends GridValidRowModel>({
  rows,
  columns,
  chartModel,
  onChartModelChange,
  activeCrossFilterValue = null,
  onCrossFilterSelect,
  onClearCrossFilter,
  onClose,
}: GridChartsPanelProps<R>) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const { dimensionColumns, valueColumns } = useMemo(
    () => getChartEligibleFields(columns),
    [columns],
  );

  const chartResult = useMemo(
    () => buildChartSeries(rows, columns, chartModel),
    [chartModel, columns, rows],
  );

  const valColDef = useMemo(
    () => columns.find((c) => c.field === chartModel.valueField),
    [chartModel.valueField, columns],
  );

  // Cap displayed categories cleanly at 12 to keep axes legible
  const displayedData = useMemo(
    () => chartResult.data.slice(0, 12),
    [chartResult.data],
  );

  const hoveredItem: ChartDatum | null = useMemo(
    () => displayedData.find((d) => d.key === hoveredKey) ?? null,
    [displayedData, hoveredKey],
  );

  const activeCrossFilterLabel = useMemo(() => {
    if (!activeCrossFilterValue) return null;
    const match = chartResult.data.find(
      (d) =>
        d.key === activeCrossFilterValue ||
        String(d.rawKey) === activeCrossFilterValue ||
        d.label === activeCrossFilterValue,
    );
    return match ? match.label : activeCrossFilterValue;
  }, [activeCrossFilterValue, chartResult.data]);

  const svgWidth = 356;
  const svgHeight = 194;
  const margin = { top: 16, right: 14, bottom: 36, left: 54 };
  const plotW = svgWidth - margin.left - margin.right;
  const plotH = svgHeight - margin.top - margin.bottom;

  const yMax = useMemo(() => {
    const rawMax = Math.max(0, ...displayedData.map((d) => d.value));
    if (rawMax === 0) return 10;
    return rawMax * 1.12;
  }, [displayedData]);

  const yTicks = useMemo(
    () => [0, 0.25, 0.5, 0.75, 1].map((t) => yMax * t),
    [yMax],
  );

  const handleSelectItem = (datum: ChartDatum) => {
    if (!onCrossFilterSelect) return;
    if (
      activeCrossFilterValue &&
      (activeCrossFilterValue === datum.key ||
        activeCrossFilterValue === datum.label)
    ) {
      onClearCrossFilter?.(chartModel.dimensionField);
    } else {
      onCrossFilterSelect(chartModel.dimensionField, datum.rawKey);
    }
  };

  return (
    <Box
      component="aside"
      aria-label="数据图表联动面板"
      data-testid="charts-panel"
      sx={{
        width: 392,
        minWidth: 392,
        maxWidth: 392,
        borderLeft: '1px solid #E0E0E0',
        bgcolor: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 1.5,
          py: 1.1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E0E0E0',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
          <BarChartIcon sx={{ fontSize: 18, color: '#1976D2' }} />
          <Typography
            sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}
          >
            图表分析联动
          </Typography>
        </Box>
        <IconButton
          size="small"
          aria-label="收起图表分析面板"
          onClick={onClose}
          sx={{ p: 0.4, color: 'rgba(0, 0, 0, 0.54)' }}
        >
          <CloseIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      {/* Scrollable Body */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {/* Chart Type Segmented Control */}
        <Box
          role="group"
          aria-label="图表类型"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 0.5,
            p: 0.4,
            bgcolor: '#EEF2F6',
            borderRadius: '4px',
          }}
        >
          {CHART_TYPES.map((ct) => {
            const active = chartModel.chartType === ct.type;
            return (
              <Box
                key={ct.type}
                component="button"
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChartModelChange({ ...chartModel, chartType: ct.type })
                }
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.45,
                  py: 0.55,
                  px: 0.5,
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.76rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? '#1976D2' : '#475569',
                  bgcolor: active ? '#FFFFFF' : 'transparent',
                  boxShadow: active ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 140ms ease, color 140ms ease',
                  '&:hover': {
                    color: active ? '#1976D2' : '#0F172A',
                  },
                }}
              >
                {ct.icon}
                <span>{ct.label}</span>
              </Box>
            );
          })}
        </Box>

        {/* Dimension / Value / Aggregation Controls */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 84px',
            gap: 1,
          }}
        >
          <FormControl size="small" fullWidth>
            <InputLabel id="chart-dim-label" sx={{ fontSize: '0.78rem' }}>
              分类维度
            </InputLabel>
            <Select
              labelId="chart-dim-label"
              label="分类维度"
              value={chartModel.dimensionField}
              onChange={(e) =>
                onChartModelChange({
                  ...chartModel,
                  dimensionField: String(e.target.value),
                })
              }
              sx={{
                bgcolor: '#FFFFFF',
                fontSize: '0.78rem',
                height: 34,
              }}
            >
              {dimensionColumns.map((col) => (
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
            <InputLabel id="chart-val-label" sx={{ fontSize: '0.78rem' }}>
              数值指标
            </InputLabel>
            <Select
              labelId="chart-val-label"
              label="数值指标"
              value={chartModel.valueField}
              onChange={(e) =>
                onChartModelChange({
                  ...chartModel,
                  valueField: String(e.target.value),
                })
              }
              sx={{
                bgcolor: '#FFFFFF',
                fontSize: '0.78rem',
                height: 34,
              }}
            >
              {valueColumns.map((col) => (
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
            <InputLabel id="chart-agg-label" sx={{ fontSize: '0.78rem' }}>
              聚合
            </InputLabel>
            <Select
              labelId="chart-agg-label"
              label="聚合"
              value={chartModel.aggFunc}
              onChange={(e) =>
                onChartModelChange({
                  ...chartModel,
                  aggFunc: e.target.value as GridAggregationFunctionName,
                })
              }
              sx={{
                bgcolor: '#FFFFFF',
                fontSize: '0.78rem',
                height: 34,
              }}
            >
              {AGG_FUNCS.map((fn) => (
                <MenuItem key={fn} value={fn} sx={{ fontSize: '0.8rem' }}>
                  {AGGREGATION_FUNCTION_LABELS[fn]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Chart Canvas Surface */}
        <Box
          sx={{
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '4px',
            p: 1.25,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
            flexShrink: 0,
          }}
        >
          {/* Quiet chart header & live hover readout */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 1,
              minHeight: 20,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#0F172A',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {chartResult.dimensionHeader} × {chartResult.valueHeader}（
              {AGGREGATION_FUNCTION_LABELS[chartResult.aggFunc]}）
            </Typography>
            <Typography
              className="font-mono-tabular"
              sx={{
                fontSize: '0.74rem',
                color: hoveredItem ? '#1976D2' : '#64748B',
                fontWeight: hoveredItem ? 600 : 400,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {hoveredItem
                ? `${hoveredItem.label} · ${hoveredItem.formattedValue} (${Math.round(hoveredItem.share * 100)}%)`
                : `共 ${rows.length} 条记录`}
            </Typography>
          </Box>

          {displayedData.length === 0 ? (
            <Box
              sx={{
                height: svgHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                fontSize: '0.8125rem',
              }}
            >
              当前筛选结果下无可可视化数据
            </Box>
          ) : chartModel.chartType === 'pie' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.25 }}>
              <svg
                width={168}
                height={168}
                viewBox="0 0 168 168"
                role="img"
                aria-label={`${chartResult.dimensionHeader} 饼图`}
                data-testid="chart-svg-pie"
                style={{ flexShrink: 0 }}
              >
                {(() => {
                  let accAngle = 0;
                  return displayedData.map((d, idx) => {
                    const sweep = d.share * 360;
                    const startAngle = accAngle;
                    const endAngle = accAngle + sweep;
                    accAngle = endAngle;
                    const color = CHART_PALETTE[idx % CHART_PALETTE.length];
                    const isActive =
                      activeCrossFilterValue === d.key ||
                      activeCrossFilterValue === d.label;
                    const isHovered = hoveredKey === d.key;
                    const outerR = isHovered || isActive ? 74 : 68;
                    const path =
                      sweep > 0.1
                        ? buildDonutArcPath(84, 84, outerR, 40, startAngle, endAngle)
                        : '';
                    return (
                      <path
                        key={d.key}
                        d={path}
                        fill={color}
                        fillOpacity={
                          activeCrossFilterValue && !isActive ? 0.35 : 0.92
                        }
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                        data-chart-datum={d.key}
                        style={{ cursor: 'pointer', transition: 'fill-opacity 140ms ease' }}
                        onMouseEnter={() => setHoveredKey(d.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        onClick={() => handleSelectItem(d)}
                      >
                        <title>{`${d.label}: ${d.formattedValue} (${Math.round(d.share * 100)}%)`}</title>
                      </path>
                    );
                  });
                })()}
                <text
                  x={84}
                  y={80}
                  textAnchor="middle"
                  style={{ fontSize: 11, fill: '#64748B' }}
                >
                  {hoveredItem ? hoveredItem.label.slice(0, 6) : '总分类'}
                </text>
                <text
                  x={84}
                  y={98}
                  textAnchor="middle"
                  className="font-mono-tabular"
                  style={{ fontSize: 13, fontWeight: 700, fill: '#0F172A' }}
                >
                  {hoveredItem
                    ? `${Math.round(hoveredItem.share * 100)}%`
                    : `${displayedData.length} 项`}
                </text>
              </svg>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  maxHeight: 168,
                  overflowY: 'auto',
                }}
              >
                {displayedData.map((d, idx) => {
                  const color = CHART_PALETTE[idx % CHART_PALETTE.length];
                  const isActive =
                    activeCrossFilterValue === d.key ||
                    activeCrossFilterValue === d.label;
                  return (
                    <Box
                      key={d.key}
                      component="button"
                      type="button"
                      onMouseEnter={() => setHoveredKey(d.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onClick={() => handleSelectItem(d)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 0.75,
                        px: 0.6,
                        py: 0.35,
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        bgcolor: isActive
                          ? 'rgba(25, 118, 210, 0.1)'
                          : hoveredKey === d.key
                            ? '#F1F5F9'
                            : 'transparent',
                        textAlign: 'left',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.6,
                          minWidth: 0,
                        }}
                      >
                        <Box
                          sx={{
                            width: 9,
                            height: 9,
                            borderRadius: '2px',
                            bgcolor: color,
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          noWrap
                          sx={{ fontSize: '0.75rem', color: '#334155' }}
                        >
                          {d.label}
                        </Typography>
                      </Box>
                      <Typography
                        className="font-mono-tabular"
                        sx={{
                          fontSize: '0.73rem',
                          color: '#0F172A',
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        {Math.round(d.share * 100)}%
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ) : (
            <svg
              width="100%"
              height={svgHeight}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              role="img"
              aria-label={`${chartResult.dimensionHeader} ${
                chartModel.chartType === 'bar'
                  ? '柱状图'
                  : chartModel.chartType === 'line'
                    ? '折线图'
                    : '面积图'
              }`}
              data-testid={`chart-svg-${chartModel.chartType}`}
            >
              {/* Horizontal Gridlines + Y-axis labels */}
              {yTicks.map((tick, idx) => {
                const y = margin.top + plotH - (tick / yMax) * plotH;
                return (
                  <g key={`ytick-${idx}`}>
                    <line
                      x1={margin.left}
                      x2={margin.left + plotW}
                      y1={y}
                      y2={y}
                      stroke={idx === 0 ? '#CBD5E1' : '#F1F5F9'}
                      strokeWidth={1}
                    />
                    <text
                      x={margin.left - 6}
                      y={y + 3.5}
                      textAnchor="end"
                      className="font-mono-tabular"
                      style={{ fontSize: 10, fill: '#64748B' }}
                    >
                      {formatCompactAxisValue(tick, valColDef, chartModel.aggFunc)}
                    </text>
                  </g>
                );
              })}

              {/* Bar Chart */}
              {chartModel.chartType === 'bar' &&
                displayedData.map((d, idx) => {
                  const slotW = plotW / Math.max(1, displayedData.length);
                  const barW = Math.min(34, Math.max(12, slotW * 0.58));
                  const cx = margin.left + slotW * idx + slotW / 2;
                  const barH = Math.max(2, (Math.max(0, d.value) / yMax) * plotH);
                  const y = margin.top + plotH - barH;
                  const isActive =
                    activeCrossFilterValue === d.key ||
                    activeCrossFilterValue === d.label;
                  const isHovered = hoveredKey === d.key;

                  return (
                    <g
                      key={d.key}
                      data-chart-datum={d.key}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredKey(d.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onClick={() => handleSelectItem(d)}
                    >
                      <rect
                        x={cx - barW / 2}
                        y={y}
                        width={barW}
                        height={barH}
                        rx={2}
                        fill={
                          isActive
                            ? '#0D47A1'
                            : isHovered
                              ? '#1565C0'
                              : '#1976D2'
                        }
                        fillOpacity={
                          activeCrossFilterValue && !isActive ? 0.35 : 0.92
                        }
                      >
                        <title>{`${d.label}: ${d.formattedValue}`}</title>
                      </rect>
                      <text
                        x={cx}
                        y={margin.top + plotH + 16}
                        textAnchor="middle"
                        style={{
                          fontSize: 10.5,
                          fill: isActive ? '#1976D2' : '#475569',
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {d.label.length > 5 ? `${d.label.slice(0, 5)}…` : d.label}
                      </text>
                    </g>
                  );
                })}

              {/* Line / Area Chart */}
              {(chartModel.chartType === 'line' ||
                chartModel.chartType === 'area') &&
                (() => {
                  const pts = displayedData.map((d, idx) => {
                    const x =
                      displayedData.length === 1
                        ? margin.left + plotW / 2
                        : margin.left +
                          (plotW / (displayedData.length - 1)) * idx;
                    const y =
                      margin.top +
                      plotH -
                      (Math.max(0, d.value) / yMax) * plotH;
                    return { ...d, x, y };
                  });
                  const linePath = pts
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                    .join(' ');
                  const areaPath =
                    pts.length > 0
                      ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(margin.top + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(margin.top + plotH).toFixed(1)} Z`
                      : '';

                  return (
                    <g>
                      {chartModel.chartType === 'area' && areaPath && (
                        <path
                          d={areaPath}
                          fill="#1976D2"
                          fillOpacity={0.14}
                        />
                      )}
                      {linePath && (
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#1976D2"
                          strokeWidth={2}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      )}
                      {pts.map((p) => {
                        const isActive =
                          activeCrossFilterValue === p.key ||
                          activeCrossFilterValue === p.label;
                        const isHovered = hoveredKey === p.key;
                        return (
                          <g
                            key={p.key}
                            data-chart-datum={p.key}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredKey(p.key)}
                            onMouseLeave={() => setHoveredKey(null)}
                            onClick={() => handleSelectItem(p)}
                          >
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={isHovered || isActive ? 5.5 : 4}
                              fill={isActive ? '#0D47A1' : '#FFFFFF'}
                              stroke="#1976D2"
                              strokeWidth={2}
                            >
                              <title>{`${p.label}: ${p.formattedValue}`}</title>
                            </circle>
                            <text
                              x={p.x}
                              y={margin.top + plotH + 16}
                              textAnchor="middle"
                              style={{
                                fontSize: 10.5,
                                fill: isActive ? '#1976D2' : '#475569',
                                fontWeight: isActive ? 600 : 400,
                              }}
                            >
                              {p.label.length > 5
                                ? `${p.label.slice(0, 5)}…`
                                : p.label}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
            </svg>
          )}
        </Box>

        {/* Cross-Filter Status Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            px: 0.25,
          }}
        >
          <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
            {activeCrossFilterLabel
              ? `已联动筛选「${chartResult.dimensionHeader} = ${activeCrossFilterLabel}」`
              : '点击图表柱体或扇区可直接联动筛选表格'}
          </Typography>
          {activeCrossFilterValue && onClearCrossFilter && (
            <Tooltip title="清除图表联动筛选">
              <Button
                size="small"
                color="primary"
                startIcon={<FilterAltOffOutlinedIcon sx={{ fontSize: 15 }} />}
                onClick={() => onClearCrossFilter(chartModel.dimensionField)}
                sx={{
                  fontSize: '0.75rem',
                  py: 0.2,
                  px: 0.75,
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                清除联动
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* Compact Ranking Summary List */}
        {displayedData.length > 0 && (
          <Box
            sx={{
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                px: 1.25,
                py: 0.75,
                bgcolor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 600, color: '#475569' }}>
                {chartResult.dimensionHeader}明细
              </Typography>
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 600, color: '#475569' }}>
                {chartResult.valueHeader}（{AGGREGATION_FUNCTION_LABELS[chartResult.aggFunc]}）
              </Typography>
            </Box>
            {displayedData.slice(0, 6).map((d) => {
              const isActive =
                activeCrossFilterValue === d.key ||
                activeCrossFilterValue === d.label;
              return (
                <Box
                  key={d.key}
                  component="button"
                  type="button"
                  onClick={() => handleSelectItem(d)}
                  onMouseEnter={() => setHoveredKey(d.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  sx={{
                    width: '100%',
                    px: 1.25,
                    py: 0.65,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    borderBottom: '1px solid #F1F5F9',
                    bgcolor: isActive
                      ? 'rgba(25, 118, 210, 0.08)'
                      : hoveredKey === d.key
                        ? '#F8FAFC'
                        : '#FFFFFF',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      fontSize: '0.78rem',
                      color: isActive ? '#1976D2' : '#334155',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {d.label}
                  </Typography>
                  <Typography
                    className="font-mono-tabular"
                    sx={{
                      fontSize: '0.78rem',
                      color: '#0F172A',
                      fontWeight: 500,
                      ml: 1,
                      flexShrink: 0,
                    }}
                  >
                    {d.formattedValue}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
