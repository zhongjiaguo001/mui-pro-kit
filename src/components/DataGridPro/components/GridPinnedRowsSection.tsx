import React from 'react';
import { Box, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import type { Column } from '@tanstack/react-table';
import type {
  GridColDef,
  GridPinnedColumnsSectionSeparator,
  GridRowId,
  GridValidRowModel,
} from '../types';
import type { ColumnMetaExt, DataGridFeatures } from '../core/useDataGridPro';
import {
  GRID_CHECKBOX_SELECTION_FIELD,
  GRID_DETAIL_PANEL_TOGGLE_FIELD,
  GRID_REORDER_COL_FIELD,
  formatCellValue,
  getDefaultAlignForType,
  isHierarchyColId,
  resolveCellValue,
  resolveRowId,
  type DensityMetrics,
  type PinnedColumnLayout,
} from '../core/gridCore';

interface GridPinnedRowsSectionProps<R extends GridValidRowModel> {
  position: 'top' | 'bottom';
  rows: Array<Partial<R>>;
  visibleColumns: Column<DataGridFeatures, R, unknown>[];
  getRowId?: (row: R) => GridRowId;
  densityMetrics: DensityMetrics;
  stickyTopOffset: number;
  pinnedLayout: Record<string, PinnedColumnLayout>;
  pinnedColumnsSectionSeparator: GridPinnedColumnsSectionSeparator;
  showCellVerticalBorder: boolean;
  isScrolledLeft: boolean;
  isScrolledRight: boolean;
  showVerticalShadow: boolean;
}

export function GridPinnedRowsSection<R extends GridValidRowModel>({
  position,
  rows,
  visibleColumns,
  getRowId,
  densityMetrics,
  stickyTopOffset,
  pinnedLayout,
  pinnedColumnsSectionSeparator,
  showCellVerticalBorder,
  isScrolledLeft,
  isScrolledRight,
  showVerticalShadow,
}: GridPinnedRowsSectionProps<R>) {
  if (rows.length === 0) return null;

  const showPinnedBorder =
    pinnedColumnsSectionSeparator === 'border-and-shadow' ||
    pinnedColumnsSectionSeparator === 'border';
  const showPinnedShadow =
    pinnedColumnsSectionSeparator === 'border-and-shadow' ||
    pinnedColumnsSectionSeparator === 'shadow';

  const rowBg = position === 'bottom' ? '#F5F7FA' : '#F8FAFC';

  return (
    <Box
      role="rowgroup"
      aria-label={position === 'top' ? '顶部固定行' : '底部固定汇总行'}
      className={[
        'MuiDataGrid-pinnedRows',
        showVerticalShadow
          ? position === 'top'
            ? 'MuiDataGrid-pinnedRows--top'
            : 'MuiDataGrid-pinnedRows--bottom'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid={`pinned-rows-${position}`}
      sx={{
        position: 'sticky',
        ...(position === 'top'
          ? { top: `${stickyTopOffset}px` }
          : { bottom: 0 }),
        zIndex: 4,
        width: '100%',
        bgcolor: rowBg,
      }}
    >
      {rows.map((partialRow, rIdx) => {
        const row = partialRow as R;
        const rowId = resolveRowId(row, rIdx, getRowId);
        const isFirstBottom = position === 'bottom' && rIdx === 0;
        const isLastTop = position === 'top' && rIdx === rows.length - 1;

        return (
          <Box
            key={`pinned-${position}-${rowId}`}
            role="row"
            data-pinned-row={position}
            data-row-id={rowId}
            className={`MuiDataGrid-row MuiDataGrid-row--pinned MuiDataGrid-row--pinned${
              position === 'top' ? 'Top' : 'Bottom'
            }`}
            sx={{
              display: 'flex',
              width: '100%',
              height: densityMetrics.rowHeight,
              bgcolor: rowBg,
              borderTop: isFirstBottom
                ? '1px solid rgba(0, 0, 0, 0.16)'
                : 'none',
              borderBottom: isLastTop
                ? '1px solid rgba(0, 0, 0, 0.16)'
                : '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
              boxSizing: 'border-box',
            }}
          >
            {visibleColumns.map((col, cIdx) => {
              const colId = col.id;
              const meta = col.columnDef.meta as ColumnMetaExt<R> | undefined;
              const colDef = meta?.colDef as GridColDef<R> | undefined;
              const isUtilityCol =
                colId === GRID_CHECKBOX_SELECTION_FIELD ||
                colId === GRID_REORDER_COL_FIELD ||
                colId === GRID_DETAIL_PANEL_TOGGLE_FIELD;
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
              const isTabular =
                colDef?.type === 'number' || colDef?.type === 'date';
              const contentJustify = isUtilityCol
                ? 'center'
                : align === 'right'
                  ? 'flex-end'
                  : align === 'center'
                    ? 'center'
                    : 'flex-start';

              const isTreeGroupCol = isHierarchyColId(colId);
              const rawValue =
                colDef && !isUtilityCol && !isActionsCol && !isTreeGroupCol
                  ? resolveCellValue(row, colDef)
                  : undefined;
              const formattedValue =
                colDef && !isUtilityCol && !isActionsCol && !isTreeGroupCol
                  ? formatCellValue(rawValue, row, colDef)
                  : '';

              let content: React.ReactNode = null;
              if (cIdx === 0 && isUtilityCol) {
                content = (
                  <PushPinOutlinedIcon
                    aria-label={position === 'top' ? '已置顶行' : '已置底行'}
                    sx={{
                      fontSize: 15,
                      color:
                        position === 'top' ? '#1976D2' : 'rgba(0, 0, 0, 0.45)',
                      transform: 'rotate(35deg)',
                    }}
                  />
                );
              } else if (isUtilityCol || isActionsCol) {
                content = null;
              } else if (
                rawValue === undefined ||
                rawValue === null ||
                rawValue === ''
              ) {
                content = (
                  <Typography
                    component="span"
                    sx={{
                      fontSize: `${densityMetrics.fontSize}px`,
                      color: 'rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    —
                  </Typography>
                );
              } else if (colDef?.renderCell && position === 'top') {
                content = colDef.renderCell({
                  id: rowId,
                  field: colId,
                  value: rawValue,
                  formattedValue,
                  row,
                  colDef,
                });
              } else if (colDef?.type === 'boolean') {
                content = rawValue ? (
                  <CheckIcon sx={{ fontSize: 18, color: 'rgba(0, 0, 0, 0.6)' }} />
                ) : (
                  <CloseIcon sx={{ fontSize: 18, color: 'rgba(0, 0, 0, 0.38)' }} />
                );
              } else {
                content = (
                  <Typography
                    component="span"
                    noWrap
                    className={isTabular ? 'font-mono-tabular' : undefined}
                    sx={{
                      fontSize: `${densityMetrics.fontSize}px`,
                      fontWeight: position === 'bottom' ? 600 : 500,
                      color:
                        position === 'bottom'
                          ? '#0F172A'
                          : 'rgba(0, 0, 0, 0.87)',
                    }}
                  >
                    {formattedValue}
                  </Typography>
                );
              }

              return (
                <Box
                  key={`pinned-cell-${rowId}-${colId}`}
                  role="gridcell"
                  data-field={colId}
                  className={[
                    'MuiDataGrid-cell',
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
        );
      })}
    </Box>
  );
}
