import React, { memo, useMemo } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import {
  addMonths,
  addYears,
  buildDecadeGrid,
  buildMonthGrid,
  isDateDisabled,
  isDateStrictlyInRange,
  isSameDay,
  isSameUnit,
  pad2,
} from './core/dateCore';
import type {
  DateCellRender,
  DisabledTimeConfig,
  PickerMode,
  ShowTimeConfig,
} from './types';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const MONTH_LABELS = [
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
const QUARTER_LABELS: { q: 1 | 2 | 3 | 4; label: string; months: string }[] = [
  { q: 1, label: 'Q1', months: '1–3月' },
  { q: 2, label: 'Q2', months: '4–6月' },
  { q: 3, label: 'Q3', months: '7–9月' },
  { q: 4, label: 'Q4', months: '10–12月' },
];

export interface TimeColumnPanelProps {
  value: Date | null;
  showTime: ShowTimeConfig;
  disabledTime?: (current: Date | null) => DisabledTimeConfig;
  onChangeTime: (hours: number, minutes: number, seconds: number) => void;
  title?: string;
}

export const TimeColumnPanel: React.FC<TimeColumnPanelProps> = memo(
  ({ value, showTime, disabledTime, onChangeTime, title }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const cssVars = useMemo(
      () =>
        ({
          '--dp-primary': theme.palette.primary.main,
          '--dp-soft-primary': alpha(theme.palette.primary.main, isDark ? 0.22 : 0.12),
          '--dp-soft-primary-hover': alpha(theme.palette.primary.main, isDark ? 0.3 : 0.18),
          '--dp-hover': theme.palette.action.hover,
          '--dp-text': theme.palette.text.primary,
          '--dp-text-disabled': theme.palette.text.disabled,
          '--dp-divider': theme.palette.divider,
          '--dp-scroll-thumb': alpha(theme.palette.text.primary, 0.2),
          '--dp-time-radius': `${Math.max(4, Number(theme.shape.borderRadius) - 2)}px`,
        }) as React.CSSProperties,
      [isDark, theme],
    );

    const opts = typeof showTime === 'object' ? showTime : {};
    const showSecond = opts.showSecond !== false;
    const hourStep = Math.max(1, opts.hourStep ?? 1);
    const minuteStep = Math.max(1, opts.minuteStep ?? 1);
    const secondStep = Math.max(1, opts.secondStep ?? 1);

    const curHour = value ? value.getHours() : 0;
    const curMinute = value ? value.getMinutes() : 0;
    const curSecond = value ? value.getSeconds() : 0;

    const dtConfig = useMemo(() => {
      const fn = disabledTime ?? opts.disabledTime;
      return fn ? fn(value) : {};
    }, [disabledTime, opts.disabledTime, value]);

    const disabledHoursSet = useMemo(
      () => new Set(dtConfig.disabledHours?.() ?? []),
      [dtConfig],
    );
    const disabledMinutesSet = useMemo(
      () => new Set(dtConfig.disabledMinutes?.(curHour) ?? []),
      [curHour, dtConfig],
    );
    const disabledSecondsSet = useMemo(
      () => new Set(dtConfig.disabledSeconds?.(curHour, curMinute) ?? []),
      [curHour, curMinute, dtConfig],
    );

    const hours = useMemo(() => {
      const arr: number[] = [];
      for (let h = 0; h < 24; h += hourStep) arr.push(h);
      return arr;
    }, [hourStep]);

    const minutes = useMemo(() => {
      const arr: number[] = [];
      for (let m = 0; m < 60; m += minuteStep) arr.push(m);
      return arr;
    }, [minuteStep]);

    const seconds = useMemo(() => {
      const arr: number[] = [];
      for (let s = 0; s < 60; s += secondStep) arr.push(s);
      return arr;
    }, [secondStep]);

    const renderCol = (
      colName: string,
      values: number[],
      activeVal: number,
      disabledSet: Set<number>,
      onPick: (v: number) => void,
    ) => (
      <div role="listbox" aria-label={colName} className="dp-time-col">
        {values.map((v) => {
          const isSel = v === activeVal && Boolean(value);
          const isDis = disabledSet.has(v);
          return (
            <button
              key={v}
              type="button"
              role="option"
              aria-selected={isSel}
              disabled={isDis}
              data-time-col={colName}
              data-time-val={v}
              data-selected={isSel ? 'true' : undefined}
              onClick={() => {
                if (!isDis) onPick(v);
              }}
              className="dp-time-opt font-mono-tabular"
            >
              {pad2(v)}
            </button>
          );
        })}
      </div>
    );

    return (
      <Box
        style={cssVars}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          '& .dp-time-col': {
            width: 52,
            height: 224,
            overflowY: 'auto',
            py: 0.5,
            px: 0.5,
            borderLeft: '1px solid var(--dp-divider)',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'var(--dp-scroll-thumb)',
              borderRadius: 2,
            },
          },
          '& .dp-time-opt': {
            width: '100%',
            height: 28,
            border: 'none',
            borderRadius: 'var(--dp-time-radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            cursor: 'pointer',
            bgcolor: 'transparent',
            color: 'var(--dp-text)',
            fontWeight: 400,
            transition: 'background-color 120ms ease',
            '&:hover:not(:disabled)': {
              bgcolor: 'var(--dp-hover)',
            },
            '&[data-selected="true"]': {
              bgcolor: 'var(--dp-soft-primary)',
              color: 'var(--dp-primary)',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'var(--dp-soft-primary-hover)',
              },
            },
            '&:disabled': {
              cursor: 'not-allowed',
              color: 'var(--dp-text-disabled)',
            },
          },
        }}
      >
        <Box
          sx={{
            height: 40,
            px: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: '1px solid var(--dp-divider)',
            borderBottom: '1px solid var(--dp-divider)',
          }}
        >
          <Typography
            className="font-mono-tabular"
            sx={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--dp-text)',
            }}
          >
            {title ??
              (value
                ? showSecond
                  ? `${pad2(curHour)}:${pad2(curMinute)}:${pad2(curSecond)}`
                  : `${pad2(curHour)}:${pad2(curMinute)}`
                : showSecond
                  ? '00:00:00'
                  : '00:00')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex' }}>
          {renderCol('时', hours, curHour, disabledHoursSet, (h) =>
            onChangeTime(h, curMinute, curSecond),
          )}
          {renderCol('分', minutes, curMinute, disabledMinutesSet, (m) =>
            onChangeTime(curHour, m, curSecond),
          )}
          {showSecond &&
            renderCol('秒', seconds, curSecond, disabledSecondsSet, (s) =>
              onChangeTime(curHour, curMinute, s),
            )}
        </Box>
      </Box>
    );
  },
);

