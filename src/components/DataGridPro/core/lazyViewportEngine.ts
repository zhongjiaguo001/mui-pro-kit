export interface LazyChunkRange {
  start: number;
  end: number;
}

/**
 * Computes contiguous, chunk-aligned missing row index ranges for MUI X Pro
 * Viewport Lazy Loading. Skips chunks that are already cached or in-flight.
 */
export function computeMissingChunkRanges(params: {
  startIndex: number;
  endIndex: number;
  totalRowCount: number;
  chunkSize: number;
  loadedIndices: ReadonlySet<number>;
  inFlightChunkIds: ReadonlySet<number>;
}): { ranges: LazyChunkRange[]; chunkIds: number[] } {
  const {
    startIndex,
    endIndex,
    totalRowCount,
    chunkSize,
    loadedIndices,
    inFlightChunkIds,
  } = params;

  if (totalRowCount <= 0 || chunkSize <= 0 || endIndex < startIndex) {
    return { ranges: [], chunkIds: [] };
  }

  const clampedStart = Math.max(0, Math.min(totalRowCount - 1, startIndex));
  const clampedEnd = Math.max(
    clampedStart,
    Math.min(totalRowCount - 1, endIndex),
  );

  const firstChunk = Math.floor(clampedStart / chunkSize);
  const lastChunk = Math.floor(clampedEnd / chunkSize);

  const missingChunkIds: number[] = [];

  for (let chunkId = firstChunk; chunkId <= lastChunk; chunkId += 1) {
    if (inFlightChunkIds.has(chunkId)) continue;
    const chunkStart = chunkId * chunkSize;
    const chunkEnd = Math.min(totalRowCount - 1, chunkStart + chunkSize - 1);
    let hasMissing = false;
    for (let idx = chunkStart; idx <= chunkEnd; idx += 1) {
      if (!loadedIndices.has(idx)) {
        hasMissing = true;
        break;
      }
    }
    if (hasMissing) {
      missingChunkIds.push(chunkId);
    }
  }

  if (missingChunkIds.length === 0) {
    return { ranges: [], chunkIds: [] };
  }

  // Coalesce contiguous missing chunk IDs into single start..end server requests
  const ranges: LazyChunkRange[] = [];
  let runStartChunk = missingChunkIds[0];
  let runEndChunk = missingChunkIds[0];

  for (let i = 1; i < missingChunkIds.length; i += 1) {
    const cid = missingChunkIds[i];
    if (cid === runEndChunk + 1) {
      runEndChunk = cid;
    } else {
      ranges.push({
        start: runStartChunk * chunkSize,
        end: Math.min(totalRowCount - 1, (runEndChunk + 1) * chunkSize - 1),
      });
      runStartChunk = cid;
      runEndChunk = cid;
    }
  }

  ranges.push({
    start: runStartChunk * chunkSize,
    end: Math.min(totalRowCount - 1, (runEndChunk + 1) * chunkSize - 1),
  });

  return { ranges, chunkIds: missingChunkIds };
}

/**
 * Merges a fetched slice `[start..start+rows.length-1]` into an immutable copy of the sparse row map.
 */
export function mergeLazyRowsIntoMap<R>(
  prevMap: ReadonlyMap<number, R>,
  start: number,
  rows: R[],
): Map<number, R> {
  const next = new Map(prevMap);
  for (let i = 0; i < rows.length; i += 1) {
    next.set(start + i, rows[i]);
  }
  return next;
}
