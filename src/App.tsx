import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TuneIcon from '@mui/icons-material/Tune';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import RestoreIcon from '@mui/icons-material/Restore';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import DataObjectIcon from '@mui/icons-material/DataObject';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import BarChartIcon from '@mui/icons-material/BarChart';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import CheckIcon from '@mui/icons-material/Check';
import PivotTableChartIcon from '@mui/icons-material/PivotTableChart';
import {
  DataGridPro,
  GRID_EN_US_LOCALE_TEXT,
  GRID_ZH_CN_LOCALE_TEXT,
  GridActionsCellItem,
  evaluateFilterItem,
  executeServerQuery,
  executeServerTreeQuery,
  getOperatorsForColumnType,
  parseQuickFilterInput,
  reorderRowsByIndex,
  useGridApiRef,
  type GridAggregationModel,
  type GridColDef,
  type GridColumnGroupingModel,
  type GridDataSource,
  type GridDensity,
  type GridEditHistorySummary,
  type GridFilterOperator,
  type GridListViewColDef,
  type GridPersistedState,
  type GridPinnedRowsProp,
  type GridPivotModel,
  type GridRowGroupingModel,
  type GridRowId,
  type GridRowOrderChangeParams,
  type GridSidebarPanel,
  type GridStateSnapshot,
} from './components/DataGridPro';
import {
  ORDER_PRIORITY_META,
  ORDER_STATUS_META,
  createInitialEnterpriseOrders,
  getOrderLineItems,
  type EnterpriseOrder,
  type OrderPriority,
  type OrderStatus,
} from './data/enterpriseOrders';
import { CreateOrderDialog } from './components/CreateOrderDialog';
import {
  StateInspector,
  type GridEventLogEntry,
} from './components/StateInspector';
import { ArchitectureReference } from './components/ArchitectureReference';
import { NavMenuShowcase } from './components/NavMenuShowcase';
import { DatePickerShowcase } from './components/DatePickerShowcase';
import { MessageShowcase } from './components/MessageShowcase';
import { MessageGlobalHost } from './components/Message';

type WorkspaceTab = 'message' | 'date' | 'menu' | 'demo' | 'state' | 'architecture';

const ICON_STATUS_SETTLED = <CheckCircleOutlineIcon style={{ fontSize: 15 }} />;
const ICON_STATUS_PROCESSING = <AutorenewIcon style={{ fontSize: 15 }} />;
const ICON_STATUS_PENDING = <ScheduleIcon style={{ fontSize: 15 }} />;
const ICON_STATUS_OVERDUE = <ErrorOutlineIcon style={{ fontSize: 15 }} />;
const ICON_ACTION_VIEW = <VisibilityOutlinedIcon style={{ fontSize: 18 }} />;
const ICON_ACTION_DELETE = <DeleteOutlineIcon style={{ fontSize: 18 }} />;
const ICON_ACTION_COPY = <ContentCopyOutlinedIcon style={{ fontSize: 16 }} />;
const ICON_ACTION_SETTLED = <DoneAllIcon style={{ fontSize: 16 }} />;

function renderStatusIcon(status: OrderStatus) {
  switch (status) {
    case 'settled':
      return ICON_STATUS_SETTLED;
    case 'processing':
      return ICON_STATUS_PROCESSING;
    case 'pending':
      return ICON_STATUS_PENDING;
    case 'overdue':
      return ICON_STATUS_OVERDUE;
  }
}

const SAVED_VIEW_STORAGE_KEY = 'datagrid_pro_saved_view_v1';

interface CustomSummaryFooterProps {
  totalFilteredRows?: number;
  selectedCount?: number;
  page?: number;
  pageSize?: number;
  paginationEnabled?: boolean;
  onPageChange?: (nextPage: number) => void;
  totalAmount?: number;
  englishLocale?: boolean;
}

