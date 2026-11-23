import type { GridFilterOperatorValue } from '../types';

export interface GridTablePaginationLocaleText {
  labelRowsPerPage: string;
  labelDisplayedRows: (params: {
    from: number;
    to: number;
    count: number;
  }) => string;
}

export interface GridLocaleText {
  // Toolbar
  toolbarColumns: string;
  toolbarFilters: string;
  toolbarDensity: string;
  toolbarDensityCompact: string;
  toolbarDensityStandard: string;
  toolbarDensityComfortable: string;
  toolbarExport: string;
  toolbarExportCSV: string;
  toolbarExportExcel: string;
  toolbarExportJSON: string;
  toolbarExportPrint: string;
  toolbarQuickFilterPlaceholder: string;
  toolbarQuickFilterLabel: string;
  toolbarQuickFilterClearLabel: string;
  toolbarCharts: string;
  toolbarPivot: string;
  toolbarUndo: string;
  toolbarRedo: string;
  toolbarSelectionCount: (count: number) => string;
  toolbarExportSelectedExcel: string;
  toolbarExportSelectedCSV: string;
  toolbarDeleteSelected: string;
  toolbarClearSelection: string;

  // Overlays
  noRowsLabel: string;
  noRowsDescription: string;
  noResultsOverlayLabel: string;
  noResultsOverlayDescription: string;
  clearFiltersButtonLabel: string;
  loadingOverlayLabel: string;
  lazyLoadingLabel: string;
  dataSourceErrorRetry: string;

  // Column Menu
  columnMenuSortAsc: string;
  columnMenuSortDesc: string;
  columnMenuUnsort: string;
  columnMenuFilter: string;
  columnMenuHideColumn: string;
  columnMenuManageColumns: string;
  columnMenuPinLeft: string;
  columnMenuPinRight: string;
  columnMenuUnpin: string;
  columnMenuAutosize: string;
  columnMenuResetWidth: string;
  columnMenuGroupBy: string;
  columnMenuUngroupBy: string;
  columnMenuAggregation: string;
  columnMenuAggregationNone: string;

  // Columns Management Panel
  columnsManagementSearchTitle: string;
  columnsManagementSearchPlaceholder: string;
  columnsManagementNoColumns: string;
  columnsManagementShowAll: string;
  columnsManagementReset: string;
  columnsManagementAutosize: string;
  columnsManagementPinLeftTooltip: string;
  columnsManagementPinRightTooltip: string;
  columnsManagementUnpinTooltip: string;

  // Filter Panel
  filterPanelTitle: string;
  filterPanelAddFilter: string;
  filterPanelRemoveAll: string;
  filterPanelColumns: string;
  filterPanelOperator: string;
  filterPanelInputLabel: string;
  filterPanelInputPlaceholder: string;
  filterPanelLogicOperator: string;
  filterPanelLogicAnd: string;
  filterPanelLogicOr: string;
  filterPanelDeleteIconLabel: string;
  filterOperatorLabels: Record<string, string>;

  // Footer & Pagination
  footerRowSelected: (count: number) => string;
  footerTotalRows: (count: number) => string;
  footerTotalVisibleRows: (visibleCount: number, totalCount: number) => string;
  footerServerModeRows: (count: number) => string;
  footerLoadedRows: (loadedCount: number, totalCount: number) => string;
  footerRowGroupingRows: (visibleCount: number, totalCount: number) => string;
  footerTreeDataRows: (visibleCount: number, totalCount: number) => string;
  footerCellRangeStats: (
    cellCount: number,
    sum: number | null,
    avg: number | null,
  ) => string;
  MuiTablePagination: GridTablePaginationLocaleText;
}

export type GridLocaleTextInput = Partial<
  Omit<GridLocaleText, 'MuiTablePagination' | 'filterOperatorLabels'>
> & {
  MuiTablePagination?: Partial<GridTablePaginationLocaleText>;
  filterOperatorLabels?: Record<string, string | undefined>;
};

