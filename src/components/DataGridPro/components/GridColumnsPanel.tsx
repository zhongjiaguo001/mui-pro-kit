import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Popover,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import type { GridValidRowModel } from '../types';
import type { ColumnMetaExt, DataGridReactTable } from '../core/useDataGridPro';
import {
  GRID_CHECKBOX_SELECTION_FIELD,
  GRID_DETAIL_PANEL_TOGGLE_FIELD,
  GRID_REORDER_COL_FIELD,
  isHierarchyColId,
  type PinnedColumnLayout,
} from '../core/gridCore';
import {
  GRID_ZH_CN_LOCALE_TEXT,
  type GridLocaleText,
} from '../core/localeText';

interface GridColumnsPanelProps<R extends GridValidRowModel> {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  table: DataGridReactTable<R>;
  pinnedLayout?: Record<string, PinnedColumnLayout>;
  onPinColumn?: (field: string, side: 'left' | 'right' | false) => void;
  onReorderColumn?: (
    sourceId: string,
    targetId: string,
    position: 'before' | 'after',
  ) => void;
  onShowAll: () => void;
  onResetWidths: () => void;
  onAutosizeAll?: () => void;
  localeText?: GridLocaleText;
}

export function GridColumnsPanel<R extends GridValidRowModel>({
  anchorEl,
  onClose,
  table,
  pinnedLayout,
  onPinColumn,
  onReorderColumn,
  onShowAll,
  onResetWidths,
  onAutosizeAll,
  localeText = GRID_ZH_CN_LOCALE_TEXT,
}: GridColumnsPanelProps<R>) {
  const [search, setSearch] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: 'before' | 'after';
  } | null>(null);

  const allColumns = table
    .getAllLeafColumns()
    .filter(
      (col) =>
        col.id !== GRID_CHECKBOX_SELECTION_FIELD &&
        col.id !== GRID_REORDER_COL_FIELD &&
        col.id !== GRID_DETAIL_PANEL_TOGGLE_FIELD &&
        !isHierarchyColId(col.id),
    );

  const filteredColumns = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allColumns;
    return allColumns.filter((col) => {
      const meta = col.columnDef.meta as ColumnMetaExt<R> | undefined;
      const label = (meta?.colDef.headerName ?? col.id).toLowerCase();
      return label.includes(q) || col.id.toLowerCase().includes(q);
    });
  }, [allColumns, search]);

  const hiddenCount = allColumns.filter((c) => !c.getIsVisible()).length;

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          elevation: 8,
          className: 'MuiDataGrid-panel',
          'data-testid': 'columns-panel',
          sx: {
            width: 344,
            borderRadius: '4px',
            mt: 0.5,
            overflow: 'hidden',
            bgcolor: '#FFFFFF',
          },
        } as Record<string, unknown>,
      }}
    >
      <Box sx={{ px: 1.5, pt: 1.25, pb: 1 }}>
        <TextField
          fullWidth
          variant="standard"
          label={localeText.columnsManagementSearchTitle}
          placeholder={localeText.columnsManagementSearchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{ fontSize: 18, color: 'rgba(0, 0, 0, 0.54)' }}
                  />
                </InputAdornment>
              ),
              sx: { fontSize: '0.875rem' },
            },
          }}
        />
      </Box>

      <Box
        sx={{
          maxHeight: 300,
          overflowY: 'auto',
          px: 1,
          py: 0.75,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.25,
        }}
      >
        {filteredColumns.length === 0 ? (
          <Typography
            sx={{
              py: 2,
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'rgba(0, 0, 0, 0.6)',
            }}
          >
            {localeText.columnsManagementNoColumns}
          </Typography>
        ) : (
          filteredColumns.map((col) => {
            const meta = col.columnDef.meta as ColumnMetaExt<R> | undefined;
            const colDef = meta?.colDef;
            const label = colDef?.headerName ?? col.id;
            const canHide = col.getCanHide();
            const canPin = Boolean(onPinColumn && colDef?.pinnable !== false);
            const canReorder = Boolean(
              onReorderColumn &&
                colDef?.disableReorder !== true &&
                search.trim() === '',
            );
            const pinnedSide = pinnedLayout?.[col.id]?.side ?? false;
            const isPinnedLeft = pinnedSide === 'left';
            const isPinnedRight = pinnedSide === 'right';
            const isDragged = draggedId === col.id;
            const dropPos =
              dropTarget?.id === col.id && !isDragged
                ? dropTarget.position
                : null;

            return (
              <Box
                key={col.id}
                data-columns-panel-item={col.id}
                draggable={canReorder}
                onDragStart={(e) => {
                  if (!canReorder) return;
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', col.id);
                  setDraggedId(col.id);
                }}
                onDragOver={(e) => {
                  if (!canReorder || !draggedId || draggedId === col.id) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos: 'before' | 'after' =
                    e.clientY >= rect.top + rect.height / 2
                      ? 'after'
                      : 'before';
                  setDropTarget((prev) =>
                    prev?.id === col.id && prev.position === pos
                      ? prev
                      : { id: col.id, position: pos },
                  );
                }}
                onDrop={(e) => {
                  if (!canReorder || !onReorderColumn) return;
                  e.preventDefault();
                  const srcId =
                    draggedId ?? e.dataTransfer.getData('text/plain');
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos: 'before' | 'after' =
                    e.clientY >= rect.top + rect.height / 2
                      ? 'after'
                      : 'before';
                  if (srcId && srcId !== col.id) {
                    onReorderColumn(srcId, col.id, pos);
                  }
                  setDraggedId(null);
                  setDropTarget(null);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDropTarget(null);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 0.5,
                  py: 0.25,
                  borderRadius: '4px',
                  opacity: isDragged ? 0.45 : 1,
                  boxShadow:
                    dropPos === 'before'
                      ? 'inset 0 2px 0 0 #1976D2'
                      : dropPos === 'after'
                        ? 'inset 0 -2px 0 0 #1976D2'
                        : 'none',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.03)',
                  },
                }}
              >
                {onReorderColumn && (
                  <Box
                    aria-hidden="true"
                    title={canReorder ? '拖拽调整列顺序' : undefined}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: canReorder
                        ? 'rgba(0, 0, 0, 0.38)'
                        : 'rgba(0, 0, 0, 0.16)',
                      cursor: canReorder ? 'grab' : 'default',
                      flexShrink: 0,
                    }}
                  >
                    <DragIndicatorIcon sx={{ fontSize: 16 }} />
                  </Box>
                )}

                <Switch
                  size="small"
                  checked={col.getIsVisible()}
                  disabled={!canHide}
                  onChange={col.getToggleVisibilityHandler()}
                  slotProps={{ input: { 'aria-label': `切换显示${label}` } }}
                />

                <Typography
                  noWrap
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: '0.84rem',
                    color: canHide
                      ? 'rgba(0, 0, 0, 0.87)'
                      : 'rgba(0, 0, 0, 0.45)',
                  }}
                >
                  {label}
                </Typography>

                {canPin && onPinColumn && (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.25,
                      flexShrink: 0,
                    }}
                  >
                    <Tooltip
                      title={
                        isPinnedLeft
                          ? localeText.columnsManagementUnpinTooltip
                          : localeText.columnsManagementPinLeftTooltip
                      }
                      enterDelay={450}
                    >
                      <IconButton
                        size="small"
                        aria-label={
                          isPinnedLeft
                            ? `${localeText.columnsManagementUnpinTooltip} ${label}`
                            : `${localeText.columnsManagementPinLeftTooltip} ${label}`
                        }
                        onClick={() =>
                          onPinColumn(col.id, isPinnedLeft ? false : 'left')
                        }
                        sx={{
                          p: 0.4,
                          color: isPinnedLeft
                            ? '#1976D2'
                            : 'rgba(0, 0, 0, 0.38)',
                          bgcolor: isPinnedLeft
                            ? 'rgba(25, 118, 210, 0.1)'
                            : 'transparent',
                          '&:hover': {
                            color: '#1976D2',
                            bgcolor: 'rgba(25, 118, 210, 0.08)',
                          },
                        }}
                      >
                        <PushPinOutlinedIcon
                          sx={{ fontSize: 15, transform: 'rotate(-45deg)' }}
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        isPinnedRight
                          ? localeText.columnsManagementUnpinTooltip
                          : localeText.columnsManagementPinRightTooltip
                      }
                      enterDelay={450}
                    >
                      <IconButton
                        size="small"
                        aria-label={
                          isPinnedRight
                            ? `${localeText.columnsManagementUnpinTooltip} ${label}`
                            : `${localeText.columnsManagementPinRightTooltip} ${label}`
                        }
                        onClick={() =>
                          onPinColumn(col.id, isPinnedRight ? false : 'right')
                        }
                        sx={{
                          p: 0.4,
                          color: isPinnedRight
                            ? '#1976D2'
                            : 'rgba(0, 0, 0, 0.38)',
                          bgcolor: isPinnedRight
                            ? 'rgba(25, 118, 210, 0.1)'
                            : 'transparent',
                          '&:hover': {
                            color: '#1976D2',
                            bgcolor: 'rgba(25, 118, 210, 0.08)',
                          },
                        }}
                      >
                        <PushPinOutlinedIcon
                          sx={{ fontSize: 15, transform: 'rotate(45deg)' }}
                        />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            );
          })
        )}
      </Box>

      <Divider />

      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 0.5,
          bgcolor: '#FFFFFF',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          {onAutosizeAll && (
            <Button
              size="small"
              color="primary"
              onClick={onAutosizeAll}
              sx={{ fontSize: '0.8125rem', px: 0.75 }}
            >
              {localeText.columnsManagementAutosize}
            </Button>
          )}
          <Button
            size="small"
            color="primary"
            onClick={onResetWidths}
            sx={{ fontSize: '0.8125rem', px: 0.75 }}
          >
            {localeText.columnsManagementReset}
          </Button>
        </Box>
        <Button
          size="small"
          color="primary"
          disabled={hiddenCount === 0}
          onClick={onShowAll}
          sx={{ fontSize: '0.8125rem', px: 0.75 }}
        >
          {localeText.columnsManagementShowAll}
        </Button>
      </Box>
    </Popover>
  );
}

