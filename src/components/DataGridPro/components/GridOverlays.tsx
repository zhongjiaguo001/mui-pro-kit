import React from 'react';
import { Box, Button, LinearProgress, Skeleton, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import type { DensityMetrics } from '../core/gridCore';
import {
  GRID_ZH_CN_LOCALE_TEXT,
  type GridLocaleText,
} from '../core/localeText';

interface GridLoadingOverlayProps {
  densityMetrics: DensityMetrics;
  columnWidths: number[];
  rowCount?: number;
  localeText?: GridLocaleText;
}

export function GridLoadingOverlay({
  densityMetrics,
  columnWidths,
  rowCount = 9,
  localeText = GRID_ZH_CN_LOCALE_TEXT,
}: GridLoadingOverlayProps) {
  return (
    <Box
      role="status"
      aria-label={localeText.loadingOverlayLabel}
      className="MuiDataGrid-loadingOverlay"
      sx={{
        position: 'absolute',
        inset: 0,
        bgcolor: 'rgba(255, 255, 255, 0.94)',
        zIndex: 6,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <LinearProgress sx={{ height: 3 }} />
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {Array.from({ length: rowCount }).map((_, rowIdx) => (
          <Box
            key={rowIdx}
            sx={{
              height: densityMetrics.rowHeight,
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
            }}
          >
            {columnWidths.map((w, colIdx) => (
              <Box
                key={colIdx}
                sx={{
                  width: w,
                  minWidth: w,
                  px: `${densityMetrics.cellPaddingX}px`,
                  boxSizing: 'border-box',
                }}
              >
                <Skeleton
                  variant="text"
                  height={20}
                  width={`${48 + ((rowIdx * 17 + colIdx * 23) % 38)}%`}
                  sx={{ bgcolor: 'rgba(0, 0, 0, 0.08)' }}
                />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

interface GridEmptyOverlayProps {
  hasActiveFilter: boolean;
  onClearFilters: () => void;
  emptyStateAction?: {
    label: string;
    onClick: () => void;
  };
  localeText?: GridLocaleText;
}

export function GridEmptyOverlay({
  hasActiveFilter,
  onClearFilters,
  emptyStateAction,
  localeText = GRID_ZH_CN_LOCALE_TEXT,
}: GridEmptyOverlayProps) {
  return (
    <Box
      className="MuiDataGrid-overlay"
      sx={{
        py: 9,
        px: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1.25,
      }}
    >
      {hasActiveFilter ? (
        <>
          <SearchOffIcon sx={{ fontSize: 38, color: 'rgba(0, 0, 0, 0.38)' }} />
          <Typography
            sx={{ fontSize: '0.9375rem', fontWeight: 500, color: 'rgba(0, 0, 0, 0.87)' }}
          >
            {localeText.noResultsOverlayLabel}
          </Typography>
          <Typography
            sx={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)', maxWidth: 360 }}
          >
            {localeText.noResultsOverlayDescription}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={onClearFilters}
            sx={{ mt: 0.75 }}
          >
            {localeText.clearFiltersButtonLabel}
          </Button>
        </>
      ) : (
        <>
          <InboxOutlinedIcon sx={{ fontSize: 38, color: 'rgba(0, 0, 0, 0.38)' }} />
          <Typography
            sx={{ fontSize: '0.9375rem', fontWeight: 500, color: 'rgba(0, 0, 0, 0.87)' }}
          >
            {localeText.noRowsLabel}
          </Typography>
          <Typography
            sx={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)', maxWidth: 360 }}
          >
            {localeText.noRowsDescription}
          </Typography>
          {emptyStateAction && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={emptyStateAction.onClick}
              sx={{ mt: 0.75 }}
            >
              {emptyStateAction.label}
            </Button>
          )}
        </>
      )}
    </Box>
  );
}
