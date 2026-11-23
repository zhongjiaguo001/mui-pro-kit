import type { GridColDef, GridValidRowModel } from '../types';
import { resolveCellValue } from './gridCore';

/**
 * Computes official MUI X rowSpanning map over a list of visible data rows.
 * Returns a Map keyed by `${rowIndex}:${field}` where:
 * - value > 1: anchor cell spanning that many consecutive rows
 * - value === 0: covered cell hidden underneath the anchor cell
 * - absent / 1: regular unmerged cell
 */
export function computeRowSpanMatrix<R extends GridValidRowModel>(
  rows: Array<R | null>,
  visibleColDefs: Array<GridColDef<R> | undefined>,
  enabled: boolean,
): Map<string, number> {
  const spanMap = new Map<string, number>();
  if (!enabled || rows.length <= 1) return spanMap;

  for (const colDef of visibleColDefs) {
    if (!colDef) continue;
    if (colDef.type === 'actions' || colDef.rowSpan === false) continue;

    const field = colDef.field;
    let runStart = -1;
    let runKey: string | null = null;

    const flushRun = (endExclusive: number) => {
      if (runStart >= 0 && endExclusive - runStart > 1) {
        const span = endExclusive - runStart;
        spanMap.set(`${runStart}:${field}`, span);
        for (let r = runStart + 1; r < endExclusive; r += 1) {
          spanMap.set(`${r}:${field}`, 0);
        }
      }
      runStart = -1;
      runKey = null;
    };

    for (let r = 0; r < rows.length; r += 1) {
      const row = rows[r];
      if (!row) {
        flushRun(r);
        continue;
      }

      const raw = resolveCellValue(row, colDef);
      const comparable = colDef.rowSpanValueGetter
        ? colDef.rowSpanValueGetter(raw, row)
        : raw;

      if (
        comparable === null ||
        comparable === undefined ||
        (typeof comparable === 'string' && comparable.trim() === '')
      ) {
        flushRun(r);
        continue;
      }

      const key = `${typeof comparable}:${String(comparable)}`;
      if (runStart >= 0 && key === runKey) {
        continue;
      }
      flushRun(r);
      runStart = r;
      runKey = key;
    }

    flushRun(rows.length);
  }

  return spanMap;
}

export interface ColSpanCellLayout {
  spanCount: number;
  totalWidth: number;
  covered: boolean;
}

/**
 * Computes horizontal colSpan layout for a single data row in Flexbox DataGrid.
 * Evaluates colDef.colSpan(value, row, colDef) and sums column widths across spanned cells.
 */
export function computeColSpanRow<R extends GridValidRowModel>(
  row: R,
  visibleColDefs: Array<GridColDef<R> | undefined>,
  colWidths: number[],
): ColSpanCellLayout[] {
  const count = visibleColDefs.length;
  const result: ColSpanCellLayout[] = new Array(count);
  let skipRemaining = 0;

  for (let i = 0; i < count; i += 1) {
    const baseWidth = colWidths[i] ?? 0;
    if (skipRemaining > 0) {
      result[i] = { spanCount: 0, totalWidth: 0, covered: true };
      skipRemaining -= 1;
      continue;
    }

    const colDef = visibleColDefs[i];
    let requestedSpan = 1;
    if (colDef?.colSpan) {
      const rawVal = resolveCellValue(row, colDef);
      const computed =
        typeof colDef.colSpan === 'function'
          ? colDef.colSpan(rawVal, row, colDef)
          : colDef.colSpan;
      if (typeof computed === 'number' && Number.isFinite(computed) && computed > 1) {
        requestedSpan = Math.min(Math.floor(computed), count - i);
      }
    }

    let totalWidth = baseWidth;
    for (let k = 1; k < requestedSpan; k += 1) {
      totalWidth += colWidths[i + k] ?? 0;
    }

    result[i] = {
      spanCount: requestedSpan,
      totalWidth,
      covered: false,
    };
    skipRemaining = requestedSpan - 1;
  }

  return result;
}
