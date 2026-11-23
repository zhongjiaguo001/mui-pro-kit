import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import type { GridPinnedColumnsSectionSeparator } from '../types';
import type { ComputedColumnGroupCell } from '../core/gridCore';

interface GridColumnGroupHeaderRowProps {
  cells: ComputedColumnGroupCell[];
  height: number;
  pinnedColumnsSectionSeparator: GridPinnedColumnsSectionSeparator;
  showColumnVerticalBorder: boolean;
  isScrolledLeft: boolean;
  isScrolledRight: boolean;
}

export function GridColumnGroupHeaderRow({
  cells,
  height,
  pinnedColumnsSectionSeparator,
  showColumnVerticalBorder,
  isScrolledLeft,
  isScrolledRight,
}: GridColumnGroupHeaderRowProps) {
  const showPinnedBorder =
    pinnedColumnsSectionSeparator === 'border-and-shadow' ||
    pinnedColumnsSectionSeparator === 'border';
  const showPinnedShadow =
    pinnedColumnsSectionSeparator === 'border-and-shadow' ||
    pinnedColumnsSectionSeparator === 'shadow';

  return (
    <Box
      role="row"
      className="MuiDataGrid-columnHeaderRow MuiDataGrid-columnHeaderRow--group"
      sx={{
        display: 'flex',
        width: '100%',
        height,
        bgcolor: 'var(--DataGrid-containerBackground, #FFFFFF)',
      }}
    >
      {cells.map((cell, idx) => {
        const isPinned = cell.pinnedSide !== false;
        const hasLeftSectionBorder = cell.isLeftBoundary && showPinnedBorder;
        const hasRightSectionBorder = cell.isRightBoundary && showPinnedBorder;
        const nextCell = cells[idx + 1];
        const hasGroupSeparator =
          Boolean(cell.groupId) &&
          nextCell !== undefined &&
          nextCell.pinnedSide === cell.pinnedSide &&
          nextCell.groupId !== cell.groupId;

        const justify =
          cell.headerAlign === 'right'
            ? 'flex-end'
            : cell.headerAlign === 'center'
              ? 'center'
              : 'flex-start';

        return (
          <Box
            key={cell.key}
            role="columnheader"
            data-group-id={cell.groupId ?? undefined}
            className={[
              'MuiDataGrid-columnHeader',
              'MuiDataGrid-columnHeader--group',
              cell.pinnedSide === 'left'
                ? 'MuiDataGrid-columnHeader--pinnedLeft'
                : cell.pinnedSide === 'right'
                  ? 'MuiDataGrid-columnHeader--pinnedRight'
                  : '',
            ]
              .filter(Boolean)
              .join(' ')}
            sx={{
              ...(isPinned
                ? {
                    position: 'sticky',
                    [cell.pinnedSide as 'left' | 'right']:
                      `${cell.pinnedOffset}px`,
                    zIndex: 4,
                  }
                : {
                    position: 'relative',
                    zIndex: 2,
                  }),
              width: cell.width,
              minWidth: cell.width,
              maxWidth: cell.width,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: justify,
              px: '10px',
              bgcolor: 'var(--DataGrid-containerBackground, #FFFFFF)',
              borderBottom: '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
              borderRight:
                showColumnVerticalBorder ||
                hasLeftSectionBorder ||
                hasGroupSeparator
                  ? '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)'
                  : 'none',
              borderLeft: hasRightSectionBorder
                ? '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)'
                : 'none',
              boxSizing: 'border-box',
              userSelect: 'none',
            }}
          >
            {cell.headerName && (
              <Tooltip
                title={cell.description ?? ''}
                disableHoverListener={!cell.description}
                enterDelay={400}
              >
                <Typography
                  component="span"
                  noWrap
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                    color: 'rgba(0, 0, 0, 0.72)',
                  }}
                >
                  {cell.headerName}
                </Typography>
              </Tooltip>
            )}

            {cell.isLeftBoundary && showPinnedShadow && (
              <Box
                aria-hidden="true"
                className="MuiDataGrid-scrollShadow MuiDataGrid-scrollShadow--left"
                sx={{
                  left: hasLeftSectionBorder ? 'calc(100% + 1px)' : '100%',
                  opacity: isScrolledLeft ? 1 : 0,
                }}
              />
            )}
            {cell.isRightBoundary && showPinnedShadow && (
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
