import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import type { Column } from '@tanstack/react-table';
import type {
  GridAggregationModel,
  GridColDef,
  GridGroupingColDef,
  GridPinnedColumnsSectionSeparator,
  GridRowGroupingColumnMode,
  GridRowGroupingModel,
  GridValidRowModel,
} from '../types';
import type { ColumnMetaExt, DataGridFeatures } from '../core/useDataGridPro';
import {
  GRID_CHECKBOX_SELECTION_FIELD,
  GRID_DETAIL_PANEL_TOGGLE_FIELD,
  GRID_REORDER_COL_FIELD,
  computeColumnAggregation,
  formatAggregatedValue,
  formatCellValue,
  getDefaultAlignForType,
  getMultipleGroupingColId,
  isHierarchyColId,
  resolveCellValue,
  type DensityMetrics,
  type PinnedColumnLayout,
  type TreeFlatRow,
} from '../core/gridCore';

interface GridTreeGroupRowProps<R extends GridValidRowModel> {
  node: TreeFlatRow<R>;
  rowIndex: number;
  isExpanded: boolean;
  onToggle: (groupKey: string) => void;
  visibleColumns: Column<DataGridFeatures, R, unknown>[];
  aggregationModel: GridAggregationModel;
  groupingColDef?: GridGroupingColDef;
  rowGroupingModel?: GridRowGroupingModel;
  rowGroupingColumnMode?: GridRowGroupingColumnMode;
  densityMetrics: DensityMetrics;
  pinnedLayout: Record<string, PinnedColumnLayout>;
  pinnedColumnsSectionSeparator: GridPinnedColumnsSectionSeparator;
  showCellVerticalBorder: boolean;
  isScrolledLeft: boolean;
  isScrolledRight: boolean;
  onFocusCell: (rowIdx: number, colIdx: number) => void;
  totalRenderedRows: number;
}

