import React from 'react';
import {
  Box,
  Checkbox,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import type { Header } from '@tanstack/react-table';
import type {
  GridPinnedColumnsSectionSeparator,
  GridValidRowModel,
} from '../types';
import type {
  ColumnMetaExt,
  DataGridFeatures,
  DataGridReactTable,
} from '../core/useDataGridPro';
import {
  GRID_CHECKBOX_SELECTION_FIELD,
  GRID_DETAIL_PANEL_TOGGLE_FIELD,
  GRID_REORDER_COL_FIELD,
  getDefaultAlignForType,
  isHierarchyColId,
  type DensityMetrics,
  type PinnedColumnLayout,
} from '../core/gridCore';

interface GridColumnHeaderProps<R extends GridValidRowModel> {
  header: Header<DataGridFeatures, R, unknown>;
  table: DataGridReactTable<R>;
  densityMetrics: DensityMetrics;
  pinnedInfo?: PinnedColumnLayout;
  pinnedColumnsSectionSeparator?: GridPinnedColumnsSectionSeparator;
  showColumnVerticalBorder: boolean;
  isScrolledLeft: boolean;
  isScrolledRight: boolean;
  onOpenMenu: (event: React.MouseEvent<HTMLButtonElement>, field: string) => void;
  isMenuOpenForColumn: boolean;
  disableColumnReorder?: boolean;
  isDragging?: boolean;
  onColumnDragStart?: (field: string) => void;
  onColumnDragEnter?: (field: string) => void;
  onColumnDragEnd?: () => void;
  isFirstHierarchyCol?: boolean;
  isAnyTreeGroupExpanded?: boolean;
  onToggleAllTreeGroups?: () => void;
  disableMultipleRowSelection?: boolean;
  disableColumnMenu?: boolean;
  onToggleSort?: (field: string, isMulti: boolean) => void;
  onColumnHeaderClick?: (field: string) => void;
}

/**
 * Renders a crisp MUI X floating header drag ghost element for DataTransfer.setDragImage.
 */
function attachMuixDragGhost(
  e: React.DragEvent<HTMLDivElement>,
  label: string,
) {
  const ghost = document.createElement('div');
  ghost.textContent = label;
  ghost.style.position = 'fixed';
  ghost.style.top = '-9999px';
  ghost.style.left = '-9999px';
  ghost.style.padding = '8px 14px';
  ghost.style.background = '#FFFFFF';
  ghost.style.color = 'rgba(0, 0, 0, 0.87)';
  ghost.style.border = '1px solid #1976D2';
  ghost.style.borderRadius = '4px';
  ghost.style.boxShadow =
    '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)';
  ghost.style.fontSize = '14px';
  ghost.style.fontWeight = '500';
  ghost.style.fontFamily =
    "'Plus Jakarta Sans', 'Noto Sans SC', -apple-system, sans-serif";
  ghost.style.whiteSpace = 'nowrap';
  ghost.style.pointerEvents = 'none';
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 24, 18);
  requestAnimationFrame(() => {
    if (ghost.parentNode) {
      ghost.parentNode.removeChild(ghost);
    }
  });
}

