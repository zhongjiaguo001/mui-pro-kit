import React, { useState } from 'react';
import { Box, Button, Chip, Tooltip, Typography } from '@mui/material';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import type {
  GridColDef,
  GridRowGroupingColumnMode,
  GridRowGroupingModel,
  GridValidRowModel,
} from '../types';

interface GridRowGroupingBarProps<R extends GridValidRowModel> {
  rowGroupingModel: GridRowGroupingModel;
  columns: GridColDef<R>[];
  isColumnDragging?: boolean;
  hasTreeData?: boolean;
  rowGroupingColumnMode: GridRowGroupingColumnMode;
  onRowGroupingColumnModeChange: (mode: GridRowGroupingColumnMode) => void;
  onAddGroupField: (field: string) => void;
  onReorderGroupFields: (sourceField: string, targetField: string) => void;
  onRemoveGroupField: (field: string) => void;
  onClearGrouping: () => void;
}

const GROUP_CHIP_MIME = 'application/x-datagrid-group-chip';

export function GridRowGroupingBar<R extends GridValidRowModel>({
  rowGroupingModel,
  columns,
  isColumnDragging = false,
  hasTreeData = false,
  rowGroupingColumnMode,
  onRowGroupingColumnModeChange,
  onAddGroupField,
  onReorderGroupFields,
  onRemoveGroupField,
  onClearGrouping,
}: GridRowGroupingBarProps<R>) {
  const [isDropOver, setIsDropOver] = useState(false);
  const [draggedChip, setDraggedChip] = useState<string | null>(null);
  const [dropTargetChip, setDropTargetChip] = useState<string | null>(null);

  const shouldShow =
    rowGroupingModel.length > 0 || (isColumnDragging && !hasTreeData);
  if (!shouldShow) return null;

  const colMap = new Map(columns.map((c) => [c.field, c]));

  return (
    <Box
      role="region"
      aria-label="行分组维度栏"
      data-testid="row-grouping-bar"
      className="MuiDataGrid-rowGroupingBar"
      onDragOver={(e) => {
        if (draggedChip) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDropOver) setIsDropOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsDropOver(false);
        }
      }}
      onDrop={(e) => {
        setIsDropOver(false);
        const chipField = e.dataTransfer.getData(GROUP_CHIP_MIME);
        if (chipField) return;
        e.preventDefault();
        const colField = e.dataTransfer.getData('text/plain');
        if (colField) {
          onAddGroupField(colField);
        }
      }}
      sx={{
        px: 1.5,
        py: 0.75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
        bgcolor: isDropOver ? 'rgba(25, 118, 210, 0.08)' : '#F8FAFC',
        borderBottom: isDropOver
          ? '1px dashed #1976D2'
          : '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
        transition: 'background-color 140ms ease, border-color 140ms ease',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.75,
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'rgba(0, 0, 0, 0.6)',
            mr: 0.25,
          }}
        >
          <AccountTreeOutlinedIcon sx={{ fontSize: 16, color: '#1976D2' }} />
          <Typography
            component="span"
            sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#334155' }}
          >
            分组维度：
          </Typography>
        </Box>

        {rowGroupingModel.length === 0 ? (
          <Typography
            component="span"
            sx={{
              fontSize: '0.8125rem',
              color: isDropOver ? '#1976D2' : '#64748B',
              fontWeight: isDropOver ? 500 : 400,
            }}
          >
            拖拽列头至此区域即可按该列进行分组
          </Typography>
        ) : (
          rowGroupingModel.map((field, idx) => {
            const label = colMap.get(field)?.headerName ?? field;
            const isChipBeingDragged = draggedChip === field;
            const isChipDropTarget =
              dropTargetChip === field && draggedChip !== null && draggedChip !== field;
            return (
              <React.Fragment key={field}>
                {idx > 0 && (
                  <ChevronRightIcon
                    sx={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.38)' }}
                  />
                )}
                <Chip
                  size="small"
                  variant="outlined"
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setDraggedChip(field);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData(GROUP_CHIP_MIME, field);
                  }}
                  onDragOver={(e) => {
                    if (!draggedChip || draggedChip === field) return;
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    if (dropTargetChip !== field) setDropTargetChip(field);
                  }}
                  onDragLeave={() => {
                    if (dropTargetChip === field) setDropTargetChip(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const src =
                      e.dataTransfer.getData(GROUP_CHIP_MIME) || draggedChip;
                    setDraggedChip(null);
                    setDropTargetChip(null);
                    if (src && src !== field) {
                      onReorderGroupFields(src, field);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedChip(null);
                    setDropTargetChip(null);
                  }}
                  icon={
                    <DragIndicatorIcon
                      sx={{
                        fontSize: '14px !important',
                        color: 'rgba(25, 118, 210, 0.55) !important',
                        ml: '4px !important',
                        mr: '-4px !important',
                      }}
                    />
                  }
                  label={label}
                  data-grouping-chip={field}
                  onDelete={() => onRemoveGroupField(field)}
                  deleteIcon={
                    <CloseIcon
                      role="button"
                      aria-label={`移除分组 ${label}`}
                      sx={{ fontSize: '15px !important' }}
                    />
                  }
                  sx={{
                    height: 26,
                    borderRadius: '4px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'grab',
                    opacity: isChipBeingDragged ? 0.5 : 1,
                    color: '#1976D2',
                    bgcolor: isChipDropTarget
                      ? 'rgba(25, 118, 210, 0.14)'
                      : 'rgba(25, 118, 210, 0.06)',
                    borderColor: isChipDropTarget
                      ? '#1976D2'
                      : 'rgba(25, 118, 210, 0.32)',
                    '& .MuiChip-deleteIcon': {
                      fontSize: 16,
                      color: 'rgba(25, 118, 210, 0.65)',
                      '&:hover': {
                        color: '#1976D2',
                      },
                    },
                  }}
                />
              </React.Fragment>
            );
          })
        )}

        {rowGroupingModel.length > 0 && isColumnDragging && (
          <Typography
            component="span"
            sx={{
              fontSize: '0.75rem',
              color: '#1976D2',
              ml: 0.5,
            }}
          >
            （松开列头追加分组维度）
          </Typography>
        )}
      </Box>

      {rowGroupingModel.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Official MUI X rowGroupingColumnMode ('single' | 'multiple') toggle */}
          <Tooltip
            title="切换单列树形分组与多列独立分组列显示模式"
            enterDelay={450}
          >
            <Box
              role="group"
              aria-label="分组列显示模式"
              sx={{
                display: 'inline-flex',
                border: '1px solid #CBD5E1',
                borderRadius: '4px',
                overflow: 'hidden',
                bgcolor: '#FFFFFF',
              }}
            >
              {(
                [
                  { mode: 'single', label: '单列' },
                  { mode: 'multiple', label: '多列' },
                ] as const
              ).map(({ mode, label }) => {
                const active = rowGroupingColumnMode === mode;
                return (
                  <Button
                    key={mode}
                    size="small"
                    aria-pressed={active}
                    data-testid={`grouping-mode-${mode}`}
                    onClick={() => onRowGroupingColumnModeChange(mode)}
                    sx={{
                      minWidth: 44,
                      px: 1,
                      py: 0.15,
                      fontSize: '0.75rem',
                      fontWeight: active ? 600 : 400,
                      borderRadius: 0,
                      color: active ? '#1976D2' : '#475569',
                      bgcolor: active
                        ? 'rgba(25, 118, 210, 0.1)'
                        : 'transparent',
                      '&:hover': {
                        bgcolor: active
                          ? 'rgba(25, 118, 210, 0.14)'
                          : 'rgba(15, 23, 42, 0.04)',
                      },
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </Box>
          </Tooltip>

          <Button
            size="small"
            variant="text"
            onClick={onClearGrouping}
            sx={{
              minWidth: 'auto',
              px: 1,
              py: 0.25,
              fontSize: '0.78rem',
              color: '#64748B',
              '&:hover': {
                color: '#1976D2',
                bgcolor: 'rgba(25, 118, 210, 0.04)',
              },
            }}
          >
            清除分组
          </Button>
        </Box>
      )}
    </Box>
  );
}