export const GRID_ZH_CN_LOCALE_TEXT: GridLocaleText = {
  // Toolbar
  toolbarColumns: '列设置',
  toolbarFilters: '筛选',
  toolbarDensity: '密度',
  toolbarDensityCompact: '紧凑',
  toolbarDensityStandard: '标准',
  toolbarDensityComfortable: '宽松',
  toolbarExport: '导出',
  toolbarExportCSV: '下载为 CSV',
  toolbarExportExcel: '导出为 Excel (.xlsx)',
  toolbarExportJSON: '导出为 JSON',
  toolbarExportPrint: '打印表格',
  toolbarQuickFilterPlaceholder: '搜索...',
  toolbarQuickFilterLabel: '快速搜索表格内容',
  toolbarQuickFilterClearLabel: '清空快速搜索',
  toolbarCharts: '图表',
  toolbarPivot: '透视配置',
  toolbarUndo: '撤销编辑 (Ctrl+Z)',
  toolbarRedo: '重做编辑 (Ctrl+Y)',
  toolbarSelectionCount: (count) => `已选择 ${count} 行记录`,
  toolbarExportSelectedExcel: '导出 Excel',
  toolbarExportSelectedCSV: '导出 CSV',
  toolbarDeleteSelected: '删除选中',
  toolbarClearSelection: '取消选择',

  // Overlays
  noRowsLabel: '暂无表格数据',
  noRowsDescription: '数据集当前为空，添加新记录或恢复示例数据后即可在此查看与操作。',
  noResultsOverlayLabel: '未找到匹配的记录',
  noResultsOverlayDescription:
    '当前筛选条件或搜索关键字没有命中任何数据，可以调整条件或一键重置。',
  clearFiltersButtonLabel: '清空筛选条件',
  loadingOverlayLabel: '表格数据加载中',
  lazyLoadingLabel: '正在加载更多数据...',
  dataSourceErrorRetry: '重试加载',

  // Column Menu
  columnMenuSortAsc: '升序排列 (ASC)',
  columnMenuSortDesc: '降序排列 (DESC)',
  columnMenuUnsort: '取消排序',
  columnMenuFilter: '按此列筛选',
  columnMenuHideColumn: '隐藏此列',
  columnMenuManageColumns: '管理所有列...',
  columnMenuPinLeft: '固定到左侧',
  columnMenuPinRight: '固定到右侧',
  columnMenuUnpin: '取消固定',
  columnMenuAutosize: '自适应此列宽度',
  columnMenuResetWidth: '重置列宽',
  columnMenuGroupBy: '按此列分组',
  columnMenuUngroupBy: '取消此列分组',
  columnMenuAggregation: '列聚合汇总',
  columnMenuAggregationNone: '无聚合',

  // Columns Management Panel
  columnsManagementSearchTitle: '查找列',
  columnsManagementSearchPlaceholder: '输入列名...',
  columnsManagementNoColumns: '未匹配到列名',
  columnsManagementShowAll: '全部显示',
  columnsManagementReset: '重置列宽',
  columnsManagementAutosize: '自适应全部列宽',
  columnsManagementPinLeftTooltip: '固定到左侧',
  columnsManagementPinRightTooltip: '固定到右侧',
  columnsManagementUnpinTooltip: '取消固定',

  // Filter Panel
  filterPanelTitle: '高级多条件筛选',
  filterPanelAddFilter: '添加筛选条件',
  filterPanelRemoveAll: '清空全部',
  filterPanelColumns: '列',
  filterPanelOperator: '运算符',
  filterPanelInputLabel: '值',
  filterPanelInputPlaceholder: '输入筛选值...',
  filterPanelLogicOperator: '逻辑关系',
  filterPanelLogicAnd: '且 (AND)',
  filterPanelLogicOr: '或 (OR)',
  filterPanelDeleteIconLabel: '删除筛选条件',
  filterOperatorLabels: {
    contains: '包含',
    equals: '等于',
    startsWith: '开头为',
    endsWith: '结尾为',
    isEmpty: '为空',
    isNotEmpty: '非空',
    isAnyOf: '属于任一',
    '=': '等于 (=)',
    '!=': '不等于 (!=)',
    '>': '大于 (>)',
    '>=': '大于等于 (>=)',
    '<': '小于 (<)',
    '<=': '小于等于 (<=)',
    is: '等于',
    not: '不等于',
    after: '晚于',
    onOrAfter: '不早于',
    before: '早于',
    onOrBefore: '不晚于',
  },

  // Footer & Pagination
  footerRowSelected: (count) => `已选择 ${count.toLocaleString('zh-CN')} 行`,
  footerTotalRows: (count) => `共 ${count.toLocaleString('zh-CN')} 行数据`,
  footerTotalVisibleRows: (visible, total) =>
    `筛选匹配 ${visible.toLocaleString('zh-CN')} / 共 ${total.toLocaleString('zh-CN')} 行`,
  footerServerModeRows: (count) =>
    `服务端模式 · 共 ${count.toLocaleString('zh-CN')} 行数据`,
  footerLoadedRows: (loaded, total) =>
    `已加载 ${loaded.toLocaleString('zh-CN')} / 共 ${total.toLocaleString('zh-CN')} 行`,
  footerRowGroupingRows: (visible, total) =>
    `行分组视图 · 当前显示 ${visible.toLocaleString('zh-CN')} 行（共 ${total.toLocaleString('zh-CN')} 条明细）`,
  footerTreeDataRows: (visible, total) =>
    `树形视图 · 当前展开 ${visible.toLocaleString('zh-CN')} 个节点（共 ${total.toLocaleString('zh-CN')} 条明细）`,
  footerCellRangeStats: (cellCount, sum, avg) => {
    const base = `已选 ${cellCount} 个单元格`;
    if (sum !== null && avg !== null) {
      return `${base} · 合计 ${sum.toLocaleString('zh-CN', {
        maximumFractionDigits: 2,
      })} · 均值 ${avg.toLocaleString('zh-CN', {
        maximumFractionDigits: 2,
      })}`;
    }
    return base;
  },
  MuiTablePagination: {
    labelRowsPerPage: '每页行数:',
    labelDisplayedRows: ({ from, to, count }) =>
      count === 0 ? '0 条记录' : `第 ${from}-${to} 条，共 ${count} 条`,
  },
};

