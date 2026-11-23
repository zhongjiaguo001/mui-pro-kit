import type { PickerMode, ShowTimeConfig } from '../types';

export interface CalendarDayCell {
  date: Date;
  dateKey: string;
  year: number;
  month: number; // 0-11
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isoWeek: number;
  isoWeekYear: number;
}

export interface DecadeYearCell {
  year: number;
  isCurrentDecade: boolean;
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function cloneDate(d: Date): Date {
  return new Date(d.getTime());
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function addDays(d: Date, delta: number): Date {
  const next = cloneDate(d);
  next.setDate(next.getDate() + delta);
  return next;
}

export function addMonths(d: Date, delta: number): Date {
  const targetYear = d.getFullYear();
  const targetMonth = d.getMonth() + delta;
  const normalized = new Date(targetYear, targetMonth, 1);
  const maxDay = getDaysInMonth(normalized.getFullYear(), normalized.getMonth());
  return new Date(
    normalized.getFullYear(),
    normalized.getMonth(),
    Math.min(d.getDate(), maxDay),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds(),
  );
}

export function addYears(d: Date, delta: number): Date {
  return addMonths(d, delta * 12);
}

export function getQuarter(d: Date): 1 | 2 | 3 | 4 {
  return (Math.floor(d.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
}

/**
 * ISO-8601 week number (1..53) and ISO week-numbering year.
 * Week 1 is the week containing the first Thursday of the year (Monday start).
 */
export function getISOWeekInfo(date: Date): { week: number; weekYear: number } {
  const utc = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = utc.getUTCDay() || 7; // Mon=1 .. Sun=7
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const weekYear = utc.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, weekYear };
}

export function startOfISOWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay() || 7; // Mon=1 .. Sun=7
  d.setDate(d.getDate() - (day - 1));
  return d;
}

export function endOfISOWeek(date: Date): Date {
  const start = startOfISOWeek(date);
  return addDays(start, 6);
}

/**
 * Builds the standard 6x7 (42-cell) calendar month matrix starting on Monday (ISO default) or Sunday.
 */
export function buildMonthGrid(
  year: number,
  month: number,
  today: Date = new Date(),
  weekStartsOn: 0 | 1 = 1,
): CalendarDayCell[] {
  const todayKey = toDateKey(today);
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const offset = (firstWeekday - weekStartsOn + 7) % 7;

  const gridStart = new Date(year, month, 1 - offset);
  const cells: CalendarDayCell[] = new Array(42);

  for (let i = 0; i < 42; i += 1) {
    const cellDate = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i,
    );
    const dateKey = toDateKey(cellDate);
    const { week, weekYear } = getISOWeekInfo(cellDate);
    cells[i] = {
      date: cellDate,
      dateKey,
      year: cellDate.getFullYear(),
      month: cellDate.getMonth(),
      day: cellDate.getDate(),
      isCurrentMonth:
        cellDate.getFullYear() === year && cellDate.getMonth() === month,
      isToday: dateKey === todayKey,
      isoWeek: week,
      isoWeekYear: weekYear,
    };
  }

  return cells;
}

/**
 * Builds Ant Design's 12-cell Decade Year Panel (1 previous decade year + 10 current + 1 next).
 */
export function buildDecadeGrid(anchorYear: number): {
  decadeStart: number;
  decadeEnd: number;
  cells: DecadeYearCell[];
} {
  const decadeStart = Math.floor(anchorYear / 10) * 10;
  const decadeEnd = decadeStart + 9;
  const cells: DecadeYearCell[] = [];
  for (let y = decadeStart - 1; y <= decadeEnd + 1; y += 1) {
    cells.push({
      year: y,
      isCurrentDecade: y >= decadeStart && y <= decadeEnd,
    });
  }
  return { decadeStart, decadeEnd, cells };
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameUnit(
  a: Date | null | undefined,
  b: Date | null | undefined,
  picker: PickerMode,
): boolean {
  if (!a || !b) return false;
  switch (picker) {
    case 'year':
      return a.getFullYear() === b.getFullYear();
    case 'quarter':
      return a.getFullYear() === b.getFullYear() && getQuarter(a) === getQuarter(b);
    case 'month':
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
    case 'week': {
      const ia = getISOWeekInfo(a);
      const ib = getISOWeekInfo(b);
      return ia.weekYear === ib.weekYear && ia.week === ib.week;
    }
    case 'date':
    default:
      return isSameDay(a, b);
  }
}

/**
 * Compares two dates at the granularity of `picker`. Returns -1, 0, or 1.
 */
export function compareByUnit(a: Date, b: Date, picker: PickerMode): -1 | 0 | 1 {
  const keyOf = (d: Date): number => {
    switch (picker) {
      case 'year':
        return d.getFullYear();
      case 'quarter':
        return d.getFullYear() * 10 + getQuarter(d);
      case 'month':
        return d.getFullYear() * 100 + d.getMonth();
      case 'week': {
        const info = getISOWeekInfo(d);
        return info.weekYear * 100 + info.week;
      }
      case 'date':
      default:
        return d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
    }
  };
  const ka = keyOf(a);
  const kb = keyOf(b);
  if (ka < kb) return -1;
  if (ka > kb) return 1;
  return 0;
}

export function isDateDisabled(
  candidate: Date,
  options: {
    disabledDate?: (d: Date) => boolean;
    minDate?: Date;
    maxDate?: Date;
    picker?: PickerMode;
  },
): boolean {
  const picker = options.picker ?? 'date';
  if (options.minDate && compareByUnit(candidate, options.minDate, picker) < 0) {
    return true;
  }
  if (options.maxDate && compareByUnit(candidate, options.maxDate, picker) > 0) {
    return true;
  }
  if (options.disabledDate && options.disabledDate(candidate)) {
    return true;
  }
  return false;
}

export function normalizeRange(
  start: Date | null,
  end: Date | null,
): [Date | null, Date | null] {
  if (start && end && end.getTime() < start.getTime()) {
    return [end, start];
  }
  return [start, end];
}

export function getRangeSpanDays(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  return Math.round(Math.abs(e - s) / 86400000) + 1;
}

/**
 * Computes visual hover preview bounds during 2-click range selection,
 * matching Ant Design RangePicker's smooth dashed/tinted preview ribbon.
 */
export function getHoverRangeBounds(
  start: Date | null,
  end: Date | null,
  hoverDate: Date | null,
  activeInput: 0 | 1,
): [Date | null, Date | null] {
  if (!hoverDate) return normalizeRange(start, end);
  if (activeInput === 1 && start && !end) {
    return normalizeRange(start, hoverDate);
  }
  if (activeInput === 0 && !start && end) {
    return normalizeRange(hoverDate, end);
  }
  return normalizeRange(start, end);
}

export function isDateStrictlyInRange(
  candidate: Date,
  start: Date | null,
  end: Date | null,
  picker: PickerMode = 'date',
): boolean {
  if (!start || !end) return false;
  const [lo, hi] = normalizeRange(start, end);
  if (!lo || !hi) return false;
  return compareByUnit(candidate, lo, picker) > 0 && compareByUnit(candidate, hi, picker) < 0;
}

export function getDefaultFormat(
  picker: PickerMode,
  showTime?: ShowTimeConfig,
): string {
  if (picker === 'year') return 'YYYY';
  if (picker === 'quarter') return 'YYYY-Q[Q]';
  if (picker === 'month') return 'YYYY-MM';
  if (picker === 'week') return 'YYYY-WW周';
  if (showTime) {
    if (typeof showTime === 'object' && showTime.format) {
      return `YYYY-MM-DD ${showTime.format}`;
    }
    const showSec =
      typeof showTime === 'object' ? showTime.showSecond !== false : true;
    return showSec ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm';
  }
  return 'YYYY-MM-DD';
}

/**
 * Formats a Date into Ant Design-style display strings supporting YYYY, MM, DD, HH, mm, ss, WW, Q.
 */
export function formatDateValue(
  date: Date | null | undefined,
  picker: PickerMode = 'date',
  format?: string,
  showTime?: ShowTimeConfig,
): string {
  if (!date || Number.isNaN(date.getTime())) return '';

  const pattern = format ?? getDefaultFormat(picker, showTime);
  if (picker === 'quarter' && !format) {
    return `${date.getFullYear()}-Q${getQuarter(date)}`;
  }
  if (picker === 'week' && !format) {
    const { week, weekYear } = getISOWeekInfo(date);
    return `${weekYear}-${pad2(week)}周`;
  }

  const { week, weekYear } = getISOWeekInfo(date);
  const yearToken = pattern.includes('WW') ? weekYear : date.getFullYear();

  return pattern
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/YYYY/g, String(yearToken))
    .replace(/MM/g, pad2(date.getMonth() + 1))
    .replace(/DD/g, pad2(date.getDate()))
    .replace(/HH/g, pad2(date.getHours()))
    .replace(/mm/g, pad2(date.getMinutes()))
    .replace(/ss/g, pad2(date.getSeconds()))
    .replace(/WW/g, pad2(week))
    .replace(/Q/g, String(getQuarter(date)));
}

/**
 * Strict user-input parser supporting YYYY-MM-DD, YYYY/MM/DD, YYYY-MM-DD HH:mm(:ss),
 * YYYY-MM, YYYY-Q[1-4], and YYYY. Rejects impossible calendar dates like 2026-02-30.
 */
export function parseDateInput(
  raw: string,
  picker: PickerMode = 'date',
  showTime?: ShowTimeConfig,
): Date | null {
  const text = raw.trim();
  if (!text) return null;

  if (picker === 'year') {
    const m = /^(\d{4})$/.exec(text);
    if (!m) return null;
    const year = Number(m[1]);
    return new Date(year, 0, 1);
  }

  if (picker === 'quarter') {
    const m = /^(\d{4})[-/\s]?Q([1-4])$/i.exec(text);
    if (!m) return null;
    const year = Number(m[1]);
    const q = Number(m[2]);
    return new Date(year, (q - 1) * 3, 1);
  }

  if (picker === 'month') {
    const m = /^(\d{4})[-/](\d{1,2})$/.exec(text);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]);
    if (month < 1 || month > 12) return null;
    return new Date(year, month - 1, 1);
  }

  if (picker === 'week') {
    const m = /^(\d{4})[-/\s]?W?(\d{1,2})周?$/i.exec(text);
    if (!m) return null;
    const year = Number(m[1]);
    const week = Number(m[2]);
    if (week < 1 || week > 53) return null;
    // ISO week 1 always contains Jan 4
    const jan4 = new Date(year, 0, 4);
    const week1Start = startOfISOWeek(jan4);
    const target = addDays(week1Start, (week - 1) * 7);
    const verify = getISOWeekInfo(target);
    if (verify.week !== week || verify.weekYear !== year) return null;
    return target;
  }

  // Date or DateTime
  const m =
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[\sT](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/.exec(
      text,
    );
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = m[4] !== undefined ? Number(m[4]) : 0;
  const minute = m[5] !== undefined ? Number(m[5]) : 0;
  const second = m[6] !== undefined ? Number(m[6]) : 0;

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > getDaysInMonth(year, month - 1)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    return null;
  }

  return showTime
    ? new Date(year, month - 1, day, hour, minute, second)
    : new Date(year, month - 1, day, 0, 0, 0);
}

