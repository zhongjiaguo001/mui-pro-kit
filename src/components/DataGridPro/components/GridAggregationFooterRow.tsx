import React from 'react';
import { Box, Typography } from '@mui/material';
import type { Column } from '@tanstack/react-table';
import type {
  GridAggregationModel,
  GridColDef,
  GridPinnedColumnsSectionSeparator,
  GridValidRowModel,
} from '../types';
import type { ColumnMetaExt, DataGridFeatures } from '../core/useDataGridPro';
import {
  AGGREGATION_FUNCTION_LABELS,
  GRID_CHECKBOX_SELECTION_FIELD,
  GRID_DETAIL_PANEL_TOGGLE_FIELD,
  GRID_REORDER_COL_FIELD,
  computeColumnAggregation,
  formatAggregatedValue,
  getDefaultAlignForType,
  isHierarchyColId,
  type DensityMetrics,
  type PinnedColumnLayout,
} from '../core/gridCore';

interface GridAggregationFooterRowProps<R extends GridValidRowModel> {
  rows: R[];
  visibleColumns: Column<DataGridFeatures, R, unknown>[];
  aggregationModel: GridAggregationModel;
  densityMetrics: DensityMetrics;
  stickyBottomOffset: number;
  pinnedLayout: Record<string, PinnedColumnLayout>;
  pinnedColumnsSectionSeparator: GridPinnedColumnsSectionSeparator;
  showCellVerticalBorder: boolean;
  isScrolledLeft: boolean;
  isScrolledRight: boolean;
  showVerticalShadow: boolean;
}

