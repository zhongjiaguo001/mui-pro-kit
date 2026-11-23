import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {
  applyRowUpdates,
  createGridEventBus,
  renderGridSlot,
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