export function GridTreeGroupRow<R extends GridValidRowModel>({
  node,
  rowIndex,
  isExpanded,
  onToggle,
  visibleColumns,
  aggregationModel,
  groupingColDef,
  rowGroupingModel,
  rowGroupingColumnMode = 'single',
  densityMetrics,
  pinnedLayout,
  pinnedColumnsSectionSeparator,
  showCellVerticalBorder,
  isScrolledLeft,
  isScrolledRight,
  onFocusCell,
  totalRenderedRows,
}: GridTreeGroupRowProps<R>) {
  const showPinnedBorder =
    pinnedColumnsSectionSeparator === 'border-and-shadow' ||
    pinnedColumnsSectionSeparator === 'border';
  const showPinnedShadow =
    pinnedColumnsSectionSeparator === 'border-and-shadow' ||
    pinnedColumnsSectionSeparator === 'shadow';

  const rowBg = node.depth === 0 ? '#F8FAFC' : '#FAFAFA';
  const rowHoverBg = '#F1F5F9';

  return (
    <Box
      role="row"
      aria-expanded={isExpanded}
      data-row-id={node.rowId}
      data-tree-group={node.id}
      data-tree-depth={node.depth}
      className="MuiDataGrid-row MuiDataGrid-row--treeGroup"
      onClick={() => onToggle(node.id)}
      sx={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        height: densityMetrics.rowHeight,
        bgcolor: rowBg,
        borderBottom: '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
        cursor: 'pointer',
        '&:hover': {
          bgcolor: rowHoverBg,
          '& .MuiDataGrid-cell--pinned': {
            bgcolor: rowHoverBg,
          },
        },
      }}
    >
      {visibleColumns.map((col, colIndex) => {
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

        const align = colDef?.align ?? getDefaultAlignForType(colDef?.type);
        const contentJustify = isUtilityCol
          ? 'center'
          : isTreeCol
            ? 'flex-start'
            : align === 'right'
              ? 'flex-end'
              : align === 'center'
                ? 'center'
                : 'flex-start';

        let content: React.ReactNode = null;
        let copyText = '';

        const isMultipleMode =
          rowGroupingColumnMode === 'multiple' &&
          Boolean(rowGroupingModel && rowGroupingModel.length > 0);
        const activeDepthGroupColId = isMultipleMode
          ? getMultipleGroupingColId(rowGroupingModel![node.depth] ?? '')
          : null;

        if (isTreeCol) {
          if (!isMultipleMode || colId === activeDepthGroupColId) {
            copyText = node.label;
            content = (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  pl: isMultipleMode ? 0 : `${node.depth * 24}px`,
                  minWidth: 0,
                  width: '100%',
                }}
              >
              <IconButton
                size="small"
                aria-label={
                  isExpanded
                    ? `收起分组 ${node.label}`
                    : `展开分组 ${node.label}`
                }
                aria-expanded={isExpanded}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(node.id);
                }}
                sx={{
                  p: 0.35,
                  color: 'rgba(0, 0, 0, 0.54)',
                  flexShrink: 0,
                  '&:hover': {
                    color: '#1976D2',
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                  },
                }}
              >
                <KeyboardArrowRightIcon
                  sx={{
                    fontSize: 19,
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 160ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </IconButton>
              <Typography
                component="span"
                noWrap
                sx={{
                  fontSize: `${densityMetrics.fontSize}px`,
                  fontWeight: node.depth === 0 ? 600 : 500,
                  color: '#0F172A',
                }}
              >
                {node.label}
              </Typography>
              {!groupingColDef?.hideDescendantCount && (
                <Typography
                  component="span"
                  className="font-mono-tabular"
                  sx={{
                    fontSize: '0.75rem',
                    color: 'rgba(0, 0, 0, 0.5)',
                    flexShrink: 0,
                    ml: 0.25,
                  }}
                >
                  ({node.descendantCount})
                </Typography>
              )}
              </Box>
            );
          }
        } else if (!isUtilityCol && !isActionsCol && colDef) {
          const aggFn = aggregationModel[colId];
          if (aggFn) {
            const aggVal = computeColumnAggregation(
              node.descendantRows,
              colDef,
              aggFn,
            );
            const displayVal = formatAggregatedValue(aggVal, aggFn, colDef);
            copyText = displayVal;
            content = (
              <Typography
                component="span"
                noWrap
                className="font-mono-tabular"
                sx={{
                  fontSize: `${densityMetrics.fontSize}px`,
                  fontWeight: 600,
                  color: '#1E293B',
                }}
              >
                {displayVal}
              </Typography>
            );
          } else if (node.row) {
            const rawVal = resolveCellValue(node.row, colDef);
            const formatted = formatCellValue(rawVal, node.row, colDef);
            copyText = formatted;
            content = (
              <Typography
                component="span"
                noWrap
                sx={{
                  fontSize: `${densityMetrics.fontSize}px`,
                  color: 'rgba(0, 0, 0, 0.72)',
                }}
              >
                {formatted}
              </Typography>
            );
          }
        }

        return (
          <Box
            key={`tree-group-cell-${node.id}-${colId}`}
            role="gridcell"
            tabIndex={0}
            data-field={colId}
            data-row-index={rowIndex}
            data-col-index={colIndex}
            data-copy-value={copyText || undefined}
            className={[
              'MuiDataGrid-cell',
              isPinned ? 'MuiDataGrid-cell--pinned' : '',
              pinnedInfo?.side === 'left'
                ? 'MuiDataGrid-cell--pinnedLeft'
                : pinnedInfo?.side === 'right'
                  ? 'MuiDataGrid-cell--pinnedRight'
                  : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                onFocusCell(
                  rowIndex,
                  Math.min(visibleColumns.length - 1, colIndex + 1),
                );
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onFocusCell(rowIndex, Math.max(0, colIndex - 1));
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                onFocusCell(
                  Math.min(totalRenderedRows - 1, rowIndex + 1),
                  colIndex,
                );
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                onFocusCell(Math.max(0, rowIndex - 1), colIndex);
              } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle(node.id);
              }
            }}
            sx={{
              ...(isPinned
                ? {
                    position: 'sticky',
                    [pinnedInfo.side as 'left' | 'right']:
                      `${pinnedInfo.offset}px`,
                    zIndex: 2,
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
              '&:focus': {
                outline: 'solid var(--DataGrid-focusOutlineColor, #1976D2) 1px',
                outlineOffset: '-1px',
              },
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
                  left: hasLeftSectionBorder ? 'calc(100% + 1px)' : '100%',
                  opacity: isScrolledLeft ? 1 : 0,
                }}
              />
            )}
            {isRightBoundary && showPinnedShadow && (
              <Box
                aria-hidden="true"
                className="MuiDataGrid-scrollShadow MuiDataGrid-scrollShadow--right"
                sx={{
                  right: hasRightSectionBorder ? 'calc(100% + 1px)' : '100%',
                  opacity: isScrolledRight ? 1 : 0,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