export function GridColumnHeader<R extends GridValidRowModel>({
  header,
  table,
  densityMetrics,
  pinnedInfo,
  pinnedColumnsSectionSeparator = 'border-and-shadow',
  showColumnVerticalBorder,
  isScrolledLeft,
  isScrolledRight,
  onOpenMenu,
  isMenuOpenForColumn,
  disableColumnReorder = false,
  isDragging = false,
  onColumnDragStart,
  onColumnDragEnter,
  onColumnDragEnd,
  isFirstHierarchyCol = true,
  isAnyTreeGroupExpanded = false,
  onToggleAllTreeGroups,
  disableMultipleRowSelection = false,
  disableColumnMenu = false,
  onToggleSort,
  onColumnHeaderClick,
}: GridColumnHeaderProps<R>) {
  const column = header.column;
  const meta = column.columnDef.meta as ColumnMetaExt<R> | undefined;
  const colDef = meta?.colDef;
  const isCheckboxCol = column.id === GRID_CHECKBOX_SELECTION_FIELD;
  const isReorderCol = column.id === GRID_REORDER_COL_FIELD;
  const isDetailToggleCol = column.id === GRID_DETAIL_PANEL_TOGGLE_FIELD;
  const isTreeGroupCol = isHierarchyColId(column.id);
  const isUtilityCol = isCheckboxCol || isReorderCol || isDetailToggleCol;
  const isActionsCol = colDef?.type === 'actions';
  const canSort = column.getCanSort();
  const canResize = column.getCanResize();
  const canReorder =
    !disableColumnReorder &&
    !isUtilityCol &&
    !isTreeGroupCol &&
    !isActionsCol &&
    colDef?.disableReorder !== true;
  const sortDirection = column.getIsSorted();
  const sortIndex = column.getSortIndex();
  const totalSorted = table.state.sorting.length;
  const isResizing = column.getIsResizing();

  const headerAlign =
    colDef?.headerAlign ??
    colDef?.align ??
    getDefaultAlignForType(colDef?.type);

  const isPinned = pinnedInfo && pinnedInfo.side !== false;
  const isLeftBoundary = pinnedInfo?.side === 'left' && pinnedInfo.isBoundary;
  const isRightBoundary = pinnedInfo?.side === 'right' && pinnedInfo.isBoundary;
  const showPinnedBorder =
    pinnedColumnsSectionSeparator === 'border-and-shadow' ||
    pinnedColumnsSectionSeparator === 'border';
  const showPinnedShadow =
    pinnedColumnsSectionSeparator === 'border-and-shadow' ||
    pinnedColumnsSectionSeparator === 'shadow';
  const hasLeftSectionBorder = isLeftBoundary && showPinnedBorder;
  const hasRightSectionBorder = isRightBoundary && showPinnedBorder;

  const stickyStyles: Record<string, unknown> = isPinned
    ? {
        position: 'sticky',
        [pinnedInfo.side as 'left' | 'right']: `${pinnedInfo.offset}px`,
        zIndex: 4,
      }
    : {
        position: 'relative',
        zIndex: 2,
      };

  const handleSortClick = (e: React.MouseEvent) => {
    onColumnHeaderClick?.(column.id);
    if (!canSort) return;
    if (onToggleSort) {
      onToggleSort(column.id, e.shiftKey);
      return;
    }
    const handler = column.getToggleSortingHandler();
    handler?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!canSort) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onToggleSort) {
        onToggleSort(column.id, e.shiftKey);
      } else {
        column.toggleSorting(undefined, e.shiftKey);
      }
    }
  };

  const headerLabel = colDef?.headerName ?? column.id;

  return (
    <Box
      role="columnheader"
      className={[
        'MuiDataGrid-columnHeader',
        pinnedInfo?.side === 'left' ? 'MuiDataGrid-columnHeader--pinnedLeft' : '',
        pinnedInfo?.side === 'right' ? 'MuiDataGrid-columnHeader--pinnedRight' : '',
        isDragging ? 'MuiDataGrid-columnHeader--dragging' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-sort={
        sortDirection === 'asc'
          ? 'ascending'
          : sortDirection === 'desc'
            ? 'descending'
            : 'none'
      }
      data-field={column.id}
      draggable={canReorder && !isResizing}
      onDragStart={(e) => {
        if (!canReorder || isResizing) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', column.id);
        attachMuixDragGhost(e, headerLabel);
        onColumnDragStart?.(column.id);
      }}
      onDragEnter={(e) => {
        if (!canReorder) return;
        e.preventDefault();
        onColumnDragEnter?.(column.id);
      }}
      onDragOver={(e) => {
        if (!canReorder) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onColumnDragEnter?.(column.id);
      }}
      onDrop={(e) => {
        if (!canReorder) return;
        e.preventDefault();
        onColumnDragEnd?.();
      }}
      onDragEnd={() => {
        onColumnDragEnd?.();
      }}
      sx={{
        ...stickyStyles,
        width: header.getSize(),
        minWidth: header.getSize(),
        maxWidth: header.getSize(),
        height: densityMetrics.headerHeight,
        display: 'flex',
        alignItems: 'center',
        px: isUtilityCol ? 0 : `${densityMetrics.cellPaddingX}px`,
        justifyContent: isUtilityCol
          ? 'center'
          : headerAlign === 'right'
            ? 'flex-end'
            : headerAlign === 'center'
              ? 'center'
              : 'flex-start',
        bgcolor: isDragging
          ? 'rgba(25, 118, 210, 0.08)'
          : 'var(--DataGrid-containerBackground, #FFFFFF)',
        outline: isDragging
          ? '1px dashed rgba(25, 118, 210, 0.55)'
          : 'none',
        outlineOffset: '-1px',
        borderBottom: '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
        borderRight:
          showColumnVerticalBorder || hasLeftSectionBorder
            ? '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)'
            : 'none',
        borderLeft: hasRightSectionBorder
          ? '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)'
          : 'none',
        userSelect: 'none',
        boxSizing: 'border-box',
        transition: 'background-color 140ms ease',
        '&:focus-within': {
          outline: 'solid var(--DataGrid-focusOutlineColor, #1976D2) 1px',
          outlineOffset: '-1px',
          '& .MuiDataGrid-menuIcon': {
            width: 28,
            opacity: 1,
            visibility: 'visible',
          },
        },
        '&:hover': {
          '& .MuiDataGrid-menuIcon': {
            width: 28,
            opacity: 1,
            visibility: 'visible',
          },
          '& .MuiDataGrid-sortIconHint': {
            width: 26,
            opacity: 0.5,
          },
        },
      }}
    >
      {isCheckboxCol ? (
        disableMultipleRowSelection ? null : (
          <Checkbox
            size="medium"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={
              table.getIsSomePageRowsSelected() &&
              !table.getIsAllPageRowsSelected()
            }
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            slotProps={{ input: { 'aria-label': '全选当前页行' } }}
            sx={{
              p: 1,
              color: 'rgba(0, 0, 0, 0.6)',
              '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                color: '#1976D2',
              },
            }}
          />
        )
      ) : isDetailToggleCol || isReorderCol ? null : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            minWidth: 0,
            flexDirection: headerAlign === 'right' ? 'row-reverse' : 'row',
            justifyContent:
              headerAlign === 'center' ? 'center' : 'space-between',
          }}
        >
          {/* MuiDataGrid-columnHeaderTitleContainer */}
          <Box
            component={canSort ? 'button' : 'div'}
            type={canSort ? 'button' : undefined}
            onClick={handleSortClick}
            onKeyDown={handleKeyDown}
            title={
              canSort
                ? `${headerLabel}（点击排序，Shift+点击多列排序，拖拽可实时换位）`
                : headerLabel
            }
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              flexDirection: headerAlign === 'right' ? 'row-reverse' : 'row',
              gap: 0.5,
              minWidth: 0,
              flex: headerAlign === 'center' ? '0 1 auto' : '1 1 auto',
              background: 'none',
              border: 'none',
              p: 0,
              m: 0,
              cursor: canSort ? 'pointer' : 'default',
              textAlign: headerAlign,
              color: 'rgba(0, 0, 0, 0.87)',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          >
            {isPinned && !isActionsCol && (
              <PushPinOutlinedIcon
                sx={{
                  fontSize: 14,
                  color: 'rgba(0, 0, 0, 0.54)',
                  flexShrink: 0,
                  transform: 'rotate(35deg)',
                }}
              />
            )}

            {colDef?.renderHeader ? (
              colDef.renderHeader({ field: column.id, colDef })
            ) : (
              <Typography
                component="span"
                noWrap
                className="MuiDataGrid-columnHeaderTitle"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'rgba(0, 0, 0, 0.87)',
                }}
              >
                {headerLabel}
              </Typography>
            )}

            {/* Official MUI X circular icon button container for Sort Arrow */}
            {canSort && (
              <Tooltip title="排序" enterDelay={500}>
                <Box
                  component="span"
                  className={
                    sortDirection
                      ? 'MuiDataGrid-sortIcon'
                      : 'MuiDataGrid-sortIconHint'
                  }
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.25,
                    flexShrink: 0,
                    overflow: 'hidden',
                    width: sortDirection ? 'auto' : 0,
                    height: 26,
                    minWidth: sortDirection ? 26 : 0,
                    borderRadius: '50%',
                    opacity: sortDirection ? 1 : 0,
                    transition: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  {sortDirection === 'asc' && (
                    <ArrowUpwardIcon
                      sx={{ fontSize: 18, color: 'rgba(0, 0, 0, 0.54)' }}
                    />
                  )}
                  {sortDirection === 'desc' && (
                    <ArrowDownwardIcon
                      sx={{ fontSize: 18, color: 'rgba(0, 0, 0, 0.54)' }}
                    />
                  )}
                  {!sortDirection && (
                    <ArrowUpwardIcon
                      sx={{ fontSize: 18, color: 'rgba(0, 0, 0, 0.38)' }}
                    />
                  )}
                  {sortDirection && totalSorted > 1 && sortIndex >= 0 && (
                    <Box
                      component="span"
                      className="font-mono-tabular"
                      sx={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: '#1976D2',
                        lineHeight: 1,
                        mr: 0.25,
                      }}
                    >
                      {sortIndex + 1}
                    </Box>
                  )}
                </Box>
              </Tooltip>
            )}
          </Box>

          {/* Tree Data Expand/Collapse All Toggle OR Official MUI X MuiDataGrid-menuIcon */}
          {isTreeGroupCol && isFirstHierarchyCol && onToggleAllTreeGroups ? (
            <Tooltip
              title={isAnyTreeGroupExpanded ? '收起全部层级' : '展开全部层级'}
              enterDelay={350}
            >
              <IconButton
                size="small"
                aria-label={
                  isAnyTreeGroupExpanded ? '收起全部层级' : '展开全部层级'
                }
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAllTreeGroups();
                }}
                sx={{
                  p: 0.4,
                  color: 'rgba(0, 0, 0, 0.54)',
                  flexShrink: 0,
                  '&:hover': {
                    color: '#1976D2',
                    bgcolor: 'rgba(25, 118, 210, 0.06)',
                  },
                }}
              >
                {isAnyTreeGroupExpanded ? (
                  <UnfoldLessIcon sx={{ fontSize: 18 }} />
                ) : (
                  <UnfoldMoreIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>
          ) : (
            !disableColumnMenu &&
            !isActionsCol &&
            !isTreeGroupCol && (
              <Box
                className="MuiDataGrid-menuIcon"
                sx={{
                  width: isMenuOpenForColumn ? 28 : 0,
                  opacity: isMenuOpenForColumn ? 1 : 0,
                  visibility: isMenuOpenForColumn ? 'visible' : 'hidden',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Tooltip title={`「${headerLabel}」列菜单`} enterDelay={500}>
                  <IconButton
                    size="small"
                    aria-label={`${headerLabel}列菜单`}
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpenForColumn ? 'true' : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMenu(e, column.id);
                    }}
                    sx={{
                      p: 0.4,
                      color: 'rgba(0, 0, 0, 0.54)',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <MoreVertIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )
          )}
        </Box>
      )}

      {/* Official MUI X MuiDataGrid-columnSeparator (2px rounded vertical bar) */}
      {!isUtilityCol && canResize && (
        <Box
          className="MuiDataGrid-columnSeparator"
          draggable={false}
          onMouseDown={(e) => {
            e.stopPropagation();
            header.getResizeHandler()(e);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            header.getResizeHandler()(e);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            column.resetSize();
          }}
          title="拖拽调整列宽，双击重置默认宽度"
          sx={{
            position: 'absolute',
            right: -5,
            top: 0,
            bottom: 0,
            width: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'col-resize',
            userSelect: 'none',
            touchAction: 'none',
            zIndex: 6,
            '&:hover .MuiDataGrid-separatorIcon': {
              bgcolor: '#1976D2',
            },
          }}
        >
          <Box
            className="MuiDataGrid-separatorIcon"
            sx={{
              width: '2px',
              height: isResizing ? '28px' : '18px',
              borderRadius: '1px',
              bgcolor: isResizing
                ? '#1976D2'
                : hasLeftSectionBorder
                  ? 'transparent'
                  : '#E0E0E0',
              transition: 'background-color 140ms ease, height 140ms ease',
            }}
          />
        </Box>
      )}

      {/* Official MUI X DataGrid Pro continuous pinned-column scroll shadow */}
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
}
