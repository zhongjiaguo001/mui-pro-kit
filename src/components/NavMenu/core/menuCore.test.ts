import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMenuTreeIndex,
  computeHorizontalOverflow,
  computeNextOpenKeys,
  computeNextSelectedKeys,
  filterMenuItems,
  getActiveAncestorKeys,
  getKeyPath,
  getNextFocusableKey,
} from './menuCore';
import type { NavMenuItem } from '../types';

const SAMPLE_ITEMS: NavMenuItem[] = [
  { key: 'overview', label: '工作台概览' },
  {
    key: 'orders',
    label: '订单中心',
    children: [
      {
        type: 'group',
        key: 'grp-core',
        label: '交易核心',
        children: [
          { key: 'orders-list', label: '全部订单' },
          { key: 'orders-refund', label: '售后退款', disabled: true },
        ],
      },
      { type: 'divider' },
      {
        key: 'orders-fulfillment',
        label: '履约调度',
        children: [
          { key: 'orders-ship', label: '发货单管理' },
          { key: 'orders-warehouse', label: '仓配波次' },
        ],
      },
    ],
  },
  {
    key: 'analytics',
    label: '数据洞察',
    children: [
      { key: 'analytics-rev', label: '营收报表' },
      { key: 'analytics-cohort', label: '留存分析' },
    ],
  },
  { key: 'danger-audit', label: '清空测试数据', danger: true },
];

test('buildMenuTreeIndex resolves multi-level keyPath across transparent groups and dividers', () => {
  const index = buildMenuTreeIndex(SAMPLE_ITEMS);

  assert.deepEqual(getKeyPath(index, 'overview'), ['overview']);
  assert.deepEqual(getKeyPath(index, 'orders-list'), ['orders-list', 'orders']);
  assert.deepEqual(getKeyPath(index, 'orders-ship'), [
    'orders-ship',
    'orders-fulfillment',
    'orders',
  ]);
  assert.equal(index.levelByKey.get('orders'), 1);
  assert.equal(index.levelByKey.get('orders-fulfillment'), 2);
  assert.equal(index.disabledKeys.has('orders-refund'), true);
  assert.deepEqual(index.leafKeys, [
    'overview',
    'orders-list',
    'orders-refund',
    'orders-ship',
    'orders-warehouse',
    'analytics-rev',
    'analytics-cohort',
    'danger-audit',
  ]);
});

test('getActiveAncestorKeys collects all ancestor SubMenu keys for selected leaf items', () => {
  const index = buildMenuTreeIndex(SAMPLE_ITEMS);
  const ancestors = getActiveAncestorKeys(index, ['orders-ship']);

  assert.equal(ancestors.has('orders-fulfillment'), true);
  assert.equal(ancestors.has('orders'), true);
  assert.equal(ancestors.has('orders-ship'), false);
  assert.equal(ancestors.has('analytics'), false);
});

test('computeNextSelectedKeys supports single-select, multi-select toggle, and non-selectable modes', () => {
  const single = computeNextSelectedKeys(['overview'], 'orders-list', {
    multiple: false,
    selectable: true,
  });
  assert.deepEqual(single, { nextSelectedKeys: ['orders-list'], action: 'select' });

  const multiAdd = computeNextSelectedKeys(['overview'], 'orders-list', {
    multiple: true,
    selectable: true,
  });
  assert.deepEqual(multiAdd, {
    nextSelectedKeys: ['overview', 'orders-list'],
    action: 'select',
  });

  const multiRemove = computeNextSelectedKeys(
    ['overview', 'orders-list'],
    'overview',
    { multiple: true, selectable: true },
  );
  assert.deepEqual(multiRemove, {
    nextSelectedKeys: ['orders-list'],
    action: 'deselect',
  });

  const disabledSelect = computeNextSelectedKeys(['overview'], 'orders-list', {
    selectable: false,
  });
  assert.deepEqual(disabledSelect, {
    nextSelectedKeys: ['overview'],
    action: 'noop',
  });
});

