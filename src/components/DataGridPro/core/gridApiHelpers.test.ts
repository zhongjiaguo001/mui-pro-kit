import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {
  applyRowUpdates,
  createGridEventBus,
  normalizeExportOptions,
  parseQuickFilterInput,
  renderGridSlot,
  resolvePanelOpenTarget,
  resolveToolbarVisibility,
} from './gridApiHelpers';

test('createGridEventBus subscribes, publishes payloads, unsubscribes, and isolates listener errors', () => {
  const bus = createGridEventBus();
  const received: Array<unknown> = [];

  const unsub1 = bus.subscribe('sortModelChange', (payload) => {
    received.push(['ok', payload]);
  });
  bus.subscribe('sortModelChange', () => {
    throw new Error('broken subscriber');
  });
  const unsub3 = bus.subscribe('sortModelChange', (payload) => {
    received.push(['after-error', payload]);
  });

  assert.equal(bus.listenerCount('sortModelChange'), 3);
  bus.publish('sortModelChange', [{ field: 'amount', sort: 'desc' }]);
  assert.equal(received.length, 2);
  assert.deepEqual(received[0], ['ok', [{ field: 'amount', sort: 'desc' }]]);
  assert.deepEqual(received[1], ['after-error', [{ field: 'amount', sort: 'desc' }]]);

  unsub1();
  unsub3();
  assert.equal(bus.listenerCount('sortModelChange'), 1);
  bus.clear();
  assert.equal(bus.listenerCount('sortModelChange'), 0);
});

test('applyRowUpdates patches existing rows, deletes rows with _action delete, and inserts new rows', () => {
  interface DemoRow {
    id: string;
    name: string;
    amount: number;
    [key: string]: unknown;
  }

  const initial: DemoRow[] = [
    { id: '1', name: 'Alpha', amount: 100 },
    { id: '2', name: 'Beta', amount: 200 },
    { id: '3', name: 'Gamma', amount: 300 },
  ];

  const updated = applyRowUpdates(
    initial,
    [
      { id: '1', amount: 150 },
      { id: '2', _action: 'delete' },
      { id: '4', name: 'Delta', amount: 400 },
    ],
    (r) => r.id,
  );

  // Immutability check
  assert.equal(initial.length, 3);
  assert.equal(initial[0].amount, 100);

  assert.equal(updated.length, 3);
  assert.deepEqual(
    updated.map((r) => ({ id: r.id, name: r.name, amount: r.amount })),
    [
      { id: '1', name: 'Alpha', amount: 150 },
      { id: '3', name: 'Gamma', amount: 300 },
      { id: '4', name: 'Delta', amount: 400 },
    ],
  );
  assert.equal('_action' in updated[2], false);
});

test('renderGridSlot handles undefined, null, ReactNode elements, and React components with merged slotProps', () => {
  assert.equal(renderGridSlot(undefined, { count: 1 }), undefined);
  assert.equal(renderGridSlot(null, { count: 1 }), null);

  const rawElement = React.createElement('div', { id: 'raw' }, 'hello');
  assert.equal(renderGridSlot(rawElement, { count: 1 }), rawElement);

  const CustomFooter = (props: { count?: number; label?: string }) =>
    React.createElement('footer', null, `${props.label}:${props.count}`);
  const rendered = renderGridSlot(
    CustomFooter,
    { count: 64 },
    { label: 'Total' },
  );
  assert.ok(React.isValidElement(rendered));
  assert.equal((rendered as React.ReactElement<{ count?: number; label?: string }>).props.count, 64);
  assert.equal((rendered as React.ReactElement<{ count?: number; label?: string }>).props.label, 'Total');
});

test('resolveToolbarVisibility honors MUI X v8 showToolbar over legacy disableToolbar with backward-compatible default', () => {
  assert.equal(resolveToolbarVisibility({}), true);
  assert.equal(resolveToolbarVisibility({ disableToolbar: true }), false);
  assert.equal(resolveToolbarVisibility({ disableToolbar: false }), true);
  assert.equal(resolveToolbarVisibility({ showToolbar: false }), false);
  assert.equal(resolveToolbarVisibility({ showToolbar: true }), true);
  // Explicit showToolbar takes precedence over disableToolbar
  assert.equal(
    resolveToolbarVisibility({ showToolbar: true, disableToolbar: true }),
    true,
  );
  assert.equal(
    resolveToolbarVisibility({ showToolbar: false, disableToolbar: false }),
    false,
  );
});

test('resolvePanelOpenTarget anchors to external button, falls back to built-in toolbar button, then gracefully falls back to docked sidebar when toolbar is hidden', () => {
  const externalBtn = { id: 'external-btn' } as unknown as HTMLElement;
  const builtInBtn = { id: 'builtin-btn' } as unknown as HTMLElement;

  assert.deepEqual(
    resolvePanelOpenTarget({
      panel: 'filters',
      anchorEl: externalBtn,
      toolbarButtonEl: builtInBtn,
    }),
    { mode: 'popover', anchorEl: externalBtn },
  );

  assert.deepEqual(
    resolvePanelOpenTarget({
      panel: 'columns',
      anchorEl: null,
      toolbarButtonEl: builtInBtn,
    }),
    { mode: 'popover', anchorEl: builtInBtn },
  );

  // When built-in toolbar is hidden (toolbarButtonEl is null) and no external anchorEl is supplied
  assert.deepEqual(
    resolvePanelOpenTarget({
      panel: 'filters',
      anchorEl: null,
      toolbarButtonEl: null,
    }),
    { mode: 'sidebar', panel: 'filters' },
  );

  assert.deepEqual(
    resolvePanelOpenTarget({
      panel: 'columns',
      anchorEl: undefined,
      toolbarButtonEl: undefined,
    }),
    { mode: 'sidebar', panel: 'columns' },
  );

  // Pivot panel always docks to right sidebar
  assert.deepEqual(
    resolvePanelOpenTarget({
      panel: 'pivot',
      anchorEl: externalBtn,
      toolbarButtonEl: builtInBtn,
    }),
    { mode: 'sidebar', panel: 'pivot' },
  );
});

test('normalizeExportOptions and parseQuickFilterInput normalize legacy boolean and option objects cleanly', () => {
  assert.deepEqual(normalizeExportOptions(undefined), {});
  assert.deepEqual(normalizeExportOptions(true), { selectedOnly: true });
  assert.deepEqual(normalizeExportOptions(false), { selectedOnly: false });
  assert.deepEqual(
    normalizeExportOptions({
      selectedOnly: true,
      fileName: 'q4-orders',
      sheetName: 'Q4',
    }),
    { selectedOnly: true, fileName: 'q4-orders', sheetName: 'Q4' },
  );

  assert.deepEqual(parseQuickFilterInput(''), []);
  assert.deepEqual(parseQuickFilterInput('   '), []);
  assert.deepEqual(parseQuickFilterInput('  华东   SO-1001  '), ['华东', 'SO-1001']);
});
