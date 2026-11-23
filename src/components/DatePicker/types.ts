import type React from 'react';

export type PickerMode = 'date' | 'week' | 'month' | 'quarter' | 'year';

export type PickerSize = 'small' | 'middle' | 'large';

export type PickerVariant = 'outlined' | 'filled' | 'borderless' | 'underlined';

export type PickerStatus = '' | 'error' | 'warning';

export interface DisabledTimeConfig {
  disabledHours?: () => number[];
  disabledMinutes?: (selectedHour: number) => number[];
  disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
}

export interface ShowTimeOptions {
  format?: string;
  showSecond?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  defaultValue?: Date;
  disabledTime?: (date: Date | null) => DisabledTimeConfig;
}

export type ShowTimeConfig = boolean | ShowTimeOptions;

export interface DatePreset<T> {
  label: React.ReactNode;
  value: T | (() => T);
}

export interface DateCellRenderInfo {
  originNode: React.ReactNode;
  today: Date;
  type: PickerMode;
  isSelected: boolean;
  isInRange: boolean;
  isDisabled: boolean;
}

export type DateCellRender = (
  current: Date,
  info: DateCellRenderInfo,
) => React.ReactNode;

export type DateRangeValue = [Date | null, Date | null];

export interface AntMuiDatePickerProps {
  /** Controlled single date value (or Date[] when `multiple` is true) */
  value?: Date | Date[] | null;
  /** Uncontrolled initial value */
  defaultValue?: Date | Date[] | null;
  /** Granularity mode matching Ant Design v5 */
  picker?: PickerMode;
  /** Ant Design v5.14+ multiple date selection mode */
  multiple?: boolean;
  /** Enable HH:mm(:ss) time selection panel alongside calendar */
  showTime?: ShowTimeConfig;
  /** Show "今天" quick action button in footer (date mode) */
  showToday?: boolean;
  /** Show "此刻" quick action button in footer (when showTime is enabled) */
  showNow?: boolean;
  /** Require explicit "确定" confirmation before committing value */
  needConfirm?: boolean;
  /** Display format string, e.g. 'YYYY-MM-DD', 'YYYY/MM/DD HH:mm' */
  format?: string;
  placeholder?: string;
  presets?: DatePreset<Date>[];
  disabled?: boolean;
  disabledDate?: (current: Date) => boolean;
  disabledTime?: (current: Date | null) => DisabledTimeConfig;
  minDate?: Date;
  maxDate?: Date;
  allowClear?: boolean;
  size?: PickerSize;
  variant?: PickerVariant;
  status?: PickerStatus;
  cellRender?: DateCellRender;
  renderExtraFooter?: (mode: PickerMode) => React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onChange?: (
    value: Date | Date[] | null,
    dateString: string | string[],
  ) => void;
  onOk?: (value: Date | Date[] | null) => void;
  onPanelChange?: (value: Date, mode: PickerMode) => void;
  ariaLabel?: string;
  'data-testid'?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface AntMuiRangePickerProps {
  value?: DateRangeValue | null;
  defaultValue?: DateRangeValue | null;
  picker?: PickerMode;
  showTime?: ShowTimeConfig;
  needConfirm?: boolean;
  format?: string;
  placeholder?: [string, string];
  presets?: DatePreset<DateRangeValue>[];
  disabled?: boolean | [boolean, boolean];
  disabledDate?: (current: Date) => boolean;
  disabledTime?: (
    current: Date | null,
    type: 'start' | 'end',
  ) => DisabledTimeConfig;
  minDate?: Date;
  maxDate?: Date;
  allowClear?: boolean;
  allowEmpty?: [boolean, boolean];
  size?: PickerSize;
  variant?: PickerVariant;
  status?: PickerStatus;
  separator?: React.ReactNode;
  cellRender?: DateCellRender;
  renderExtraFooter?: (mode: PickerMode) => React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onChange?: (
    dates: DateRangeValue | null,
    dateStrings: [string, string],
  ) => void;
  onCalendarChange?: (
    dates: DateRangeValue,
    dateStrings: [string, string],
    info: { range: 'start' | 'end' },
  ) => void;
  onOk?: (dates: DateRangeValue | null) => void;
  ariaLabel?: string;
  'data-testid'?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface AntMuiCalendarProps {
  value?: Date;
  defaultValue?: Date;
  mode?: 'month' | 'year';
  fullscreen?: boolean;
  disabledDate?: (date: Date) => boolean;
  cellRender?: (
    date: Date,
    info: { type: 'date' | 'month'; isSelected: boolean; isToday: boolean },
  ) => React.ReactNode;
  onSelect?: (date: Date, info: { source: 'date' | 'month' | 'year' | 'customize' }) => void;
  onChange?: (date: Date) => void;
  onPanelChange?: (date: Date, mode: 'month' | 'year') => void;
  'data-testid'?: string;
}