test('computeNextOpenKeys enforces AntD accordion behavior while preserving ancestor chain', () => {
  const index = buildMenuTreeIndex(SAMPLE_ITEMS);

  // Non-accordion allows multiple root submenus open
  const multi = computeNextOpenKeys(['orders'], 'analytics', {
    accordion: false,
    levelByKey: index.levelByKey,
  });
  assert.deepEqual(multi, ['orders', 'analytics']);

  // Accordion keeps ancestor 'orders' when opening nested 'orders-fulfillment'
  const nestedOpen = computeNextOpenKeys(['orders'], 'orders-fulfillment', {
    accordion: true,
    levelByKey: index.levelByKey,
  });
  assert.deepEqual(nestedOpen, ['orders', 'orders-fulfillment']);

  // Accordion closes 'orders' AND nested 'orders-fulfillment' when opening sibling root 'analytics'
  const switchRoot = computeNextOpenKeys(
    ['orders', 'orders-fulfillment'],
    'analytics',
    { accordion: true, levelByKey: index.levelByKey },
  );
  assert.deepEqual(switchRoot, ['analytics']);

  // Clicking an already-open submenu closes it cleanly
  const closeSelf = computeNextOpenKeys(['analytics'], 'analytics', {
    accordion: true,
    levelByKey: index.levelByKey,
  });
  assert.deepEqual(closeSelf, []);
});

test('computeHorizontalOverflow fits all items when container is wide and slices accurately when narrow', () => {
  const widths = [110, 120, 115, 130, 100]; // total = 575 + 16 = 591px

  const fullFit = computeHorizontalOverflow(widths, 620, 52, 4);
  assert.deepEqual(fullFit, { visibleCount: 5, hasOverflow: false });

  // Container = 420px -> budget = 420 - 52 - 4 = 364px
  // Item 0: 110; Item 1: 110+4+120=234; Item 2: 234+4+115=353 <= 364; Item 3: 353+4+130=487 > 364
  const partialFit = computeHorizontalOverflow(widths, 420, 52, 4);
  assert.deepEqual(partialFit, { visibleCount: 3, hasOverflow: true });

  // Very narrow container still yields 0 visible + overflow indicator
  const tinyFit = computeHorizontalOverflow(widths, 80, 52, 4);
  assert.deepEqual(tinyFit, { visibleCount: 0, hasOverflow: true });
});

test('getNextFocusableKey traverses circularly and skips disabled items', () => {
  const ordered = ['a', 'b', 'c', 'd'];
  const disabled = new Set(['b']);

  assert.equal(getNextFocusableKey(ordered, disabled, 'a', 'next'), 'c');
  assert.equal(getNextFocusableKey(ordered, disabled, 'd', 'next'), 'a');
  assert.equal(getNextFocusableKey(ordered, disabled, 'c', 'prev'), 'a');
  assert.equal(getNextFocusableKey(ordered, disabled, 'a', 'prev'), 'd');
  assert.equal(getNextFocusableKey(ordered, disabled, null, 'first'), 'a');
  assert.equal(getNextFocusableKey(ordered, disabled, null, 'last'), 'd');
});

test('filterMenuItems preserves matching descendant paths and returns auto-expand keys', () => {
  const { filteredItems, matchedOpenKeys } = filterMenuItems(
    SAMPLE_ITEMS,
    '波次',
  );

  assert.equal(filteredItems.length, 1);
  assert.equal((filteredItems[0] as { key: string }).key, 'orders');
  assert.deepEqual(matchedOpenKeys, ['orders-fulfillment', 'orders']);

  // Empty query returns full untouched list
  const empty = filterMenuItems(SAMPLE_ITEMS, '   ');
  assert.equal(empty.filteredItems.length, SAMPLE_ITEMS.length);
  assert.deepEqual(empty.matchedOpenKeys, []);
});

