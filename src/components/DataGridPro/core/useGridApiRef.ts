import { useRef, type RefObject } from 'react';
import type { GridApiPro, GridValidRowModel } from '../types';

/**
 * Official MUI X DataGrid Pro imperative API ref hook.
 * Pass the returned ref to `<DataGridPro apiRef={apiRef} />` to call
 * `exportState()`, `restoreState()`, `autosizeColumns()`, `scrollToIndexes()`, etc.
 */
export function useGridApiRef<
  R extends GridValidRowModel = GridValidRowModel,
>(): RefObject<GridApiPro<R> | null> {
  return useRef<GridApiPro<R> | null>(null);
}
