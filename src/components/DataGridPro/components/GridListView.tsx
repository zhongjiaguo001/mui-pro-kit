import React from 'react';
import { Box, Checkbox, Typography } from '@mui/material';
import type { Row } from '@tanstack/react-table';
import type {
  GridColDef,
  GridListViewColDef,
  GridRowId,
  GridValidRowModel,
} from '../types';
import type { DataGridFeatures } from '../core/useDataGridPro';
import { formatCellValue, resolveCellValue } from '../core/gridCore';

interface GridListViewProps<R extends GridValidRowModel> {
  rows: Row<DataGridFeatures, R>[];
  columns: GridColDef<R>[];
  listViewColumn?: GridListViewColDef<R>;
  checkboxSelection: boolean;
  disableRowSelectionOnClick: boolean;
  onRowClick?: (row: R, id: GridRowId) => void;
  onRowDoubleClick?: (params: { id: GridRowId; row: R }) => void;
  resolveRowIdForRow: (row: R, idx: number) => GridRowId;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
}

/**
 * Official MUI X `listView` single-column responsive card-list renderer.
 * Renders `listViewColumn.renderCell` (or a structured fallback) with native
 * checkbox selection and row click / double-click interactions.
 */
export function GridListView<R extends GridValidRowModel>({
  rows,
  columns,
  listViewColumn,
  checkboxSelection,
  disableRowSelectionOnClick,
  onRowClick,
  onRowDoubleClick,
  resolveRowIdForRow,
  allSelected,
  someSelected,
  onToggleAll,
}: GridListViewProps<R>) {
  const dataColumns = columns.filter((c) => c.type !== 'actions');
  const fallbackColDef: GridColDef<R> = dataColumns[0] ?? {
    field: listViewColumn?.field ?? 'listView',
  };

  return (
    <Box
      role="rowgroup"
      className="MuiDataGrid-listView"
      data-testid="datagrid-list-view"
      sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}
    >
      {checkboxSelection && rows.length > 0 && (
        <Box
          sx={{
            px: 1.5,
            py: 0.75,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: '#FAFAFA',
            borderBottom: '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
          }}
        >
          <Checkbox
            size="small"
            checked={allSelected}
            indeterminate={!allSelected && someSelected}
            onChange={onToggleAll}
            slotProps={{ input: { 'aria-label': '全选当前列表项' } }}
            sx={{ p: 0.4 }}
          />
          <Typography
            sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#475569' }}
          >
            全选当前页（{rows.length} 项）
          </Typography>
        </Box>
      )}

      {rows.map((row, rowIndex) => {
        const rowId = resolveRowIdForRow(row.original, rowIndex);
        const isSelected = row.getIsSelected();
        const canSelect = row.getCanSelect();

        const rawPrimary = resolveCellValue(row.original, fallbackColDef);
        const formattedPrimary = formatCellValue(
          rawPrimary,
          row.original,
          fallbackColDef,
        );

        return (
          <Box
            key={row.id}
            role="row"
            data-row-id={rowId}
            data-rowindex={rowIndex}
            aria-selected={checkboxSelection ? isSelected : undefined}
            onClick={() => {
              if (checkboxSelection && !disableRowSelectionOnClick && canSelect) {
                row.toggleSelected();
              }
              onRowClick?.(row.original, rowId);
            }}
            onDoubleClick={() =>
              onRowDoubleClick?.({ id: rowId, row: row.original })
            }
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              bgcolor: isSelected ? '#EDF4FC' : '#FFFFFF',
              borderBottom: '1px solid var(--DataGrid-rowBorderColor, #E0E0E0)',
              cursor:
                (checkboxSelection && !disableRowSelectionOnClick) || onRowClick
                  ? 'pointer'
                  : 'default',
              '&:hover': {
                bgcolor: isSelected ? '#E3EFFB' : '#F8FAFC',
              },
            }}
          >
            {checkboxSelection && (
              <Checkbox
                size="small"
                checked={isSelected}
                disabled={!canSelect}
                onClick={(e) => e.stopPropagation()}
                onChange={() => row.toggleSelected()}
                slotProps={{ input: { 'aria-label': `选择行 ${rowId}` } }}
                sx={{ p: 0.4, flexShrink: 0 }}
              />
            )}

            <Box sx={{ flex: 1, minWidth: 0 }}>
              {listViewColumn ? (
                listViewColumn.renderCell({
                  id: rowId,
                  field: listViewColumn.field,
                  value: row.original[listViewColumn.field],
                  formattedValue: String(
                    row.original[listViewColumn.field] ?? '',
                  ),
                  row: row.original,
                  colDef: fallbackColDef,
                })
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#0F172A',
                      }}
                    >
                      {formattedPrimary || String(rowId)}
                    </Typography>
                    {dataColumns[1] && (
                      <Typography sx={{ fontSize: '0.8rem', color: '#64748B' }}>
                        {formatCellValue(
                          resolveCellValue(row.original, dataColumns[1]),
                          row.original,
                          dataColumns[1],
                        )}
                      </Typography>
                    )}
                  </Box>
                  {dataColumns[2] && (
                    <Typography
                      className="font-mono-tabular"
                      sx={{
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: '#1E293B',
                      }}
                    >
                      {formatCellValue(
                        resolveCellValue(row.original, dataColumns[2]),
                        row.original,
                        dataColumns[2],
                      )}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
