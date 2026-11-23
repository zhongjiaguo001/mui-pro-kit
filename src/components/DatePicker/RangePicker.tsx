import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  ClickAwayListener,
  Divider,
  Grow,
  IconButton,
  InputBase,
  Paper,
  Popper,
  Typography,
} from '@mui/material';
import { alpha, useTheme, type Theme } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CancelIcon from '@mui/icons-material/Cancel';
import { DatePanel, TimeColumnPanel } from './DatePanel';
import {
  addMonths,
  addYears,
  cloneDate,
  formatDateValue,
  getHoverRangeBounds,
  isDateDisabled,
  normalizeRange,
  parseDateInput,
  withTimeFrom,
} from './core/dateCore';
import type {
  AntMuiRangePickerProps,
  DateRangeValue,
  PickerMode,
  PickerSize,
  PickerStatus,
} from './types';

function resolveHeight(size: PickerSize): number {
  if (size === 'small') return 30;
  if (size === 'large') return 42;
  return 36;
}

function resolveBorderColor(
  theme: Theme,
  status: PickerStatus,
  isOpen: boolean,
  isHovered: boolean,
  allDisabled: boolean,
): string {
  if (allDisabled) return theme.palette.divider;
  if (status === 'error') return theme.palette.error.main;
  if (status === 'warning') return theme.palette.warning.main;
  if (isOpen) return theme.palette.primary.main;
  if (isHovered) return alpha(theme.palette.text.primary, 0.56);
  return alpha(theme.palette.text.primary, 0.23);
}

function getDefaultPlaceholders(picker: PickerMode): [string, string] {
  switch (picker) {
    case 'week':
      return ['开始周', '结束周'];
    case 'month':
      return ['开始月份', '结束月份'];
    case 'quarter':
      return ['开始季度', '结束季度'];
    case 'year':
      return ['开始年份', '结束年份'];
    default:
      return ['开始日期', '结束日期'];
  }
}