test('edge cases: empty tree, all-disabled keyboard nav, unknown currentKey, and 0px overflow', () => {
  const emptyIdx = buildMenuTreeIndex([]);
  assert.equal(emptyIdx.itemByKey.size, 0);
  assert.deepEqual(emptyIdx.leafKeys, []);
  assert.deepEqual(getKeyPath(emptyIdx, 'missing'), ['missing']);

  // All-disabled or empty keyboard focus returns null
  assert.equal(getNextFocusableKey([], new Set(), null, 'next'), null);
  assert.equal(
    getNextFocusableKey(['a', 'b'], new Set(['a', 'b']), 'a', 'next'),
    null,
  );
  assert.equal(
    getNextFocusableKey(['a', 'b'], new Set(['a', 'b']), null, 'first'),
    null,
  );
  assert.equal(
    getNextFocusableKey(['a', 'b'], new Set(['a', 'b']), null, 'last'),
    null,
  );

  // Unknown or disabled currentKey falls back to first (next) or last (prev)
  assert.equal(
    getNextFocusableKey(['a', 'b', 'c'], new Set(['a']), 'missing', 'next'),
    'b',
  );
  assert.equal(
    getNextFocusableKey(['a', 'b', 'c'], new Set(['c']), 'missing', 'prev'),
    'b',
  );

  // Exact fit and 0px container boundaries for horizontal overflow
  assert.deepEqual(computeHorizontalOverflow([], 500, 48, 4), {
    visibleCount: 0,
    hasOverflow: false,
  });
  assert.deepEqual(computeHorizontalOverflow([100, 100], 0, 48, 4), {
    visibleCount: 2,
    hasOverflow: false,
  });
  // Exact fit: 100 + 4 + 100 = 204
  assert.deepEqual(computeHorizontalOverflow([100, 100], 204, 48, 4), {
    visibleCount: 2,
    hasOverflow: false,
  });
  // 1px short -> triggers overflow
  assert.deepEqual(computeHorizontalOverflow([100, 100], 203, 48, 4), {
    visibleCount: 1,
    hasOverflow: true,
  });
});

test('edge cases: 4-level deep accordion and deselecting last multi-select item', () => {
  const deepItems: NavMenuItem[] = [
    {
      key: 'l1-a',
      label: 'L1 A',
      children: [
        {
          key: 'l2-a',
          label: 'L2 A',
          children: [
            {
              key: 'l3-a',
              label: 'L3 A',
              children: [{ key: 'l4-a', label: 'L4 A' }],
            },
            {
              key: 'l3-b',
              label: 'L3 B',
              children: [{ key: 'l4-b', label: 'L4 B' }],
            },
          ],
        },
      ],
    },
    {
      key: 'l1-b',
      label: 'L1 B',
      children: [{ key: 'l2-b', label: 'L2 B' }],
    },
  ];
  const idx = buildMenuTreeIndex(deepItems);

  // Switching sibling at level 3 preserves level 1 & 2 ancestors
  const switchL3 = computeNextOpenKeys(['l1-a', 'l2-a', 'l3-a'], 'l3-b', {
    accordion: true,
    levelByKey: idx.levelByKey,
  });
  assert.deepEqual(switchL3, ['l1-a', 'l2-a', 'l3-b']);

  // Switching at level 1 closes entire deep chain of l1-a
  const switchL1 = computeNextOpenKeys(['l1-a', 'l2-a', 'l3-b'], 'l1-b', {
    accordion: true,
    levelByKey: idx.levelByKey,
  });
  assert.deepEqual(switchL1, ['l1-b']);

  // Deselecting the last remaining item in multiple mode yields empty selection
  const clearLast = computeNextSelectedKeys(['l4-a'], 'l4-a', {
    multiple: true,
    selectable: true,
  });
  assert.deepEqual(clearLast, { nextSelectedKeys: [], action: 'deselect' });
});

