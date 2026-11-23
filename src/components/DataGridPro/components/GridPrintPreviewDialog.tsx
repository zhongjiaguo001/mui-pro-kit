import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import type {
  GridAggregationModel,
  GridColDef,
  GridValidRowModel,
} from '../types';
import {
  AGGREGATION_FUNCTION_LABELS,
  computeColumnAggregation,
  formatAggregatedValue,
  formatCellValue,
  resolveCellValue,
} from '../core/gridCore';

interface GridPrintPreviewDialogProps<R extends GridValidRowModel> {
  open: boolean;
  onClose: () => void;
  title?: string;
  rows: R[];
  selectedRows: R[];
  columns: GridColDef<R>[];
  aggregationModel?: GridAggregationModel;
}

export function GridPrintPreviewDialog<R extends GridValidRowModel>({
  open,
  onClose,
  title = '数据表格打印预览',
  rows,
  selectedRows,
  columns,
  aggregationModel,
}: GridPrintPreviewDialogProps<R>) {
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  const printableRows = useMemo(
    () => (selectedOnly && selectedRows.length > 0 ? selectedRows : rows),
    [rows, selectedOnly, selectedRows],
  );

  const hasAggregation = Boolean(
    aggregationModel && Object.keys(aggregationModel).length > 0,
  );

  const printableColumns = useMemo(
    () => columns.filter((c) => c.type !== 'actions'),
    [columns],
  );

  const handlePrintNow = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          'data-testid': 'print-preview-dialog',
          sx: { borderRadius: '6px' },
        } as Record<string, unknown>,
      }}
    >
      <DialogTitle
        sx={{
          py: 1.5,
          px: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PrintOutlinedIcon sx={{ fontSize: 20, color: '#1976D2' }} />
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>
            {title}
          </Typography>
          <Typography
            className="font-mono-tabular"
            sx={{ fontSize: '0.8rem', color: '#64748B', ml: 1 }}
          >
            共 {printableRows.length} 行 · {printableColumns.length} 列
          </Typography>
        </Box>
        <IconButton size="small" aria-label="关闭打印预览" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Print Options Strip */}
      <Box
        sx={{
          px: 2.5,
          py: 1,
          bgcolor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          flexWrap: 'wrap',
        }}
      >
        {selectedRows.length > 0 && (
          <FormControlLabel
            sx={{
              m: 0,
              '& .MuiFormControlLabel-label': { fontSize: '0.8125rem' },
            }}
            control={
              <Switch
                size="small"
                checked={selectedOnly}
                onChange={(e) => setSelectedOnly(e.target.checked)}
              />
            }
            label={`仅打印已选中的 ${selectedRows.length} 行`}
          />
        )}
        <FormControlLabel
          sx={{
            m: 0,
            '& .MuiFormControlLabel-label': { fontSize: '0.8125rem' },
          }}
          control={
            <Switch
              size="small"
              checked={showSummary}
              onChange={(e) => setShowSummary(e.target.checked)}
            />
          }
          label="包含文档抬头与统计摘要"
        />
      </Box>

      <DialogContent
        sx={{
          p: 2.5,
          bgcolor: '#F1F5F9',
          maxHeight: '62vh',
          overflow: 'auto',
        }}
      >
        {/* Simulated Print Sheet */}
        <Box
          className="MuiDataGrid-printSheet"
          sx={{
            bgcolor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '4px',
            p: 2.5,
            overflowX: 'auto',
          }}
        >
          {showSummary && (
            <Box
              sx={{
                mb: 2,
                pb: 1.25,
                borderBottom: '1.5px solid #0F172A',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Typography
                sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}
              >
                {title}
              </Typography>
              <Typography
                className="font-mono-tabular"
                sx={{ fontSize: '0.78rem', color: '#475569' }}
              >
                记录数：{printableRows.length} · 生成日期：
                {new Date().toISOString().slice(0, 10)}
              </Typography>
            </Box>
          )}

          <Table
            size="small"
            aria-label="打印预览数据表"
            sx={{
              '& th, & td': {
                borderColor: '#E2E8F0',
                fontSize: '0.78rem',
                py: 0.75,
                px: 1,
                whiteSpace: 'nowrap',
              },
            }}
          >
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                {printableColumns.map((col) => (
                  <TableCell
                    key={col.field}
                    align={col.headerAlign ?? col.align ?? 'left'}
                    sx={{ fontWeight: 600, color: '#0F172A' }}
                  >
                    {col.headerName ?? col.field}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {printableRows.slice(0, 100).map((row, rIdx) => (
                <TableRow key={rIdx}>
                  {printableColumns.map((col) => {
                    const raw = resolveCellValue(row, col);
                    const formatted = formatCellValue(raw, row, col);
                    return (
                      <TableCell
                        key={col.field}
                        align={col.align ?? (col.type === 'number' ? 'right' : 'left')}
                        className={col.type === 'number' || col.type === 'date' ? 'font-mono-tabular' : undefined}
                        sx={{ color: '#1E293B' }}
                      >
                        {formatted || '—'}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              {hasAggregation && aggregationModel && (
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  {printableColumns.map((col, idx) => {
                    const fn = aggregationModel[col.field];
                    if (idx === 0 && !fn) {
                      return (
                        <TableCell
                          key={col.field}
                          sx={{ fontWeight: 700, color: '#0F172A' }}
                        >
                          聚合汇总
                        </TableCell>
                      );
                    }
                    if (!fn) {
                      return <TableCell key={col.field} />;
                    }
                    const aggVal = computeColumnAggregation(
                      printableRows,
                      col,
                      fn,
                    );
                    const text =
                      aggVal === null
                        ? '—'
                        : `${AGGREGATION_FUNCTION_LABELS[fn]}: ${formatAggregatedValue(aggVal, fn, col)}`;
                    return (
                      <TableCell
                        key={col.field}
                        align={col.align ?? 'right'}
                        className="font-mono-tabular"
                        sx={{ fontWeight: 700, color: '#1976D2' }}
                      >
                        {text}
                      </TableCell>
                    );
                  })}
                </TableRow>
              )}
            </TableBody>
          </Table>

          {printableRows.length > 100 && (
            <Typography
              sx={{
                mt: 1.5,
                fontSize: '0.75rem',
                color: '#64748B',
                textAlign: 'center',
              }}
            >
              预览已展示前 100 行（共 {printableRows.length} 行）
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.25, borderTop: '1px solid #E0E0E0' }}>
        <Button size="small" color="inherit" onClick={onClose}>
          关闭
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<PrintOutlinedIcon fontSize="small" />}
          onClick={handlePrintNow}
        >
          打印 / 另存为 PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
