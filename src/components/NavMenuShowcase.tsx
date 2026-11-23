import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Slider,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import {
  NavMenu,
  buildMenuTreeIndex,
  filterMenuItems,
  type NavMenuInfo,
  type NavMenuItem,
  type NavMenuMode,
  type NavMenuSelectInfo,
  type NavMenuTheme,
  type NavMenuTriggerSubMenuAction,
} from './NavMenu';

interface MenuEventLogEntry {
  id: number;
  time: string;
  event: 'onClick' | 'onSelect' | 'onDeselect' | 'onOpenChange';
  detail: string;
}

const ICON_DASHBOARD = <DashboardOutlinedIcon />;
const ICON_ORDERS = <ShoppingBagOutlinedIcon />;
const ICON_SHIP = <LocalShippingOutlinedIcon />;
const ICON_INSIGHTS = <InsightsOutlinedIcon />;
const ICON_INVENTORY = <Inventory2OutlinedIcon />;
const ICON_USERS = <PeopleOutlineIcon />;
const ICON_BILLING = <ReceiptLongOutlinedIcon />;
const ICON_SECURITY = <SecurityOutlinedIcon />;
const ICON_SETTINGS = <SettingsOutlinedIcon />;
const ICON_DELETE = <DeleteOutlineIcon />;

