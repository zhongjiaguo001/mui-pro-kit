import React, { memo, useMemo, useState } from 'react';
import {
  Box,
  Button,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  buildMonthGrid,
  isDateDisabled,
  isSameDay,
} from './core/dateCore';
import type { AntMuiCalendarProps } from './types';
import { DATE_PICKER_TABULAR_STYLES } from './tabularStyles';

const WEEKDAY_HEADERS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const MONTH_NAMES = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
];

/**
 * Ant Design `Calendar` parity component built with Material UI v7 Theme tokens.
 * Uses CSS custom properties derived from MUI Theme for O(1) theme switching
 * and zero per-cell Emotion style hashing.
 */
export const CalendarPanel: React.FC<AntMuiCalendarProps> = memo(
  ({
    value: controlledValue,
    defaultValue,
    mode: controlledMode,
    fullscreen = true,
    disabledDate,
    cellRender,
    onSelect,
    onChange,
    onPanelChange,
    'data-testid': dataTestId,
  }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const cssVars = useMemo(
      () =>
        ({
          '--cal-primary': theme.palette.primary.main,
          '--cal-selected-bg': alpha(theme.palette.primary.main, isDark ? 0.18 : 0.09),
          '--cal-selected-hover': alpha(theme.palette.primary.main, isDark ? 0.24 : 0.13),
          '--cal-today-border': alpha(theme.palette.primary.main, 0.45),
          '--cal-hover': theme.palette.action.hover,
          '--cal-divider': theme.palette.divider,
          '--cal-text': theme.palette.text.primary,
          '--cal-text-secondary': theme.palette.text.secondary,
          '--cal-text-disabled': theme.palette.text.disabled,
          '--cal-out-month': alpha(theme.palette.text.secondary, isDark ? 0.52 : 0.62),
          '--cal-cell-radius': `${Math.max(4, Number(theme.shape.borderRadius) - 2)}px`,
        }) as React.CSSProperties,
      [isDark, theme],
    );

    const tokens = useMemo(
      () => ({
        segmentedBg: isDark
          ? alpha(theme.palette.common.white, 0.07)
          : alpha(theme.palette.common.black, 0.045),
        cardRadius: `${Number(theme.shape.borderRadius) + 2}px`,
        cellRadius: `${Math.max(4, Number(theme.shape.borderRadius) - 2)}px`,
      }),
      [isDark, theme],
    );

    const today = useMemo(() => new Date(), []);
    const [internalDate, setInternalDate] = useState<Date>(
      () => defaultValue ?? today,
    );
    const activeDate = controlledValue ?? internalDate;

    const [internalMode, setInternalMode] = useState<'month' | 'year'>('month');
    const activeMode = controlledMode ?? internalMode;

    const viewYear = activeDate.getFullYear();
    const viewMonth = activeDate.getMonth();

    const yearOptions = useMemo(() => {
      const arr: number[] = [];
      for (let y = viewYear - 8; y <= viewYear + 8; y += 1) {
        arr.push(y);
      }
      return arr;
    }, [viewYear]);

    const monthGrid = useMemo(
      () => buildMonthGrid(viewYear, viewMonth, today, 1),
      [today, viewMonth, viewYear],
    );

    const commitDate = (
      next: Date,
      source: 'date' | 'month' | 'year' | 'customize',
    ) => {
      if (controlledValue === undefined) {
        setInternalDate(next);
      }
      onChange?.(next);
      onSelect?.(next, { source });
    };

    const handleModeSwitch = (nextMode: 'month' | 'year') => {
      if (controlledMode === undefined) {
        setInternalMode(nextMode);
      }
      onPanelChange?.(activeDate, nextMode);
    };

    return (
      <Box
        data-testid={dataTestId}
        style={cssVars}
        sx={{
          bgcolor: theme.palette.background.paper,
          color: 'var(--cal-text)',
          border: '1px solid var(--cal-divider)',
          borderRadius: tokens.cardRadius,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          '& .cal-cell': {
            minHeight: fullscreen ? 56 : 40,
            p: 0.65,
            border: 'none',
            borderTop: '2px solid var(--cal-divider)',
            borderRadius: 'var(--cal-cell-radius)',
            bgcolor: 'transparent',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            gap: 0.35,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background-color 120ms ease',
            '&[data-today="true"]': {
              borderTopColor: 'var(--cal-today-border)',
            },
            '&[data-selected="true"]': {
              borderTopColor: 'var(--cal-primary)',
              bgcolor: 'var(--cal-selected-bg)',
            },
            '&:hover:not(:disabled)': {
              bgcolor: 'var(--cal-hover)',
            },
            '&:hover:not(:disabled)[data-selected="true"]': {
              bgcolor: 'var(--cal-selected-hover)',
            },
            '&:disabled': {
              cursor: 'not-allowed',
            },
          },
          '& .cal-cell-year': {
            minHeight: fullscreen ? 76 : 52,
            p: 1,
            gap: 0.5,
          },
          '& .cal-day-num': {
            textAlign: 'right',
            fontSize: '0.76rem',
            fontWeight: 500,
            color: 'var(--cal-text)',
            '&[data-out-month="true"]': { color: 'var(--cal-out-month)' },
            '&[data-today="true"]': { fontWeight: 700 },
            '&[data-selected="true"]': {
              fontWeight: 700,
              color: 'var(--cal-primary)',
            },
            '&[data-disabled="true"]': { color: 'var(--cal-text-disabled)' },
          },
        }}
      >
        {DATE_PICKER_TABULAR_STYLES}
        {/* Calendar Header Controls */}
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: '1px solid var(--cal-divider)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Select
              size="small"
              value={viewYear}
              aria-label="日历年份"
              MenuProps={{
                variant: 'menu',
                disableScrollLock: true,
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
                slotProps: {
                  paper: {
                    elevation: 0,
                    sx: {
                      mt: 0.5,
                      maxHeight: 240,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: theme.shadows[8],
                    },
                  },
                },
              }}
              onChange={(e) => {
                const nextY = Number(e.target.value);
                const next = new Date(nextY, viewMonth, Math.min(activeDate.getDate(), 28));
                commitDate(next, 'year');
                onPanelChange?.(next, activeMode);
              }}
              sx={{
                height: 30,
                fontSize: '0.8rem',
                '& .MuiSelect-select': { py: 0.4, px: 1.25 },
              }}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y} sx={{ fontSize: '0.8rem' }}>
                  {y}年
                </MenuItem>
              ))}
            </Select>

            {activeMode === 'month' && (
              <Select
                size="small"
                value={viewMonth}
                aria-label="日历月份"
                onChange={(e) => {
                  const nextM = Number(e.target.value);
                  const next = new Date(viewYear, nextM, Math.min(activeDate.getDate(), 28));
                  commitDate(next, 'month');
                  onPanelChange?.(next, activeMode);
                }}
                sx={{
                  height: 30,
                  fontSize: '0.8rem',
                  '& .MuiSelect-select': { py: 0.4, px: 1.25 },
                }}
              >
                {MONTH_NAMES.map((label, mIdx) => (
                  <MenuItem key={label} value={mIdx} sx={{ fontSize: '0.8rem' }}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            )}

            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => {
                commitDate(today, 'customize');
                onPanelChange?.(today, activeMode);
              }}
              sx={{
                height: 30,
                minWidth: 0,
                px: 1.25,
                fontSize: '0.76rem',
                borderColor: 'var(--cal-divider)',
                color: 'var(--cal-text)',
                textTransform: 'none',
              }}
            >
              今天
            </Button>
          </Box>

          {/* Month / Year Segmented Toggle */}
          <Box
            role="group"
            aria-label="日历视图切换"
            sx={{
              display: 'inline-flex',
              p: '2px',
              bgcolor: tokens.segmentedBg,
              borderRadius: `${theme.shape.borderRadius}px`,
              border: '1px solid var(--cal-divider)',
            }}
          >
            {(
              [
                { value: 'month', label: '月' },
                { value: 'year', label: '年' },
              ] as const
            ).map((opt) => {
              const isAct = activeMode === opt.value;
              return (
                <Box
                  key={opt.value}
                  component="button"
                  type="button"
                  aria-pressed={isAct}
                  onClick={() => handleModeSwitch(opt.value)}
                  sx={{
                    px: 1.25,
                    py: 0.3,
                    border: 'none',
                    borderRadius: tokens.cellRadius,
                    cursor: 'pointer',
                    fontSize: '0.76rem',
                    fontWeight: isAct ? 600 : 500,
                    bgcolor: isAct ? theme.palette.background.paper : 'transparent',
                    color: isAct ? 'var(--cal-text)' : 'var(--cal-text-secondary)',
                    boxShadow: isAct ? theme.shadows[1] : 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  {opt.label}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Month Mode Grid */}
        {activeMode === 'month' && (
          <Box sx={{ p: 1.5 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                mb: 0.75,
              }}
            >
              {WEEKDAY_HEADERS.map((d) => (
                <Typography
                  key={d}
                  sx={{
                    textAlign: 'right',
                    pr: 1,
                    fontSize: '0.74rem',
                    fontWeight: 500,
                    color: 'var(--cal-text-secondary)',
                  }}
                >
                  {d}
                </Typography>
              ))}
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
              }}
            >
              {monthGrid.map((cell) => {
                const isSelected = isSameDay(cell.date, activeDate);
                const isDisabled = isDateDisabled(cell.date, {
                  disabledDate,
                  picker: 'date',
                });

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    className="cal-cell"
                    disabled={isDisabled}
                    data-cal-date={cell.dateKey}
                    data-selected={isSelected ? 'true' : undefined}
                    data-today={cell.isToday && !isSelected ? 'true' : undefined}
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!isDisabled) commitDate(cell.date, 'date');
                    }}
                  >
                    <span
                      className="cal-day-num font-mono-tabular"
                      data-selected={isSelected ? 'true' : undefined}
                      data-today={cell.isToday ? 'true' : undefined}
                      data-out-month={!cell.isCurrentMonth ? 'true' : undefined}
                      data-disabled={isDisabled ? 'true' : undefined}
                    >
                      {cell.day < 10 ? `0${cell.day}` : cell.day}
                    </span>
                    {cellRender && (
                      <div style={{ overflow: 'hidden' }}>
                        {cellRender(cell.date, {
                          type: 'date',
                          isSelected,
                          isToday: cell.isToday,
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Year Mode Grid */}
        {activeMode === 'year' && (
          <Box
            sx={{
              p: 1.5,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1,
            }}
          >
            {MONTH_NAMES.map((label, mIdx) => {
              const cellDate = new Date(viewYear, mIdx, 1);
              const isSelected = viewMonth === mIdx;
              const isTodayMonth =
                today.getFullYear() === viewYear && today.getMonth() === mIdx;

              return (
                <button
                  key={label}
                  type="button"
                  className="cal-cell cal-cell-year"
                  data-cal-month={mIdx}
                  data-selected={isSelected ? 'true' : undefined}
                  data-today={isTodayMonth && !isSelected ? 'true' : undefined}
                  onClick={() => {
                    commitDate(cellDate, 'month');
                    handleModeSwitch('month');
                  }}
                >
                  <span
                    className="cal-day-num"
                    data-selected={isSelected ? 'true' : undefined}
                    data-today={isTodayMonth ? 'true' : undefined}
                    style={{ fontSize: '0.82rem' }}
                  >
                    {label}
                  </span>
                  {cellRender && (
                    <div style={{ overflow: 'hidden' }}>
                      {cellRender(cellDate, {
                        type: 'month',
                        isSelected,
                        isToday: isTodayMonth,
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </Box>
        )}
      </Box>
    );
  },
);

CalendarPanel.displayName = 'CalendarPanel';