/**
 * Keyboard navigation step calculation for the calendar date grid.
 */
export function moveFocusedDate(
  current: Date,
  key: string,
): Date | null {
  switch (key) {
    case 'ArrowLeft':
      return addDays(current, -1);
    case 'ArrowRight':
      return addDays(current, 1);
    case 'ArrowUp':
      return addDays(current, -7);
    case 'ArrowDown':
      return addDays(current, 7);
    case 'PageUp':
      return addMonths(current, -1);
    case 'PageDown':
      return addMonths(current, 1);
    case 'Home':
      return startOfISOWeek(current);
    case 'End':
      return endOfISOWeek(current);
    default:
      return null;
  }
}

export function withTimeFrom(targetDate: Date, timeSource: Date | null | undefined): Date {
  const next = cloneDate(targetDate);
  if (timeSource) {
    next.setHours(
      timeSource.getHours(),
      timeSource.getMinutes(),
      timeSource.getSeconds(),
      0,
    );
  }
  return next;
}

export function toggleMultiDateSelection(
  current: readonly Date[],
  target: Date,
  picker: PickerMode = 'date',
): Date[] {
  const exists = current.some((d) => isSameUnit(d, target, picker));
  if (exists) {
    return current.filter((d) => !isSameUnit(d, target, picker));
  }
  return [...current, target].sort((a, b) => a.getTime() - b.getTime());
}
