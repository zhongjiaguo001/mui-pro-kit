import React from 'react';
import { Box, TablePagination, Typography } from '@mui/material';
import type { GridCellRangeStats, GridSlotComponent } from '../types';
import {
  GRID_ZH_CN_LOCALE_TEXT,
  type GridLocaleText,
} from '../core/localeText';
import { renderGridSlot } from '../core/gridApiHelpers';

export interface GridFooterProps {
  totalFilteredRows: number;
  totalRows: number;
  loadedRowCount?: number;
  serverMode?: boolean;
  selectedCount: number;
  paginationEnabled: boolean;
  hideSelectedRowCount?: boolean;
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  treeVisibleRowCount?: number | null;
  hierarchyMode?: 'tree' | 'rowGrouping' | null;
  cellRangeStats?: GridCellRangeStats | null;
  localeText?: GridLocaleText;
  paginationSlot?: GridSlotComponent;
  paginationSlotProps?: Record<string, unknown>;
}

export function GridFooter({
  totalFilteredRows,
  totalRows,
  loadedRowCount,
  serverMode = false,
  selectedCount,
  paginationEnabled,
  hideSelectedRowCount = false,
  page,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  treeVisibleRowCount,
  hierarchyMode = null,
  cellRangeStats = null,
  localeText = GRID_ZH_CN_LOCALE_TEXT,
  paginationSlot,
  paginationSlotProps,
}: GridFooterProps) {
  const showRangeStats =
    cellRangeStats !== null && cellRangeStats.cellCount > 1;
  const isProgressiveLazy =
    !paginationEnabled &&
    typeof loadedRowCount === 'number' &&
    totalRows > loadedRowCount;

  const customPagination = paginationEnabled
    ? renderGridSlot(
        paginationSlot,
        {
          count: totalFilteredRows,
          page,
          pageSize,
          pageSizeOptions,
          onPageChange,
          onPageSizeChange,
          localeText,
        },
        paginationSlotProps,
      )
    : undefined;

  return (
    <Box
      className="MuiDataGrid-footerContainer"
      sx={{
        minHeight: 52,
        px: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
        borderTop: '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
        bgcolor: 'var(--DataGrid-containerBackground, #FFFFFF)',
      }}
    >
      {/* Left: MUI X MuiDataGrid-selectedRowCount + Live Cell Range Statistics */}
      <Box
        className="MuiDataGrid-selectedRowCount"
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          fontSize: '0.875rem',
          color: 'rgba(0, 0, 0, 0.87)',
        }}
      >
        {selectedCount > 0 && !hideSelectedRowCount ? (
          <Typography
            component="span"
            className="tabular-nums"
            sx={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.87)' }}
          >
            {localeText.footerRowSelected(selectedCount)}
          </Typography>
        ) : (
          <Typography
            component="span"
            className="tabular-nums"
            sx={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}
          >
            {typeof treeVisibleRowCount === 'number'
              ? hierarchyMode === 'rowGrouping'
                ? localeText.footerRowGroupingRows(
                    treeVisibleRowCount,
                    totalFilteredRows,
                  )
                : localeText.footerTreeDataRows(
                    treeVisibleRowCount,
                    totalFilteredRows,
                  )
              : isProgressiveLazy
                ? localeText.footerLoadedRows(loadedRowCount, totalRows)
                : serverMode
                  ? localeText.footerServerModeRows(totalFilteredRows)
                  : totalFilteredRows !== totalRows
                    ? localeText.footerTotalVisibleRows(
                        totalFilteredRows,
                        totalRows,
                      )
                    : localeText.footerTotalRows(totalRows)}
          </Typography>
        )}

        {showRangeStats && cellRangeStats && (
          <Box
            data-testid="cell-range-stats"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              pl: 1.25,
              borderLeft: '1px solid #E0E0E0',
              fontSize: '0.8125rem',
              color: '#1976D2',
            }}
          >
            <Typography
              component="span"
              className="font-mono-tabular"
              sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1976D2' }}
            >
              {localeText.footerCellRangeStats(
                cellRangeStats.cellCount,
                cellRangeStats.numericCount > 0 ? cellRangeStats.sum : null,
                cellRangeStats.numericCount > 0 ? cellRangeStats.avg : null,
              )}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Right: Custom pagination slot or Native MUI TablePagination */}
      {paginationEnabled &&
        (customPagination !== undefined ? (
          customPagination
        ) : (
          <TablePagination
            component="div"
            count={totalFilteredRows}
            page={Math.min(
              page,
              Math.max(0, Math.ceil(totalFilteredRows / pageSize) - 1),
            )}
            onPageChange={(_, nextPage) => onPageChange(nextPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              onPageSizeChange(Number(e.target.value));
            }}
            rowsPerPageOptions={pageSizeOptions}
            labelRowsPerPage={localeText.MuiTablePagination.labelRowsPerPage}
            labelDisplayedRows={localeText.MuiTablePagination.labelDisplayedRows}
            showFirstButton
            showLastButton
            sx={{
              border: 'none',
              '& .MuiTablePagination-toolbar': {
                minHeight: 52,
                px: 0,
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                m: 0,
              },
            }}
          />
        ))}
    </Box>
  );
}
