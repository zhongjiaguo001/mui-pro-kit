import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addMonths,
  buildDecadeGrid,
  buildMonthGrid,
  compareByUnit,
  formatDateValue,
  getHoverRangeBounds,
  getISOWeekInfo,
  getQuarter,
  getRangeSpanDays,
  isDateDisabled,
  isDateStrictlyInRange,
  isSameUnit,
  moveFocusedDate,
  normalizeRange,
  parseDateInput,
  toggleMultiDateSelection,
} from './dateCore';

test('buildMonthGrid produces exact 42 cells aligned to Monday start and handles leap years', () => {
  // Feb 2024 is a leap year (29 days), Feb 1 2024 is Thursday -> 3 leading Jan cells
  const feb2024 = buildMonthGrid(2024, 1, new Date(2024, 1, 29), 1);
  assert.equal(feb2024.length, 42);
  assert.equal(feb2024[0].dateKey, '2024-01-29');
  assert.equal(feb2024[0].isCurrentMonth, false);
  assert.equal(feb2024[3].dateKey, '2024-02-01');
  assert.equal(feb2024[3].isCurrentMonth, true);
  assert.equal(feb2024[31].dateKey, '2024-02-29');
  assert.equal(feb2024[31].isToday, true);

  // Feb 2026 is a non-leap year (28 days), Feb 1 2026 is Sunday -> 6 leading Jan cells
  const feb2026 = buildMonthGrid(2026, 1, new Date(2026, 1, 15), 1);
  assert.equal(feb2026.length, 42);
  assert.equal(feb2026[0].dateKey, '2026-01-26');
  assert.equal(feb2026[6].dateKey, '2026-02-01');
  assert.equal(feb2026[33].dateKey, '2026-02-28');
  assert.equal(feb2026[34].dateKey, '2026-03-01');
});

test('ISO week, quarter, and decade grid calculations match Ant Design semantics', () => {
  // 2026-01-01 is Thursday -> ISO week 1 of 2026
  assert.deepEqual(getISOWeekInfo(new Date(2026, 0, 1)), { week: 1, weekYear: 2026 });
  // 2026-11-21 is Saturday -> ISO week 47 of 2026
  assert.deepEqual(getISOWeekInfo(new Date(2026, 10, 21)), { week: 47, weekYear: 2026 });
  // Cross-year ISO week boundary: 2026-12-31 is Thursday -> ISO week 53 of 2026; 2027-01-01 is Friday -> ISO week 53 of 2026
  assert.deepEqual(getISOWeekInfo(new Date(2026, 11, 31)), { week: 53, weekYear: 2026 });
  assert.deepEqual(getISOWeekInfo(new Date(2027, 0, 1)), { week: 53, weekYear: 2026 });
  assert.deepEqual(getISOWeekInfo(new Date(2027, 0, 4)), { week: 1, weekYear: 2027 });

  assert.equal(getQuarter(new Date(2026, 0, 15)), 1);
  assert.equal(getQuarter(new Date(2026, 3, 1)), 2);
  assert.equal(getQuarter(new Date(2026, 8, 30)), 3);
  assert.equal(getQuarter(new Date(2026, 10, 21)), 4);

  const decade = buildDecadeGrid(2026);
  assert.equal(decade.decadeStart, 2020);
  assert.equal(decade.decadeEnd, 2029);
  assert.equal(decade.cells.length, 12);
  assert.equal(decade.cells[0].year, 2019);
  assert.equal(decade.cells[0].isCurrentDecade, false);
  assert.equal(decade.cells[1].year, 2020);
  assert.equal(decade.cells[1].isCurrentDecade, true);
  assert.equal(decade.cells[11].year, 2030);
  assert.equal(decade.cells[11].isCurrentDecade, false);
});