export const GRID_EN_US_LOCALE_TEXT: GridLocaleText = {
  // Toolbar
  toolbarColumns: 'Columns',
  toolbarFilters: 'Filters',
  toolbarDensity: 'Density',
  toolbarDensityCompact: 'Compact',
  toolbarDensityStandard: 'Standard',
  toolbarDensityComfortable: 'Comfortable',
  toolbarExport: 'Export',
  toolbarExportCSV: 'Download as CSV',
  toolbarExportExcel: 'Export to Excel (.xlsx)',
  toolbarExportJSON: 'Export as JSON',
  toolbarExportPrint: 'Print',
  toolbarQuickFilterPlaceholder: 'Search...',
  toolbarQuickFilterLabel: 'Quick search table',
  toolbarQuickFilterClearLabel: 'Clear quick search',
  toolbarCharts: 'Charts',
  toolbarPivot: 'Pivot',
  toolbarUndo: 'Undo (Ctrl+Z)',
  toolbarRedo: 'Redo (Ctrl+Y)',
  toolbarSelectionCount: (count) =>
    count === 1 ? '1 row selected' : `${count.toLocaleString('en-US')} rows selected`,
  toolbarExportSelectedExcel: 'Export Excel',
  toolbarExportSelectedCSV: 'Export CSV',
  toolbarDeleteSelected: 'Delete selected',
  toolbarClearSelection: 'Clear selection',

  // Overlays
  noRowsLabel: 'No rows',
  noRowsDescription:
    'The dataset is currently empty. Add new records or restore demo data to get started.',
  noResultsOverlayLabel: 'No results found.',
  noResultsOverlayDescription:
    'No records match the current filters or search query. Adjust your criteria or reset filters.',
  clearFiltersButtonLabel: 'Reset filters',
  loadingOverlayLabel: 'Loading rows',
  lazyLoadingLabel: 'Loading more rows...',
  dataSourceErrorRetry: 'Retry',

  // Column Menu
  columnMenuSortAsc: 'Sort by ASC',
  columnMenuSortDesc: 'Sort by DESC',
  columnMenuUnsort: 'Unsort',
  columnMenuFilter: 'Filter',
  columnMenuHideColumn: 'Hide column',
  columnMenuManageColumns: 'Manage columns',
  columnMenuPinLeft: 'Pin to left',
  columnMenuPinRight: 'Pin to right',
  columnMenuUnpin: 'Unpin',
  columnMenuAutosize: 'Autosize column',
  columnMenuResetWidth: 'Reset width',
  columnMenuGroupBy: 'Group by column',
  columnMenuUngroupBy: 'Stop grouping',
  columnMenuAggregation: 'Aggregation',
  columnMenuAggregationNone: 'None',

  // Columns Management Panel
  columnsManagementSearchTitle: 'Find column',
  columnsManagementSearchPlaceholder: 'Column title...',
  columnsManagementNoColumns: 'No columns found',
  columnsManagementShowAll: 'Show all',
  columnsManagementReset: 'Reset widths',
  columnsManagementAutosize: 'Autosize all',
  columnsManagementPinLeftTooltip: 'Pin to left',
  columnsManagementPinRightTooltip: 'Pin to right',
  columnsManagementUnpinTooltip: 'Unpin',

  // Filter Panel
  filterPanelTitle: 'Filters',
  filterPanelAddFilter: 'Add filter',
  filterPanelRemoveAll: 'Remove all',
  filterPanelColumns: 'Columns',
  filterPanelOperator: 'Operator',
  filterPanelInputLabel: 'Value',
  filterPanelInputPlaceholder: 'Filter value...',
  filterPanelLogicOperator: 'Logic operator',
  filterPanelLogicAnd: 'And',
  filterPanelLogicOr: 'Or',
  filterPanelDeleteIconLabel: 'Delete filter',
  filterOperatorLabels: {
    contains: 'contains',
    equals: 'equals',
    startsWith: 'starts with',
    endsWith: 'ends with',
    isEmpty: 'is empty',
    isNotEmpty: 'is not empty',
    isAnyOf: 'is any of',
    '=': '=',
    '!=': '!=',
    '>': '>',
    '>=': '>=',
    '<': '<',
    '<=': '<=',
    is: 'is',
    not: 'is not',
    after: 'is after',
    onOrAfter: 'is on or after',
    before: 'is before',
    onOrBefore: 'is on or before',
  },

  // Footer & Pagination
  footerRowSelected: (count) =>
    count === 1 ? '1 row selected' : `${count.toLocaleString('en-US')} rows selected`,
  footerTotalRows: (count) => `${count.toLocaleString('en-US')} rows`,
  footerTotalVisibleRows: (visible, total) =>
    `${visible.toLocaleString('en-US')} of ${total.toLocaleString('en-US')} rows`,
  footerServerModeRows: (count) =>
    `Server mode · ${count.toLocaleString('en-US')} rows`,
  footerLoadedRows: (loaded, total) =>
    `Loaded ${loaded.toLocaleString('en-US')} of ${total.toLocaleString('en-US')} rows`,
  footerRowGroupingRows: (visible, total) =>
    `Row grouping · ${visible.toLocaleString('en-US')} rows (${total.toLocaleString('en-US')} records)`,
  footerTreeDataRows: (visible, total) =>
    `Tree view · ${visible.toLocaleString('en-US')} nodes (${total.toLocaleString('en-US')} records)`,
  footerCellRangeStats: (cellCount, sum, avg) => {
    const base = `${cellCount} cells selected`;
    if (sum !== null && avg !== null) {
      return `${base} · Sum ${sum.toLocaleString('en-US', {
        maximumFractionDigits: 2,
      })} · Avg ${avg.toLocaleString('en-US', {
        maximumFractionDigits: 2,
      })}`;
    }
    return base;
  },
  MuiTablePagination: {
    labelRowsPerPage: 'Rows per page:',
    labelDisplayedRows: ({ from, to, count }) =>
      count === 0 ? '0–0 of 0' : `${from}–${to} of ${count}`,
  },
};

export function resolveLocaleText(
  override?: GridLocaleTextInput,
): GridLocaleText {
  if (!override) return GRID_ZH_CN_LOCALE_TEXT;
  const mergedOperatorLabels: Record<string, string> = {
    ...GRID_ZH_CN_LOCALE_TEXT.filterOperatorLabels,
  };
  if (override.filterOperatorLabels) {
    for (const [k, v] of Object.entries(override.filterOperatorLabels)) {
      if (typeof v === 'string') {
        mergedOperatorLabels[k] = v;
      }
    }
  }
  return {
    ...GRID_ZH_CN_LOCALE_TEXT,
    ...override,
    MuiTablePagination: {
      ...GRID_ZH_CN_LOCALE_TEXT.MuiTablePagination,
      ...(override.MuiTablePagination ?? {}),
    },
    filterOperatorLabels: mergedOperatorLabels,
  };
}
