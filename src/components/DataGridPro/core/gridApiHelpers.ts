import React, { isValidElement } from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { GridRowId, GridRowUpdate, GridValidRowModel } from '../types';

export type GridEventListener<P = unknown> = (params: P) => void;

export interface GridEventBus {
  subscribe: <P = unknown>(
    event: string,
    handler: GridEventListener<P>,
  ) => () => void;
  publish: <P = unknown>(event: string, params?: P) => void;
  listenerCount: (event: string) => number;
  clear: () => void;
}

/**
 * Lightweight typed event bus powering official MUI X
 * apiRef.current.subscribeEvent / publishEvent.
 */
export function createGridEventBus(): GridEventBus {
  const listeners = new Map<string, Set<GridEventListener<unknown>>>();

  return {
    subscribe<P = unknown>(
      event: string,
      handler: GridEventListener<P>,
    ): () => void {
      let bucket = listeners.get(event);
      if (!bucket) {
        bucket = new Set();
        listeners.set(event, bucket);
      }
      const wrapped = handler as GridEventListener<unknown>;
      bucket.add(wrapped);
      return () => {
        const current = listeners.get(event);
        if (!current) return;
        current.delete(wrapped);
        if (current.size === 0) {
          listeners.delete(event);
        }
      };
    },

    publish<P = unknown>(event: string, params?: P): void {
      const bucket = listeners.get(event);
      if (!bucket || bucket.size === 0) return;
      for (const listener of Array.from(bucket)) {
        try {
          listener(params);
        } catch {
          // Isolate subscriber errors so one broken listener never crashes grid updates
        }
      }
    },

    listenerCount(event: string): number {
      return listeners.get(event)?.size ?? 0;
    },

    clear(): void {
      listeners.clear();
    },
  };
}

/**
 * Pure implementation of official MUI X apiRef.current.updateRows(updates):
 * - `_action: 'delete'` removes matching row by id
 * - Existing id merges partial fields non-destructively
 * - Unknown id inserts a new row record (without `_action`)
 */
export function applyRowUpdates<R extends GridValidRowModel>(
  rows: R[],
  updates: GridRowUpdate<R>[],
  resolveId: (row: R, index: number) => GridRowId,
): R[] {
  if (!updates.length) return rows;

  const deleteIds = new Set<string>();
  const patchById = new Map<string, GridRowUpdate<R>>();
  const orderedUpdateIds: string[] = [];

  for (const update of updates) {
    const key = String(update.id);
    if (update._action === 'delete') {
      deleteIds.add(key);
      patchById.delete(key);
    } else {
      deleteIds.delete(key);
      const existingPatch = patchById.get(key);
      patchById.set(key, existingPatch ? { ...existingPatch, ...update } : update);
      if (!orderedUpdateIds.includes(key)) {
        orderedUpdateIds.push(key);
      }
    }
  }

  const seenIds = new Set<string>();
  const nextRows: R[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const key = String(resolveId(row, i));
    if (deleteIds.has(key)) {
      continue;
    }
    seenIds.add(key);
    const patch = patchById.get(key);
    if (patch) {
      const cleanPatch: Record<string, unknown> = { ...patch };
      delete cleanPatch._action;
      nextRows.push({ ...row, ...cleanPatch } as R);
    } else {
      nextRows.push(row);
    }
  }

  for (const key of orderedUpdateIds) {
    if (seenIds.has(key) || deleteIds.has(key)) continue;
    const insert = patchById.get(key);
    if (!insert) continue;
    const cleanRow: Record<string, unknown> = { ...insert };
    delete cleanRow._action;
    nextRows.push(cleanRow as R);
  }

  return nextRows;
}

export type GridSlotValue<P extends Record<string, unknown> = Record<string, unknown>> =
  | ComponentType<P>
  | ReactNode
  | null
  | undefined;

/**
 * Resolves an official MUI X slot which may be:
 * - `null`: explicitly disabled
 * - a React Component (`function` or `forwardRef`/`memo` object): rendered with `{ ...baseProps, ...slotProps }`
 * - a ReactNode (JSX element, string, etc.): returned as-is for backwards compatibility
 * - `undefined`: returns `undefined` so caller falls back to built-in component
 */
export function renderGridSlot<
  P extends Record<string, unknown> = Record<string, unknown>,
>(
  slot: GridSlotValue<P>,
  baseProps: P,
  extraSlotProps?: Record<string, unknown>,
): ReactNode | undefined {
  if (slot === undefined) return undefined;
  if (slot === null) return null;

  if (typeof slot === 'function') {
    const Comp = slot as ComponentType<P>;
    return React.createElement(Comp, {
      ...baseProps,
      ...(extraSlotProps ?? {}),
    });
  }

  if (
    typeof slot === 'object' &&
    slot !== null &&
    !isValidElement(slot) &&
    '$$typeof' in slot
  ) {
    // React.memo / React.forwardRef component object
    const Comp = slot as unknown as ComponentType<P>;
    return React.createElement(Comp, {
      ...baseProps,
      ...(extraSlotProps ?? {}),
    });
  }

  return slot as ReactNode;
}