const ENTERPRISE_MENU_ITEMS: NavMenuItem[] = [
  {
    key: 'dashboard',
    label: '工作台概览',
    icon: ICON_DASHBOARD,
    extra: '⌘1',
  },
  {
    key: 'orders',
    label: '订单与履约',
    icon: ICON_ORDERS,
    children: [
      {
        type: 'group',
        key: 'grp-trade',
        label: '交易核心',
        children: [
          { key: 'orders-all', label: '全部订单', extra: '⌘2' },
          { key: 'orders-approval', label: '待审核单据', extra: '12' },
          { key: 'orders-refund', label: '售后退款（锁定）', disabled: true },
        ],
      },
      { type: 'divider', key: 'div-orders', dashed: true },
      {
        key: 'orders-fulfillment',
        label: '履约调度中心',
        icon: ICON_SHIP,
        children: [
          { key: 'fulfillment-wave', label: '仓配波次计划' },
          { key: 'fulfillment-carrier', label: '承运商时效路由' },
          {
            key: 'fulfillment-crossborder',
            label: '跨境清关专席',
            children: [
              { key: 'cb-customs', label: '报关单证核验' },
              { key: 'cb-tariff', label: '关税成本核算' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'analytics',
    label: '经营洞察',
    icon: ICON_INSIGHTS,
    children: [
      { key: 'analytics-revenue', label: '营收与回款漏斗', extra: '⌘R' },
      { key: 'analytics-cohort', label: '客户留存队列' },
      { key: 'analytics-forecast', label: '季度预测模型' },
    ],
  },
  {
    key: 'inventory',
    label: '库存与供应链',
    icon: ICON_INVENTORY,
    children: [
      { key: 'inv-stock', label: '实时库存水位' },
      { key: 'inv-purchase', label: '采购补货协同' },
    ],
  },
  { type: 'divider', key: 'div-root' },
  {
    key: 'org',
    label: '组织与权限',
    icon: ICON_USERS,
    children: [
      { key: 'org-members', label: '成员目录' },
      { key: 'org-roles', label: 'RBAC 角色策略', icon: ICON_SECURITY },
    ],
  },
  {
    key: 'billing',
    label: '账单与结算',
    icon: ICON_BILLING,
  },
  {
    key: 'settings',
    label: '系统偏好设置',
    icon: ICON_SETTINGS,
    extra: '⌘,',
  },
  {
    key: 'reset-sandbox',
    label: '清空沙箱数据',
    icon: ICON_DELETE,
    danger: true,
  },
];

const HORIZONTAL_DEMO_ITEMS: NavMenuItem[] = [
  { key: 'h-home', label: '概览首页', icon: ICON_DASHBOARD },
  {
    key: 'h-products',
    label: '产品矩阵',
    icon: ICON_INVENTORY,
    children: [
      { key: 'h-prod-grid', label: '企业数据表格' },
      { key: 'h-prod-menu', label: '多级菜单导航' },
      {
        key: 'h-prod-bi',
        label: '商业智能套件',
        children: [
          { key: 'h-bi-pivot', label: '交叉透视表' },
          { key: 'h-bi-chart', label: '图表联动引擎' },
        ],
      },
    ],
  },
  { key: 'h-orders', label: '订单交易', icon: ICON_ORDERS },
  { key: 'h-analytics', label: '经营报表', icon: ICON_INSIGHTS },
  { key: 'h-billing', label: '财务结算', icon: ICON_BILLING },
  { key: 'h-org', label: '团队权限', icon: ICON_USERS },
  { key: 'h-settings', label: '系统设置', icon: ICON_SETTINGS },
];

const DARK_VERTICAL_ITEMS: NavMenuItem[] = [
  { key: 'dv-overview', label: '控制台总览', icon: ICON_DASHBOARD, extra: '⌘D' },
  {
    key: 'dv-deploy',
    label: '发布与运维',
    icon: ICON_SHIP,
    children: [
      {
        type: 'group',
        key: 'dv-grp-env',
        label: '运行环境',
        children: [
          { key: 'dv-prod', label: '生产集群 (CN-East)' },
          { key: 'dv-staging', label: '预发验证环境' },
        ],
      },
      { type: 'divider', key: 'dv-div', dashed: true },
      {
        key: 'dv-pipeline',
        label: '流水线编排',
        children: [
          { key: 'dv-canary', label: '灰度金丝雀发布' },
          { key: 'dv-rollback', label: '一键版本回滚', danger: true },
        ],
      },
    ],
  },
  {
    key: 'dv-security',
    label: '安全审计',
    icon: ICON_SECURITY,
    children: [
      { key: 'dv-audit-log', label: '操作审计日志' },
      { key: 'dv-token', label: 'API 密钥轮换' },
    ],
  },
  { key: 'dv-locked', label: '底层内核参数', icon: ICON_SETTINGS, disabled: true },
];

const MODULE_DESCRIPTIONS: Record<string, { title: string; summary: string }> = {
  dashboard: {
    title: '工作台概览',
    summary: '汇总核心交易指标、待办审批事项与今日履约进度。',
  },
  'orders-all': {
    title: '全部订单',
    summary: '支持多维度检索、批量审核与财务回款核销的企业级订单主台账。',
  },
  'orders-approval': {
    title: '待审核单据',
    summary: '当前有 12 笔大额合同等待法务与财务复核签批。',
  },
  'fulfillment-wave': {
    title: '仓配波次计划',
    summary: '按区域与承运商时效自动拆单并生成最优拣货波次。',
  },
  'fulfillment-carrier': {
    title: '承运商时效路由',
    summary: '根据历史妥投率动态分配干线承运商与运费模板。',
  },
  'cb-customs': {
    title: '报关单证核验',
    summary: '四级深层菜单节点示例，展示完整祖先链高亮与面包屑同步。',
  },
  'cb-tariff': {
    title: '关税成本核算',
    summary: '实时计算目的港关税税率、清关杂费及毛利贡献。',
  },
  'analytics-revenue': {
    title: '营收与回款漏斗',
    summary: '按季度、大区与行业透视合同签约额及回款周期。',
  },
  'analytics-cohort': {
    title: '客户留存队列',
    summary: '追踪企业大客户年度续约率与增购扩展系数 (NDR)。',
  },
  'analytics-forecast': {
    title: '季度预测模型',
    summary: '结合商机阶段转化率生成滚动 90 天现金流预测。',
  },
  'inv-stock': {
    title: '实时库存水位',
    summary: '多仓安全库存预警与在途库存动态可视化。',
  },
  'inv-purchase': {
    title: '采购补货协同',
    summary: '基于预测销量自动生成供应商采购建议单。',
  },
  'org-members': {
    title: '成员目录',
    summary: '统一管理企业组织架构、部门汇报线与账号状态。',
  },
  'org-roles': {
    title: 'RBAC 角色策略',
    summary: '细粒度字段级与操作级访问控制权限配置。',
  },
  billing: {
    title: '账单与结算',
    summary: '月度对账单、发票开具与自动核销流水管理。',
  },
  settings: {
    title: '系统偏好设置',
    summary: '配置全局时区、语言包、Webhook 通知与主题偏好。',
  },
  'reset-sandbox': {
    title: '清空沙箱数据',
    summary: '危险操作项（danger: true）示例，用于高风险指令视觉警示。',
  },
};

function formatTimeNow(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

export const NavMenuShowcase: React.FC = () => {
  const [mode, setMode] = useState<NavMenuMode>('inline');
  const [theme, setTheme] = useState<NavMenuTheme>('light');
  const [inlineCollapsed, setInlineCollapsed] = useState(false);
  const [accordion, setAccordion] = useState(false);
  const [multiple, setMultiple] = useState(false);
  const [triggerAction, setTriggerAction] =
    useState<NavMenuTriggerSubMenuAction>('hover');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedKeys, setSelectedKeys] = useState<string[]>(['orders-all']);
  const [openKeys, setOpenKeys] = useState<string[]>(['orders']);
  const [lastKeyPath, setLastKeyPath] = useState<string[]>([
    'orders-all',
    'orders',
  ]);
  const [eventLog, setEventLog] = useState<MenuEventLogEntry[]>([]);

  // Dedicated secondary demo states
  const [horizWidth, setHorizWidth] = useState<number>(620);
  const [horizSelected, setHorizSelected] = useState<string[]>(['h-home']);
  const [darkVertSelected, setDarkVertSelected] = useState<string[]>([
    'dv-overview',
  ]);

  const fullIndex = useMemo(
    () => buildMenuTreeIndex(ENTERPRISE_MENU_ITEMS),
    [],
  );

  const { filteredItems, matchedOpenKeys } = useMemo(
    () => filterMenuItems(ENTERPRISE_MENU_ITEMS, searchQuery),
    [searchQuery],
  );

  const effectiveOpenKeys = searchQuery.trim() ? matchedOpenKeys : openKeys;

  const pushLog = (
    event: MenuEventLogEntry['event'],
    detail: string,
  ) => {
    setEventLog((prev) => [
      { id: Date.now() + Math.random(), time: formatTimeNow(), event, detail },
      ...prev.slice(0, 7),
    ]);
  };

  const handleSelect = (info: NavMenuSelectInfo) => {
    setSelectedKeys(info.selectedKeys);
    setLastKeyPath(info.keyPath);
    pushLog(
      'onSelect',
      `key="${info.key}" · keyPath=[${info.keyPath.join(' -> ')}]`,
    );
  };

  const handleDeselect = (info: NavMenuSelectInfo) => {
    setSelectedKeys(info.selectedKeys);
    pushLog('onDeselect', `key="${info.key}" · 剩余 ${info.selectedKeys.length} 项`);
  };

  const handleClick = (info: NavMenuInfo) => {
    pushLog('onClick', `key="${info.key}"`);
  };

  const handleOpenChange = (nextOpen: string[]) => {
    setOpenKeys(nextOpen);
    pushLog(
      'onOpenChange',
      nextOpen.length > 0 ? `[${nextOpen.join(', ')}]` : '[] (全部收起)',
    );
  };

  const primarySelectedKey = selectedKeys[selectedKeys.length - 1] ?? 'dashboard';
  const activeModule = MODULE_DESCRIPTIONS[primarySelectedKey] ?? {
    title: primarySelectedKey,
    summary: '已激活当前导航节点。',
  };

  const breadcrumbLabels = useMemo(() => {
    return [...lastKeyPath]
      .reverse()
      .map((k) => {
        const node = fullIndex.itemByKey.get(k);
        return node && typeof node.label === 'string' ? node.label : k;
      });
  }, [fullIndex, lastKeyPath]);

  const isDark = theme === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Workspace Header + Interactive Mode / Theme / Feature Controls */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
            }}
          >
            菜单导航组件（Ant Design 功能对齐 · MUI 技术栈实现）
          </Typography>
          <Typography
            sx={{
              mt: 0.4,
              fontSize: '0.82rem',
              color: '#64748B',
            }}
          >
            内嵌展开 / 垂直级联弹出 / 水平响应式溢出 · 亮暗双主题 · 手风琴 · 折叠图标栏 · 多选 · 键盘导航
          </Typography>
        </Box>

        {/* Interactive Mode & Theme Segmented Controls */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {/* Mode segmented selector */}
          <Box
            role="group"
            aria-label="导航模式"
            sx={{
              display: 'inline-flex',
              p: '3px',
              bgcolor: '#F1F5F9',
              borderRadius: '8px',
            }}
          >
            {(
              [
                { value: 'inline', label: '内嵌 Inline' },
                { value: 'vertical', label: '垂直 Vertical' },
                { value: 'horizontal', label: '水平 Horizontal' },
              ] as const
            ).map((opt) => {
              const active = mode === opt.value;
              return (
                <Box
                  key={opt.value}
                  component="button"
                  type="button"
                  onClick={() => setMode(opt.value)}
                  aria-pressed={active}
                  sx={{
                    px: 1.5,
                    py: 0.6,
                    border: 0,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: active ? 600 : 500,
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    bgcolor: active ? '#FFFFFF' : 'transparent',
                    color: active ? '#0F172A' : '#475569',
                    boxShadow: active
                      ? '0 1px 2px rgba(15, 23, 42, 0.08)'
                      : 'none',
                    transition: 'all 140ms ease',
                  }}
                >
                  {opt.label}
                </Box>
              );
            })}
          </Box>

          {/* Theme segmented selector */}
          <Box
            role="group"
            aria-label="主题风格"
            sx={{
              display: 'inline-flex',
              p: '3px',
              bgcolor: '#F1F5F9',
              borderRadius: '8px',
            }}
          >
            {(
              [
                { value: 'light', label: '亮色 Light' },
                { value: 'dark', label: '深色 Dark' },
              ] as const
            ).map((opt) => {
              const active = theme === opt.value;
              return (
                <Box
                  key={opt.value}
                  component="button"
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  aria-pressed={active}
                  sx={{
                    px: 1.5,
                    py: 0.6,
                    border: 0,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: active ? 600 : 500,
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    bgcolor: active ? '#FFFFFF' : 'transparent',
                    color: active ? '#0F172A' : '#475569',
                    boxShadow: active
                      ? '0 1px 2px rgba(15, 23, 42, 0.08)'
                      : 'none',
                    transition: 'all 140ms ease',
                  }}
                >
                  {opt.label}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Feature Toggles Row */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: 2,
          py: 1.25,
          bgcolor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2.5 }}>
          <FormControlLabel
            sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.82rem', color: '#334155' } }}
            control={
              <Switch
                size="small"
                checked={inlineCollapsed}
                disabled={mode !== 'inline'}
                onChange={(e) => setInlineCollapsed(e.target.checked)}
              />
            }
            label="折叠收起 (inlineCollapsed)"
          />
          <FormControlLabel
            sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.82rem', color: '#334155' } }}
            control={
              <Switch
                size="small"
                checked={accordion}
                disabled={mode !== 'inline' || inlineCollapsed}
                onChange={(e) => setAccordion(e.target.checked)}
              />
            }
            label="手风琴模式 (只展开当前父级)"
          />
          <FormControlLabel
            sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.82rem', color: '#334155' } }}
            control={
              <Switch
                size="small"
                checked={multiple}
                onChange={(e) => {
                  const next = e.target.checked;
                  setMultiple(next);
                  if (!next && selectedKeys.length > 1) {
                    setSelectedKeys([selectedKeys[selectedKeys.length - 1]]);
                  }
                }}
              />
            }
            label="多选模式 (multiple)"
          />
          <FormControlLabel
            sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.82rem', color: '#334155' } }}
            control={
              <Switch
                size="small"
                checked={triggerAction === 'click'}
                onChange={(e) =>
                  setTriggerAction(e.target.checked ? 'click' : 'hover')
                }
              />
            }
            label="点击触发弹出子菜单 (click)"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedKeys(['cb-customs']);
              setOpenKeys(['orders', 'orders-fulfillment', 'fulfillment-crossborder']);
              setLastKeyPath([
                'cb-customs',
                'fulfillment-crossborder',
                'orders-fulfillment',
                'orders',
              ]);
              pushLog('onSelect', '程序化跳转至四级菜单 cb-customs');
            }}
            sx={{ fontSize: '0.78rem', textTransform: 'none' }}
          >
            定位至四级菜单
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              setSelectedKeys(['orders-all']);
              setOpenKeys(['orders']);
              setLastKeyPath(['orders-all', 'orders']);
              setSearchQuery('');
              setEventLog([]);
            }}
            sx={{ fontSize: '0.78rem', color: '#64748B', textTransform: 'none' }}
          >
            重置状态
          </Button>
        </Box>
      </Box>

      {/* Main Live Interactive Playground Shell */}
      <Box
        data-testid="nav-menu-playground"
        sx={{
          bgcolor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: mode === 'horizontal' ? 'column' : 'row',
          minHeight: mode === 'horizontal' ? 380 : 560,
        }}
      >
        {/* Navigation Region */}
        {mode === 'horizontal' ? (
          <Box
            sx={{
              bgcolor: isDark ? '#001529' : '#FFFFFF',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'}`,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: isDark ? '#FFFFFF' : '#0F172A',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Console OS
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <NavMenu
                items={ENTERPRISE_MENU_ITEMS}
                mode="horizontal"
                theme={theme}
                selectedKeys={selectedKeys}
                openKeys={openKeys}
                multiple={multiple}
                triggerSubMenuAction={triggerAction}
                onClick={handleClick}
                onSelect={handleSelect}
                onDeselect={handleDeselect}
                onOpenChange={handleOpenChange}
                ariaLabel="顶部水平主导航"
                style={{ borderBottom: 'none' }}
              />
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              width: mode === 'inline' && inlineCollapsed ? 68 : 264,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: isDark ? '#001529' : '#FFFFFF',
              borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'}`,
              transition: 'width 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Sidebar Top Brand & Collapse Button */}
            <Box
              sx={{
                height: 52,
                px: mode === 'inline' && inlineCollapsed ? 0 : 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  mode === 'inline' && inlineCollapsed
                    ? 'center'
                    : 'space-between',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9'}`,
              }}
            >
              {!(mode === 'inline' && inlineCollapsed) && (
                <Typography
                  sx={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Console OS
                </Typography>
              )}
              {mode === 'inline' && (
                <IconButton
                  size="small"
                  aria-label={inlineCollapsed ? '展开侧边导航' : '折叠侧边导航'}
                  onClick={() => setInlineCollapsed((v) => !v)}
                  sx={{
                    color: isDark ? 'rgba(255,255,255,0.75)' : '#475569',
                    '&:hover': {
                      bgcolor: isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(15,23,42,0.05)',
                    },
                  }}
                >
                  {inlineCollapsed ? (
                    <MenuIcon fontSize="small" />
                  ) : (
                    <MenuOpenIcon fontSize="small" />
                  )}
                </IconButton>
              )}
            </Box>

            {/* Quick Menu Filter (visible when sidebar is expanded) */}
            {!(mode === 'inline' && inlineCollapsed) && (
              <Box sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="筛选菜单项..."
                  aria-label="筛选菜单项"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon
                            sx={{
                              fontSize: 16,
                              color: isDark
                                ? 'rgba(255,255,255,0.45)'
                                : '#94A3B8',
                            }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label="清空菜单搜索"
                            onClick={() => setSearchQuery('')}
                            sx={{
                              p: 0.25,
                              color: isDark
                                ? 'rgba(255,255,255,0.6)'
                                : '#64748B',
                            }}
                          >
                            <ClearIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </InputAdornment>
                      ) : undefined,
                      sx: {
                        fontSize: '0.8rem',
                        height: 34,
                        bgcolor: isDark
                          ? 'rgba(255,255,255,0.06)'
                          : '#F8FAFC',
                        color: isDark ? '#FFFFFF' : '#0F172A',
                        '& fieldset': {
                          borderColor: isDark
                            ? 'rgba(255,255,255,0.12)'
                            : '#E2E8F0',
                        },
                      },
                    },
                  }}
                />
              </Box>
            )}

            {/* Main MUI NavMenu */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {filteredItems.length === 0 ? (
                <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
                  <Typography
                    sx={{
                      fontSize: '0.82rem',
                      color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B',
                    }}
                  >
                    未匹配到「{searchQuery}」
                  </Typography>
                </Box>
              ) : (
                <NavMenu
                  items={filteredItems}
                  mode={mode}
                  theme={theme}
                  selectedKeys={selectedKeys}
                  openKeys={effectiveOpenKeys}
                  inlineCollapsed={inlineCollapsed}
                  accordion={accordion}
                  multiple={multiple}
                  triggerSubMenuAction={triggerAction}
                  onClick={handleClick}
                  onSelect={handleSelect}
                  onDeselect={handleDeselect}
                  onOpenChange={handleOpenChange}
                  ariaLabel="侧边主导航菜单"
                  style={{ borderRight: 'none' }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Right / Bottom Live State & Context Inspector */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            bgcolor: '#FAFAFA',
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          {/* Active Breadcrumb + Page Context */}
          <Box
            sx={{
              pb: 2,
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            <Typography
              data-testid="nav-active-breadcrumb"
              sx={{
                fontSize: '0.78rem',
                color: '#64748B',
                mb: 0.75,
              }}
            >
              {breadcrumbLabels.join(' / ')}
            </Typography>
            <Typography
              component="h2"
              data-testid="nav-active-title"
              sx={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#0F172A',
              }}
            >
              {activeModule.title}
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                fontSize: '0.86rem',
                color: '#475569',
                lineHeight: 1.6,
              }}
            >
              {activeModule.summary}
            </Typography>
          </Box>

          {/* Structured State Matrix (flat hairline layout, tabular monospace values) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 2,
              pb: 2,
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mb: 0.5 }}>
                selectedKeys（当前选中）
              </Typography>
              <Typography
                data-testid="nav-state-selected"
                className="font-mono-tabular"
                sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A' }}
              >
                {JSON.stringify(selectedKeys)}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mb: 0.5 }}>
                openKeys（展开子菜单）
              </Typography>
              <Typography
                data-testid="nav-state-open"
                className="font-mono-tabular"
                sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A' }}
              >
                {JSON.stringify(effectiveOpenKeys)}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mb: 0.5 }}>
                keyPath（完整路径链）
              </Typography>
              <Typography
                data-testid="nav-state-keypath"
                className="font-mono-tabular"
                sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1976D2' }}
              >
                {lastKeyPath.join(' → ')}
              </Typography>
            </Box>
          </Box>

          {/* Live Event Callback Trace */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
              回调事件追踪（实时响应 onClick / onSelect / onDeselect / onOpenChange）
            </Typography>
            {eventLog.length === 0 ? (
              <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8', py: 1 }}>
                点击左侧或顶部菜单项、展开子菜单或使用方向键 / Enter / Esc 导航，此处将实时记录触发事件。
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75,
                }}
              >
                {eventLog.map((entry) => (
                  <Box
                    key={entry.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 1.5,
                      fontSize: '0.78rem',
                      py: 0.5,
                      borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
                    }}
                  >
                    <Typography
                      component="span"
                      className="font-mono-tabular"
                      sx={{ fontSize: '0.75rem', color: '#94A3B8', flexShrink: 0 }}
                    >
                      {entry.time}
                    </Typography>
                    <Typography
                      component="span"
                      className="font-mono-tabular"
                      sx={{
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        color:
                          entry.event === 'onSelect'
                            ? '#1976D2'
                            : entry.event === 'onDeselect'
                              ? '#D97706'
                              : '#334155',
                        minWidth: 100,
                        flexShrink: 0,
                      }}
                    >
                      {entry.event}
                    </Typography>
                    <Typography
                      component="span"
                      className="font-mono-tabular"
                      sx={{ fontSize: '0.77rem', color: '#475569', wordBreak: 'break-all' }}
                    >
                      {entry.detail}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Secondary Dedicated Scenarios: Responsive Horizontal Overflow + Dark Cascading Vertical */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.35fr 1fr' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        {/* Scenario 1: Responsive Horizontal Overflow Demo */}
        <Box
          sx={{
            bgcolor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                水平响应式自动折叠（ResizeObserver ··· 溢出菜单）
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#64748B', mt: 0.25 }}>
                拖动宽度滑块或点击预设宽度，超出项自动收入「···」级联子菜单
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {[760, 520, 380].map((preset) => (
                <Button
                  key={preset}
                  size="small"
                  variant={horizWidth === preset ? 'contained' : 'outlined'}
                  onClick={() => setHorizWidth(preset)}
                  sx={{
                    minWidth: 56,
                    px: 1.25,
                    py: 0.35,
                    fontSize: '0.75rem',
                  }}
                >
                  {preset}px
                </Button>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 0.5 }}>
            <Typography
              className="font-mono-tabular"
              sx={{ fontSize: '0.78rem', color: '#475569', minWidth: 96 }}
            >
              容器宽度: {horizWidth}px
            </Typography>
            <Slider
              size="small"
              min={320}
              max={820}
              step={10}
              value={horizWidth}
              aria-label="水平菜单演示容器宽度"
              onChange={(_, val) => {
                if (typeof val === 'number') setHorizWidth(val);
              }}
            />
          </Box>

          <Box
            data-testid="horizontal-overflow-demo"
            sx={{
              width: horizWidth,
              maxWidth: '100%',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              overflow: 'hidden',
              transition: 'width 120ms ease',
            }}
          >
            <NavMenu
              items={HORIZONTAL_DEMO_ITEMS}
              mode="horizontal"
              theme="light"
              selectedKeys={horizSelected}
              onSelect={(info) => setHorizSelected(info.selectedKeys)}
              ariaLabel="响应式水平溢出导航示例"
            />
          </Box>

          <Typography
            className="font-mono-tabular"
            sx={{ fontSize: '0.78rem', color: '#64748B' }}
          >
            当前选中水平菜单项: {horizSelected.join(', ')}
          </Typography>
        </Box>

        {/* Scenario 2: Dark Vertical Cascading Flyout Demo */}
        <Box
          sx={{
            bgcolor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
              深色垂直级联弹出（mode=&quot;vertical&quot; · theme=&quot;dark&quot;）
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#64748B', mt: 0.25 }}>
              悬停展开右侧多级 Popper 浮层，内置分组标题、虚线分割、禁用与危险操作项
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 2.5,
              alignItems: 'stretch',
              flex: 1,
            }}
          >
            <Box
              data-testid="dark-vertical-demo"
              sx={{
                width: 224,
                flexShrink: 0,
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <NavMenu
                items={DARK_VERTICAL_ITEMS}
                mode="vertical"
                theme="dark"
                selectedKeys={darkVertSelected}
                onSelect={(info) => setDarkVertSelected(info.selectedKeys)}
                ariaLabel="深色垂直级联导航示例"
                style={{ height: '100%', borderRight: 'none' }}
              />
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 1,
                color: '#475569',
                fontSize: '0.82rem',
              }}
            >
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A' }}>
                当前激活节点
              </Typography>
              <Typography
                className="font-mono-tabular"
                sx={{ fontSize: '0.84rem', color: '#1976D2', fontWeight: 600 }}
              >
                {darkVertSelected[0]}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.6 }}>
                鼠标悬停至「发布与运维 → 流水线编排」可体验多级右侧级联弹出与防抖关闭延迟。
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