TimeColumnPanel.displayName = 'TimeColumnPanel';

export interface DatePanelProps {
  /** Target picker granularity of the parent control */
  picker: PickerMode;
  /** Currently displayed panel drill-down mode */
  panelMode: PickerMode;
  /** Anchor month/year being viewed */
  viewDate: Date;
  today: Date;
  /** Selected dates (single, multiple, or range endpoints) */
  selectedDates: readonly Date[];
  /** Range start/end for range ribbon highlighting */
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  /** Hover preview date for range ribbon or week highlight */
  hoverDate?: Date | null;
  /** Focused date for keyboard navigation ring */
  focusedDate?: Date | null;
  disabledDate?: (d: Date) => boolean;
  minDate?: Date;
  maxDate?: Date;
  cellRender?: DateCellRender;
  hidePrevNav?: boolean;
  hideNextNav?: boolean;
  onViewDateChange: (next: Date) => void;
  onPanelModeChange: (nextMode: PickerMode) => void;
  onSelectDate: (date: Date) => void;
  onHoverDate?: (date: Date | null) => void;
}

export const DatePanel: React.FC<DatePanelProps> = memo(
  ({
    picker,
    panelMode,
    viewDate,
    today,
    selectedDates,
    rangeStart = null,
    rangeEnd = null,
    hoverDate = null,
    focusedDate = null,
    disabledDate,
    minDate,
    maxDate,
    cellRender,
    hidePrevNav = false,
    hideNextNav = false,
    onViewDateChange,
    onPanelModeChange,
    onSelectDate,
    onHoverDate,
  }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const cssVars = useMemo(
      () =>
        ({
          '--dp-primary': theme.palette.primary.main,
          '--dp-primary-dark': theme.palette.primary.dark,
          '--dp-primary-contrast': theme.palette.primary.contrastText,
          '--dp-contrast-muted': alpha(theme.palette.primary.contrastText, 0.8),
          '--dp-ribbon': alpha(theme.palette.primary.main, isDark ? 0.22 : 0.12),
          '--dp-hover': theme.palette.action.hover,
          '--dp-text': theme.palette.text.primary,
          '--dp-text-secondary': theme.palette.text.secondary,
          '--dp-text-disabled': theme.palette.text.disabled,
          '--dp-out-month': alpha(theme.palette.text.secondary, isDark ? 0.55 : 0.65),
          '--dp-divider': theme.palette.divider,
          '--dp-radius': `${theme.shape.borderRadius}px`,
          '--dp-btn-radius': `${Math.max(4, Number(theme.shape.borderRadius) - 2)}px`,
        }) as React.CSSProperties,
      [isDark, theme],
    );

    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();

    const monthGrid = useMemo(
      () =>
        panelMode === 'date' || panelMode === 'week'
          ? buildMonthGrid(viewYear, viewMonth, today, 1)
          : [],
      [panelMode, today, viewMonth, viewYear],
    );

    const decadeInfo = useMemo(
      () => (panelMode === 'year' ? buildDecadeGrid(viewYear) : null),
      [panelMode, viewYear],
    );

    const handleSuperPrev = () => {
      if (panelMode === 'year') {
        onViewDateChange(addYears(viewDate, -10));
      } else {
        onViewDateChange(addYears(viewDate, -1));
      }
    };

    const handleSuperNext = () => {
      if (panelMode === 'year') {
        onViewDateChange(addYears(viewDate, 10));
      } else {
        onViewDateChange(addYears(viewDate, 1));
      }
    };

    const handlePrevMonth = () => {
      onViewDateChange(addMonths(viewDate, -1));
    };

    const handleNextMonth = () => {
      onViewDateChange(addMonths(viewDate, 1));
    };

    const isCellSelected = (d: Date, unit: PickerMode): boolean => {
      if (rangeStart && isSameUnit(d, rangeStart, unit)) return true;
      if (rangeEnd && isSameUnit(d, rangeEnd, unit)) return true;
      return selectedDates.some((sel) => isSameUnit(sel, d, unit));
    };

    return (
      <Box
        style={cssVars}
        sx={{
          width: panelMode === 'week' ? 308 : 280,
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--dp-text)',
          // Static container-scoped styles for all cells (0 dynamic Emotion hashes per cell)
          '& .dp-week-row': {
            display: 'grid',
            gridTemplateColumns:
              panelMode === 'week' ? '30px repeat(7, 1fr)' : 'repeat(7, 1fr)',
            alignItems: 'center',
            borderRadius: panelMode === 'week' ? 'var(--dp-radius)' : 0,
            transition: 'background-color 120ms ease',
            '&[data-week-state="selected"]': { bgcolor: 'var(--dp-primary)' },
            '&[data-week-state="in-range"]': { bgcolor: 'var(--dp-ribbon)' },
            '&[data-week-state="hover"]': { bgcolor: 'var(--dp-hover)' },
          },
          '& .dp-day-btn': {
            position: 'relative',
            height: 32,
            p: 0,
            border: 'none',
            background: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            '&:disabled': { cursor: 'not-allowed' },
            '& > *': { position: 'relative', zIndex: 1 },
            '&[data-ribbon]::before': {
              content: '""',
              position: 'absolute',
              top: 2,
              bottom: 2,
              left: 0,
              right: 0,
              bgcolor: 'var(--dp-ribbon)',
              zIndex: 0,
            },
            '&[data-ribbon-cap="start"]::before': { left: '50%' },
            '&[data-ribbon-cap="end"]::before': { right: '50%' },
            '&[data-round-left="true"]::before': {
              borderTopLeftRadius: 'var(--dp-radius)',
              borderBottomLeftRadius: 'var(--dp-radius)',
            },
            '&[data-round-right="true"]::before': {
              borderTopRightRadius: 'var(--dp-radius)',
              borderBottomRightRadius: 'var(--dp-radius)',
            },
            '&:hover:not(:disabled)[data-mode="date"]:not([aria-selected="true"]) > .dp-day-inner': {
              bgcolor: 'var(--dp-hover)',
            },
          },
          '& .dp-day-inner': {
            width: 28,
            height: 28,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--dp-radius)',
            fontSize: '0.8rem',
            fontWeight: 400,
            color: 'var(--dp-text)',
            border: '1px solid transparent',
            transition: 'background-color 120ms ease, color 120ms ease',
            '&[data-out-month="true"]': { color: 'var(--dp-text-disabled)' },
            '&[data-week-out-month="true"]': { color: 'var(--dp-out-month)' },
            '&[data-today="true"]': {
              fontWeight: 600,
              borderColor: 'var(--dp-primary)',
            },
            '&[data-focused="true"]': {
              borderStyle: 'dashed',
              borderColor: 'var(--dp-primary)',
            },
            '&[data-selected="true"]': {
              fontWeight: 600,
              bgcolor: 'var(--dp-primary)',
              color: 'var(--dp-primary-contrast)',
              borderColor: 'transparent',
            },
            '&[data-week-selected="true"]': {
              fontWeight: 600,
              bgcolor: 'transparent',
              color: 'var(--dp-primary-contrast)',
              borderColor: 'transparent',
            },
            '&[data-disabled="true"]': {
              color: 'var(--dp-text-disabled)',
            },
          },
          '& .dp-unit-btn': {
            border: '1px solid transparent',
            borderRadius: 'var(--dp-radius)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            bgcolor: 'transparent',
            color: 'var(--dp-text)',
            transition: 'background-color 120ms ease',
            '&[data-out-decade="true"]': { color: 'var(--dp-out-month)' },
            '&[data-current="true"]': {
              fontWeight: 600,
              borderColor: 'var(--dp-primary)',
            },
            '&[data-in-range="true"]': { bgcolor: 'var(--dp-ribbon)' },
            '&[data-selected="true"]': {
              fontWeight: 600,
              bgcolor: 'var(--dp-primary)',
              color: 'var(--dp-primary-contrast)',
              borderColor: 'transparent',
              '& .dp-sub-label': { color: 'var(--dp-contrast-muted)' },
            },
            '&:hover:not(:disabled)': { bgcolor: 'var(--dp-hover)' },
            '&:hover:not(:disabled)[data-selected="true"]': {
              bgcolor: 'var(--dp-primary-dark)',
            },
            '&:disabled': {
              cursor: 'not-allowed',
              color: 'var(--dp-text-disabled)',
            },
          },
        }}
      >
        {/* Header Navigation Bar */}
        <Box
          sx={{
            height: 40,
            px: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--dp-divider)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 56 }}>
            {!hidePrevNav && (
              <>
                <IconButton
                  size="small"
                  aria-label={panelMode === 'year' ? '上十年' : '上一年'}
                  onClick={handleSuperPrev}
                  sx={{
                    p: 0.4,
                    color: 'var(--dp-text-secondary)',
                    '&:hover': { color: 'var(--dp-text)' },
                  }}
                >
                  <KeyboardDoubleArrowLeftIcon sx={{ fontSize: 16 }} />
                </IconButton>
                {(panelMode === 'date' || panelMode === 'week') && (
                  <IconButton
                    size="small"
                    aria-label="上一月"
                    onClick={handlePrevMonth}
                    sx={{
                      p: 0.4,
                      color: 'var(--dp-text-secondary)',
                      '&:hover': { color: 'var(--dp-text)' },
                    }}
                  >
                    <KeyboardArrowLeftIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                )}
              </>
            )}
          </Box>

          {/* Clickable Year / Month Drill-Up Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {panelMode === 'year' && decadeInfo ? (
              <Typography
                className="font-mono-tabular"
                sx={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--dp-text)' }}
              >
                {decadeInfo.decadeStart}–{decadeInfo.decadeEnd}
              </Typography>
            ) : (
              <>
                <Box
                  component="button"
                  type="button"
                  onClick={() => onPanelModeChange('year')}
                  sx={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 'var(--dp-btn-radius)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: 'var(--dp-text)',
                    fontFamily: 'inherit',
                    '&:hover': {
                      color: 'var(--dp-primary)',
                      bgcolor: 'var(--dp-hover)',
                    },
                  }}
                >
                  {viewYear}年
                </Box>
                {(panelMode === 'date' || panelMode === 'week') && (
                  <Box
                    component="button"
                    type="button"
                    onClick={() => onPanelModeChange('month')}
                    sx={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      px: 0.5,
                      py: 0.25,
                      borderRadius: 'var(--dp-btn-radius)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: 'var(--dp-text)',
                      fontFamily: 'inherit',
                      '&:hover': {
                        color: 'var(--dp-primary)',
                        bgcolor: 'var(--dp-hover)',
                      },
                    }}
                  >
                    {viewMonth + 1}月
                  </Box>
                )}
              </>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              minWidth: 56,
            }}
          >
            {!hideNextNav && (
              <>
                {(panelMode === 'date' || panelMode === 'week') && (
                  <IconButton
                    size="small"
                    aria-label="下一月"
                    onClick={handleNextMonth}
                    sx={{
                      p: 0.4,
                      color: 'var(--dp-text-secondary)',
                      '&:hover': { color: 'var(--dp-text)' },
                    }}
                  >
                    <KeyboardArrowRightIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  aria-label={panelMode === 'year' ? '下十年' : '下一年'}
                  onClick={handleSuperNext}
                  sx={{
                    p: 0.4,
                    color: 'var(--dp-text-secondary)',
                    '&:hover': { color: 'var(--dp-text)' },
                  }}
                >
                  <KeyboardDoubleArrowRightIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Body Grid */}
        {(panelMode === 'date' || panelMode === 'week') && (
          <Box sx={{ p: 1.25 }}>
            {/* Weekday Row */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns:
                  panelMode === 'week' ? '30px repeat(7, 1fr)' : 'repeat(7, 1fr)',
                mb: 0.5,
              }}
            >
              {panelMode === 'week' && (
                <span
                  style={{
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    color: 'var(--dp-text-secondary)',
                    lineHeight: '24px',
                  }}
                >
                  周
                </span>
              )}
              {WEEKDAY_LABELS.map((w) => (
                <span
                  key={w}
                  style={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--dp-text-secondary)',
                    lineHeight: '24px',
                  }}
                >
                  {w}
                </span>
              ))}
            </Box>

            {/* 6 Week Rows */}
            {Array.from({ length: 6 }, (_, rowIdx) => {
              const rowCells = monthGrid.slice(rowIdx * 7, rowIdx * 7 + 7);
              const firstCell = rowCells[0];
              const isWeekSelected =
                panelMode === 'week' && isCellSelected(firstCell.date, 'week');
              const isWeekHovered =
                panelMode === 'week' &&
                Boolean(hoverDate) &&
                isSameUnit(firstCell.date, hoverDate, 'week');
              const isWeekInRange =
                panelMode === 'week' &&
                isDateStrictlyInRange(firstCell.date, rangeStart, rangeEnd, 'week');

              const weekState =
                panelMode === 'week'
                  ? isWeekSelected
                    ? 'selected'
                    : isWeekInRange
                      ? 'in-range'
                      : isWeekHovered
                        ? 'hover'
                        : undefined
                  : undefined;

              return (
                <div
                  key={firstCell.dateKey}
                  className="dp-week-row"
                  data-week-state={weekState}
                >
                  {panelMode === 'week' && (
                    <span
                      className="font-mono-tabular"
                      style={{
                        textAlign: 'center',
                        fontSize: '0.72rem',
                        color: isWeekSelected
                          ? 'var(--dp-contrast-muted)'
                          : 'var(--dp-text-secondary)',
                      }}
                    >
                      {firstCell.isoWeek}
                    </span>
                  )}

                  {rowCells.map((cell, colIdx) => {
                    const isDisabled = isDateDisabled(cell.date, {
                      disabledDate,
                      minDate,
                      maxDate,
                      picker: panelMode,
                    });
                    const isSelected =
                      panelMode === 'week'
                        ? isWeekSelected
                        : cell.isCurrentMonth && isCellSelected(cell.date, 'date');
                    const isStartCap =
                      panelMode === 'date' &&
                      cell.isCurrentMonth &&
                      Boolean(rangeStart) &&
                      isSameDay(cell.date, rangeStart);
                    const isEndCap =
                      panelMode === 'date' &&
                      cell.isCurrentMonth &&
                      Boolean(rangeEnd) &&
                      isSameDay(cell.date, rangeEnd);
                    const isInRange =
                      panelMode === 'date' &&
                      cell.isCurrentMonth &&
                      isDateStrictlyInRange(cell.date, rangeStart, rangeEnd, 'date');
                    const isFocused =
                      Boolean(focusedDate) && isSameDay(cell.date, focusedDate);

                    const originNode = (
                      <span
                        className="dp-day-inner font-mono-tabular"
                        data-selected={
                          panelMode === 'date' && isSelected ? 'true' : undefined
                        }
                        data-week-selected={
                          panelMode === 'week' && isWeekSelected ? 'true' : undefined
                        }
                        data-today={cell.isToday && !isSelected ? 'true' : undefined}
                        data-focused={
                          isFocused && !isSelected && !cell.isToday ? 'true' : undefined
                        }
                        data-out-month={
                          panelMode === 'date' && !cell.isCurrentMonth
                            ? 'true'
                            : undefined
                        }
                        data-week-out-month={
                          panelMode === 'week' && !cell.isCurrentMonth
                            ? 'true'
                            : undefined
                        }
                        data-disabled={isDisabled ? 'true' : undefined}
                      >
                        {cell.day}
                      </span>
                    );

                    const rendered = cellRender
                      ? cellRender(cell.date, {
                          originNode,
                          today,
                          type: panelMode,
                          isSelected,
                          isInRange,
                          isDisabled,
                        })
                      : originNode;

                    const multiDayRange =
                      Boolean(rangeStart) &&
                      Boolean(rangeEnd) &&
                      !isSameDay(rangeStart, rangeEnd);
                    const showRibbon =
                      panelMode === 'date' &&
                      cell.isCurrentMonth &&
                      (isInRange ||
                        (isStartCap && multiDayRange && colIdx < 6) ||
                        (isEndCap && multiDayRange && colIdx > 0));

                    return (
                      <button
                        key={cell.dateKey}
                        type="button"
                        role="gridcell"
                        className="dp-day-btn"
                        aria-selected={isSelected}
                        aria-disabled={isDisabled || undefined}
                        data-mode={panelMode}
                        data-date-key={cell.dateKey}
                        data-in-month={cell.isCurrentMonth ? 'true' : 'false'}
                        data-ribbon={showRibbon ? 'true' : undefined}
                        data-ribbon-cap={
                          showRibbon
                            ? isStartCap
                              ? 'start'
                              : isEndCap
                                ? 'end'
                                : undefined
                            : undefined
                        }
                        data-round-left={
                          showRibbon && colIdx === 0 && !isStartCap
                            ? 'true'
                            : undefined
                        }
                        data-round-right={
                          showRibbon && colIdx === 6 && !isEndCap
                            ? 'true'
                            : undefined
                        }
                        disabled={isDisabled}
                        onMouseEnter={() => onHoverDate?.(cell.date)}
                        onMouseLeave={() => onHoverDate?.(null)}
                        onClick={() => {
                          if (isDisabled) return;
                          onSelectDate(cell.date);
                        }}
                      >
                        {rendered}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </Box>
        )}

        {/* Month Panel (4 x 3) */}
        {panelMode === 'month' && (
          <Box
            sx={{
              p: 1.5,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1,
            }}
          >
            {MONTH_LABELS.map((label, monthIdx) => {
              const cellDate = new Date(viewYear, monthIdx, 1);
              const isDisabled = isDateDisabled(cellDate, {
                disabledDate,
                minDate,
                maxDate,
                picker: 'month',
              });
              const isSelected =
                picker === 'month' && isCellSelected(cellDate, 'month');
              const isInRange =
                picker === 'month' &&
                isDateStrictlyInRange(cellDate, rangeStart, rangeEnd, 'month');
              const isCurrent =
                today.getFullYear() === viewYear && today.getMonth() === monthIdx;

              return (
                <button
                  key={label}
                  type="button"
                  className="dp-unit-btn"
                  disabled={isDisabled}
                  data-month-index={monthIdx}
                  data-selected={isSelected ? 'true' : undefined}
                  data-in-range={isInRange ? 'true' : undefined}
                  data-current={isCurrent && !isSelected ? 'true' : undefined}
                  style={{ height: 44, fontSize: '0.84rem' }}
                  onMouseEnter={() => onHoverDate?.(cellDate)}
                  onMouseLeave={() => onHoverDate?.(null)}
                  onClick={() => {
                    if (isDisabled) return;
                    if (picker === 'month') {
                      onSelectDate(cellDate);
                    } else {
                      onViewDateChange(new Date(viewYear, monthIdx, 1));
                      onPanelModeChange(picker === 'week' ? 'week' : 'date');
                    }
                  }}
                >
                  {label}
                </button>
              );
            })}
          </Box>
        )}

        {/* Quarter Panel (4 x 1) */}
        {panelMode === 'quarter' && (
          <Box
            sx={{
              p: 1.5,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
            }}
          >
            {QUARTER_LABELS.map(({ q, label, months }) => {
              const cellDate = new Date(viewYear, (q - 1) * 3, 1);
              const isDisabled = isDateDisabled(cellDate, {
                disabledDate,
                minDate,
                maxDate,
                picker: 'quarter',
              });
              const isSelected = isCellSelected(cellDate, 'quarter');
              const isInRange = isDateStrictlyInRange(
                cellDate,
                rangeStart,
                rangeEnd,
                'quarter',
              );

              return (
                <button
                  key={label}
                  type="button"
                  className="dp-unit-btn"
                  disabled={isDisabled}
                  data-quarter={q}
                  data-selected={isSelected ? 'true' : undefined}
                  data-in-range={isInRange ? 'true' : undefined}
                  style={{
                    padding: '12px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                  }}
                  onMouseEnter={() => onHoverDate?.(cellDate)}
                  onMouseLeave={() => onHoverDate?.(null)}
                  onClick={() => {
                    if (!isDisabled) onSelectDate(cellDate);
                  }}
                >
                  <span
                    className="font-mono-tabular"
                    style={{ fontSize: '0.88rem', fontWeight: 600 }}
                  >
                    {label}
                  </span>
                  <span
                    className="dp-sub-label"
                    style={{
                      fontSize: '0.7rem',
                      color: isSelected
                        ? 'var(--dp-contrast-muted)'
                        : 'var(--dp-text-secondary)',
                    }}
                  >
                    {months}
                  </span>
                </button>
              );
            })}
          </Box>
        )}

        {/* Year Decade Panel (4 x 3) */}
        {panelMode === 'year' && decadeInfo && (
          <Box
            sx={{
              p: 1.5,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1,
            }}
          >
            {decadeInfo.cells.map(({ year, isCurrentDecade }) => {
              const cellDate = new Date(year, 0, 1);
              const isDisabled = isDateDisabled(cellDate, {
                disabledDate,
                minDate,
                maxDate,
                picker: 'year',
              });
              const isSelected =
                picker === 'year' && isCellSelected(cellDate, 'year');
              const isInRange =
                picker === 'year' &&
                isDateStrictlyInRange(cellDate, rangeStart, rangeEnd, 'year');
              const isCurrent = today.getFullYear() === year;

              return (
                <button
                  key={year}
                  type="button"
                  className="dp-unit-btn font-mono-tabular"
                  disabled={isDisabled}
                  data-year={year}
                  data-selected={isSelected ? 'true' : undefined}
                  data-in-range={isInRange ? 'true' : undefined}
                  data-current={isCurrent && !isSelected ? 'true' : undefined}
                  data-out-decade={!isCurrentDecade ? 'true' : undefined}
                  style={{ height: 44, fontSize: '0.84rem' }}
                  onMouseEnter={() => onHoverDate?.(cellDate)}
                  onMouseLeave={() => onHoverDate?.(null)}
                  onClick={() => {
                    if (isDisabled) return;
                    if (picker === 'year') {
                      onSelectDate(cellDate);
                    } else {
                      onViewDateChange(new Date(year, viewMonth, 1));
                      onPanelModeChange(
                        picker === 'quarter'
                          ? 'quarter'
                          : picker === 'month'
                            ? 'month'
                            : picker === 'week'
                              ? 'week'
                              : 'date',
                      );
                    }
                  }}
                >
                  {year}
                </button>
              );
            })}
          </Box>
        )}
      </Box>
    );
  },
);

DatePanel.displayName = 'DatePanel';
