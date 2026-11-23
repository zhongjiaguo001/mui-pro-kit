export interface FlexColumnSpec {
  id: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  isUserResized?: boolean;
}

/**
 * Official MUI X iterative `flex` column width distribution algorithm.
 * Allocates remaining container width across visible columns with `flex > 0`
 * (excluding columns explicitly resized by the user), clamping against
 * `minWidth` / `maxWidth` and redistributing any surplus or deficit cleanly.
 */
export function computeFlexColumnWidths(
  columns: FlexColumnSpec[],
  viewportWidth: number,
): Record<string, number> {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    return {};
  }

  let fixedWidthSum = 0;
  const flexCols: Array<{
    id: string;
    flex: number;
    minWidth: number;
    maxWidth: number;
  }> = [];

  for (const col of columns) {
    const hasFlex =
      typeof col.flex === 'number' &&
      Number.isFinite(col.flex) &&
      col.flex > 0 &&
      !col.isUserResized;
    if (hasFlex) {
      flexCols.push({
        id: col.id,
        flex: col.flex as number,
        minWidth: Math.max(40, col.minWidth ?? 60),
        maxWidth:
          typeof col.maxWidth === 'number' && Number.isFinite(col.maxWidth)
            ? Math.max(col.maxWidth, col.minWidth ?? 60)
            : Number.POSITIVE_INFINITY,
      });
    } else {
      fixedWidthSum += col.width;
    }
  }

  if (flexCols.length === 0) {
    return {};
  }

  const resolved: Record<string, number> = {};
  let available = Math.max(0, viewportWidth - fixedWidthSum);
  let remaining = [...flexCols];

  // Iteratively freeze columns that hit minWidth or maxWidth bounds
  while (remaining.length > 0) {
    const totalFlex = remaining.reduce((acc, c) => acc + c.flex, 0);
    if (totalFlex <= 0) break;

    let clampedAny = false;
    const nextRemaining: typeof remaining = [];

    for (const col of remaining) {
      const share = (available * col.flex) / totalFlex;
      if (share < col.minWidth) {
        resolved[col.id] = Math.round(col.minWidth);
        available = Math.max(0, available - col.minWidth);
        clampedAny = true;
      } else if (share > col.maxWidth) {
        resolved[col.id] = Math.round(col.maxWidth);
        available = Math.max(0, available - col.maxWidth);
        clampedAny = true;
      } else {
        nextRemaining.push(col);
      }
    }

    if (!clampedAny) {
      let distributed = 0;
      nextRemaining.forEach((col, idx) => {
        if (idx === nextRemaining.length - 1) {
          const finalW = Math.max(
            col.minWidth,
            Math.min(col.maxWidth, Math.round(available - distributed)),
          );
          resolved[col.id] = finalW;
        } else {
          const w = Math.round((available * col.flex) / totalFlex);
          resolved[col.id] = w;
          distributed += w;
        }
      });
      break;
    }

    remaining = nextRemaining;
  }

  return resolved;
}
