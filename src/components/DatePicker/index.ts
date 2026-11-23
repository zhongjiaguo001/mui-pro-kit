import type React from 'react';
import { DatePicker as BaseDatePicker } from './DatePicker';
import { RangePicker } from './RangePicker';
import { CalendarPanel } from './CalendarPanel';
import type { AntMuiDatePickerProps } from './types';

type DatePickerCompound = React.FC<AntMuiDatePickerProps> & {
  RangePicker: typeof RangePicker;
};

export const DatePicker = BaseDatePicker as DatePickerCompound;
DatePicker.RangePicker = RangePicker;

export { RangePicker, CalendarPanel };
export {
  addDays,
  addMonths,
  addYears,
  buildDecadeGrid,
  buildMonthGrid,
  compareByUnit,
  formatDateValue,
  getDefaultFormat,
  getHoverRangeBounds,
  getISOWeekInfo,
  getQuarter,
  getRangeSpanDays,
  isDateDisabled,
  isDateStrictlyInRange,
  isSameDay,
  isSameUnit,
  moveFocusedDate,
  normalizeRange,
  parseDateInput,
  startOfDay,
  toDateKey,
  toggleMultiDateSelection,
} from './core/dateCore';

export type {
  AntMuiCalendarProps,
  AntMuiDatePickerProps,
  AntMuiRangePickerProps,
  DateCellRender,
  DateCellRenderInfo,
  DatePreset,
  DateRangeValue,
  DisabledTimeConfig,
  PickerMode,
  PickerSize,
  PickerStatus,
  PickerVariant,
  ShowTimeConfig,
  ShowTimeOptions,
} from './types';
