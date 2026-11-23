import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFlexColumnWidths } from './flexLayout';
import {
  computeMissingChunkRanges,
  mergeLazyRowsIntoMap,
} from './lazyViewportEngine';
import {
  evaluateFilterModel,
  getOperatorsForColumn,
  isFilterItemActive,
} from './gridCore';
import type { GridColDef, GridFilterModel } from '../types';

test('computeFlexColumnWidths distributes remaining viewport width proportionally and honors minWidth/maxWidth', () => {
  const cols = [
    { id: 'id', width: 100 },
    { id: 'name', width: 150, flex: 1, minWidth: 120 },
    { id: 'notes', width: 150, flex: 2, minWidth: 160, maxWidth: 400 },
    { id: 'actions', width: 100 },
  ];

  // Viewport = 1100 -> remaining after fixed (100 + 100) = 900
  // Initial split: name=300, notes=600 -> notes clamps to maxWidth=400 -> remaining 500 goes to name!
  const wide = computeFlexColumnWidths(cols, 1100);
  assert.equal(wide.notes, 400);
  assert.equal(wide.name, 500);
  assert.equal(wide.id, undefined);
  assert.equal(wide.actions, undefined);

  // Narrow viewport = 460 -> remaining = 260
  // Initial split: name=86.6 (<120, clamp to 120), notes=173.3 -> remaining for notes = 140 (<160, clamp to 160)
  const narrow = computeFlexColumnWidths(cols, 460);
  assert.equal(narrow.name, 120);
  assert.equal(narrow.notes, 160);
});

test('computeFlexColumnWidths excludes manually user-resized flex columns from redistribution', () => {
  const cols = [
    { id: 'a', width: 220, flex: 1, minWidth: 100, isUserResized: true },
    { id: 'b', width: 150, flex: 1, minWidth: 100 },
  ];
  const widths = computeFlexColumnWidths(cols, 600);
  assert.equal(widths.a, undefined);
  assert.equal(widths.b, 380);
});

test('colDef.filterOperators supports custom unary and range operators in evaluateFilterModel', () => {
  interface Deal extends Record<string, unknown> {
    id: number;
    amount: number;
  }

  const columns: GridColDef<Deal>[] = [
    {
      field: 'amount',
      type: 'number',
      filterOperators: [
        {
          value: 'highValue',
          label: '高额大单 (≥¥30万)',
          requiresValue: false,
          getApplyFilterFn: () => (val) => Number(val) >= 300000,
        },
        {
          value: 'between',
          label: '金额区间',
          requiresValue: true,
          getApplyFilterFn: (item) => {
            const parts = String(item.value ?? '')
              .split(/[-,~]/)
              .map((s) => Number(s.trim()));
            if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) {
              return null;
            }
            const [min, max] = parts;
            return (val) => Number(val) >= min && Number(val) <= max;
          },
        },
      ],
    },
  ];

  const ops = getOperatorsForColumn(columns[0]);
  assert.equal(ops.length, 2);
  assert.equal(ops[0].requiresValue, false);
  assert.equal(
    isFilterItemActive({ id: '1', field: 'amount', operator: 'highValue', value: '' }, columns[0]),
    true,
  );

  const rows: Deal[] = [
    { id: 1, amount: 120000 },
    { id: 2, amount: 250000 },
    { id: 3, amount: 380000 },
  ];

  const unaryModel: GridFilterModel = {
    items: [{ id: 'f1', field: 'amount', operator: 'highValue', value: '' }],
  };
  assert.deepEqual(
    rows.filter((r) => evaluateFilterModel(r, unaryModel, columns)).map((r) => r.id),
    [3],
  );

  const rangeModel: GridFilterModel = {
    items: [{ id: 'f2', field: 'amount', operator: 'between', value: '150000-300000' }],
  };
  assert.deepEqual(
    rows.filter((r) => evaluateFilterModel(r, rangeModel, columns)).map((r) => r.id),
    [2],
  );
});

test('computeMissingChunkRanges coalesces contiguous uncached chunks and skips loaded/in-flight chunks', () => {
  const loaded = new Set<number>();
  for (let i = 0; i < 25; i += 1) loaded.add(i); // chunk 0 loaded
  const inFlight = new Set<number>([2]); // chunk 2 already fetching

  // Viewport jumps to rows 20..95 -> chunks 0..3 -> missing chunks are 1 and 3 (separated by in-flight 2)
  const { ranges, chunkIds } = computeMissingChunkRanges({
    startIndex: 20,
    endIndex: 95,
    totalRowCount: 500,
    chunkSize: 25,
    loadedIndices: loaded,
    inFlightChunkIds: inFlight,
  });

  assert.deepEqual(chunkIds, [1, 3]);
  assert.deepEqual(ranges, [
    { start: 25, end: 49 },
    { start: 75, end: 99 },
  ]);

  // Merging fetched slice updates sparse map immutably
  const prev = new Map<number, { id: number }>();
  const next = mergeLazyRowsIntoMap(prev, 25, [{ id: 25 }, { id: 26 }]);
  assert.equal(prev.size, 0);
  assert.equal(next.get(25)?.id, 25);
  assert.equal(next.get(26)?.id, 26);
});