test('formatDateValue and parseDateInput handle all 5 picker modes, leap days, and reject invalid dates', () => {
  const sample = new Date(2026, 10, 21, 14, 5, 9);

  assert.equal(formatDateValue(sample, 'date'), '2026-11-21');
  assert.equal(formatDateValue(sample, 'date', undefined, true), '2026-11-21 14:05:09');
  assert.equal(formatDateValue(sample, 'date', 'YYYY/MM/DD HH:mm', true), '2026/11/21 14:05');
  assert.equal(formatDateValue(sample, 'month'), '2026-11');
  assert.equal(formatDateValue(sample, 'quarter'), '2026-Q4');
  assert.equal(formatDateValue(sample, 'year'), '2026');
  assert.equal(formatDateValue(sample, 'week'), '2026-47周');

  const parsedDate = parseDateInput('2026-11-21', 'date');
  assert.ok(parsedDate);
  assert.equal(formatDateValue(parsedDate, 'date'), '2026-11-21');

  const parsedLeap = parseDateInput('2024-02-29', 'date');
  assert.ok(parsedLeap);
  assert.equal(formatDateValue(parsedLeap, 'date'), '2024-02-29');

  const parsedDateTime = parseDateInput('2026-11-21 09:30:45', 'date', true);
  assert.ok(parsedDateTime);
  assert.equal(formatDateValue(parsedDateTime, 'date', undefined, true), '2026-11-21 09:30:45');

  const parsedMonth = parseDateInput('2026-08', 'month');
  assert.ok(parsedMonth);
  assert.equal(formatDateValue(parsedMonth, 'month'), '2026-08');

  const parsedQuarter = parseDateInput('2026-Q3', 'quarter');
  assert.ok(parsedQuarter);
  assert.equal(formatDateValue(parsedQuarter, 'quarter'), '2026-Q3');

  const parsedYear = parseDateInput('2028', 'year');
  assert.ok(parsedYear);
  assert.equal(formatDateValue(parsedYear, 'year'), '2028');

  const parsedWeek = parseDateInput('2026-47周', 'week');
  assert.ok(parsedWeek);
  assert.equal(formatDateValue(parsedWeek, 'week'), '2026-47周');

  // Strict invalid calendar rejections
  assert.equal(parseDateInput('2026-02-29', 'date'), null);
  assert.equal(parseDateInput('2026-02-30', 'date'), null);
  assert.equal(parseDateInput('2026-13-01', 'date'), null);
  assert.equal(parseDateInput('2026-11-21 25:00:00', 'date', true), null);
  assert.equal(parseDateInput('2026-Q5', 'quarter'), null);
  assert.equal(parseDateInput('not-a-date', 'date'), null);
});

test('range normalization, hover preview ribbon, span days, and multi-unit constraints', () => {
  const d1 = new Date(2026, 10, 10);
  const d2 = new Date(2026, 10, 18);

  // Reversed inputs auto-normalize
  const [normS, normE] = normalizeRange(d2, d1);
  assert.equal(formatDateValue(normS, 'date'), '2026-11-10');
  assert.equal(formatDateValue(normE, 'date'), '2026-11-18');
  assert.equal(getRangeSpanDays(d1, d2), 9);
  assert.equal(getRangeSpanDays(d1, d1), 1);
  assert.equal(getRangeSpanDays(d1, null), null);

  // Hover preview when choosing end date earlier than start date
  const [hs, he] = getHoverRangeBounds(d2, null, d1, 1);
  assert.equal(formatDateValue(hs, 'date'), '2026-11-10');
  assert.equal(formatDateValue(he, 'date'), '2026-11-18');
  assert.equal(isDateStrictlyInRange(new Date(2026, 10, 14), hs, he, 'date'), true);
  assert.equal(isDateStrictlyInRange(d1, hs, he, 'date'), false);

  // minDate / maxDate / disabledDate enforcement across date/month/quarter/year
  const opts = {
    minDate: new Date(2026, 10, 5),
    maxDate: new Date(2026, 10, 25),
    disabledDate: (d: Date) => d.getDay() === 0,
    picker: 'date' as const,
  };
  assert.equal(isDateDisabled(new Date(2026, 10, 4), opts), true);
  assert.equal(isDateDisabled(new Date(2026, 10, 26), opts), true);
  assert.equal(isDateDisabled(new Date(2026, 10, 8), opts), true); // Sunday
  assert.equal(isDateDisabled(new Date(2026, 10, 10), opts), false);

  assert.equal(
    isDateDisabled(new Date(2025, 11, 1), {
      minDate: new Date(2026, 0, 1),
      picker: 'quarter',
    }),
    true,
  );
  assert.equal(
    isDateDisabled(new Date(2026, 0, 1), {
      minDate: new Date(2026, 0, 1),
      picker: 'quarter',
    }),
    false,
  );
});