function CustomSummaryFooter({
  totalFilteredRows = 0,
  selectedCount = 0,
  page = 0,
  pageSize = 10,
  paginationEnabled = true,
  onPageChange,
  totalAmount = 0,
  englishLocale = false,
}: CustomSummaryFooterProps) {
  const totalPages = Math.max(1, Math.ceil(totalFilteredRows / pageSize));
  return (
    <Box
      data-testid="custom-footer-slot"
      sx={{
        minHeight: 52,
        px: 2,
        py: 0.75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        borderTop: '1px solid #CBD5E1',
        bgcolor: '#F8FAFC',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography
          sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1976D2' }}
        >
          {englishLocale ? 'Custom Footer Slot' : '自定义页脚插槽'}
        </Typography>
        <Typography
          className="font-mono-tabular"
          sx={{ fontSize: '0.8125rem', color: '#334155' }}
        >
          {englishLocale
            ? `${totalFilteredRows} records · Total ¥${totalAmount.toLocaleString('en-US')}`
            : `共 ${totalFilteredRows.toLocaleString('zh-CN')} 条记录 · 总额 ¥${totalAmount.toLocaleString('zh-CN')}`}
          {selectedCount > 0
            ? englishLocale
              ? ` · ${selectedCount} selected`
              : ` · 已选 ${selectedCount} 行`
            : ''}
        </Typography>
      </Box>

      {paginationEnabled && onPageChange && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            disabled={page <= 0}
            onClick={() => onPageChange(Math.max(0, page - 1))}
            sx={{ minWidth: 64, fontSize: '0.78rem', py: 0.25 }}
          >
            {englishLocale ? 'Prev' : '上一页'}
          </Button>
          <Typography
            className="font-mono-tabular"
            sx={{ fontSize: '0.8rem', color: '#475569', px: 0.5 }}
          >
            {page + 1} / {totalPages}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            disabled={page + 1 >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            sx={{ minWidth: 64, fontSize: '0.78rem', py: 0.25 }}
          >
            {englishLocale ? 'Next' : '下一页'}
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default function App() {
  const apiRef = useGridApiRef<EnterpriseOrder>();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('message');
  const [orders, setOrders] = useState<EnterpriseOrder[]>(() =>
    createInitialEnterpriseOrders(64),
  );
  const [largeOrders, setLargeOrders] = useState<EnterpriseOrder[] | null>(null);
  const [nextSeq, setNextSeq] = useState(1065);

  // Interactive DataGridPro prop toggles for engineering evaluation
  const [pivotMode, setPivotMode] = useState(false);
  const [pivotModel, setPivotModel] = useState<GridPivotModel>({
    rows: ['region'],
    columns: ['status'],
    values: [
      { field: 'amount', aggFunc: 'sum' },
      { field: 'orderNo', aggFunc: 'size' },
    ],
  });
  const [enableTreeData, setEnableTreeData] = useState(false);
  const [rowGroupingModel, setRowGroupingModel] = useState<GridRowGroupingModel>(
    [],
  );
  const [aggregationModel, setAggregationModel] =
    useState<GridAggregationModel>({});
  const [cellSelection, setCellSelection] = useState(true);
  const [largeDatasetMode, setLargeDatasetMode] = useState(false);
  const [checkboxSelection, setCheckboxSelection] = useState(true);
  const [headerFilters, setHeaderFilters] = useState(false);
  const [enableColumnGrouping, setEnableColumnGrouping] = useState(false);
  const [enablePinnedRows, setEnablePinnedRows] = useState(false);
  const [rowReordering, setRowReordering] = useState(false);
  const [fullRowEdit, setFullRowEdit] = useState(false);
  const [rowSpanning, setRowSpanning] = useState(false);
  const [lockSettledRows, setLockSettledRows] = useState(false);
  const [autoRowHeight, setAutoRowHeight] = useState(false);
  const [singleRowSelect, setSingleRowSelect] = useState(false);
  const [serverDataMode, setServerDataMode] = useState(false);
  const [serverTreeMode, setServerTreeMode] = useState(false);
  const [infiniteScrollMode, setInfiniteScrollMode] = useState(false);
  const [viewportLazyMode, setViewportLazyMode] = useState(false);
  const [listViewMode, setListViewMode] = useState(false);
  const [serverOrdersPool, setServerOrdersPool] = useState<EnterpriseOrder[]>(() =>
    createInitialEnterpriseOrders(500),
  );
  const serverOrdersPoolRef = useRef(serverOrdersPool);
  serverOrdersPoolRef.current = serverOrdersPool;
  const [lazyLoadedCount, setLazyLoadedCount] = useState(25);
  const [lazyLoading, setLazyLoading] = useState(false);
  const lazyTimerRef = useRef<number | null>(null);
  const [showCellVerticalBorder, setShowCellVerticalBorder] = useState(false);
  const [showBuiltInToolbar, setShowBuiltInToolbar] = useState(false);
  const [externalQuickSearch, setExternalQuickSearch] = useState('');
  const [sidebarPanel, setSidebarPanel] = useState<GridSidebarPanel | null>(null);
  const [chartsPanelOpen, setChartsPanelOpen] = useState(false);
  const [editHistoryState, setEditHistoryState] = useState<GridEditHistorySummary>({
    canUndo: false,
    canRedo: false,
    pastCount: 0,
    futureCount: 0,
  });
  const [externalDensityAnchor, setExternalDensityAnchor] =
    useState<HTMLElement | null>(null);
  const [externalExportAnchor, setExternalExportAnchor] =
    useState<HTMLElement | null>(null);
  const [englishLocale, setEnglishLocale] = useState(false);
  const [customFooterSlot, setCustomFooterSlot] = useState(false);
  const [wideColumnsMode, setWideColumnsMode] = useState(false);
  const [autoHeightMode, setAutoHeightMode] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [emptyPreview, setEmptyPreview] = useState(false);
  const [displayOptionsAnchor, setDisplayOptionsAnchor] =
    useState<HTMLElement | null>(null);
  const [recentEvents, setRecentEvents] = useState<GridEventLogEntry[]>([]);
  const eventSeqRef = useRef(1);
  const [hasSavedView, setHasSavedView] = useState(() => {
    try {
      return Boolean(window.localStorage.getItem(SAVED_VIEW_STORAGE_KEY));
    } catch {
      return false;
    }
  });

  const isAggregationActive = Object.keys(aggregationModel).length > 0;
  const isRowGroupingActive = rowGroupingModel.length > 0;

  useEffect(() => {
    return () => {
      if (lazyTimerRef.current !== null) {
        window.clearTimeout(lazyTimerRef.current);
      }
    };
  }, []);

  // Subscribe to official MUI X apiRef event bus for live event stream inspection
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const record = (event: string, summary: string) => {
      const now = new Date();
      const timestamp = now.toTimeString().slice(0, 8);
      const id = eventSeqRef.current++;
      setRecentEvents((prev) =>
        [{ id, event, summary, timestamp }, ...prev].slice(0, 6),
      );
    };
    const unsubs = [
      api.subscribeEvent('sortModelChange', (model) => {
        const arr = Array.isArray(model) ? model : [];
        record(
          'sortModelChange',
          arr.length > 0
            ? arr.map((s: { field?: string; sort?: string }) => `${s.field}:${s.sort}`).join(', ')
            : 'cleared',
        );
      }),
      api.subscribeEvent('filterModelChange', (model) => {
        const m = model as { items?: unknown[]; quickFilterValues?: string[] } | undefined;
        record(
          'filterModelChange',
          `items=${m?.items?.length ?? 0}, quick=${(m?.quickFilterValues ?? []).join(' ') || 'none'}`,
        );
      }),
      api.subscribeEvent('rowSelectionChange', (ids) => {
        const arr = Array.isArray(ids) ? ids : [];
        record('rowSelectionChange', `selected=${arr.length} rows`);
      }),
      api.subscribeEvent('paginationModelChange', (model) => {
        const m = model as { page?: number; pageSize?: number } | undefined;
        record('paginationModelChange', `page=${(m?.page ?? 0) + 1}, pageSize=${m?.pageSize ?? 10}`);
      }),
      api.subscribeEvent('densityChange', (density) => {
        record('densityChange', `density=${String(density)}`);
      }),
      api.subscribeEvent('rowsUpdate', (updates) => {
        const arr = Array.isArray(updates) ? updates : [];
        record('rowsUpdate', `mutations=${arr.length}`);
      }),
      api.subscribeEvent('cellModesModelChange', (model) => {
        const count = model && typeof model === 'object' ? Object.keys(model).length : 0;
        record('cellModesModelChange', `editingRows=${count}`);
      }),
      api.subscribeEvent('rowModesModelChange', (model) => {
        const count = model && typeof model === 'object' ? Object.keys(model).length : 0;
        record('rowModesModelChange', `editingRows=${count}`);
      }),
      api.subscribeEvent<GridEditHistorySummary>('editHistoryChange', (summary) => {
        if (summary && typeof summary === 'object') {
          setEditHistoryState(summary);
          record(
            'editHistoryChange',
            `past=${summary.pastCount}, future=${summary.futureCount}`,
          );
        }
      }),
      api.subscribeEvent<GridSidebarPanel | null>('sidebarPanelChange', (panel) => {
        record('sidebarPanelChange', panel ?? 'closed');
      }),
      api.subscribeEvent<boolean>('chartsPanelOpenChange', (open) => {
        record('chartsPanelOpenChange', open ? 'open' : 'closed');
      }),
    ];
    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [apiRef]);

  const handleToggleServerDataMode = useCallback((checked: boolean) => {
    setServerDataMode(checked);
    if (checked) {
      setServerTreeMode(false);
      setInfiniteScrollMode(false);
      setViewportLazyMode(false);
      setLargeDatasetMode(false);
      setPivotMode(false);
      setEnableTreeData(false);
      setRowGroupingModel([]);
      setEmptyPreview(false);
    }
  }, []);

  const handleToggleServerTreeMode = useCallback((checked: boolean) => {
    setServerTreeMode(checked);
    if (checked) {
      setServerDataMode(false);
      setInfiniteScrollMode(false);
      setViewportLazyMode(false);
      setLargeDatasetMode(false);
      setPivotMode(false);
      setEnableTreeData(false);
      setListViewMode(false);
      setRowGroupingModel([]);
      setEmptyPreview(false);
    }
  }, []);

  const handleToggleInfiniteScrollMode = useCallback((checked: boolean) => {
    if (lazyTimerRef.current !== null) {
      window.clearTimeout(lazyTimerRef.current);
      lazyTimerRef.current = null;
    }
    setLazyLoading(false);
    setInfiniteScrollMode(checked);
    if (checked) {
      setLazyLoadedCount(25);
      setServerDataMode(false);
      setServerTreeMode(false);
      setViewportLazyMode(false);
      setLargeDatasetMode(false);
      setPivotMode(false);
      setEnableTreeData(false);
      setRowGroupingModel([]);
      setEmptyPreview(false);
    }
  }, []);

  const handleToggleViewportLazyMode = useCallback((checked: boolean) => {
    setViewportLazyMode(checked);
    if (checked) {
      setServerDataMode(false);
      setServerTreeMode(false);
      setInfiniteScrollMode(false);
      setLargeDatasetMode(false);
      setAutoHeightMode(false);
      setListViewMode(false);
      setPivotMode(false);
      setEnableTreeData(false);
      setRowGroupingModel([]);
      setEmptyPreview(false);
    }
  }, []);

  const handleToggleListViewMode = useCallback((checked: boolean) => {
    setListViewMode(checked);
    if (checked) {
      setPivotMode(false);
      setViewportLazyMode(false);
      setServerTreeMode(false);
      setEnableTreeData(false);
      setRowGroupingModel([]);
    }
  }, []);

  const handleLoadMoreLazyRows = useCallback(() => {
    if (!infiniteScrollMode || lazyLoading) return;
    if (lazyLoadedCount >= serverOrdersPool.length) return;
    setLazyLoading(true);
    lazyTimerRef.current = window.setTimeout(() => {
      lazyTimerRef.current = null;
      setLazyLoadedCount((prev) =>
        Math.min(serverOrdersPool.length, prev + 25),
      );
      setLazyLoading(false);
    }, 220);
  }, [infiniteScrollMode, lazyLoadedCount, lazyLoading, serverOrdersPool.length]);

  const handleTogglePivotMode = useCallback((checked: boolean) => {
    setPivotMode(checked);
    if (checked) {
      setEnableTreeData(false);
      setRowGroupingModel([]);
      setServerDataMode(false);
      setServerTreeMode(false);
      setInfiniteScrollMode(false);
      setViewportLazyMode(false);
      setListViewMode(false);
    }
  }, []);

  const handleToggleTreeData = useCallback((checked: boolean) => {
    setEnableTreeData(checked);
    if (checked) {
      setPivotMode(false);
      setRowGroupingModel([]);
      setServerDataMode(false);
      setServerTreeMode(false);
      setInfiniteScrollMode(false);
      setViewportLazyMode(false);
      setListViewMode(false);
    }
  }, []);

  const handleToggleRowGrouping = useCallback((checked: boolean) => {
    if (checked) {
      setPivotMode(false);
      setEnableTreeData(false);
      setServerDataMode(false);
      setServerTreeMode(false);
      setInfiniteScrollMode(false);
      setViewportLazyMode(false);
      setListViewMode(false);
      setRowGroupingModel(['region', 'status']);
    } else {
      setRowGroupingModel([]);
    }
  }, []);

  const handleToggleAggregation = useCallback((checked: boolean) => {
    setAggregationModel(
      checked ? { amount: 'sum', collectionRate: 'avg', orderNo: 'size' } : {},
    );
  }, []);

  const handleToggleLargeDataset = useCallback((checked: boolean) => {
    if (checked) {
      setLargeOrders((prev) => prev ?? createInitialEnterpriseOrders(1000));
      setServerDataMode(false);
      setServerTreeMode(false);
      setInfiniteScrollMode(false);
      setViewportLazyMode(false);
    }
    setLargeDatasetMode(checked);
  }, []);

  // Live state snapshot for StateInspector tab
  const [gridSnapshot, setGridSnapshot] = useState<GridStateSnapshot | null>(null);
  const snapshotQuickFilterText = (
    gridSnapshot?.filterModel.quickFilterValues ?? []
  ).join(' ');
  useEffect(() => {
    setExternalQuickSearch((prev) =>
      parseQuickFilterInput(prev).join(' ') === snapshotQuickFilterText
        ? prev
        : snapshotQuickFilterText,
    );
  }, [snapshotQuickFilterText]);

  // Inline edit feedback snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Dialog & Drawer states
  const [createOpen, setCreateOpen] = useState(false);
  const [inspectedOrder, setInspectedOrder] = useState<EnterpriseOrder | null>(
    null,
  );

  const handleDeleteRow = useCallback(
    (id: GridRowId) => {
      if (largeDatasetMode) {
        setLargeOrders((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
      } else {
        setOrders((prev) => prev.filter((row) => row.id !== id));
      }
      setInspectedOrder((prev) => (prev && prev.id === id ? null : prev));
    },
    [largeDatasetMode],
  );

  const handleQuickMarkSettled = useCallback(
    (row: EnterpriseOrder) => {
      const updated: EnterpriseOrder = {
        ...row,
        status: 'settled',
        collectionRate: 100,
        approved: true,
      };
      if (largeDatasetMode) {
        setLargeOrders((prev) =>
          prev ? prev.map((r) => (r.id === row.id ? updated : r)) : prev,
        );
      } else {
        setOrders((prev) =>
          prev.map((r) => (r.id === row.id ? updated : r)),
        );
      }
      setInspectedOrder((prev) => (prev && prev.id === row.id ? updated : prev));
      setSnackbar({
        open: true,
        message: `已将 ${row.orderNo} 快捷标记为「已结算」`,
        severity: 'success',
      });
    },
    [largeDatasetMode],
  );

  const handleDeleteSelected = useCallback(
    (ids: GridRowId[]) => {
      const idSet = new Set(ids);
      if (largeDatasetMode) {
        setLargeOrders((prev) =>
          prev ? prev.filter((r) => !idSet.has(r.id)) : prev,
        );
      } else {
        setOrders((prev) => prev.filter((row) => !idSet.has(row.id)));
      }
    },
    [largeDatasetMode],
  );

  const handleCreateOrder = useCallback(
    (newOrder: EnterpriseOrder) => {
      if (largeDatasetMode) {
        setLargeOrders((prev) => [newOrder, ...(prev ?? [])]);
      } else {
        setOrders((prev) => [newOrder, ...prev]);
      }
      setNextSeq((s) => s + 1);
      setEmptyPreview(false);
    },
    [largeDatasetMode],
  );

  const handleResetDemoData = useCallback(() => {
    setOrders(createInitialEnterpriseOrders(64));
    setLargeOrders(null);
    setLargeDatasetMode(false);
    setNextSeq(1065);
    setEmptyPreview(false);
    setLoadingPreview(false);
  }, []);

  const getOrderRowId = useCallback((row: EnterpriseOrder) => row.id, []);
  const getOrderTreePath = useCallback(
    (row: EnterpriseOrder) => [row.region, row.industry, row.orderNo],
    [],
  );

  const handleProcessRowUpdate = useCallback(
    (newRow: EnterpriseOrder, _oldRow: EnterpriseOrder): EnterpriseOrder => {
      if (!newRow.customer || String(newRow.customer).trim().length === 0) {
        throw new Error('客户名称不能为空');
      }
      if (Number(newRow.amount) < 0) {
        throw new Error('订单金额不能小于 0');
      }
      if (
        Number(newRow.collectionRate) < 0 ||
        Number(newRow.collectionRate) > 100
      ) {
        throw new Error('回款进度需在 0% - 100% 之间');
      }

      if (serverDataMode || viewportLazyMode || serverTreeMode) {
        return newRow;
      }

      if (largeDatasetMode) {
        setLargeOrders((prev) =>
          prev ? prev.map((item) => (item.id === newRow.id ? newRow : item)) : prev,
        );
      } else {
        setOrders((prev) =>
          prev.map((item) => (item.id === newRow.id ? newRow : item)),
        );
      }
      setInspectedOrder((prev) => (prev && prev.id === newRow.id ? newRow : prev));
      setSnackbar({
        open: true,
        message: `已更新订单 ${newRow.orderNo}`,
        severity: 'success',
      });
      return newRow;
    },
    [largeDatasetMode, serverDataMode, serverTreeMode, viewportLazyMode],
  );

  const handleProcessRowUpdateError = useCallback((error: unknown) => {
    setSnackbar({
      open: true,
      message: error instanceof Error ? error.message : '单元格更新失败',
      severity: 'error',
    });
  }, []);

  const handleSaveGridView = useCallback(() => {
    if (!apiRef.current) return;
    try {
      const state = apiRef.current.exportState();
      window.localStorage.setItem(
        SAVED_VIEW_STORAGE_KEY,
        JSON.stringify(state),
      );
      setHasSavedView(true);
      setDisplayOptionsAnchor(null);
      setSnackbar({
        open: true,
        message: '已保存当前表格视图配置',
        severity: 'success',
      });
    } catch {
      setSnackbar({
        open: true,
        message: '保存视图配置失败',
        severity: 'error',
      });
    }
  }, [apiRef]);

  const handleRestoreGridView = useCallback(() => {
    if (!apiRef.current) return;
    try {
      const raw = window.localStorage.getItem(SAVED_VIEW_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as GridPersistedState;
      if (parsed.rowGroupingModel && parsed.rowGroupingModel.length > 0) {
        setEnableTreeData(false);
      }
      apiRef.current.restoreState(parsed);
      setDisplayOptionsAnchor(null);
      setSnackbar({
        open: true,
        message: '已恢复上次保存的视图配置',
        severity: 'success',
      });
    } catch {
      setSnackbar({
        open: true,
        message: '恢复视图配置失败',
        severity: 'error',
      });
    }
  }, [apiRef]);

  const handleClipboardCopy = useCallback(
    ({ rowCount, colCount }: { rowCount: number; colCount: number }) => {
      const msg =
        rowCount > 1 || colCount > 1
          ? `已复制 ${rowCount}×${colCount} 单元格区域至剪贴板`
          : '已复制单元格内容至剪贴板';
      setSnackbar({ open: true, message: msg, severity: 'success' });
    },
    [],
  );

  const handleClipboardPaste = useCallback(
    ({
      updatedRows,
      updatedCells,
    }: {
      updatedRows: number;
      updatedCells: number;
    }) => {
      setSnackbar({
        open: true,
        message: `已粘贴更新 ${updatedRows} 行（${updatedCells} 个单元格）`,
        severity: 'success',
      });
    },
    [],
  );

  const handleClipboardClear = useCallback(
    ({
      updatedRows,
      updatedCells,
    }: {
      updatedRows: number;
      updatedCells: number;
    }) => {
      setSnackbar({
        open: true,
        message: `已清空选区 ${updatedRows} 行（${updatedCells} 个单元格，可 Ctrl+Z 撤销）`,
        severity: 'success',
      });
    },
    [],
  );

  const handleDataSourceError = useCallback((error: unknown) => {
    setSnackbar({
      open: true,
      message: error instanceof Error ? error.message : '服务端数据同步失败，已自动回滚',
      severity: 'error',
    });
  }, []);

  const handleCellAutoFill = useCallback(
    ({
      updatedRows,
      updatedCells,
    }: {
      updatedRows: number;
      updatedCells: number;
    }) => {
      setSnackbar({
        open: true,
        message: `已智能填充 ${updatedRows} 行（${updatedCells} 个单元格）`,
        severity: 'success',
      });
    },
    [],
  );

  const handleUndoRedo = useCallback(
    ({
      action,
      label,
    }: {
      action: 'undo' | 'redo';
      rowCount: number;
      label: string;
    }) => {
      setSnackbar({
        open: true,
        message: `${action === 'undo' ? '已撤销' : '已重做'}：${label}`,
        severity: 'success',
      });
    },
    [],
  );

  const handleExport = useCallback(
    ({
      format,
      rowCount,
      selectedOnly,
    }: {
      format: 'xlsx' | 'csv' | 'json';
      rowCount: number;
      selectedOnly: boolean;
    }) => {
      const formatLabel =
        format === 'xlsx'
          ? 'Excel (.xlsx)'
          : format === 'json'
            ? 'JSON'
            : 'CSV';
      setSnackbar({
        open: true,
        message: `已导出 ${rowCount} 条${selectedOnly ? '选中' : ''}订单为 ${formatLabel}`,
        severity: 'success',
      });
    },
    [],
  );

  const handleRowOrderChange = useCallback(
    ({ row, oldIndex, targetIndex }: GridRowOrderChangeParams<EnterpriseOrder>) => {
      if (largeDatasetMode) {
        setLargeOrders((prev) =>
          prev ? reorderRowsByIndex(prev, oldIndex, targetIndex) : prev,
        );
      } else {
        setOrders((prev) => reorderRowsByIndex(prev, oldIndex, targetIndex));
      }
      setSnackbar({
        open: true,
        message: `已将 ${row.orderNo} 调整至第 ${targetIndex + 1} 行`,
        severity: 'success',
      });
    },
    [largeDatasetMode],
  );

  const columnGroupingModel = useMemo<GridColumnGroupingModel>(
    () => [
      {
        groupId: 'identity',
        headerName: '合同标识',
        description: '订单编号与签约主体',
        children: [{ field: 'orderNo' }, { field: 'customer' }],
      },
      {
        groupId: 'finance',
        headerName: '财务与回款',
        description: '订单履约状态、合同额及回款比例',
        children: [
          { field: 'status' },
          { field: 'amount' },
          { field: 'collectionRate' },
        ],
      },
      {
        groupId: 'delivery',
        headerName: '业务归属与审批',
        description: '区域负责人、行业分类与审批记录',
        children: [
          { field: 'region' },
          { field: 'industry' },
          { field: 'priority' },
          { field: 'owner' },
          { field: 'approved' },
          { field: 'createdAt' },
          { field: 'remark' },
        ],
      },
    ],
    [],
  );

  const renderDetailPanelContent = useCallback(
    ({ row }: { id: GridRowId; row: EnterpriseOrder }) => {
      const lineItems = getOrderLineItems(row);
      const collectedAmount = Math.round(
        (row.amount * Math.max(0, Math.min(100, row.collectionRate))) / 100,
      );
      const pendingAmount = Math.max(0, row.amount - collectedAmount);

      return (
        <Box sx={{ px: 3, py: 2 }}>
          <Paper
            variant="outlined"
            sx={{
              bgcolor: '#FFFFFF',
              borderColor: '#E0E0E0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                borderBottom: '1px solid #E0E0E0',
                bgcolor: '#FAFAFA',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                <Typography
                  sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(0,0,0,0.87)' }}
                >
                  合同交付明细
                </Typography>
                <Typography
                  className="font-mono-tabular"
                  sx={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.6)' }}
                >
                  {row.orderNo} · {row.customer} · 负责人：{row.owner}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Typography
                  className="font-mono-tabular"
                  sx={{ fontSize: '0.8rem', color: '#15803D' }}
                >
                  已回款 ¥{collectedAmount.toLocaleString('zh-CN')}
                </Typography>
                <Typography
                  className="font-mono-tabular"
                  sx={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.6)' }}
                >
                  待回款 ¥{pendingAmount.toLocaleString('zh-CN')}
                </Typography>
              </Box>
            </Box>

            <Table size="small" aria-label={`${row.orderNo} 合同明细`}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, color: 'rgba(0,0,0,0.6)', width: 130 }}>
                    明细编号
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, color: 'rgba(0,0,0,0.6)' }}>
                    交付项名称
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 500, color: 'rgba(0,0,0,0.6)', width: 90 }}
                  >
                    数量
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 500, color: 'rgba(0,0,0,0.6)', width: 140 }}
                  >
                    单价
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 500, color: 'rgba(0,0,0,0.6)', width: 140 }}
                  >
                    小计金额
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineItems.map((item) => (
                  <TableRow
                    key={item.sku}
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell
                      className="font-mono-tabular"
                      sx={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.6)' }}
                    >
                      {item.sku}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.87)' }}>
                      {item.name}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="font-mono-tabular"
                      sx={{ fontSize: '0.8125rem' }}
                    >
                      {item.quantity}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="font-mono-tabular"
                      sx={{ fontSize: '0.8125rem' }}
                    >
                      ¥{item.unitPrice.toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="font-mono-tabular"
                      sx={{ fontSize: '0.8125rem', fontWeight: 500 }}
                    >
                      ¥{item.subtotal.toLocaleString('zh-CN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      );
    },
    [],
  );

  const columns = useMemo<GridColDef<EnterpriseOrder>[]>(
    () => [
      {
        field: 'orderNo',
        headerName: '订单编号',
        width: serverTreeMode ? 220 : 146,
        minWidth: 120,
        hideable: false,
        rowSpan: false,
        renderCell: ({ formattedValue }) => (
          <span
            className="font-mono-tabular"
            style={{
              fontSize: '0.875rem',
              color: 'rgba(0, 0, 0, 0.87)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {formattedValue}
          </span>
        ),
      },
      {
        field: 'customer',
        headerName: '客户名称',
        width: 210,
        minWidth: 150,
        flex: wideColumnsMode ? undefined : 1,
        editable: true,
        preProcessEditCellProps: ({ props }) => {
          const text = String(props.value ?? '').trim();
          if (text.length === 0) {
            return { ...props, error: '客户名称不能为空' };
          }
          if (text.length < 2) {
            return { ...props, error: '客户名称至少需要 2 个字符' };
          }
          return { ...props, error: false };
        },
        renderCell: ({ formattedValue }) => (
          <span
            title={`${formattedValue}（双击编辑）`}
            style={{
              fontSize: '0.875rem',
              color: 'rgba(0, 0, 0, 0.87)',
              whiteSpace: autoRowHeight ? 'normal' : 'nowrap',
              overflow: autoRowHeight ? undefined : 'hidden',
              textOverflow: autoRowHeight ? undefined : 'ellipsis',
              lineHeight: autoRowHeight ? 1.45 : undefined,
            }}
          >
            {formattedValue}
          </span>
        ),
      },
      {
        field: 'status',
        headerName: '订单状态',
        type: 'singleSelect',
        width: 122,
        minWidth: 104,
        editable: true,
        valueOptions: [
          { value: 'settled', label: '已结算' },
          { value: 'processing', label: '履行中' },
          { value: 'pending', label: '待审核' },
          { value: 'overdue', label: '已逾期' },
        ],
        renderCell: ({ value }) => {
          const status = value as OrderStatus;
          const meta = ORDER_STATUS_META[status];
          return (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                color: meta.color,
                fontSize: '0.8125rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {renderStatusIcon(status)}
              <span>{meta.label}</span>
            </span>
          );
        },
      },
      {
        field: 'amount',
        headerName: '订单金额',
        type: 'number',
        width: 148,
        minWidth: 120,
        editable: true,
        rowSpan: false,
        align: 'right',
        headerAlign: 'right',
        filterOperators: [
          ...getOperatorsForColumnType('number').map<
            GridFilterOperator<EnterpriseOrder>
          >((op) => ({
            value: op.value,
            label: op.label,
            requiresValue: op.requiresValue,
            getApplyFilterFn: (filterItem) => (cellValue, row, colDef) =>
              evaluateFilterItem(
                cellValue,
                filterItem,
                {
                  ...colDef,
                  filterOperators: undefined,
                },
                row,
              ),
          })),
          {
            value: 'highValue',
            label: '高额大单 (≥¥30万)',
            requiresValue: false,
            getApplyFilterFn: () => (cellValue) => Number(cellValue) >= 300000,
          },
          {
            value: 'between',
            label: '金额区间 (最小-最大)',
            requiresValue: true,
            getApplyFilterFn: (filterItem) => {
              const parts = String(filterItem.value ?? '')
                .split(/[-,~～]/)
                .map((s) => Number(s.trim()));
              if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) {
                return null;
              }
              const [min, max] = parts;
              return (cellValue) => {
                const n = Number(cellValue);
                return !Number.isNaN(n) && n >= min && n <= max;
              };
            },
          },
        ],
        preProcessEditCellProps: ({ props }) => {
          const raw = props.value;
          const num =
            typeof raw === 'number'
              ? raw
              : Number(String(raw ?? '').replace(/[¥￥,\s]/g, ''));
          if (raw === '' || raw === null || raw === undefined || Number.isNaN(num)) {
            return { ...props, error: '请输入有效的数字金额' };
          }
          if (num < 0) {
            return { ...props, error: '订单金额不能为负数' };
          }
          if (num > 100000000) {
            return { ...props, error: '单笔订单金额不能超过 1 亿元' };
          }
          return { ...props, error: false };
        },
        valueFormatter: (value) =>
          `¥${Number(value).toLocaleString('zh-CN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`,
        renderCell: ({ formattedValue }) => (
          <span
            className="font-mono-tabular"
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'rgba(0, 0, 0, 0.87)',
              whiteSpace: 'nowrap',
            }}
          >
            {formattedValue}
          </span>
        ),
      },
      {
        field: 'collectionRate',
        headerName: '回款进度',
        type: 'number',
        width: 146,
        minWidth: 120,
        editable: true,
        rowSpan: false,
        align: 'right',
        headerAlign: 'right',
        preProcessEditCellProps: ({ props }) => {
          const raw = props.value;
          const num =
            typeof raw === 'number'
              ? raw
              : Number(String(raw ?? '').replace(/[%\s]/g, ''));
          if (raw === '' || raw === null || raw === undefined || Number.isNaN(num)) {
            return { ...props, error: '请输入 0-100 的百分比' };
          }
          if (num < 0 || num > 100) {
            return { ...props, error: '回款进度需在 0% 至 100% 之间' };
          }
          return { ...props, error: false };
        },
        valueFormatter: (value) => `${Number(value)}%`,
        renderCell: ({ value }) => {
          const pct = Math.max(0, Math.min(100, Number(value)));
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 5,
                  backgroundColor: '#E2E8F0',
                  borderRadius: 99,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    backgroundColor:
                      pct === 100
                        ? '#15803D'
                        : pct >= 50
                          ? '#1976D2'
                          : '#D97706',
                  }}
                />
              </div>
              <span
                className="font-mono-tabular"
                style={{
                  fontSize: '0.78rem',
                  color: '#334155',
                  width: 36,
                  textAlign: 'right',
                }}
              >
                {pct}%
              </span>
            </div>
          );
        },
      },
      {
        field: 'region',
        headerName: '负责区域',
        type: 'singleSelect',
        width: 118,
        minWidth: 96,
        editable: true,
        valueOptions: ['华东区', '华北区', '华南区', '西南区', '华中区'],
      },
      {
        field: 'industry',
        headerName: '所属行业',
        width: 136,
        minWidth: 104,
      },
      {
        field: 'priority',
        headerName: '优先级',
        type: 'singleSelect',
        width: 110,
        minWidth: 92,
        editable: true,
        valueOptions: [
          { value: 'high', label: '高优先' },
          { value: 'medium', label: '常规' },
          { value: 'low', label: '低优先' },
        ],
        renderCell: ({ value }) => {
          const priority = value as OrderPriority;
          const meta = ORDER_PRIORITY_META[priority];
          return (
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: priority === 'high' ? 600 : 400,
                color: meta.color,
              }}
            >
              {meta.label}
            </span>
          );
        },
      },
      {
        field: 'owner',
        headerName: '负责人',
        width: 110,
        minWidth: 92,
        editable: true,
      },
      {
        field: 'approved',
        headerName: '审批通过',
        type: 'boolean',
        width: 112,
        minWidth: 96,
        editable: true,
        rowSpan: false,
      },
      {
        field: 'createdAt',
        headerName: '创建日期',
        type: 'date',
        width: 124,
        minWidth: 108,
        editable: true,
        rowSpan: false,
        renderCell: ({ formattedValue }) => (
          <span
            className="font-mono-tabular"
            style={{ fontSize: '0.8125rem', color: '#475569' }}
          >
            {formattedValue}
          </span>
        ),
      },
      {
        field: 'remark',
        headerName: '备注说明',
        width: 210,
        minWidth: 120,
        editable: true,
        rowSpan: false,
        renderCell: ({ formattedValue }) => (
          <span
            title={formattedValue || '—'}
            style={{
              fontSize: '0.8125rem',
              color: formattedValue ? '#475569' : '#94A3B8',
              whiteSpace: autoRowHeight ? 'normal' : 'nowrap',
              overflow: autoRowHeight ? undefined : 'hidden',
              textOverflow: autoRowHeight ? undefined : 'ellipsis',
              lineHeight: autoRowHeight ? 1.45 : undefined,
              wordBreak: autoRowHeight ? 'break-word' : undefined,
            }}
          >
            {formattedValue || '—'}
          </span>
        ),
      },
      ...(wideColumnsMode
        ? Array.from({ length: 23 }, (_, idx): GridColDef<EnterpriseOrder> => {
            const metricLabels = [
              'Q1 回款额',
              'Q2 回款额',
              'Q3 回款额',
              'Q4 回款额',
              '毛利率',
              '税前净额',
              '税额 (6%)',
              '折扣系数',
              '续约概率',
              '交付周期(天)',
              'SLA 等级',
              '合同年限',
              '计费周期',
              '开票进度',
              '法务复核',
              '信用评级',
              '渠道来源',
              '大客户经理',
              '交付工程师',
              '实施节点',
              '质保金比例',
              '风险评分',
              '账龄(天)',
            ];
            const headerName = metricLabels[idx] ?? `扩展指标 ${idx + 1}`;
            return {
              field: `extMetric_${idx + 1}`,
              headerName,
              type: 'number',
              width: 124,
              minWidth: 100,
              align: 'right',
              headerAlign: 'right',
              valueGetter: (_v, row) => {
                const seed =
                  Number(String(row.id).replace(/\D/g, '') || 1) * 17 +
                  (idx + 1) * 31;
                if (idx < 4) {
                  return Math.round((row.amount * (18 + (seed % 15))) / 100);
                }
                if (idx === 4 || idx === 8 || idx === 13 || idx === 20) {
                  return 45 + (seed % 50);
                }
                if (idx === 5) return Math.round(row.amount / 1.06);
                if (idx === 6) return Math.round(row.amount - row.amount / 1.06);
                return (seed % 90) + 10;
              },
              valueFormatter: (val) => {
                const n = Number(val ?? 0);
                if (idx < 4 || idx === 5 || idx === 6) {
                  return `¥${n.toLocaleString('zh-CN')}`;
                }
                if (idx === 4 || idx === 8 || idx === 13 || idx === 20) {
                  return `${n}%`;
                }
                return String(n);
              },
            };
          })
        : []),
      {
        field: 'actions',
        headerName: '操作',
        type: 'actions',
        width: 112,
        minWidth: 112,
        maxWidth: 112,
        sortable: false,
        filterable: false,
        resizable: false,
        hideable: false,
        align: 'center',
        headerAlign: 'center',
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="view"
            icon={ICON_ACTION_VIEW}
            label={`查看 ${row.orderNo} 详情`}
            onClick={() => setInspectedOrder(row)}
          />,
          <GridActionsCellItem
            key="delete"
            icon={ICON_ACTION_DELETE}
            label={`删除 ${row.orderNo}`}
            color="error"
            onClick={() => handleDeleteRow(row.id)}
          />,
          <GridActionsCellItem
            key="copy-order-no"
            icon={ICON_ACTION_COPY}
            label="复制订单编号"
            showInMenu
            onClick={() => {
              if (
                typeof navigator !== 'undefined' &&
                navigator.clipboard?.writeText
              ) {
                void navigator.clipboard.writeText(row.orderNo).catch(() => {});
              }
              setSnackbar({
                open: true,
                message: `已复制订单号 ${row.orderNo}`,
                severity: 'success',
              });
            }}
          />,
          <GridActionsCellItem
            key="mark-settled"
            icon={ICON_ACTION_SETTLED}
            label="快速标记已结算"
            color="primary"
            showInMenu
            disabled={row.status === 'settled'}
            onClick={() => handleQuickMarkSettled(row)}
          />,
        ],
      },
    ],
    [
      handleDeleteRow,
      handleQuickMarkSettled,
      autoRowHeight,
      wideColumnsMode,
      serverTreeMode,
    ],
  );

  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const serverDataSource = useMemo<GridDataSource<EnterpriseOrder> | undefined>(() => {
    if (!serverDataMode && !viewportLazyMode && !serverTreeMode) return undefined;
    return {
      getRows: async (params) => {
        await new Promise((resolve) => window.setTimeout(resolve, 180));
        if (serverTreeMode) {
          return executeServerTreeQuery(
            serverOrdersPoolRef.current,
            columnsRef.current,
            getOrderTreePath,
            params,
          );
        }
        return executeServerQuery(
          serverOrdersPoolRef.current,
          columnsRef.current,
          params,
        );
      },
      ...(serverTreeMode
        ? {
            getGroupKey: (row: EnterpriseOrder) =>
              String((row as Record<string, unknown>).__serverTreeKey ?? row.orderNo),
            getChildrenCount: (row: EnterpriseOrder) =>
              Number((row as Record<string, unknown>).__serverTreeChildrenCount ?? 0),
          }
        : {}),
      updateRow: async ({ newRow }) => {
        await new Promise((resolve) => window.setTimeout(resolve, 180));
        if (
          Number(newRow.amount) < 0 ||
          String(newRow.customer ?? '').includes('回滚')
        ) {
          throw new Error('服务端校验失败：金额不可为负且客户名称不可包含「回滚」');
        }
        const nextPool = serverOrdersPoolRef.current.map((item) =>
          item.id === newRow.id ? { ...item, ...newRow } : item,
        );
        serverOrdersPoolRef.current = nextPool;
        setServerOrdersPool(nextPool);
        setSnackbar({
          open: true,
          message: `已通过 dataSource.updateRow 写回服务端 (${newRow.orderNo})`,
          severity: 'success',
        });
        return newRow;
      },
    };
  }, [serverDataMode, viewportLazyMode, serverTreeMode, getOrderTreePath]);

  const orderListViewColumn = useMemo<GridListViewColDef<EnterpriseOrder>>(
    () => ({
      field: 'orderCard',
      renderCell: ({ row }) => {
        const statusMeta = ORDER_STATUS_META[row.status];
        const priorityMeta = ORDER_PRIORITY_META[row.priority];
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              width: '100%',
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ minWidth: 220, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.4 }}>
                <Typography
                  component="span"
                  className="font-mono-tabular"
                  sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1976D2' }}
                >
                  {row.orderNo}
                </Typography>
                <Typography
                  component="span"
                  sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}
                >
                  {row.customer}
                </Typography>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.45,
                    color: statusMeta.color,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  {renderStatusIcon(row.status)}
                  <span>{statusMeta.label}</span>
                </Box>
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                {row.region} · {row.industry} · 负责人：{row.owner} · 优先级：
                <Box component="span" sx={{ color: priorityMeta.color, fontWeight: 500 }}>
                  {priorityMeta.label}
                </Box>{' '}
                · 下单日期：{row.createdAt}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  className="font-mono-tabular"
                  sx={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}
                >
                  ¥{row.amount.toLocaleString('zh-CN')}
                </Typography>
                <Typography
                  className="font-mono-tabular"
                  sx={{ fontSize: '0.72rem', color: '#64748B' }}
                >
                  回款进度 {row.collectionRate}%
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectedOrder(row);
                }}
                sx={{ fontSize: '0.75rem', minWidth: 68, py: 0.35 }}
              >
                查看详情
              </Button>
            </Box>
          </Box>
        );
      },
    }),
    [],
  );

  const activeOrders = infiniteScrollMode
    ? serverOrdersPool.slice(0, lazyLoadedCount)
    : largeDatasetMode && largeOrders
      ? largeOrders
      : orders;
  const displayedRows = emptyPreview ? [] : activeOrders;

  const totalAmount = useMemo(
    () =>
      (serverDataMode || viewportLazyMode || serverTreeMode
        ? serverOrdersPool
        : displayedRows
      ).reduce((sum, row) => sum + row.amount, 0),
    [displayedRows, serverDataMode, viewportLazyMode, serverTreeMode, serverOrdersPool],
  );

  const pinnedRowsConfig = useMemo<
    GridPinnedRowsProp<EnterpriseOrder> | undefined
  >(() => {
    if (!enablePinnedRows || displayedRows.length === 0) return undefined;
    const topOverdue =
      displayedRows.find((r) => r.status === 'overdue') ?? displayedRows[0];
    const avgRate = Math.round(
      displayedRows.reduce((sum, r) => sum + r.collectionRate, 0) /
        displayedRows.length,
    );
    const summaryRow: Partial<EnterpriseOrder> = {
      id: '__summary__',
      orderNo: '合计汇总',
      customer: `共 ${displayedRows.length} 笔企业合同`,
      amount: totalAmount,
      collectionRate: avgRate,
      region: '全部区域',
      remark: '实时汇总行（固定置底）',
    };
    return {
      top: topOverdue ? [topOverdue] : [],
      bottom: [summaryRow],
    };
  }, [displayedRows, enablePinnedRows, totalAmount]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#FAFAFA',
      }}
    >
      {/* Top Bar Contract: 3 zones separated cleanly */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <Box
          sx={{
            maxWidth: 1440,
            mx: 'auto',
            px: { xs: 2, md: 3 },
            height: 58,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 4,
          }}
        >
          {/* Zone 1: Single wordmark */}
          <Typography
            component="a"
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('demo');
            }}
            sx={{
              fontSize: '1.05rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#0F172A',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            DataGrid Pro
          </Typography>

          {/* Zone 2: Concise single-line navigation tabs */}
          <Box
            component="nav"
            aria-label="主导航"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 2, sm: 3.5 },
              height: '100%',
            }}
          >
            {(
              [
                { key: 'message', label: '全局提示' },
                { key: 'date', label: '日期选择' },
                { key: 'menu', label: '菜单导航' },
                { key: 'demo', label: '数据表格' },
                { key: 'state', label: '状态检视' },
                { key: 'architecture', label: '源码架构' },
              ] as const
            ).map((navItem) => {
              const isActive = activeTab === navItem.key;
              return (
                <Box
                  key={navItem.key}
                  component="button"
                  type="button"
                  onClick={() => setActiveTab(navItem.key)}
                  aria-current={isActive ? 'page' : undefined}
                  sx={{
                    height: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    borderBottom: isActive
                      ? '2px solid #1976D2'
                      : '2px solid transparent',
                    px: 0.5,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#0F172A' : '#475569',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontFamily: 'inherit',
                    transition: 'color 140ms ease, border-color 140ms ease',
                    '&:hover': {
                      color: '#0F172A',
                    },
                    '&:focus-visible': {
                      outline: '2px solid #1976D2',
                      outlineOffset: -2,
                    },
                  }}
                >
                  {navItem.label}
                </Box>
              );
            })}
          </Box>

          {/* Zone 3: Single primary CTA */}
          <Box sx={{ flexShrink: 0 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{
                px: 2,
                py: 0.85,
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              新增订单
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content Container */}
      <Box
        component="main"
        sx={{
          flex: 1,
          width: '100%',
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 2, md: 3 },
          py: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: activeTab === 'demo' ? 'flex' : 'none',
            flexDirection: 'column',
            gap: 2,
          }}
        >
            {/* Workspace Header + Single-Line Pro Feature Toggles */}
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', lg: 'flex-end' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 2,
              }}
            >
              <Box sx={{ flexShrink: 0 }}>
                <Typography
                  component="h1"
                  sx={{
                    fontSize: '1.375rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: '#0F172A',
                    lineHeight: 1.3,
                  }}
                >
                  企业订单台账
                </Typography>
                <Typography
                  className="tabular-nums"
                  sx={{
                    fontSize: '0.8125rem',
                    color: '#475569',
                    mt: 0.4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {serverTreeMode
                    ? `服务端树形懒加载 · 共 ${serverOrdersPool.length.toLocaleString('zh-CN')} 笔订单 · 按需逐级拉取`
                    : serverDataMode
                      ? `服务端数据源 · 共 ${serverOrdersPool.length.toLocaleString('zh-CN')} 笔订单 · 合计 ¥${totalAmount.toLocaleString('zh-CN')}`
                      : viewportLazyMode
                        ? `分片懒加载 · 共 ${serverOrdersPool.length.toLocaleString('zh-CN')} 笔订单 · 合计 ¥${totalAmount.toLocaleString('zh-CN')}`
                        : infiniteScrollMode
                          ? `无限滚动懒加载 · 已加载 ${displayedRows.length} / ${serverOrdersPool.length} 笔订单`
                          : `共 ${displayedRows.length.toLocaleString('zh-CN')} 笔订单 · 合计 ¥${totalAmount.toLocaleString('zh-CN')}`}
                </Typography>
              </Box>

              {/* Single-Line Flagship Pro Controls + Secondary Display Options Popover */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: { xs: 'wrap', lg: 'nowrap' },
                  rowGap: 0.5,
                  columnGap: 1.15,
                }}
              >
                <FormControlLabel
                  sx={{
                    m: 0,
                    whiteSpace: 'nowrap',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.78rem',
                      color: '#334155',
                    },
                  }}
                  control={
                    <Switch
                      size="small"
                      checked={pivotMode}
                      onChange={(e) => handleTogglePivotMode(e.target.checked)}
                    />
                  }
                  label="透视表"
                />
                <FormControlLabel
                  sx={{
                    m: 0,
                    whiteSpace: 'nowrap',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.78rem',
                      color: '#334155',
                    },
                  }}
                  control={
                    <Switch
                      size="small"
                      checked={isRowGroupingActive}
                      onChange={(e) =>
                        handleToggleRowGrouping(e.target.checked)
                      }
                    />
                  }
                  label="行分组"
                />
                <FormControlLabel
                  sx={{
                    m: 0,
                    whiteSpace: 'nowrap',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.78rem',
                      color: '#334155',
                    },
                  }}
                  control={
                    <Switch
                      size="small"
                      checked={enableTreeData}
                      onChange={(e) => handleToggleTreeData(e.target.checked)}
                    />
                  }
                  label="树形数据"
                />
                <FormControlLabel
                  sx={{
                    m: 0,
                    whiteSpace: 'nowrap',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.78rem',
                      color: '#334155',
                    },
                  }}
                  control={
                    <Switch
                      size="small"
                      checked={isAggregationActive}
                      onChange={(e) =>
                        handleToggleAggregation(e.target.checked)
                      }
                    />
                  }
                  label="聚合汇总"
                />
                <FormControlLabel
                  sx={{
                    m: 0,
                    whiteSpace: 'nowrap',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.78rem',
                      color: '#334155',
                    },
                  }}
                  control={
                    <Switch
                      size="small"
                      checked={headerFilters}
                      onChange={(e) => setHeaderFilters(e.target.checked)}
                    />
                  }
                  label="列头筛选"
                />
                <FormControlLabel
                  sx={{
                    m: 0,
                    whiteSpace: 'nowrap',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.78rem',
                      color: '#334155',
                    },
                  }}
                  control={
                    <Switch
                      size="small"
                      checked={enableColumnGrouping}
                      onChange={(e) =>
                        setEnableColumnGrouping(e.target.checked)
                      }
                    />
                  }
                  label="列分组"
                />
                <FormControlLabel
                  sx={{
                    m: 0,
                    whiteSpace: 'nowrap',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.78rem',
                      color: '#334155',
                    },
                  }}
                  control={
                    <Switch
                      size="small"
                      checked={enablePinnedRows}
                      onChange={(e) => setEnablePinnedRows(e.target.checked)}
                    />
                  }
                  label="固定行"
                />
                <FormControlLabel
                  sx={{
                    m: 0,
                    whiteSpace: 'nowrap',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.78rem',
                      color: '#334155',
                    },
                  }}
                  control={
                    <Switch
                      size="small"
                      checked={rowReordering}
                      onChange={(e) => setRowReordering(e.target.checked)}
                    />
                  }
                  label="行拖拽"
                />
                <FormControlLabel
                  sx={{
                    m: 0,
                    whiteSpace: 'nowrap',
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.78rem',
                      color: '#334155',
                    },
                  }}
                  control={
                    <Switch
                      size="small"
                      checked={fullRowEdit}
                      onChange={(e) => setFullRowEdit(e.target.checked)}
                    />
                  }
                  label="整行编辑"
                />
                <Tooltip
                  title="切换至 1,000 行大数据集并启用高性能窗口行虚拟滚动"
                  enterDelay={400}
                >
                  <FormControlLabel
                    sx={{
                      m: 0,
                      whiteSpace: 'nowrap',
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.78rem',
                        color: '#334155',
                      },
                    }}
                    control={
                      <Switch
                        size="small"
                        checked={largeDatasetMode}
                        onChange={(e) =>
                          handleToggleLargeDataset(e.target.checked)
                        }
                        slotProps={{ input: { 'aria-label': '千行虚拟滚动' } }}
                      />
                    }
                    label="千行虚拟"
                  />
                </Tooltip>

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<TuneIcon sx={{ fontSize: 16 }} />}
                  onClick={(e) => setDisplayOptionsAnchor(e.currentTarget)}
                  sx={{
                    minWidth: 'auto',
                    px: 1.25,
                    py: 0.35,
                    fontSize: '0.78rem',
                    color: '#334155',
                    borderColor: '#CBD5E1',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    '&:hover': {
                      borderColor: '#1976D2',
                      color: '#1976D2',
                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                    },
                  }}
                >
                  显示选项
                </Button>

                <Popover
                  open={Boolean(displayOptionsAnchor)}
                  anchorEl={displayOptionsAnchor}
                  onClose={() => setDisplayOptionsAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{
                    paper: {
                      elevation: 6,
                      sx: { p: 1.5, width: 252, borderRadius: '4px', mt: 0.5 },
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                    }}
                  >
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={cellSelection}
                          onChange={(e) => setCellSelection(e.target.checked)}
                        />
                      }
                      label="单元格区域选区"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={checkboxSelection}
                          onChange={(e) =>
                            setCheckboxSelection(e.target.checked)
                          }
                        />
                      }
                      label="复选框选择"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={rowSpanning}
                          onChange={(e) => setRowSpanning(e.target.checked)}
                        />
                      }
                      label="相邻同值合并"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={lockSettledRows}
                          onChange={(e) => setLockSettledRows(e.target.checked)}
                        />
                      }
                      label="锁定已结算订单"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={autoRowHeight}
                          onChange={(e) => setAutoRowHeight(e.target.checked)}
                        />
                      }
                      label="自适应行高 (auto)"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={singleRowSelect}
                          onChange={(e) => setSingleRowSelect(e.target.checked)}
                        />
                      }
                      label="单选模式"
                    />
                    <Divider sx={{ my: 0.5 }} />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={serverDataMode}
                          onChange={(e) =>
                            handleToggleServerDataMode(e.target.checked)
                          }
                        />
                      }
                      label="服务端分页 / 排序 / 筛选"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={infiniteScrollMode}
                          onChange={(e) =>
                            handleToggleInfiniteScrollMode(e.target.checked)
                          }
                        />
                      }
                      label="无限滚动加载 (Lazy)"
                    />
                    <Divider sx={{ my: 0.5 }} />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={englishLocale}
                          onChange={(e) => setEnglishLocale(e.target.checked)}
                        />
                      }
                      label="英文界面 (en-US)"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={customFooterSlot}
                          onChange={(e) =>
                            setCustomFooterSlot(e.target.checked)
                          }
                        />
                      }
                      label="自定义页脚插槽 (Footer Slot)"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={wideColumnsMode}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setWideColumnsMode(checked);
                            if (checked) {
                              setEnableColumnGrouping(false);
                              setPivotMode(false);
                            }
                          }}
                        />
                      }
                      label="宽表列虚拟化 (36列)"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={autoHeightMode}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setAutoHeightMode(checked);
                            if (checked) {
                              setLargeDatasetMode(false);
                              setInfiniteScrollMode(false);
                              setViewportLazyMode(false);
                            }
                          }}
                        />
                      }
                      label="自动高度 (autoHeight)"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={viewportLazyMode}
                          onChange={(e) =>
                            handleToggleViewportLazyMode(e.target.checked)
                          }
                        />
                      }
                      label="分片懒加载 (500行)"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={serverTreeMode}
                          onChange={(e) =>
                            handleToggleServerTreeMode(e.target.checked)
                          }
                        />
                      }
                      label="服务端树形懒加载"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={listViewMode}
                          onChange={(e) =>
                            handleToggleListViewMode(e.target.checked)
                          }
                        />
                      }
                      label="列表视图 (listView)"
                    />
                    <Divider sx={{ my: 0.5 }} />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={showBuiltInToolbar}
                          onChange={(e) =>
                            setShowBuiltInToolbar(e.target.checked)
                          }
                        />
                      }
                      label="显示内置工具栏 (showToolbar)"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={showCellVerticalBorder}
                          onChange={(e) =>
                            setShowCellVerticalBorder(e.target.checked)
                          }
                        />
                      }
                      label="单元格竖线"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={loadingPreview}
                          onChange={(e) => setLoadingPreview(e.target.checked)}
                        />
                      }
                      label="加载态预览"
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.8125rem',
                          color: '#334155',
                        },
                      }}
                      control={
                        <Switch
                          size="small"
                          checked={emptyPreview}
                          onChange={(e) => setEmptyPreview(e.target.checked)}
                        />
                      }
                      label="空数据预览"
                    />

                    <Divider sx={{ my: 0.5 }} />

                    <Button
                      size="small"
                      variant="text"
                      startIcon={<BookmarkBorderIcon fontSize="small" />}
                      onClick={handleSaveGridView}
                      sx={{
                        justifyContent: 'flex-start',
                        fontSize: '0.8125rem',
                        color: '#1976D2',
                      }}
                    >
                      保存当前视图
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      disabled={!hasSavedView}
                      startIcon={<RestoreIcon fontSize="small" />}
                      onClick={handleRestoreGridView}
                      sx={{
                        justifyContent: 'flex-start',
                        fontSize: '0.8125rem',
                        color: '#334155',
                      }}
                    >
                      恢复已保存视图
                    </Button>

                    {(orders.length !== 64 ||
                      largeDatasetMode ||
                      emptyPreview ||
                      loadingPreview) && (
                      <>
                        <Divider sx={{ my: 0.5 }} />
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<RestartAltIcon fontSize="small" />}
                          onClick={() => {
                            handleResetDemoData();
                            setDisplayOptionsAnchor(null);
                          }}
                          sx={{
                            justifyContent: 'flex-start',
                            fontSize: '0.8125rem',
                            color: '#475569',
                          }}
                        >
                          恢复默认示例数据
                        </Button>
                      </>
                    )}
                  </Box>
                </Popover>
              </Box>
            </Box>

            {/* Clean External Control Bar (shown when built-in toolbar is hidden via showToolbar={false}) */}
            {!showBuiltInToolbar &&
              (() => {
                const selectedRowIds = gridSnapshot?.rowSelectionModel ?? [];
                const activeFilterItemCount = (
                  gridSnapshot?.filterModel.items ?? []
                ).filter((item) => {
                  if (
                    item.operator === 'isEmpty' ||
                    item.operator === 'isNotEmpty'
                  ) {
                    return true;
                  }
                  if (Array.isArray(item.value)) return item.value.length > 0;
                  return (
                    item.value !== undefined &&
                    item.value !== null &&
                    String(item.value).trim() !== ''
                  );
                }).length;
                const hiddenColCount = Object.values(
                  gridSnapshot?.columnVisibilityModel ?? {},
                ).filter((v) => v === false).length;
                const currentDensity: GridDensity =
                  gridSnapshot?.density ?? 'standard';

                const controlBtnSx = {
                  height: 32,
                  px: 1.25,
                  minWidth: 'auto',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: '#334155',
                  borderColor: '#E2E8F0',
                  bgcolor: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: '#CBD5E1',
                    bgcolor: '#F8FAFC',
                    color: '#0F172A',
                  },
                };

                if (selectedRowIds.length > 0) {
                  return (
                    <Box
                      data-testid="external-selection-bar"
                      sx={{
                        minHeight: 44,
                        px: 1.5,
                        py: 0.75,
                        borderRadius: '6px',
                        bgcolor: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      <Typography
                        className="tabular-nums"
                        sx={{
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          color: '#1D4ED8',
                        }}
                      >
                        {englishLocale
                          ? `${selectedRowIds.length} row(s) selected`
                          : `已选择 ${selectedRowIds.length} 笔订单`}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<TableViewOutlinedIcon sx={{ fontSize: 16 }} />}
                          onClick={() =>
                            apiRef.current?.exportDataAsExcel({
                              selectedOnly: true,
                              fileName: 'enterprise-orders-selected',
                            })
                          }
                          sx={controlBtnSx}
                        >
                          {englishLocale ? 'Export Excel' : '导出选中 Excel'}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<SaveAltIcon sx={{ fontSize: 16 }} />}
                          onClick={() =>
                            apiRef.current?.exportDataAsCsv({
                              selectedOnly: true,
                              fileName: 'enterprise-orders-selected',
                            })
                          }
                          sx={controlBtnSx}
                        >
                          {englishLocale ? 'Export CSV' : '导出选中 CSV'}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />}
                          onClick={() => {
                            handleDeleteSelected(selectedRowIds);
                            apiRef.current?.setRowSelectionModel([]);
                          }}
                          sx={{
                            height: 32,
                            px: 1.25,
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            bgcolor: '#FFFFFF',
                          }}
                        >
                          {englishLocale ? 'Delete selected' : '删除选中'}
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => apiRef.current?.setRowSelectionModel([])}
                          sx={{
                            height: 32,
                            fontSize: '0.8rem',
                            color: '#475569',
                          }}
                        >
                          {englishLocale ? 'Clear' : '取消选择'}
                        </Button>
                      </Box>
                    </Box>
                  );
                }

                return (
                  <Box
                    data-testid="external-grid-toolbar"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1.25,
                    }}
                  >
                    {/* Left: Clean external quick filter input */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 260px', maxWidth: 360 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={externalQuickSearch}
                        placeholder={
                          englishLocale
                            ? 'Search order, customer, region...'
                            : '搜索订单号、客户、区域或负责人...'
                        }
                        onChange={(e) => {
                          const nextVal = e.target.value;
                          setExternalQuickSearch(nextVal);
                          apiRef.current?.setQuickFilterValues(
                            parseQuickFilterInput(nextVal),
                          );
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: 32,
                            fontSize: '0.8125rem',
                            bgcolor: '#FFFFFF',
                            borderRadius: '6px',
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#CBD5E1' },
                            '&.Mui-focused fieldset': {
                              borderColor: '#1976D2',
                              borderWidth: 1,
                            },
                          },
                        }}
                        slotProps={{
                          input: {
                            'aria-label': englishLocale
                              ? 'Search table'
                              : '外部快速搜索',
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                              </InputAdornment>
                            ),
                            endAdornment: externalQuickSearch ? (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  aria-label={englishLocale ? 'Clear search' : '清空搜索'}
                                  onClick={() => {
                                    setExternalQuickSearch('');
                                    apiRef.current?.setQuickFilterValues([]);
                                  }}
                                  edge="end"
                                  sx={{ p: 0.25 }}
                                >
                                  <CloseIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </InputAdornment>
                            ) : null,
                          },
                        }}
                      />
                    </Box>

                    {/* Right: Minimalist external controls powered by apiRef & controlled props */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
                        onClick={(e) =>
                          apiRef.current?.showFilterPanel(undefined, e.currentTarget)
                        }
                        sx={{
                          ...controlBtnSx,
                          ...(activeFilterItemCount > 0
                            ? {
                                borderColor: '#93C5FD',
                                bgcolor: '#EFF6FF',
                                color: '#1D4ED8',
                              }
                            : {}),
                        }}
                      >
                        {englishLocale ? 'Filters' : '筛选'}
                        {activeFilterItemCount > 0 ? ` (${activeFilterItemCount})` : ''}
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewColumnIcon sx={{ fontSize: 16 }} />}
                        onClick={(e) =>
                          apiRef.current?.showColumnsPanel(e.currentTarget)
                        }
                        sx={{
                          ...controlBtnSx,
                          ...(hiddenColCount > 0
                            ? {
                                borderColor: '#93C5FD',
                                bgcolor: '#EFF6FF',
                                color: '#1D4ED8',
                              }
                            : {}),
                        }}
                      >
                        {englishLocale ? 'Columns' : '列设置'}
                        {hiddenColCount > 0 ? ` (${hiddenColCount})` : ''}
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={
                          currentDensity === 'compact' ? (
                            <ViewHeadlineIcon sx={{ fontSize: 16 }} />
                          ) : currentDensity === 'comfortable' ? (
                            <ViewStreamIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <TableRowsIcon sx={{ fontSize: 16 }} />
                          )
                        }
                        onClick={(e) => setExternalDensityAnchor(e.currentTarget)}
                        sx={controlBtnSx}
                      >
                        {englishLocale ? 'Density' : '密度'}
                      </Button>
                      <Menu
                        anchorEl={externalDensityAnchor}
                        open={Boolean(externalDensityAnchor)}
                        onClose={() => setExternalDensityAnchor(null)}
                        slotProps={{
                          paper: {
                            elevation: 6,
                            sx: { minWidth: 152, borderRadius: '6px', mt: 0.5 },
                          },
                        }}
                      >
                        {(
                          [
                            {
                              value: 'compact',
                              label: englishLocale ? 'Compact' : '紧凑',
                              hint: '36px',
                            },
                            {
                              value: 'standard',
                              label: englishLocale ? 'Standard' : '标准',
                              hint: '52px',
                            },
                            {
                              value: 'comfortable',
                              label: englishLocale ? 'Comfortable' : '宽松',
                              hint: '67px',
                            },
                          ] as Array<{
                            value: GridDensity;
                            label: string;
                            hint: string;
                          }>
                        ).map((opt) => (
                          <MenuItem
                            key={opt.value}
                            selected={currentDensity === opt.value}
                            onClick={() => {
                              apiRef.current?.setDensity(opt.value);
                              setExternalDensityAnchor(null);
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 26 }}>
                              {currentDensity === opt.value ? (
                                <CheckIcon fontSize="small" color="primary" />
                              ) : null}
                            </ListItemIcon>
                            <ListItemText
                              primary={opt.label}
                              secondary={opt.hint}
                              slotProps={{
                                primary: { sx: { fontSize: '0.84rem' } },
                                secondary: {
                                  sx: {
                                    fontSize: '0.72rem',
                                    fontFamily: 'JetBrains Mono, monospace',
                                  },
                                },
                              }}
                            />
                          </MenuItem>
                        ))}
                      </Menu>

                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<SaveAltIcon sx={{ fontSize: 16 }} />}
                        onClick={(e) => setExternalExportAnchor(e.currentTarget)}
                        sx={controlBtnSx}
                      >
                        {englishLocale ? 'Export' : '导出'}
                      </Button>
                      <Menu
                        anchorEl={externalExportAnchor}
                        open={Boolean(externalExportAnchor)}
                        onClose={() => setExternalExportAnchor(null)}
                        slotProps={{
                          paper: {
                            elevation: 6,
                            sx: { minWidth: 176, borderRadius: '6px', mt: 0.5 },
                          },
                        }}
                      >
                        <MenuItem
                          onClick={() => {
                            apiRef.current?.exportDataAsExcel();
                            setExternalExportAnchor(null);
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <TableViewOutlinedIcon
                              fontSize="small"
                              sx={{ color: '#15803D' }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={englishLocale ? 'Download Excel (.xlsx)' : '导出 Excel (.xlsx)'}
                            slotProps={{ primary: { sx: { fontSize: '0.84rem' } } }}
                          />
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            apiRef.current?.exportDataAsCsv();
                            setExternalExportAnchor(null);
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <SaveAltIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={englishLocale ? 'Download CSV' : '导出 CSV'}
                            slotProps={{ primary: { sx: { fontSize: '0.84rem' } } }}
                          />
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            apiRef.current?.exportDataAsJson();
                            setExternalExportAnchor(null);
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <DataObjectIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={englishLocale ? 'Download JSON' : '导出 JSON'}
                            slotProps={{ primary: { sx: { fontSize: '0.84rem' } } }}
                          />
                        </MenuItem>
                        <Divider />
                        <MenuItem
                          onClick={() => {
                            setExternalExportAnchor(null);
                            apiRef.current?.exportDataAsPrint();
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <PrintOutlinedIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={englishLocale ? 'Print preview' : '打印预览'}
                            slotProps={{ primary: { sx: { fontSize: '0.84rem' } } }}
                          />
                        </MenuItem>
                      </Menu>

                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ mx: 0.25, my: 0.5, borderColor: '#E2E8F0' }}
                      />

                      {!pivotMode && (
                        <>
                          <Tooltip
                            title={englishLocale ? 'Undo (Ctrl+Z)' : '撤销编辑 (Ctrl+Z)'}
                            enterDelay={350}
                          >
                            <span>
                              <IconButton
                                size="small"
                                aria-label={englishLocale ? 'Undo' : '撤销'}
                                disabled={!editHistoryState.canUndo}
                                onClick={() => void apiRef.current?.undo()}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '6px',
                                  bgcolor: '#FFFFFF',
                                  color: editHistoryState.canUndo
                                    ? '#334155'
                                    : '#CBD5E1',
                                }}
                              >
                                <UndoIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={englishLocale ? 'Redo (Ctrl+Y)' : '重做编辑 (Ctrl+Y)'}
                            enterDelay={350}
                          >
                            <span>
                              <IconButton
                                size="small"
                                aria-label={englishLocale ? 'Redo' : '重做'}
                                disabled={!editHistoryState.canRedo}
                                onClick={() => void apiRef.current?.redo()}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '6px',
                                  bgcolor: '#FFFFFF',
                                  color: editHistoryState.canRedo
                                    ? '#334155'
                                    : '#CBD5E1',
                                }}
                              >
                                <RedoIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      )}

                      <Tooltip
                        title={englishLocale ? 'Charts panel' : '图表分析面板'}
                        enterDelay={350}
                      >
                        <IconButton
                          size="small"
                          aria-label={englishLocale ? 'Toggle charts' : '图表分析'}
                          aria-pressed={chartsPanelOpen}
                          onClick={() => apiRef.current?.toggleChartsPanel()}
                          sx={{
                            width: 32,
                            height: 32,
                            border: '1px solid',
                            borderColor: chartsPanelOpen ? '#93C5FD' : '#E2E8F0',
                            borderRadius: '6px',
                            bgcolor: chartsPanelOpen ? '#EFF6FF' : '#FFFFFF',
                            color: chartsPanelOpen ? '#1D4ED8' : '#334155',
                          }}
                        >
                          <BarChartIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>

                      {pivotMode && (
                        <Tooltip
                          title={englishLocale ? 'Pivot settings' : '透视维度面板'}
                          enterDelay={350}
                        >
                          <IconButton
                            size="small"
                            aria-label={englishLocale ? 'Pivot settings' : '透视配置'}
                            aria-pressed={sidebarPanel === 'pivot'}
                            onClick={() =>
                              apiRef.current?.setSidebarPanel(
                                sidebarPanel === 'pivot' ? null : 'pivot',
                              )
                            }
                            sx={{
                              width: 32,
                              height: 32,
                              border: '1px solid',
                              borderColor:
                                sidebarPanel === 'pivot' ? '#93C5FD' : '#E2E8F0',
                              borderRadius: '6px',
                              bgcolor:
                                sidebarPanel === 'pivot' ? '#EFF6FF' : '#FFFFFF',
                              color:
                                sidebarPanel === 'pivot' ? '#1D4ED8' : '#334155',
                            }}
                          >
                            <PivotTableChartIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip
                        title={englishLocale ? 'Docked sidebar' : '右侧工具侧边栏'}
                        enterDelay={350}
                      >
                        <IconButton
                          size="small"
                          aria-label={englishLocale ? 'Toggle sidebar' : '侧边栏'}
                          aria-pressed={Boolean(sidebarPanel)}
                          onClick={() =>
                            apiRef.current?.setSidebarPanel(
                              sidebarPanel ? null : pivotMode ? 'pivot' : 'columns',
                            )
                          }
                          sx={{
                            width: 32,
                            height: 32,
                            border: '1px solid',
                            borderColor: sidebarPanel ? '#93C5FD' : '#E2E8F0',
                            borderRadius: '6px',
                            bgcolor: sidebarPanel ? '#EFF6FF' : '#FFFFFF',
                            color: sidebarPanel ? '#1D4ED8' : '#334155',
                          }}
                        >
                          <ViewSidebarOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                );
              })()}

            {/* Primary Focal Anchor: DataGridPro */}
            <DataGridPro<EnterpriseOrder>
              apiRef={apiRef}
              showToolbar={showBuiltInToolbar}
              sidebarPanel={sidebarPanel}
              onSidebarPanelChange={setSidebarPanel}
              chartsPanelOpen={chartsPanelOpen}
              onChartsPanelOpenChange={setChartsPanelOpen}
              rows={displayedRows}
              columns={columns}
              getRowId={getOrderRowId}
              height={628}
              autoHeight={autoHeightMode}
              columnBufferPx={160}
              loading={loadingPreview || lazyLoading}
              dataSource={serverDataSource}
              lazyLoading={viewportLazyMode}
              lazyLoadingChunkSize={25}
              listView={listViewMode}
              listViewColumn={orderListViewColumn}
              keepDetailContentMounted
              rowCount={infiniteScrollMode ? serverOrdersPool.length : undefined}
              onRowsScrollEnd={
                infiniteScrollMode ? handleLoadMoreLazyRows : undefined
              }
              scrollEndThreshold={120}
              checkboxSelection={checkboxSelection}
              disableMultipleRowSelection={singleRowSelect}
              isRowSelectable={
                lockSettledRows
                  ? ({ row }) => row.status !== 'settled'
                  : undefined
              }
              isCellEditable={
                lockSettledRows
                  ? ({ row }) => row.status !== 'settled'
                  : undefined
              }
              getRowHeight={autoRowHeight ? () => 'auto' : undefined}
              getRowClassName={({ row }) =>
                lockSettledRows && row.status === 'settled'
                  ? 'order-row--settled-locked'
                  : ''
              }
              disableRowSelectionOnClick
              cellSelection={cellSelection}
              onClipboardCopy={handleClipboardCopy}
              onClipboardPaste={handleClipboardPaste}
              onClipboardClear={handleClipboardClear}
              onDataSourceError={handleDataSourceError}
              onCellAutoFill={handleCellAutoFill}
              onUndoRedo={handleUndoRedo}
              onExport={handleExport}
              pivotMode={pivotMode}
              onPivotModeChange={handleTogglePivotMode}
              pivotModel={pivotModel}
              onPivotModelChange={setPivotModel}
              chartsIntegration
              rowSpanning={rowSpanning}
              headerFilters={headerFilters}
              columnGroupingModel={
                enableColumnGrouping ? columnGroupingModel : undefined
              }
              pinnedRows={pinnedRowsConfig}
              rowReordering={rowReordering}
              onRowOrderChange={handleRowOrderChange}
              editMode={fullRowEdit ? 'row' : 'cell'}
              treeData={enableTreeData || serverTreeMode}
              getTreeDataPath={getOrderTreePath}
              rowGroupingModel={rowGroupingModel}
              onRowGroupingModelChange={setRowGroupingModel}
              groupingColDef={{ headerName: '区域 / 行业 / 订单', width: 248 }}
              defaultGroupingExpansionDepth={1}
              aggregationModel={aggregationModel}
              onAggregationModelChange={setAggregationModel}
              showCellVerticalBorder={showCellVerticalBorder}
              showColumnVerticalBorder={showCellVerticalBorder}
              pinnedColumnsSectionSeparator="border-and-shadow"
              getDetailPanelContent={renderDetailPanelContent}
              getDetailPanelHeight={() => 'auto'}
              processRowUpdate={handleProcessRowUpdate}
              onProcessRowUpdateError={handleProcessRowUpdateError}
              pagination={
                !largeDatasetMode &&
                !infiniteScrollMode &&
                !viewportLazyMode &&
                !serverTreeMode
              }
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { page: 0, pageSize: 10 } },
                pinnedColumns: { left: ['orderNo'], right: ['actions'] },
                density: 'standard',
              }}
              localeText={
                englishLocale
                  ? GRID_EN_US_LOCALE_TEXT
                  : GRID_ZH_CN_LOCALE_TEXT
              }
              slots={
                customFooterSlot
                  ? { footer: CustomSummaryFooter }
                  : undefined
              }
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterPlaceholder: englishLocale
                    ? 'Search order, customer, region...'
                    : '搜索订单号、客户、区域或负责人...',
                  csvFileName: 'enterprise-orders',
                  excelFileName: 'enterprise-orders',
                },
                footer: {
                  totalAmount,
                  englishLocale,
                },
              }}
              onRowsUpdate={
                !largeDatasetMode &&
                !serverDataMode &&
                !serverTreeMode &&
                !infiniteScrollMode &&
                !viewportLazyMode
                  ? setOrders
                  : undefined
              }
              onDeleteSelectedRows={handleDeleteSelected}
              onStateChange={setGridSnapshot}
              emptyStateAction={{
                label: englishLocale ? 'Restore demo orders' : '恢复示例订单数据',
                onClick: handleResetDemoData,
              }}
              ariaLabel="企业订单高级数据表格"
            />
        </Box>

        {activeTab === 'message' && <MessageShowcase />}

        {activeTab === 'date' && <DatePickerShowcase />}

        {activeTab === 'menu' && <NavMenuShowcase />}

        {activeTab === 'state' && (
          <StateInspector
            snapshot={gridSnapshot}
            apiRef={apiRef}
            recentEvents={recentEvents}
            onCommandFeedback={(message) =>
              setSnackbar({ open: true, message, severity: 'success' })
            }
          />
        )}

        {activeTab === 'architecture' && <ArchitectureReference />}
      </Box>

      {/* Create Order Modal */}
      <CreateOrderDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateOrder}
        nextSequence={nextSeq}
      />

      {/* Row Detail Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(inspectedOrder)}
        onClose={() => setInspectedOrder(null)}
        slotProps={{
          paper: {
            sx: { width: { xs: '100%', sm: 400 }, p: 3 },
          },
        }}
      >
        {inspectedOrder && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pb: 2,
              }}
            >
              <Box>
                <Typography
                  className="font-mono-tabular"
                  sx={{ fontSize: '0.78rem', color: '#64748B' }}
                >
                  {inspectedOrder.orderNo}
                </Typography>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#0F172A' }}>
                  {inspectedOrder.customer}
                </Typography>
              </Box>
              <IconButton
                size="small"
                aria-label="关闭详情抽屉"
                onClick={() => setInspectedOrder(null)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Divider />

            <Box
              sx={{
                py: 2.5,
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
                rowGap: 1.75,
                columnGap: 2,
                fontSize: '0.85rem',
              }}
            >
              <Typography sx={{ color: '#64748B', fontSize: '0.825rem' }}>
                订单状态
              </Typography>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  color: ORDER_STATUS_META[inspectedOrder.status].color,
                }}
              >
                {ORDER_STATUS_META[inspectedOrder.status].label}
              </Typography>

              <Typography sx={{ color: '#64748B', fontSize: '0.825rem' }}>
                订单金额
              </Typography>
              <Typography
                className="font-mono-tabular"
                sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}
              >
                ¥{inspectedOrder.amount.toLocaleString('zh-CN')}
              </Typography>

              <Typography sx={{ color: '#64748B', fontSize: '0.825rem' }}>
                回款进度
              </Typography>
              <Typography
                className="font-mono-tabular"
                sx={{ fontSize: '0.85rem', color: '#0F172A' }}
              >
                {inspectedOrder.collectionRate}%
              </Typography>

              <Typography sx={{ color: '#64748B', fontSize: '0.825rem' }}>
                所属行业
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#0F172A' }}>
                {inspectedOrder.industry}
              </Typography>

              <Typography sx={{ color: '#64748B', fontSize: '0.825rem' }}>
                负责区域
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#0F172A' }}>
                {inspectedOrder.region}
              </Typography>

              <Typography sx={{ color: '#64748B', fontSize: '0.825rem' }}>
                负责人
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#0F172A' }}>
                {inspectedOrder.owner}
              </Typography>

              <Typography sx={{ color: '#64748B', fontSize: '0.825rem' }}>
                审批状态
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#0F172A' }}>
                {inspectedOrder.approved ? '已通过' : '待审批'}
              </Typography>

              <Typography sx={{ color: '#64748B', fontSize: '0.825rem' }}>
                创建日期
              </Typography>
              <Typography
                className="font-mono-tabular"
                sx={{ fontSize: '0.85rem', color: '#0F172A' }}
              >
                {inspectedOrder.createdAt}
              </Typography>

              <Typography sx={{ color: '#64748B', fontSize: '0.825rem' }}>
                备注说明
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#334155' }}>
                {inspectedOrder.remark || '暂无备注'}
              </Typography>
            </Box>

            <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlineIcon fontSize="small" />}
                onClick={() => handleDeleteRow(inspectedOrder.id)}
              >
                删除此订单
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setInspectedOrder(null)}
              >
                关闭
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
      {/* Edit Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2600}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ fontSize: '0.85rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      <MessageGlobalHost />
    </Box>
  );
}
