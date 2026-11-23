import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';

interface ArchitectureRow {
  moduleName: string;
  muixReference: string;
  tanstackBridge: string;
  phase: 'implemented' | 'planned';
}

const ARCHITECTURE_ROWS: ArchitectureRow[] = [
  {
    moduleName: '声明式列配置与值管道',
    muixReference: 'GridColDef / valueGetter / valueFormatter / renderCell',
    tanstackBridge: 'useDataGridPro 列适配器 -> TanStack ColumnDef + meta.colDef',
    phase: 'implemented',
  },
  {
    moduleName: '单列与多列排序（Pro）',
    muixReference: 'useGridSorting / GridSortModel (Shift+Click 优先级索引)',
    tanstackBridge: 'getSortedRowModel() + enableMultiSort + 列头序号标示',
    phase: 'implemented',
  },
  {
    moduleName: '多条件筛选与快速搜索（Pro）',
    muixReference: 'useGridFilter / GridFilterPanel (AND/OR + 类型操作符)',
    tanstackBridge: 'gridCore.evaluateFilterModel() 纯函数引擎 + QuickFilter',
    phase: 'implemented',
  },
  {
    moduleName: '拖拽列宽与双击重置（Pro）',
    muixReference: 'useGridColumnResize / GridColumnHeaderSeparator',
    tanstackBridge: 'enableColumnResizing + columnResizeMode: onChange + resetSize()',
    phase: 'implemented',
  },
  {
    moduleName: '左右列固定与滚动阴影（Pro）',
    muixReference: 'useGridColumnPinning / pinnedColumnsSectionSeparator / .MuiDataGrid-scrollShadow',
    tanstackBridge: 'columnPinningFeature + computePinnedOffsets() + 贯通 linear-gradient 滚动阴影',
    phase: 'implemented',
  },
  {
    moduleName: '主从行展开（Master-Detail · Pro）',
    muixReference: 'getDetailPanelContent / __detail_panel_toggle__ / detailPanelExpandedRowIds',
    tanstackBridge: '自动注入可固定展开列 + sticky 视口宽度明细容器，横向滚动不偏移',
    phase: 'implemented',
  },
  {
    moduleName: '拖拽列重排序（Pro）',
    muixReference: 'useGridColumnReorder / disableColumnReorder / orderedFields',
    tanstackBridge: 'columnOrderingFeature + HTML5 列头拖拽落点指示线 + reorderColumnIds()',
    phase: 'implemented',
  },
  {
    moduleName: '单元格行内编辑与校验',
    muixReference: 'editable / processRowUpdate / onProcessRowUpdateError / valueParser',
    tanstackBridge: '双击或 Enter/F2 激活按类型匹配的 MUI 编辑器（文本/数值/下拉/布尔/日期）',
    phase: 'implemented',
  },
  {
    moduleName: '列头快捷筛选行（Pro）与键盘导航',
    muixReference: 'headerFilters / GridHeaderFilterRow / GridKeyboardNavigation',
    tanstackBridge: '与 GridFilterModel 双向同步的列头输入行 + 方向键/Home/End/F2 单元格焦点移动',
    phase: 'implemented',
  },
  {
    moduleName: '列头菜单、列管理与行选择',
    muixReference: 'GridColumnMenu / GridColumnsManagement / GRID_CHECKBOX_SELECTION_COL_DEF',
    tanstackBridge: 'MUI Menu & Popover 绑定可见性/排序/固定 API + 复选框全选与批量操作栏',
    phase: 'implemented',
  },
  {
    moduleName: '分页、密度切换与 CSV 导出',
    muixReference: 'GridPagination / GridToolbarDensitySelector / GridToolbarExport',
    tanstackBridge: 'createPaginatedRowModel() + MUI TablePagination + UTF-8 BOM CSV',
    phase: 'implemented',
  },
  {
    moduleName: '行虚拟化 / 树形数据 / 聚合分组',
    muixReference: 'GridVirtualScroller / TreeData / RowGrouping / Aggregation',
    tanstackBridge: '后续阶段可基于 @tanstack/react-virtual 与分组行模型平滑扩展',
    phase: 'planned',
  },
];

export function ArchitectureReference() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box>
        <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A' }}>
          MUI X DataGrid Pro 源码架构对照
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#475569', mt: 0.5, maxWidth: 820 }}>
          核心设计遵循 MUI X 的 Headless 状态与 Slots UI 分离原则：用 TanStack Table v9 模块化 tableFeatures 与 useTable 替代 MUI X 内部复杂的 Feature Hooks 与 Pipe 订阅系统，用 MUI Material 组件精准还原 DataGrid Pro 的交互规范与视觉层级。
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderColor: '#E2E8F0', borderRadius: '8px' }}
      >
        <Table size="small" aria-label="MUI X DataGrid Pro 与 TanStack Table 源码对照表">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 600, color: '#334155', py: 1.5, width: 200 }}>
                功能模块
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#334155', py: 1.5 }}>
                MUI X DataGrid Pro 参考机制
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#334155', py: 1.5 }}>
                TanStack Table + MUI 实现方式
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#334155', py: 1.5, width: 120 }}>
                当前阶段
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ARCHITECTURE_ROWS.map((row) => (
              <TableRow
                key={row.moduleName}
                sx={{
                  '&:last-child td': { borderBottom: 0 },
                  '&:hover': { bgcolor: '#F8FAFC' },
                }}
              >
                <TableCell sx={{ fontWeight: 500, color: '#0F172A', py: 1.5 }}>
                  {row.moduleName}
                </TableCell>
                <TableCell
                  className="font-mono-tabular"
                  sx={{ fontSize: '0.78rem', color: '#334155', py: 1.5 }}
                >
                  {row.muixReference}
                </TableCell>
                <TableCell sx={{ fontSize: '0.82rem', color: '#475569', py: 1.5 }}>
                  {row.tanstackBridge}
                </TableCell>
                <TableCell sx={{ py: 1.5 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.6,
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: row.phase === 'implemented' ? '#15803D' : '#64748B',
                    }}
                  >
                    {row.phase === 'implemented' ? (
                      <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <ScheduleIcon sx={{ fontSize: 16 }} />
                    )}
                    <span>{row.phase === 'implemented' ? '已实现' : '后续扩展'}</span>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
