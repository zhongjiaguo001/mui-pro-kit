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
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import { DatePanel, TimeColumnPanel } from './DatePanel';
import { DATE_PICKER_TABULAR_STYLES } from './tabularStyles';
import {
  cloneDate,
  formatDateValue,
  isDateDisabled,
  moveFocusedDate,
  parseDateInput,
  toggleMultiDateSelection,
  withTimeFrom,
} from './core/dateCore';
import type {
  AntMuiDatePickerProps,
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
  disabled: boolean,
): string {
  if (disabled) return theme.palette.divider;
  if (status === 'error') return theme.palette.error.main;
  if (status === 'warning') return theme.palette.warning.main;
  if (isOpen) return theme.palette.primary.main;
  if (isHovered) return alpha(theme.palette.text.primary, 0.56);
  return alpha(theme.palette.text.primary, 0.23);
}

function getDefaultPlaceholder(picker: PickerMode, multiple: boolean): string {
  if (multiple) return '请选择多个日期';
  switch (picker) {
    case 'week':
      return '请选择周';
    case 'month':
      return '请选择月份';
    case 'quarter':
      return '请选择季度';
    case 'year':
      return '请选择年份';
    default:
      return '请选择日期';
  }
}

export const DatePicker: React.FC<AntMuiDatePickerProps> = ({
  value: controlledValue,
  defaultValue = null,
  picker = 'date',
  multiple = false,
  showTime = false,
  showToday = true,
  showNow = true,
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
  size = 'middle',
  variant = 'outlined',
  status = '',
  cellRender,
  renderExtraFooter,
  open: controlledOpen,
  onOpenChange,
  onChange,
  onOk,
  onPanelChange,
  ariaLabel,
  'data-testid': dataTestId,
  className,
  style,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const today = useMemo(() => new Date(), []);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const keyboardNavActiveRef = useRef(false);

  const [internalValue, setInternalValue] = useState<Date | Date[] | null>(defaultValue);
  const actualValue = controlledValue !== undefined ? controlledValue : internalValue;

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const [hovered, setHovered] = useState(false);
  const [panelMode, setPanelMode] = useState<PickerMode>(picker);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [presetPreviewDate, setPresetPreviewDate] = useState<Date | null>(null);

  const requireConfirm = Boolean(
    needConfirm ?? (Boolean(showTime) && picker === 'date' && !multiple),
  );

  // Draft value used when `needConfirm` or `showTime` is enabled
  const [draftDate, setDraftDate] = useState<Date | null>(() =>
    actualValue && !Array.isArray(actualValue) ? cloneDate(actualValue) : null,
  );

  const selectedArray = useMemo<Date[]>(() => {
    if (multiple) {
      if (Array.isArray(actualValue)) return actualValue;
      return actualValue ? [actualValue] : [];
    }
    if (requireConfirm && isOpen) {
      return draftDate ? [draftDate] : [];
    }
    if (Array.isArray(actualValue)) return actualValue.slice(0, 1);
    return actualValue ? [actualValue] : [];
  }, [actualValue, draftDate, isOpen, multiple, requireConfirm]);

  const primaryDate = selectedArray[0] ?? null;

  const [viewDate, setViewDate] = useState<Date>(() => primaryDate ?? today);
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);

  useEffect(() => {
    setPanelMode(picker);
  }, [picker]);

  const formattedDisplay = useMemo(() => {
    if (multiple) return '';
    return primaryDate ? formatDateValue(primaryDate, picker, format, showTime) : '';
  }, [format, multiple, picker, primaryDate, showTime]);

  const [inputText, setInputText] = useState<string>(formattedDisplay);
  useEffect(() => {
    setInputText(formattedDisplay);
  }, [formattedDisplay]);

  const setOpenState = useCallback(
    (next: boolean) => {
      if (disabled && next) return;
      if (controlledOpen === undefined) {
        setInternalOpen(next);
      }
      if (next) {
        keyboardNavActiveRef.current = false;
        setPanelMode(picker);
        const seed =
          !Array.isArray(actualValue) && actualValue
            ? cloneDate(actualValue)
            : Array.isArray(actualValue) && actualValue[0]
              ? cloneDate(actualValue[0])
              : today;
        setViewDate(seed);
        setFocusedDate(seed);
        if (!multiple) {
          setDraftDate(
            actualValue && !Array.isArray(actualValue) ? cloneDate(actualValue) : null,
          );
        }
      } else {
        keyboardNavActiveRef.current = false;
        setPresetPreviewDate(null);
      }
      onOpenChange?.(next);
    },
    [actualValue, controlledOpen, disabled, multiple, onOpenChange, picker, today],
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

  const commitSingle = useCallback(
    (next: Date | null, closeAfter = true) => {
      if (controlledValue === undefined) {
        setInternalValue(next);
      }
      const formatted = next ? formatDateValue(next, picker, format, showTime) : '';
      onChange?.(next, formatted);
      if (closeAfter) {
        setOpenState(false);
      }
    },
    [controlledValue, format, onChange, picker, setOpenState, showTime],
  );

  const commitMultiple = useCallback(
    (nextList: Date[]) => {
      if (controlledValue === undefined) {
        setInternalValue(nextList);
      }
      const strings = nextList.map((d) =>
        formatDateValue(d, picker, format, false),
      );
      onChange?.(nextList, strings);
    },
    [controlledValue, format, onChange, picker],
  );

  const handleSelectPanelDate = useCallback(
    (picked: Date) => {
      if (multiple) {
        const nextList = toggleMultiDateSelection(selectedArray, picked, picker);
        commitMultiple(nextList);
        return;
      }

      const withPreservedTime = showTime
        ? withTimeFrom(
            picked,
            draftDate ??
              (typeof showTime === 'object' ? showTime.defaultValue : null) ??
              new Date(0, 0, 0, 0, 0, 0),
          )
        : picked;

      if (requireConfirm) {
        setDraftDate(withPreservedTime);
        setViewDate(withPreservedTime);
      } else {
        commitSingle(withPreservedTime, true);
      }
    },
    [
      commitMultiple,
      commitSingle,
      draftDate,
      multiple,
      picker,
      requireConfirm,
      selectedArray,
      showTime,
    ],
  );

  const handleTimeChange = useCallback(
    (hours: number, minutes: number, seconds: number) => {
      const base = draftDate ? cloneDate(draftDate) : cloneDate(today);
      base.setHours(hours, minutes, seconds, 0);
      setDraftDate(base);
      setViewDate(base);
    },
    [draftDate, today],
  );

  const handleConfirmOk = useCallback(() => {
    const finalDate = draftDate ?? today;
    commitSingle(finalDate, true);
    onOk?.(finalDate);
  }, [commitSingle, draftDate, onOk, today]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      commitMultiple([]);
    } else {
      setDraftDate(null);
      commitSingle(null, false);
    }
  };

  const handleInputCommit = () => {
    if (multiple) return;
    const trimmed = inputText.trim();
    if (trimmed === formattedDisplay.trim()) {
      return;
    }
    if (!trimmed) {
      if (allowClear && primaryDate) {
        commitSingle(null, false);
      } else {
        setInputText(formattedDisplay);
      }
      return;
    }
    const parsed = parseDateInput(trimmed, picker, showTime);
    if (
      parsed &&
      !isDateDisabled(parsed, { disabledDate, minDate, maxDate, picker })
    ) {
      commitSingle(parsed, false);
      setViewDate(parsed);
    } else {
      setInputText(formattedDisplay);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (
        isOpen &&
        focusedDate &&
        picker === 'date' &&
        panelMode === 'date' &&
        (keyboardNavActiveRef.current || !inputText)
      ) {
        e.preventDefault();
        if (!isDateDisabled(focusedDate, { disabledDate, minDate, maxDate, picker })) {
          handleSelectPanelDate(focusedDate);
        }
        return;
      }
      handleInputCommit();
      if (isOpen && !requireConfirm) setOpenState(false);
      return;
    }

    if (!isOpen && (e.key === 'ArrowDown' || e.key === ' ')) {
      e.preventDefault();
      setOpenState(true);
      return;
    }

    if (isOpen && panelMode === 'date') {
      const nextFocus = moveFocusedDate(focusedDate ?? viewDate, e.key);
      if (nextFocus) {
        e.preventDefault();
        keyboardNavActiveRef.current = true;
        setFocusedDate(nextFocus);
        setViewDate(nextFocus);
      }
    }
  };

  const hasValue = multiple ? selectedArray.length > 0 : Boolean(primaryDate);
  const heightPx = resolveHeight(size);
  const borderColor = resolveBorderColor(theme, status, isOpen, hovered, disabled);
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

  const variantSx =
    variant === 'filled'
      ? {
          bgcolor: disabled
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
              bgcolor: disabled
                ? theme.palette.action.disabledBackground
                : theme.palette.background.paper,
              border: `1px solid ${borderColor}`,
              borderRadius: radiusPx,
            };

  const showTodayBtn =
    !multiple &&
    picker === 'date' &&
    ((showTime && showNow) || (!showTime && showToday));

  const todayDisabled = isDateDisabled(today, {
    disabledDate,
    minDate,
    maxDate,
    picker,
  });

  const presetHoverBg = alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1);

  return (
    <Box
      ref={anchorRef}
      data-testid={dataTestId}
      className={className}
      style={style}
      sx={{ display: 'inline-flex', width: '100%', maxWidth: multiple ? 360 : 260 }}
    >
      {DATE_PICKER_TABULAR_STYLES}
      {/* Input Trigger Shell */}
      <Box
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          if (!disabled) {
            setOpenState(true);
            inputRef.current?.focus();
          }
        }}
        sx={{
          width: '100%',
          minHeight: heightPx,
          px: variant === 'underlined' ? 0.5 : 1.25,
          py: multiple ? 0.35 : 0,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          cursor: disabled ? 'not-allowed' : 'text',
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
        {multiple ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 0.5,
              minWidth: 0,
            }}
          >
            {selectedArray.length === 0 ? (
              <Typography
                sx={{
                  fontSize: size === 'small' ? '0.78rem' : '0.84rem',
                  color: theme.palette.text.disabled,
                }}
              >
                {placeholder ?? getDefaultPlaceholder(picker, true)}
              </Typography>
            ) : (
              selectedArray.map((d) => {
                const label = formatDateValue(d, picker, format, false);
                return (
                  <Box
                    key={label}
                    className="font-mono-tabular"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.35,
                      px: 0.75,
                      py: 0.15,
                      bgcolor: theme.palette.action.hover,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: `${Math.max(4, Number(theme.shape.borderRadius) - 2)}px`,
                      fontSize: '0.75rem',
                      color: theme.palette.text.primary,
                    }}
                  >
                    <span>{label}</span>
                    {!disabled && (
                      <IconButton
                        size="small"
                        aria-label={`移除日期 ${label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          commitMultiple(
                            toggleMultiDateSelection(selectedArray, d, picker),
                          );
                        }}
                        sx={{
                          p: 0.1,
                          color: theme.palette.text.secondary,
                          '&:hover': { color: theme.palette.text.primary },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        ) : (
          <InputBase
            inputRef={inputRef}
            value={inputText}
            disabled={disabled}
            placeholder={placeholder ?? getDefaultPlaceholder(picker, false)}
            onChange={(e) => {
              keyboardNavActiveRef.current = false;
              setInputText(e.target.value);
            }}
            onBlur={handleInputCommit}
            onKeyDown={handleInputKeyDown}
            inputProps={{
              'aria-label':
                ariaLabel ?? placeholder ?? getDefaultPlaceholder(picker, false),
              className: 'font-mono-tabular',
            }}
            sx={{
              flex: 1,
              fontSize:
                size === 'small'
                  ? '0.78rem'
                  : size === 'large'
                    ? '0.9rem'
                    : '0.84rem',
              color: disabled
                ? theme.palette.text.disabled
                : theme.palette.text.primary,
              '& input': { p: 0 },
              '& input::placeholder': {
                color: theme.palette.text.disabled,
                opacity: 1,
              },
            }}
          />
        )}

        {/* Clear or Calendar Suffix Icon */}
        {allowClear && hasValue && !disabled && hovered ? (
          <IconButton
            size="small"
            aria-label="清空日期"
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

      {/* Popper Calendar Dropdown */}
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
                  data-date-popup="single"
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
                    {/* Left Presets Rail */}
                    {presets && presets.length > 0 && !multiple && (
                      <Box
                        sx={{
                          width: 112,
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
                          const resolvePreset = () =>
                            typeof preset.value === 'function'
                              ? preset.value()
                              : preset.value;
                          return (
                            <Box
                              key={idx}
                              component="button"
                              type="button"
                              onMouseEnter={() => {
                                const d = resolvePreset();
                                setPresetPreviewDate(d);
                                setViewDate(d);
                              }}
                              onMouseLeave={() => setPresetPreviewDate(null)}
                              onClick={() => {
                                const d = resolvePreset();
                                if (
                                  !isDateDisabled(d, {
                                    disabledDate,
                                    minDate,
                                    maxDate,
                                    picker,
                                  })
                                ) {
                                  if (requireConfirm) {
                                    setDraftDate(d);
                                    setViewDate(d);
                                  } else {
                                    commitSingle(d, true);
                                  }
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

                    {/* Main Calendar + Optional Time Columns */}
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex' }}>
                        <DatePanel
                          picker={picker}
                          panelMode={panelMode}
                          viewDate={viewDate}
                          today={today}
                          selectedDates={
                            presetPreviewDate ? [presetPreviewDate] : selectedArray
                          }
                          hoverDate={hoverDate}
                          focusedDate={focusedDate}
                          disabledDate={disabledDate}
                          minDate={minDate}
                          maxDate={maxDate}
                          cellRender={cellRender}
                          onViewDateChange={(next) => {
                            setViewDate(next);
                            onPanelChange?.(next, panelMode);
                          }}
                          onPanelModeChange={(nextMode) => {
                            setPanelMode(nextMode);
                            onPanelChange?.(viewDate, nextMode);
                          }}
                          onSelectDate={handleSelectPanelDate}
                          onHoverDate={setHoverDate}
                        />

                        {Boolean(showTime) &&
                          picker === 'date' &&
                          panelMode === 'date' &&
                          !multiple && (
                            <TimeColumnPanel
                              value={draftDate ?? primaryDate}
                              showTime={showTime}
                              disabledTime={disabledTime}
                              onChangeTime={handleTimeChange}
                            />
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
                            {renderExtraFooter(panelMode)}
                          </Box>
                        </>
                      )}

                      {/* Standard Footer: Today / Now / Confirm */}
                      {(showTodayBtn || requireConfirm || multiple) && (
                        <>
                          <Divider />
                          <Box
                            sx={{
                              px: 1.5,
                              py: 0.85,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent:
                                showTodayBtn && (requireConfirm || multiple)
                                  ? 'space-between'
                                  : requireConfirm || multiple
                                    ? 'flex-end'
                                    : 'center',
                              gap: 1,
                            }}
                          >
                            {showTodayBtn && (
                              <Button
                                size="small"
                                variant="text"
                                color="primary"
                                disabled={todayDisabled}
                                onClick={() => {
                                  const now = new Date();
                                  if (requireConfirm) {
                                    setDraftDate(now);
                                    setViewDate(now);
                                  } else {
                                    commitSingle(now, true);
                                  }
                                }}
                                sx={{
                                  minWidth: 0,
                                  px: 1,
                                  py: 0.25,
                                  fontSize: '0.78rem',
                                  textTransform: 'none',
                                }}
                              >
                                {showTime ? '此刻' : '今天'}
                              </Button>
                            )}

                            {multiple && (
                              <Box
                                sx={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Typography
                                  className="font-mono-tabular"
                                  sx={{
                                    fontSize: '0.75rem',
                                    color: theme.palette.text.secondary,
                                  }}
                                >
                                  已选 {selectedArray.length} 项
                                </Typography>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  disableElevation
                                  onClick={() => setOpenState(false)}
                                  sx={{
                                    minWidth: 52,
                                    px: 1.5,
                                    py: 0.3,
                                    fontSize: '0.76rem',
                                  }}
                                >
                                  完成
                                </Button>
                              </Box>
                            )}

                            {requireConfirm && !multiple && (
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                disableElevation
                                disabled={!draftDate && !primaryDate}
                                onClick={handleConfirmOk}
                                sx={{
                                  minWidth: 52,
                                  px: 1.5,
                                  py: 0.3,
                                  fontSize: '0.76rem',
                                }}
                              >
                                确定
                              </Button>
                            )}
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