export function GridAggregationFooterRow<R extends GridValidRowModel>({
  rows,
  visibleColumns,
  aggregationModel,
  densityMetrics,
  stickyBottomOffset,
  pinnedLayout,
  pinnedColumnsSectionSeparator,
  showCellVerticalBorder,
  isScrolledLeft,
  isScrolledRight,
  showVerticalShadow,
}: GridAggregationFooterRowProps<R>) {
  const activeEntries = Object.entries(aggregationModel);
  if (activeEntries.length === 0) return null;

  const showPinnedBorder =
    pinnedColumnsSectionSeparator === 'border-and-shadow' ||
    pinnedColumnsSectionSeparator === 'border';
  const showPinnedShadow =
    pinnedColumnsSectionSeparator === 'border-and-shadow' ||
    pinnedColumnsSectionSeparator === 'shadow';

  // Find the first non-utility column to display the "总计汇总" label if it doesn't hold its own aggregation
  const firstLabelColId = visibleColumns.find(
    (c) =>
      c.id !== GRID_CHECKBOX_SELECTION_FIELD &&
      c.id !== GRID_REORDER_COL_FIELD &&
      c.id !== GRID_DETAIL_PANEL_TOGGLE_FIELD,
  )?.id;

  const rowBg = '#F4F7FB';

  return (
    <Box
      role="rowgroup"
      aria-label="列聚合汇总行"
      data-testid="aggregation-footer-row"
      className={[
        'MuiDataGrid-aggregationRow',
        showVerticalShadow ? 'MuiDataGrid-pinnedRows--bottom' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      sx={{
        position: 'sticky',
        bottom: `${stickyBottomOffset}px`,
        zIndex: 4,
        width: '100%',
        bgcolor: rowBg,
      }}
    >
      <Box
        role="row"
        className="MuiDataGrid-row MuiDataGrid-row--aggregation"
        sx={{
          display: 'flex',
          width: '100%',
          height: Math.max(densityMetrics.rowHeight, 48),
          bgcolor: rowBg,
          borderTop: '2px solid rgba(25, 118, 210, 0.28)',
          borderBottom: '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
          boxSizing: 'border-box',
        }}
      >
        {visibleColumns.map((col) => {
          const colId = col.id;
          const meta = col.columnDef.meta as ColumnMetaExt<R> | undefined;
          const colDef = meta?.colDef as GridColDef<R> | undefined;
          const isUtilityCol =
            colId === GRID_CHECKBOX_SELECTION_FIELD ||
            colId === GRID_REORDER_COL_FIELD ||
            colId === GRID_DETAIL_PANEL_TOGGLE_FIELD;
          const isTreeCol = isHierarchyColId(colId);
          const isActionsCol = colDef?.type === 'actions';

          const pinnedInfo = pinnedLayout[colId];
          const isPinned = pinnedInfo && pinnedInfo.side !== false;
          const isLeftBoundary =
            pinnedInfo?.side === 'left' && pinnedInfo.isBoundary;
          const isRightBoundary =
            pinnedInfo?.side === 'right' && pinnedInfo.isBoundary;
          const hasLeftSectionBorder = isLeftBoundary && showPinnedBorder;
          const hasRightSectionBorder = isRightBoundary && showPinnedBorder;
          const isPinnedBoundary = isLeftBoundary || isRightBoundary;

          const align =
            colDef?.align ?? getDefaultAlignForType(colDef?.type);
          const contentJustify = isUtilityCol
            ? 'center'
            : align === 'right'
              ? 'flex-end'
              : align === 'center'
                ? 'center'
                : 'flex-start';

          const aggFn =
            !isUtilityCol && !isTreeCol && !isActionsCol
              ? aggregationModel[colId]
              : undefined;

          let content: React.ReactNode = null;
          if (aggFn && colDef) {
            const rawVal = computeColumnAggregation(rows, colDef, aggFn);
            const displayVal = formatAggregatedValue(rawVal, aggFn, colDef);
            const fnLabel = AGGREGATION_FUNCTION_LABELS[aggFn];
            content = (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems:
                    align === 'right'
                      ? 'flex-end'
                      : align === 'center'
                        ? 'center'
                        : 'flex-start',
                  justifyContent: 'center',
                  minWidth: 0,
                  lineHeight: 1.2,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.675rem',
                    fontWeight: 600,
                    color: '#1976D2',
                    letterSpacing: '0.02em',
                    lineHeight: 1.15,
                  }}
                >
                  {fnLabel}
                </Typography>
                <Typography
                  component="span"
                  noWrap
                  className="font-mono-tabular"
                  sx={{
                    fontSize: `${densityMetrics.fontSize}px`,
                    fontWeight: 700,
                    color: '#0F172A',
                    lineHeight: 1.3,
                  }}
                >
                  {displayVal}
                </Typography>
              </Box>
            );
          } else if (colId === firstLabelColId) {
            content = (
              <Typography
                component="span"
                noWrap
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                聚合汇总
              </Typography>
            );
          }

          return (
            <Box
              key={`agg-cell-${colId}`}
              role="gridcell"
              data-field={colId}
              data-aggregation-fn={aggFn ?? undefined}
              className={[
                'MuiDataGrid-cell',
                'MuiDataGrid-aggregationCell',
                isPinned ? 'MuiDataGrid-cell--pinned' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              sx={{
                ...(isPinned
                  ? {
                      position: 'sticky',
                      [pinnedInfo.side as 'left' | 'right']:
                        `${pinnedInfo.offset}px`,
                      zIndex: 3,
                      bgcolor: rowBg,
                    }
                  : {
                      position: 'relative',
                      zIndex: 1,
                    }),
                width: col.getSize(),
                minWidth: col.getSize(),
                maxWidth: col.getSize(),
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: contentJustify,
                px: isUtilityCol ? 0 : `${densityMetrics.cellPaddingX}px`,
                borderRight:
                  showCellVerticalBorder || hasLeftSectionBorder
                    ? '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)'
                    : 'none',
                borderLeft: hasRightSectionBorder
                  ? '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)'
                  : 'none',
                boxSizing: 'border-box',
                overflow: isPinnedBoundary ? 'visible' : 'hidden',
              }}
            >
              {isPinnedBoundary ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: contentJustify,
                    width: '100%',
                    height: '100%',
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  {content}
                </Box>
              ) : (
                content
              )}

              {isLeftBoundary && showPinnedShadow && (
                <Box
                  aria-hidden="true"
                  className="MuiDataGrid-scrollShadow MuiDataGrid-scrollShadow--left"
                  sx={{
                    left: hasLeftSectionBorder
                      ? 'calc(100% + 1px)'
                      : '100%',
                    opacity: isScrolledLeft ? 1 : 0,
                  }}
                />
              )}
              {isRightBoundary && showPinnedShadow && (
                <Box
                  aria-hidden="true"
                  className="MuiDataGrid-scrollShadow MuiDataGrid-scrollShadow--right"
                  sx={{
                    right: hasRightSectionBorder
                      ? 'calc(100% + 1px)'
                      : '100%',
                    opacity: isScrolledRight ? 1 : 0,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
