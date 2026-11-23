# DatePicker, RangePicker & CalendarPanel Documentation (AI-Ready Reference)

> **Architecture**: Ant Design v5 API-aligned date/time selection suite built natively on Material UI (`useTheme`, CSS custom properties derived from MUI Theme for O(1) Light/Dark & primary accent switching) and native JavaScript `Date` objects (zero Day.js / Moment dependency).

---

## 1. Module Entry

```ts
import {
  DatePicker,
  RangePicker,
  CalendarPanel,
  type AntMuiDatePickerProps,
  type AntMuiRangePickerProps,
  type AntMuiCalendarProps,
  type DateRangeValue,
  type DatePreset,
  type PickerMode,
  type ShowTimeConfig,
} from 'mui-pro-kit/date-picker';
// Also re-exported from 'mui-pro-kit'
// RangePicker is also attached as `DatePicker.RangePicker`
```

### Theming & Styles
- Automatically inherits Light/Dark mode, `palette.primary`, `palette.divider`, `palette.text`, and `shape.borderRadius` from the host app's MUI `<ThemeProvider>`.
- Does **not** strictly require `mui-pro-kit/styles.css`, though importing it enables `.font-mono-tabular` for aligned monospace tabular numerals in calendar and time columns.

---

## 2. Critical Rules for AI Code Generation

1. **Native `Date` Values Only**: Pass standard JavaScript `Date` instances (never Day.js/Moment objects or raw ISO strings) to `value`, `defaultValue`, `minDate`, `maxDate`, and `presets`.
2. **Multiple vs Single Value Shape**:
   - When `multiple={false}` (default): `value` is `Date | null`, `onChange(value: Date | null, dateString: string)`.
   - When `multiple={true}`: `value` is `Date[]`, `onChange(value: Date[], dateStrings: string[])`.
3. **Range Value Shape**: `RangePicker` uses `DateRangeValue = [Date | null, Date | null]` (or `null` when cleared). `onChange(dates, [startStr, endStr])`.
4. **Confirmation Behavior (`needConfirm`)**: When `showTime` is enabled on `picker="date"` (non-multiple), `needConfirm` defaults to `true`—users edit a draft value and commit via the "确定" button (which fires `onChange` and `onOk`). Override with `needConfirm={false}` if immediate commits are desired.
5. **Presets Lazy Evaluation**: `presets` accepts either a value (`Date` / `DateRangeValue`) or a factory function `() => Date` / `() => DateRangeValue` so relative presets like "最近 7 天" stay fresh.

---

## 3. Quick Start Examples

### Single Date & DateTime Picker
```tsx
import { useState } from 'react';
import { DatePicker } from 'mui-pro-kit/date-picker';

export function OrderDateField() {
  const [date, setDate] = useState<Date | null>(new Date());

  return (
    <DatePicker
      value={date}
      showTime={{ showSecond: false, minuteStep: 5 }}
      presets={[
        { label: '今天', value: () => new Date() },
        { label: '明天', value: () => new Date(Date.now() + 86_400_000) },
      ]}
      onChange={(next, dateStr) => {
        setDate(Array.isArray(next) ? next[0] ?? null : next);
        console.log('Selected:', dateStr);
      }}
    />
  );
}
```

### RangePicker (`DatePicker.RangePicker`)
```tsx
import { useState } from 'react';
import { DatePicker, type DateRangeValue } from 'mui-pro-kit/date-picker';

export function ReportRangeField() {
  const [range, setRange] = useState<DateRangeValue | null>(null);

  return (
    <DatePicker.RangePicker
      value={range}
      placeholder={['开始日期', '结束日期']}
      presets={[
        {
          label: '近 7 天',
          value: () => [new Date(Date.now() - 6 * 86_400_000), new Date()],
        },
      ]}
      onChange={(next) => setRange(next)}
    />
  );
}
```

### Fullscreen / Compact CalendarPanel
```tsx
import { CalendarPanel } from 'mui-pro-kit/date-picker';

<CalendarPanel
  fullscreen
  onSelect={(date, info) => console.log(date, info.source)}
/>
```

---

## 4. Props Reference