test('keyboard date movement across boundaries, month clamping, and multi-select date toggling', () => {
  // Month clamping: Jan 31 + 1 month -> Feb 28 (2026); Jan 31 + 1 month -> Feb 29 (2024)
  assert.equal(formatDateValue(addMonths(new Date(2026, 0, 31), 1), 'date'), '2026-02-28');
  assert.equal(formatDateValue(addMonths(new Date(2024, 0, 31), 1), 'date'), '2024-02-29');

  const base = new Date(2026, 10, 18); // Wed
  assert.equal(formatDateValue(moveFocusedDate(base, 'ArrowRight'), 'date'), '2026-11-19');
  assert.equal(formatDateValue(moveFocusedDate(base, 'ArrowLeft'), 'date'), '2026-11-17');
  assert.equal(formatDateValue(moveFocusedDate(base, 'ArrowDown'), 'date'), '2026-11-25');
  assert.equal(formatDateValue(moveFocusedDate(base, 'ArrowUp'), 'date'), '2026-11-11');
  assert.equal(formatDateValue(moveFocusedDate(base, 'Home'), 'date'), '2026-11-16'); // Mon
  assert.equal(formatDateValue(moveFocusedDate(base, 'End'), 'date'), '2026-11-22'); // Sun
  assert.equal(formatDateValue(moveFocusedDate(base, 'PageDown'), 'date'), '2026-12-18');
  assert.equal(formatDateValue(moveFocusedDate(new Date(2026, 11, 31), 'ArrowRight'), 'date'), '2027-01-01');
  assert.equal(formatDateValue(moveFocusedDate(new Date(2026, 0, 1), 'ArrowLeft'), 'date'), '2025-12-31');
  assert.equal(moveFocusedDate(base, 'KeyA'), null);

  // Unit comparison & multi-select toggle
  assert.equal(compareByUnit(new Date(2026, 10, 1), new Date(2026, 10, 30), 'month'), 0);
  assert.equal(isSameUnit(new Date(2026, 10, 16), new Date(2026, 10, 22), 'week'), true);

  let selected: Date[] = [];
  selected = toggleMultiDateSelection(selected, new Date(2026, 10, 20), 'date');
  selected = toggleMultiDateSelection(selected, new Date(2026, 10, 12), 'date');
  assert.deepEqual(
    selected.map((d) => formatDateValue(d, 'date')),
    ['2026-11-12', '2026-11-20'],
  );
  selected = toggleMultiDateSelection(selected, new Date(2026, 10, 12), 'date');
  assert.deepEqual(
    selected.map((d) => formatDateValue(d, 'date')),
    ['2026-11-20'],
  );
});

test('dateCore pure-engine throughput handles 10,000+ calendar ops within budget', () => {
  const today = new Date(2026, 10, 22);
  const t0 = performance.now();
  let totalCells = 0;
  for (let i = 0; i < 2000; i += 1) {
    const grid = buildMonthGrid(2020 + (i % 15), i % 12, today, 1);
    totalCells += grid.length;
  }
  const gridMs = performance.now() - t0;
  assert.equal(totalCells, 84000);
  assert.ok(gridMs < 1500, `buildMonthGrid(2000) took ${gridMs.toFixed(1)}ms`);

  const t1 = performance.now();
  let validCount = 0;
  for (let i = 0; i < 10000; i += 1) {
    const formatted = formatDateValue(new Date(2026, i % 12, (i % 28) + 1), 'date');
    const parsed = parseDateInput(formatted, 'date');
    if (parsed) validCount += 1;
  }
  const roundtripMs = performance.now() - t1;
  assert.equal(validCount, 10000);
  assert.ok(roundtripMs < 1500, `format+parse(10000) took ${roundtripMs.toFixed(1)}ms`);
});
