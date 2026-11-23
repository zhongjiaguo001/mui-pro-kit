import type { GridSortDirection } from '../types';

export interface VirtualColumnEntry {
  id: string;
  width: number;
  pinnedSide: 'left' | 'right' | false;
}

export interface ComputeVirtualColumnWindowParams {
  columns: VirtualColumnEntry[];
  scrollLeft: number;
  viewportWidth: number;
  columnBufferPx?: number;
  enabled: boolean;
}

export interface VirtualColumnWindow {
  isVirtualized: boolean;
  leftIndices: number[];
  centerIndices: number[];
  rightIndices: number[];
  leftSpacerWidth: number;
  rightSpacerWidth: number;
  renderedCount: number;
}

export const DEFAULT_SORTING_ORDER: Array<GridSortDirection | null> = [
  'asc',
  'desc',
  null,
];

/**
 * Pure MUI X-compatible horizontal column virtualizer.
 * Keeps all pinned-left and pinned-right columns mounted while slicing center
 * columns to `[scrollLeft - columnBufferPx, scrollLeft + centerViewport + columnBufferPx]`
 * with exact left/right pixel spacer conservation.
 */
export function computeVirtualColumnWindow({
  columns,
  scrollLeft,
  viewportWidth,
  columnBufferPx = 150,
  enabled,
}: ComputeVirtualColumnWindowParams): VirtualColumnWindow {
  const leftIndices: number[] = [];
  const centerAll: Array<{ index: number; width: number }> = [];
  const rightIndices: number[] = [];

  let pinnedLeftWidth = 0;
  let pinnedRightWidth = 0;

  for (let i = 0; i < columns.length; i += 1) {
    const col = columns[i];
    if (col.pinnedSide === 'left') {
      leftIndices.push(i);
      pinnedLeftWidth += col.width;
    } else if (col.pinnedSide === 'right') {
      rightIndices.push(i);
      pinnedRightWidth += col.width;
    } else {
      centerAll.push({ index: i, width: col.width });
    }
  }

  if (!enabled || centerAll.length === 0) {
    const centerIndices = centerAll.map((c) => c.index);
    return {
      isVirtualized: false,
      leftIndices,
      centerIndices,
      rightIndices,
      leftSpacerWidth: 0,
      rightSpacerWidth: 0,
      renderedCount: columns.length,
    };
  }

  const effectiveViewport = viewportWidth > 0 ? viewportWidth : 1200;
  const visibleCenterSpan = Math.max(
    240,
    effectiveViewport - pinnedLeftWidth - pinnedRightWidth,
  );
  const clampedScrollLeft = Math.max(0, scrollLeft);
  const buffer = Math.max(0, columnBufferPx);
  const windowStart = clampedScrollLeft - buffer;
  const windowEnd = clampedScrollLeft + visibleCenterSpan + buffer;

  let cursorX = 0;
  let firstVisibleCenterPos = -1;
  let lastVisibleCenterPos = -1;
  let leftSpacerWidth = 0;
  let rightSpacerWidth = 0;

  for (let i = 0; i < centerAll.length; i += 1) {
    const colStart = cursorX;
    const colEnd = cursorX + centerAll[i].width;
    cursorX = colEnd;

    if (colEnd >= windowStart && colStart <= windowEnd) {
      if (firstVisibleCenterPos === -1) {
        firstVisibleCenterPos = i;
        leftSpacerWidth = colStart;
      }
      lastVisibleCenterPos = i;
    }
  }

  // Fallback if scrollLeft overshoots total center width
  if (firstVisibleCenterPos === -1) {
    const fallbackPos = centerAll.length - 1;
    firstVisibleCenterPos = fallbackPos;
    lastVisibleCenterPos = fallbackPos;
    leftSpacerWidth = Math.max(0, cursorX - centerAll[fallbackPos].width);
    rightSpacerWidth = 0;
  } else {
    for (let i = lastVisibleCenterPos + 1; i < centerAll.length; i += 1) {
      rightSpacerWidth += centerAll[i].width;
    }
  }

  const centerIndices = centerAll
    .slice(firstVisibleCenterPos, lastVisibleCenterPos + 1)
    .map((c) => c.index);

  const isVirtualized = centerIndices.length < centerAll.length;

  return {
    isVirtualized,
    leftIndices,
    centerIndices,
    rightIndices,
    leftSpacerWidth,
    rightSpacerWidth,
    renderedCount:
      leftIndices.length + centerIndices.length + rightIndices.length,
  };
}

/**
 * Resolves the next sort direction given the current direction and official MUI X `sortingOrder` cycle.
 */
export function getNextSortDirection(
  current: GridSortDirection | false | null | undefined,
  sortingOrder: Array<GridSortDirection | null> = DEFAULT_SORTING_ORDER,
): GridSortDirection | null {
  const normalizedOrder =
    sortingOrder.length > 0 ? sortingOrder : DEFAULT_SORTING_ORDER;
  const normalizedCurrent: GridSortDirection | null =
    current === 'asc' || current === 'desc' ? current : null;
  const idx = normalizedOrder.indexOf(normalizedCurrent);
  if (idx === -1) {
    return normalizedOrder[0] ?? null;
  }
  return normalizedOrder[(idx + 1) % normalizedOrder.length] ?? null;
}

/**
 * Computes the official MUI X `autoPageSize` value from available body height and row height.
 */
export function computeAutoPageSize(
  availableBodyHeight: number,
  rowHeight: number,
): number {
  if (!Number.isFinite(availableBodyHeight) || !Number.isFinite(rowHeight)) {
    return 1;
  }
  if (rowHeight <= 0 || availableBodyHeight <= 0) {
    return 1;
  }
  return Math.max(1, Math.floor(availableBodyHeight / rowHeight));
}