### 4.1 `DatePicker` (`AntMuiDatePickerProps`)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `Date \| Date[] \| null` | `undefined` | Controlled value (`Date[]` when `multiple={true}`). |
| `defaultValue` | `Date \| Date[] \| null` | `null` | Uncontrolled initial value. |
| `picker` | `'date' \| 'week' \| 'month' \| 'quarter' \| 'year'` | `'date'` | Selection granularity. |
| `multiple` | `boolean` | `false` | Ant Design v5.14+ multi-date chip selection mode. |
| `showTime` | `boolean \| ShowTimeOptions` | `false` | Shows HH:mm(:ss) time picker columns (`format`, `showSecond`, `hourStep`, `minuteStep`, `secondStep`, `defaultValue`, `disabledTime`). |
| `showToday` | `boolean` | `true` | Shows "今天" footer button in `date` mode. |
| `showNow` | `boolean` | `true` | Shows "此刻" footer button when `showTime` is enabled. |
| `needConfirm` | `boolean` | `Boolean(showTime && picker === 'date' && !multiple)` | Requires clicking "确定" before committing. |
| `format` | `string` | Auto per `picker`/`showTime` | Display/input format string (e.g. `'YYYY-MM-DD'`, `'YYYY/MM/DD HH:mm'`). |
| `placeholder` | `string` | Localized per `picker` | Input placeholder. |
| `presets` | `DatePreset<Date>[]` | `undefined` | Quick preset sidebar items (`{ label, value }`). |
| `disabled` | `boolean` | `false` | Disables the input and popup. |
| `disabledDate` | `(current: Date) => boolean` | `undefined` | Disables matching calendar cells. |
| `disabledTime` | `(current: Date \| null) => DisabledTimeConfig` | `undefined` | Returns `{ disabledHours?, disabledMinutes?, disabledSeconds? }`. |
| `minDate` / `maxDate` | `Date` | `undefined` | Inclusive date bounds. |
| `allowClear` | `boolean` | `true` | Shows clear button on hover when populated. |
| `size` | `'small' \| 'middle' \| 'large'` | `'middle'` | Input height density. |
| `variant` | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` | Ant Design v5 visual input variant. |
| `status` | `'' \| 'error' \| 'warning'` | `''` | Validation border/status highlight. |
| `cellRender` | `(current: Date, info: DateCellRenderInfo) => ReactNode` | `undefined` | Custom cell renderer (`originNode`, `today`, `type`, `isSelected`, `isInRange`, `isDisabled`). |
| `renderExtraFooter` | `(mode: PickerMode) => ReactNode` | `undefined` | Custom footer content inside the popup. |
| `open` / `onOpenChange` | `boolean` / `(open: boolean) => void` | uncontrolled | Popup open state control. |
| `onChange` | `(value: Date \| Date[] \| null, dateString: string \| string[]) => void` | `undefined` | Fired when committed value changes. |
| `onOk` | `(value: Date \| Date[] \| null) => void` | `undefined` | Fired when user clicks "确定". |
| `onPanelChange` | `(value: Date, mode: PickerMode) => void` | `undefined` | Fired when switching panel view/granularity. |

### 4.2 `RangePicker` (`AntMuiRangePickerProps`)

Shares `picker`, `showTime`, `needConfirm`, `format`, `minDate`, `maxDate`, `allowClear`, `size`, `variant`, `status`, `cellRender`, `renderExtraFooter`, `open`, `onOpenChange`, `disabledDate`, plus range-specific props:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `defaultValue` | `DateRangeValue \| null` | `null` | `[startDate \| null, endDate \| null]`. |
| `placeholder` | `[string, string]` | Localized per `picker` | Start and end input placeholders. |
| `presets` | `DatePreset<DateRangeValue>[]` | `undefined` | Range presets with hover preview ribbon. |
| `disabled` | `boolean \| [boolean, boolean]` | `false` | Disable whole picker or individual start/end input. |
| `disabledTime` | `(current: Date \| null, type: 'start' \| 'end') => DisabledTimeConfig` | `undefined` | Separate time restrictions for start and end. |
| `allowEmpty` | `[boolean, boolean]` | `[false, false]` | Allow open-ended start or end boundary. |
| `separator` | `ReactNode` | Arrow icon | Custom separator between start and end inputs. |
| `onChange` | `(dates: DateRangeValue \| null, dateStrings: [string, string]) => void` | `undefined` | Fired on committed range change. |
| `onCalendarChange` | `(dates: DateRangeValue, dateStrings: [string, string], info: { range: 'start' \| 'end' }) => void` | `undefined` | Fired during intermediate selection of start/end dates. |
| `onOk` | `(dates: DateRangeValue \| null) => void` | `undefined` | Fired on confirmation. |

### 4.3 `CalendarPanel` (`AntMuiCalendarProps`)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `defaultValue` | `Date` | `today` | Active date. |
| `mode` | `'month' \| 'year'` | `'month'` | Controlled month-grid vs 12-month year-grid mode. |
| `fullscreen` | `boolean` | `true` | Full-page calendar card vs compact sidebar widget. |
| `disabledDate` | `(date: Date) => boolean` | `undefined` | Disables specific dates. |
| `cellRender` | `(date: Date, info: { type: 'date' \| 'month'; isSelected: boolean; isToday: boolean }) => ReactNode` | `undefined` | Renders custom content (badges, events) inside calendar cells. |
| `onSelect` | `(date: Date, info: { source: 'date' \| 'month' \| 'year' \| 'customize' }) => void` | `undefined` | Fired when a date/month/year is selected. |
| `onChange` / `onPanelChange` | `(date: Date) => void` / `(date: Date, mode: 'month' \| 'year') => void` | `undefined` | Date and view-mode callbacks. |

---

## 5. Exported Pure Headless Utilities (`dateCore`)

All date math helpers are exported directly from `mui-pro-kit/date-picker`:
`addDays`, `addMonths`, `addYears`, `startOfDay`, `toDateKey`, `isSameDay`, `isSameUnit`, `compareByUnit`, `getQuarter`, `getISOWeekInfo`, `buildMonthGrid`, `buildDecadeGrid`, `formatDateValue`, `parseDateInput`, `getDefaultFormat`, `isDateDisabled`, `isDateStrictlyInRange`, `normalizeRange`, `getHoverRangeBounds`, `getRangeSpanDays`, `moveFocusedDate`, `toggleMultiDateSelection`.