export const RangePicker: React.FC<AntMuiRangePickerProps> = ({
  value: controlledValue,
  defaultValue = null,
  picker = 'date',
  showTime = false,
  needConfirm,
  format,
  placeholder,
  presets,
  disabled = false,
  disabledDate,
  disabledTime,
  minDate,
  maxDate,
  allowClear = true,
  allowEmpty = [false, false],
  size = 'middle',
  variant = 'outlined',
  status = '',
  separator,
  cellRender,
  renderExtraFooter,
  open: controlledOpen,
  onOpenChange,
  onChange,
  onCalendarChange,
  onOk,
  ariaLabel = '日期范围选择',
  'data-testid': dataTestId,
  className,
  style,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const today = useMemo(() => new Date(), []);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const startInputRef = useRef<HTMLInputElement | null>(null);
  const endInputRef = useRef<HTMLInputElement | null>(null);

  const disabledTuple: [boolean, boolean] = Array.isArray(disabled)
    ? disabled
    : [disabled, disabled];
  const allDisabled = disabledTuple[0] && disabledTuple[1];

  const [internalValue, setInternalValue] = useState<DateRangeValue | null>(
    defaultValue,
  );
  const actualValue: DateRangeValue = useMemo(() => {
    const raw = controlledValue !== undefined ? controlledValue : internalValue;
    return raw ? [raw[0] ?? null, raw[1] ?? null] : [null, null];
  }, [controlledValue, internalValue]);

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const [hovered, setHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState<0 | 1>(0);
  const [draftRange, setDraftRange] = useState<DateRangeValue>(actualValue);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [presetHoverRange, setPresetHoverRange] = useState<DateRangeValue | null>(
    null,
  );
  const [leftPanelMode, setLeftPanelMode] = useState<PickerMode>(picker);
  const [rightPanelMode, setRightPanelMode] = useState<PickerMode>(picker);

  const requireConfirm = Boolean(needConfirm ?? (Boolean(showTime) && picker === 'date'));

  const [leftViewDate, setLeftViewDate] = useState<Date>(
    () => actualValue[0] ?? today,
  );

  const rightViewDate = useMemo(() => {
    if (picker === 'year') return addYears(leftViewDate, 10);
    if (picker === 'month' || picker === 'quarter') {
      return addYears(leftViewDate, 1);
    }
    return addMonths(leftViewDate, 1);
  }, [leftViewDate, picker]);

  useEffect(() => {
    setLeftPanelMode(picker);
    setRightPanelMode(picker);
  }, [picker]);

  const formattedStart = useMemo(
    () => formatDateValue(actualValue[0], picker, format, showTime),
    [actualValue, format, picker, showTime],
  );
  const formattedEnd = useMemo(
    () => formatDateValue(actualValue[1], picker, format, showTime),
    [actualValue, format, picker, showTime],
  );

  const [startText, setStartText] = useState(formattedStart);
  const [endText, setEndText] = useState(formattedEnd);

  useEffect(() => {
    setStartText(formattedStart);
  }, [formattedStart]);

  useEffect(() => {
    setEndText(formattedEnd);
  }, [formattedEnd]);

  const setOpenState = useCallback(
    (next: boolean, focusIdx?: 0 | 1) => {
      if (allDisabled && next) return;
      if (controlledOpen === undefined) {
        setInternalOpen(next);
      }
      if (next) {
        const targetIdx =
          focusIdx !== undefined
            ? disabledTuple[focusIdx]
              ? (focusIdx === 0 ? 1 : 0)
              : focusIdx
            : disabledTuple[0]
              ? 1
              : 0;
        setActiveIndex(targetIdx);
        setDraftRange([actualValue[0], actualValue[1]]);
        setLeftPanelMode(picker);
        setRightPanelMode(picker);
        setLeftViewDate(actualValue[0] ?? actualValue[1] ?? today);
      } else {
        setHoverDate(null);
        setPresetHoverRange(null);
      }
      onOpenChange?.(next);
    },
    [actualValue, allDisabled, controlledOpen, disabledTuple, onOpenChange, picker, today],
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenState(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, setOpenState]);

  const commitRange = useCallback(
    (next: DateRangeValue | null, closeAfter = true) => {
      const normalized = next ? normalizeRange(next[0], next[1]) : null;
      if (controlledValue === undefined) {
        setInternalValue(normalized);
      }
      const strings: [string, string] = normalized
        ? [
            formatDateValue(normalized[0], picker, format, showTime),
            formatDateValue(normalized[1], picker, format, showTime),
          ]
        : ['', ''];
      onChange?.(normalized, strings);
      if (closeAfter) {
        setOpenState(false);
      }
    },
    [controlledValue, format, onChange, picker, setOpenState, showTime],
  );

  const handleSelectCell = useCallback(
    (picked: Date) => {
      const preserved = showTime
        ? withTimeFrom(
            picked,
            draftRange[activeIndex] ??
              (activeIndex === 0
                ? new Date(0, 0, 0, 0, 0, 0)
                : new Date(0, 0, 0, 23, 59, 59)),
          )
        : picked;

      let nextDraft: DateRangeValue;
      const otherIndex: 0 | 1 = activeIndex === 0 ? 1 : 0;

      if (activeIndex === 0) {
        if (draftRange[0] && draftRange[1] && !disabledTuple[1]) {
          nextDraft = [preserved, null];
        } else {
          nextDraft = [preserved, draftRange[1]];
        }
      } else {
        if (draftRange[0] && draftRange[1] && !disabledTuple[0]) {
          nextDraft = [null, preserved];
        } else {
          nextDraft = [draftRange[0], preserved];
        }
      }

      const calStrings: [string, string] = [
        formatDateValue(nextDraft[0], picker, format, showTime),
        formatDateValue(nextDraft[1], picker, format, showTime),
      ];
      onCalendarChange?.(nextDraft, calStrings, {
        range: activeIndex === 0 ? 'start' : 'end',
      });

      const bothFilled = Boolean(nextDraft[0] && nextDraft[1]);
      if (bothFilled) {
        const normalized = normalizeRange(nextDraft[0], nextDraft[1]);
        setDraftRange(normalized);
        if (!requireConfirm) {
          commitRange(normalized, true);
        }
      } else {
        setDraftRange(nextDraft);
        if (!disabledTuple[otherIndex]) {
          setActiveIndex(otherIndex);
        }
      }
    },
    [
      activeIndex,
      commitRange,
      disabledTuple,
      draftRange,
      format,
      onCalendarChange,
      picker,
      requireConfirm,
      showTime,
    ],
  );

  const handleRangeTimeChange = (
    idx: 0 | 1,
    hours: number,
    minutes: number,
    seconds: number,
  ) => {
    const base = draftRange[idx] ? cloneDate(draftRange[idx]!) : cloneDate(today);
    base.setHours(hours, minutes, seconds, 0);
    const next: DateRangeValue =
      idx === 0 ? [base, draftRange[1]] : [draftRange[0], base];
    setDraftRange(next);
  };

  const handleManualInputCommit = (idx: 0 | 1) => {
    const raw = idx === 0 ? startText : endText;
    const currentFormatted = idx === 0 ? formattedStart : formattedEnd;
    const trimmed = raw.trim();
    if (trimmed === currentFormatted.trim()) {
      return;
    }
    if (!trimmed) {
      if (allowEmpty[idx]) {
        const next: DateRangeValue =
          idx === 0 ? [null, actualValue[1]] : [actualValue[0], null];
        commitRange(next, false);
      } else {
        if (idx === 0) setStartText(formattedStart);
        else setEndText(formattedEnd);
      }
      return;
    }

    const parsed = parseDateInput(trimmed, picker, showTime);
    if (
      parsed &&
      !isDateDisabled(parsed, { disabledDate, minDate, maxDate, picker })
    ) {
      const next: DateRangeValue =
        idx === 0 ? [parsed, actualValue[1]] : [actualValue[0], parsed];
      if (next[0] && next[1]) {
        commitRange(next, false);
      } else if (allowEmpty[idx === 0 ? 1 : 0]) {
        commitRange(next, false);
      } else {
        setDraftRange(next);
      }
    } else {
      if (idx === 0) setStartText(formattedStart);
      else setEndText(formattedEnd);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next: DateRangeValue = [
      disabledTuple[0] ? actualValue[0] : null,
      disabledTuple[1] ? actualValue[1] : null,
    ];
    if (!next[0] && !next[1]) {
      setDraftRange([null, null]);
      commitRange(null, false);
    } else {
      setDraftRange(next);
      commitRange(next, false);
    }
  };

  const [visStart, visEnd] = useMemo(() => {
    if (presetHoverRange) {
      return normalizeRange(presetHoverRange[0], presetHoverRange[1]);
    }
    return getHoverRangeBounds(
      draftRange[0],
      draftRange[1],
      hoverDate,
      activeIndex,
    );
  }, [activeIndex, draftRange, hoverDate, presetHoverRange]);

  const placeholders = placeholder ?? getDefaultPlaceholders(picker);
  const heightPx = resolveHeight(size);
  const borderColor = resolveBorderColor(theme, status, isOpen, hovered, allDisabled);
  const hasAnyValue = Boolean(actualValue[0] || actualValue[1]);
  const radiusPx = `${theme.shape.borderRadius}px`;
  const popupRadiusPx = `${Number(theme.shape.borderRadius) + 2}px`;

  const ringColor =
    status === 'error'
      ? theme.palette.error.main
      : status === 'warning'
        ? theme.palette.warning.main
        : theme.palette.primary.main;

  const filledBg = isDark
    ? alpha(theme.palette.common.white, 0.08)
    : alpha(theme.palette.common.black, 0.05);

  const presetHoverBg = alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1);

  const variantSx =
    variant === 'filled'
      ? {
          bgcolor: allDisabled
            ? theme.palette.action.disabledBackground
            : isOpen
              ? theme.palette.background.paper
              : filledBg,
          border: `1px solid ${isOpen || status ? borderColor : 'transparent'}`,
          borderRadius: radiusPx,
        }
      : variant === 'borderless'
        ? {
            bgcolor: 'transparent',
            border: '1px solid transparent',
            borderRadius: radiusPx,
          }
        : variant === 'underlined'
          ? {
              bgcolor: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${borderColor}`,
              borderRadius: 0,
            }
          : {
              bgcolor: allDisabled
                ? theme.palette.action.disabledBackground
                : theme.palette.background.paper,
              border: `1px solid ${borderColor}`,
              borderRadius: radiusPx,
            };

  return (
    <Box
      ref={anchorRef}
      data-testid={dataTestId}
      className={className}
      style={style}
      sx={{
        display: 'inline-flex',
        width: '100%',
        maxWidth: showTime ? 420 : 340,
      }}
    >
      {/* Dual Input Trigger Bar with Animated Active Indicator */}
      <Box
        role="group"
        aria-label={ariaLabel}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          position: 'relative',
          width: '100%',
          height: heightPx,
          px: variant === 'underlined' ? 0.5 : 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          cursor: allDisabled ? 'not-allowed' : 'text',
          transition: theme.transitions.create(
            ['border-color', 'box-shadow', 'background-color'],
            { duration: 150 },
          ),
          boxShadow:
            isOpen && variant !== 'borderless' && variant !== 'underlined'
              ? `0 0 0 2px ${alpha(ringColor, isDark ? 0.28 : 0.16)}`
              : 'none',
          ...variantSx,
        }}
      >
        {/* Start Input */}
        <Box
          onClick={() => {
            if (!disabledTuple[0]) {
              setOpenState(true, 0);
              startInputRef.current?.focus();
            }
          }}
          sx={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <InputBase
            inputRef={startInputRef}
            value={startText}
            disabled={disabledTuple[0]}
            placeholder={placeholders[0]}
            onFocus={() => {
              if (!disabledTuple[0]) setActiveIndex(0);
            }}
            onChange={(e) => setStartText(e.target.value)}
            onBlur={() => handleManualInputCommit(0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleManualInputCommit(0);
            }}
            inputProps={{
              'aria-label': placeholders[0],
              className: 'font-mono-tabular',
            }}
            sx={{
              width: '100%',
              fontSize: size === 'small' ? '0.78rem' : '0.84rem',
              color: disabledTuple[0]
                ? theme.palette.text.disabled
                : theme.palette.text.primary,
              '& input': { p: 0 },
              '& input::placeholder': {
                color: theme.palette.text.disabled,
                opacity: 1,
              },
            }}
          />
          {isOpen && activeIndex === 0 && !disabledTuple[0] && (
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 2,
                bgcolor: theme.palette.primary.main,
                borderRadius: 1,
              }}
            />
          )}
        </Box>

        {/* Range Separator */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            color: theme.palette.text.secondary,
            flexShrink: 0,
          }}
        >
          {separator ?? <ArrowForwardIcon sx={{ fontSize: 14 }} />}
        </Box>

        {/* End Input */}
        <Box
          onClick={() => {
            if (!disabledTuple[1]) {
              setOpenState(true, 1);
              endInputRef.current?.focus();
            }
          }}
          sx={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <InputBase
            inputRef={endInputRef}
            value={endText}
            disabled={disabledTuple[1]}
            placeholder={placeholders[1]}
            onFocus={() => {
              if (!disabledTuple[1]) setActiveIndex(1);
            }}
            onChange={(e) => setEndText(e.target.value)}
            onBlur={() => handleManualInputCommit(1)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleManualInputCommit(1);
            }}
            inputProps={{
              'aria-label': placeholders[1],
              className: 'font-mono-tabular',
            }}
            sx={{
              width: '100%',
              fontSize: size === 'small' ? '0.78rem' : '0.84rem',
              color: disabledTuple[1]
                ? theme.palette.text.disabled
                : theme.palette.text.primary,
              '& input': { p: 0 },
              '& input::placeholder': {
                color: theme.palette.text.disabled,
                opacity: 1,
              },
            }}
          />
          {isOpen && activeIndex === 1 && !disabledTuple[1] && (
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 2,
                bgcolor: theme.palette.primary.main,
                borderRadius: 1,
              }}
            />
          )}
        </Box>

        {/* Clear or Calendar Suffix */}
        {allowClear && hasAnyValue && !allDisabled && hovered ? (
          <IconButton
            size="small"
            aria-label="清空日期范围"
            onClick={handleClear}
            sx={{
              p: 0.15,
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.text.primary },
            }}
          >
            <CancelIcon sx={{ fontSize: 15 }} />
          </IconButton>
        ) : (
          <CalendarTodayOutlinedIcon
            sx={{
              fontSize: 15,
              color:
                status === 'error'
                  ? theme.palette.error.main
                  : status === 'warning'
                    ? theme.palette.warning.main
                    : theme.palette.text.secondary,
              flexShrink: 0,
            }}
          />
        )}
      </Box>

      {/* Dual-Panel Popper Dropdown */}
      <Popper
        open={isOpen}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        modifiers={[
          { name: 'offset', options: { offset: [0, 6] } },
          {
            name: 'preventOverflow',
            options: { padding: 8, boundary: 'viewport' },
          },
        ]}
        sx={{ zIndex: theme.zIndex.modal + 60 }}
      >
        {({ TransitionProps }) => (
          <Grow
            {...TransitionProps}
            timeout={{ enter: 160, exit: 110 }}
            style={{ transformOrigin: 'top left' }}
          >
            <div>
              <ClickAwayListener
                onClickAway={(ev) => {
                  if (
                    anchorRef.current &&
                    ev.target instanceof Node &&
                    anchorRef.current.contains(ev.target)
                  ) {
                    return;
                  }
                  setOpenState(false);
                }}
              >
                <Paper
                  elevation={0}
                  data-date-popup="range"
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: popupRadiusPx,
                    boxShadow: theme.shadows[8],
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ display: 'flex' }}>
                    {/* Left Range Presets Sidebar */}
                    {presets && presets.length > 0 && (
                      <Box
                        sx={{
                          width: 116,
                          py: 1,
                          px: 0.75,
                          borderRight: `1px solid ${theme.palette.divider}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.25,
                          bgcolor: theme.palette.background.default,
                        }}
                      >
                        {presets.map((preset, idx) => {
                          const resolveVal = () =>
                            typeof preset.value === 'function'
                              ? preset.value()
                              : preset.value;
                          return (
                            <Box
                              key={idx}
                              component="button"
                              type="button"
                              onMouseEnter={() => {
                                const r = resolveVal();
                                setPresetHoverRange(r);
                                if (r[0]) setLeftViewDate(r[0]);
                              }}
                              onMouseLeave={() => setPresetHoverRange(null)}
                              onClick={() => {
                                const r = resolveVal();
                                if (requireConfirm) {
                                  setDraftRange(r);
                                  if (r[0]) setLeftViewDate(r[0]);
                                } else {
                                  commitRange(r, true);
                                }
                              }}
                              sx={{
                                width: '100%',
                                textAlign: 'left',
                                px: 1,
                                py: 0.65,
                                border: 'none',
                                borderRadius: `${Math.max(4, Number(theme.shape.borderRadius) - 1)}px`,
                                bgcolor: 'transparent',
                                color: theme.palette.text.primary,
                                fontSize: '0.78rem',
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                '&:hover': {
                                  bgcolor: presetHoverBg,
                                  color: theme.palette.primary.main,
                                },
                              }}
                            >
                              {preset.label}
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    {/* Dual Panels (+ Optional Time Panel) */}
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex' }}>
                        <DatePanel
                          picker={picker}
                          panelMode={leftPanelMode}
                          viewDate={leftViewDate}
                          today={today}
                          selectedDates={[]}
                          rangeStart={visStart}
                          rangeEnd={visEnd}
                          hoverDate={hoverDate}
                          disabledDate={disabledDate}
                          minDate={minDate}
                          maxDate={maxDate}
                          cellRender={cellRender}
                          hideNextNav={!showTime}
                          onViewDateChange={setLeftViewDate}
                          onPanelModeChange={setLeftPanelMode}
                          onSelectDate={handleSelectCell}
                          onHoverDate={setHoverDate}
                        />

                        {showTime && picker === 'date' ? (
                          <TimeColumnPanel
                            value={draftRange[activeIndex]}
                            showTime={showTime}
                            disabledTime={
                              disabledTime
                                ? (d) =>
                                    disabledTime(
                                      d,
                                      activeIndex === 0 ? 'start' : 'end',
                                    )
                                : undefined
                            }
                            title={
                              activeIndex === 0 ? '开始时间' : '结束时间'
                            }
                            onChangeTime={(h, m, s) =>
                              handleRangeTimeChange(activeIndex, h, m, s)
                            }
                          />
                        ) : (
                          <Box sx={{ borderLeft: `1px solid ${theme.palette.divider}` }}>
                            <DatePanel
                              picker={picker}
                              panelMode={rightPanelMode}
                              viewDate={rightViewDate}
                              today={today}
                              selectedDates={[]}
                              rangeStart={visStart}
                              rangeEnd={visEnd}
                              hoverDate={hoverDate}
                              disabledDate={disabledDate}
                              minDate={minDate}
                              maxDate={maxDate}
                              cellRender={cellRender}
                              hidePrevNav
                              onViewDateChange={(nextRight) => {
                                if (picker === 'year') {
                                  setLeftViewDate(addYears(nextRight, -10));
                                } else if (
                                  picker === 'month' ||
                                  picker === 'quarter'
                                ) {
                                  setLeftViewDate(addYears(nextRight, -1));
                                } else {
                                  setLeftViewDate(addMonths(nextRight, -1));
                                }
                              }}
                              onPanelModeChange={setRightPanelMode}
                              onSelectDate={handleSelectCell}
                              onHoverDate={setHoverDate}
                            />
                          </Box>
                        )}
                      </Box>

                      {/* Extra Footer */}
                      {renderExtraFooter && (
                        <>
                          <Divider />
                          <Box
                            sx={{
                              px: 1.5,
                              py: 0.75,
                              fontSize: '0.76rem',
                              color: theme.palette.text.secondary,
                            }}
                          >
                            {renderExtraFooter(leftPanelMode)}
                          </Box>
                        </>
                      )}

                      {/* Confirm Bar for showTime / needConfirm */}
                      {requireConfirm && (
                        <>
                          <Divider />
                          <Box
                            sx={{
                              px: 1.5,
                              py: 0.85,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1.5,
                            }}
                          >
                            <Typography
                              className="font-mono-tabular"
                              sx={{
                                fontSize: '0.74rem',
                                color: theme.palette.text.secondary,
                              }}
                            >
                              {draftRange[0]
                                ? formatDateValue(
                                    draftRange[0],
                                    picker,
                                    format,
                                    showTime,
                                  )
                                : '未选开始'}{' '}
                              →{' '}
                              {draftRange[1]
                                ? formatDateValue(
                                    draftRange[1],
                                    picker,
                                    format,
                                    showTime,
                                  )
                                : '未选结束'}
                            </Typography>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              disableElevation
                              disabled={
                                (!draftRange[0] && !allowEmpty[0]) ||
                                (!draftRange[1] && !allowEmpty[1])
                              }
                              onClick={() => {
                                const norm = normalizeRange(
                                  draftRange[0],
                                  draftRange[1],
                                );
                                commitRange(norm, true);
                                onOk?.(norm);
                              }}
                              sx={{
                                minWidth: 52,
                                px: 1.5,
                                py: 0.3,
                                fontSize: '0.76rem',
                              }}
                            >
                              确定
                            </Button>
                          </Box>
                        </>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </ClickAwayListener>
            </div>
          </Grow>
        )}
      </Popper>
    </Box>
  );
};
