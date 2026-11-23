import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAutoPageSize,
  computeVirtualColumnWindow,
  getNextSortDirection,
  type VirtualColumnEntry,
} from './columnVirtualizer';

function makeWideColumns(count: number): VirtualColumnEntry[] {
  const cols: VirtualColumnEntry[] = [
    { id: '__checkbox__', width: 50, pinnedSide: 'left' },
    { id: 'orderNo', width: 150, pinnedSide: 'left' },
  ];
  for (let i = 0; i < count; i += 1) {
    cols.push({ id: `metric_${i}`, width: 120, pinnedSide: false });
  }
  cols.push({ id: 'actions', width: 110, pinnedSide: 'right' });
  return cols;
}

test('computeVirtualColumnWindow preserves pinned left/right and slices center columns with exact pixel conservation', () => {
  const cols = makeWideColumns(34);
  const totalWidth = cols.reduce((acc, c) => acc + c.width, 0);

  // At scrollLeft = 0 in a 1200px viewport
  const startWin = computeVirtualColumnWindow({
    columns: cols,
    scrollLeft: 0,
    viewportWidth: 1200,
    columnBufferPx: 150,
    enabled: true,
  });

  assert.equal(startWin.isVirtualized, true);
  assert.deepEqual(startWin.leftIndices, [0, 1]);
  assert.deepEqual(startWin.rightIndices, [cols.length - 1]);
  assert.equal(startWin.leftSpacerWidth, 0);
  assert.ok(startWin.centerIndices.length < 15);
  assert.ok(startWin.rightSpacerWidth > 2000);

  const renderedWidthStart =
    [...startWin.leftIndices, ...startWin.centerIndices, ...startWin.rightIndices].reduce(
      (acc, idx) => acc + cols[idx].width,
      0,
    ) +
    startWin.leftSpacerWidth +
    startWin.rightSpacerWidth;
  assert.equal(renderedWidthStart, totalWidth);

  // Mid horizontal scroll
  const midWin = computeVirtualColumnWindow({
    columns: cols,
    scrollLeft: 1800,
    viewportWidth: 1200,
    columnBufferPx: 150,
    enabled: true,
  });

  assert.equal(midWin.isVirtualized, true);
  assert.deepEqual(midWin.leftIndices, [0, 1]);
  assert.deepEqual(midWin.rightIndices, [cols.length - 1]);
  assert.ok(midWin.leftSpacerWidth > 1000);
  assert.ok(midWin.rightSpacerWidth > 500);

  const renderedWidthMid =
    [...midWin.leftIndices, ...midWin.centerIndices, ...midWin.rightIndices].reduce(
      (acc, idx) => acc + cols[idx].width,
      0,
    ) +
    midWin.leftSpacerWidth +
    midWin.rightSpacerWidth;
  assert.equal(renderedWidthMid, totalWidth);
});

test('computeVirtualColumnWindow bypasses slicing when disabled', () => {
  const cols = makeWideColumns(30);
  const win = computeVirtualColumnWindow({
    columns: cols,
    scrollLeft: 600,
    viewportWidth: 1000,
    columnBufferPx: 150,
    enabled: false,
  });

  assert.equal(win.isVirtualized, false);
  assert.equal(win.leftSpacerWidth, 0);
  assert.equal(win.rightSpacerWidth, 0);
  assert.equal(win.renderedCount, cols.length);
});

test('getNextSortDirection honors default and custom sortingOrder cycles', () => {
  // Default: asc -> desc -> null -> asc
  assert.equal(getNextSortDirection(false), 'asc');
  assert.equal(getNextSortDirection('asc'), 'desc');
  assert.equal(getNextSortDirection('desc'), null);

  // Custom: desc -> asc -> null
  const descFirst: Array<'asc' | 'desc' | null> = ['desc', 'asc', null];
  assert.equal(getNextSortDirection(null, descFirst), 'desc');
  assert.equal(getNextSortDirection('desc', descFirst), 'asc');
  assert.equal(getNextSortDirection('asc', descFirst), null);

  // Two-state cycle without unsorted state: asc -> desc -> asc
  const twoState: Array<'asc' | 'desc' | null> = ['asc', 'desc'];
  assert.equal(getNextSortDirection(null, twoState), 'asc');
  assert.equal(getNextSortDirection('asc', twoState), 'desc');
  assert.equal(getNextSortDirection('desc', twoState), 'asc');
});

test('computeAutoPageSize calculates floor(availableHeight / rowHeight) with floor of 1', () => {
  assert.equal(computeAutoPageSize(520, 52), 10);
  assert.equal(computeAutoPageSize(560, 52), 10);
  assert.equal(computeAutoPageSize(572, 52), 11);
  assert.equal(computeAutoPageSize(20, 52), 1);
  assert.equal(computeAutoPageSize(0, 52), 1);
});
