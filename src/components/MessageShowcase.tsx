import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import {
  ThemeProvider,
  alpha,
  useTheme,
  type PaletteMode,
} from '@mui/material/styles';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import {
  MUI_ACCENT_PRESETS,
  createMuiDateTheme,
  type MuiAccentKey,
} from '../theme';
import { message, useMessage } from './Message';

interface MessageEventLog {
  id: number;
  time: string;
  event: string;
  detail: string;
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 8);
}

const TOP_OPTIONS = [
  { value: 16, label: '16px' },
  { value: 64, label: '64px' },
  { value: 108, label: '108px' },
] as const;

const DURATION_OPTIONS = [
  { value: 1.5, label: '1.5s' },
  { value: 3, label: '3s' },
  { value: 5, label: '5s' },
  { value: 0, label: '常驻 (0)' },
] as const;

const MAX_COUNT_OPTIONS: { value: number | undefined; label: string }[] = [
  { value: undefined, label: '不限' },
  { value: 3, label: '最多 3 条' },
  { value: 5, label: '最多 5 条' },
];

interface MessageShowcaseBodyProps {
  themeMode: PaletteMode;
  accentKey: MuiAccentKey;
  onThemeModeChange: (mode: PaletteMode) => void;
  onAccentChange: (accent: MuiAccentKey) => void;
}

const MessageShowcaseBody: React.FC<MessageShowcaseBodyProps> = ({
  themeMode,
  accentKey,
  onThemeModeChange,
  onAccentChange,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const ui = useMemo(
    () => ({
      segmentedBg: isDark
        ? alpha(theme.palette.common.white, 0.07)
        : alpha(theme.palette.common.black, 0.045),
      cardRadius: `${Number(theme.shape.borderRadius) + 2}px`,
      controlRadius: `${theme.shape.borderRadius}px`,
      innerRadius: `${Math.max(4, Number(theme.shape.borderRadius) - 2)}px`,
      rowDivider: alpha(theme.palette.divider, 0.7),
    }),
    [isDark, theme],
  );

  // Global hook configuration controls
  const [topOffset, setTopOffset] = useState<number>(64);
  const [defaultDuration, setDefaultDuration] = useState<number>(3);
  const [maxCount, setMaxCount] = useState<number | undefined>(3);
  const [pauseOnHover, setPauseOnHover] = useState(true);
  const [rtl, setRtl] = useState(false);
  const [defaultClosable, setDefaultClosable] = useState(false);

  const [logs, setLogs] = useState<MessageEventLog[]>([]);
  const logSeqRef = useRef(0);
  const burstSeqRef = useRef(0);
  const scopedBoxRef = useRef<HTMLDivElement | null>(null);

  const pushLog = useCallback((event: string, detail: string) => {
    logSeqRef.current += 1;
    const id = logSeqRef.current;
    setLogs((prev) =>
      [{ id, time: nowTime(), event, detail }, ...prev].slice(0, 8),
    );
  }, []);

  // Primary Hook-based Message instance (inherits nested MUI ThemeProvider!)
  const [messageApi, contextHolder] = useMessage({
    top: topOffset,
    duration: defaultDuration,
    maxCount,
    pauseOnHover,
    rtl,
  });

  // Scoped Container Hook-based Message instance (`getContainer`)
  const getScopedContainer = useCallback(
    () => scopedBoxRef.current ?? document.body,
    [],
  );
  const [scopedApi, scopedContextHolder] = useMessage({
    top: 12,
    duration: 3,
    maxCount: 2,
    prefixCls: 'mui-scoped-message',
    getContainer: getScopedContainer,
  });

  const triggerBasic = (
    type: 'info' | 'success' | 'warning' | 'error' | 'loading',
    text: string,
  ) => {
    pushLog(`messageApi.${type}`, text);
    messageApi.open({
      type,
      content: text,
      closable: defaultClosable || defaultDuration === 0,
      onClose: () => pushLog('onClose', `[${type}] ${text}`),
    });
  };

  const handlePromiseChain = () => {
    pushLog('Promise 链启动', 'loading(1s) → success(1.2s) → info(1.5s)');
    messageApi
      .loading('步骤 1/3：正在校验财务审批权限...', 1)
      .then(() => {
        pushLog('Promise.then #1', '步骤 1 完成，衔接 success');
        return messageApi.success('步骤 2/3：凭证校验通过，正在生成回单', 1.2);
      })
      .then(() => {
        pushLog('Promise.then #2', '步骤 2 完成，衔接 info');
        return messageApi.info('步骤 3/3：全部流程已归档', 1.5);
      })
      .then(() => {
        pushLog('Promise.then #3', '链式提示全部关闭');
      });
  };

  const handleKeyUpdate = () => {
    const key = 'sync-order-key';
    pushLog('open(key)', `key="${key}" loading (duration=0)`);
    messageApi.open({
      key,
      type: 'loading',
      content: '正在同步 ERP 订单台账，请稍候...',
      duration: 0,
    });
    window.setTimeout(() => {
      pushLog('update(key)', `key="${key}" 原地更新为 success`);
      messageApi.open({
        key,
        type: 'success',
        content: 'ERP 订单台账同步完成（共更新 64 条记录）',
        duration: 2.5,
        closable: true,
        onClose: () => pushLog('onClose', `key="${key}" 已关闭`),
      });
    }, 900);
  };

  const handleStickyClosable = () => {
    const key = `sticky-${Date.now()}`;
    pushLog('open(duration=0)', '常驻提示已展示，需手动点击关闭或 destroy()');
    messageApi.open({
      key,
      type: 'warning',
      content: '检测到未保存的表单草稿（duration: 0 常驻，点击右侧 × 关闭）',
      duration: 0,
      closable: true,
      onClose: () => pushLog('onClose', '用户手动关闭了常驻提示'),
    });
  };

  const handleCustomIconAndStyle = () => {
    pushLog('open(custom)', '自定义图标 + 边框样式 + onClick 交互');
    messageApi.open({
      type: 'info',
      content: '新版本 v2.8 发布就绪 — 点击此提示记录点击事件',
      icon: (
        <RocketLaunchOutlinedIcon
          sx={{ fontSize: 18, color: theme.palette.primary.main, display: 'block' }}
        />
      ),
      style: {
        borderColor: theme.palette.primary.main,
      },
      closable: true,
      duration: 4,
      onClick: () => pushLog('onClick', '用户点击了自定义样式全局提示'),
    });
  };

  const handleStaticCall = () => {
    pushLog('message.success (Static)', '通过静态单例直接触发，无需 Hook');
    message.success({
      content: '静态方法调用：message.success() 全局生效（支持在非 React 工具函数中调用）',
      duration: 3,
      closable: defaultClosable,
    });
  };

  const handleBurstQueue = () => {
    const limitLabel = maxCount ? `maxCount=${maxCount}` : '无上限';
    pushLog('连发 6 条', `队列策略：${limitLabel}（超出按 FIFO 淘汰旧提示）`);
    for (let i = 1; i <= 6; i += 1) {
      burstSeqRef.current += 1;
      const n = burstSeqRef.current;
      const types = ['info', 'success', 'warning', 'error'] as const;
      const t = types[i % types.length];
      messageApi.open({
        type: t,
        content: `批量并发提示 #${n}（${t.toUpperCase()}）`,
        closable: defaultClosable,
      });
    }
  };

  const handleDestroyAll = () => {
    messageApi.destroy();
    scopedApi.destroy();
    message.destroy();
    pushLog('destroy()', '已立即销毁全部 Hook、容器及静态全局提示');
  };

  const triggerScopedNotice = (type: 'info' | 'success' | 'error') => {
    const labels = {
      info: '局部容器提示：仅挂载在当前卡片顶部',
      success: '局部容器保存成功：不遮挡页面顶部导航',
      error: '局部校验异常：请检查当前模块必填项',
    };
    pushLog('getContainer', `[${type}] ${labels[type]}`);
    scopedApi[type](labels[type], 3);
  };

  return (
    <Box
      data-testid="mui-message-themed-root"
      data-mui-mode={themeMode}
      data-mui-accent={accentKey}
      sx={{
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: ui.cardRadius,
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        transition: theme.transitions.create(
          ['background-color', 'border-color', 'color'],
          { duration: 180 },
        ),
      }}
    >
      {/* Hook Context Holders inside MUI ThemeProvider */}
      {contextHolder}
      {scopedContextHolder}

      {/* Header + Live MUI Theme Switcher */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            component="h2"
            sx={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: theme.palette.text.primary,
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
            }}
          >
            全局提示 Message 组件（Ant Design 功能对齐 · MUI 主题系统驱动）
          </Typography>
          <Typography
            sx={{
              mt: 0.4,
              fontSize: '0.82rem',
              color: theme.palette.text.secondary,
            }}
          >
            支持 useMessage Hook 主题上下文继承与静态单例调用 · 五种状态 · Promise 链式衔接 · key 原地更新 · maxCount FIFO · 悬停暂停计时
          </Typography>
        </Box>

        {/* MUI Theme Mode + Accent Selector */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
          <Box
            role="group"
            aria-label="MUI 主题模式"
            sx={{
              display: 'inline-flex',
              p: '2px',
              bgcolor: ui.segmentedBg,
              borderRadius: ui.controlRadius,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {(
              [
                {
                  value: 'light' as const,
                  label: '浅色 Light',
                  icon: <LightModeOutlinedIcon sx={{ fontSize: 14 }} />,
                },
                {
                  value: 'dark' as const,
                  label: '深色 Dark',
                  icon: <DarkModeOutlinedIcon sx={{ fontSize: 14 }} />,
                },
              ]
            ).map((item) => {
              const active = themeMode === item.value;
              return (
                <Box
                  key={item.value}
                  component="button"
                  type="button"
                  data-testid={`msg-theme-mode-${item.value}`}
                  aria-pressed={active}
                  onClick={() => onThemeModeChange(item.value)}
                  sx={{
                    px: 1.15,
                    py: 0.4,
                    border: 'none',
                    borderRadius: ui.innerRadius,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: active ? 600 : 500,
                    bgcolor: active ? theme.palette.background.paper : 'transparent',
                    color: active
                      ? theme.palette.text.primary
                      : theme.palette.text.secondary,
                    boxShadow: active ? theme.shadows[1] : 'none',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.icon}
                  {item.label}
                </Box>
              );
            })}
          </Box>

          <Box
            role="group"
            aria-label="MUI 主色板"
            sx={{
              display: 'inline-flex',
              p: '2px',
              bgcolor: ui.segmentedBg,
              borderRadius: ui.controlRadius,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {MUI_ACCENT_PRESETS.map((preset) => {
              const active = accentKey === preset.key;
              const dotColor = isDark ? preset.dark.main : preset.light.main;
              return (
                <Box
                  key={preset.key}
                  component="button"
                  type="button"
                  data-testid={`msg-theme-accent-${preset.key}`}
                  aria-pressed={active}
                  onClick={() => onAccentChange(preset.key)}
                  sx={{
                    px: 1,
                    py: 0.4,
                    border: 'none',
                    borderRadius: ui.innerRadius,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.55,
                    fontSize: '0.74rem',
                    fontWeight: active ? 600 : 500,
                    bgcolor: active ? theme.palette.background.paper : 'transparent',
                    color: active
                      ? theme.palette.text.primary
                      : theme.palette.text.secondary,
                    boxShadow: active ? theme.shadows[1] : 'none',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: dotColor,
                      flexShrink: 0,
                    }}
                  />
                  {preset.label}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Global Message Configuration Strip */}
      <Box
        sx={{
          px: 2.25,
          py: 1.5,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: ui.cardRadius,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
            {/* Top Offset */}
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <Typography sx={{ fontSize: '0.76rem', color: theme.palette.text.secondary }}>
                顶部间距 (top)
              </Typography>
              <Box
                role="group"
                aria-label="顶部间距"
                sx={{
                  display: 'inline-flex',
                  p: '2px',
                  bgcolor: ui.segmentedBg,
                  borderRadius: ui.controlRadius,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                {TOP_OPTIONS.map((opt) => {
                  const active = topOffset === opt.value;
                  return (
                    <Box
                      key={opt.value}
                      component="button"
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTopOffset(opt.value)}
                      className="font-mono-tabular"
                      sx={{
                        px: 1,
                        py: 0.3,
                        border: 'none',
                        borderRadius: ui.innerRadius,
                        cursor: 'pointer',
                        fontSize: '0.73rem',
                        fontWeight: active ? 600 : 500,
                        bgcolor: active ? theme.palette.background.paper : 'transparent',
                        color: active
                          ? theme.palette.text.primary
                          : theme.palette.text.secondary,
                        boxShadow: active ? theme.shadows[1] : 'none',
                        fontFamily: 'inherit',
                      }}
                    >
                      {opt.label}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Default Duration */}
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <Typography sx={{ fontSize: '0.76rem', color: theme.palette.text.secondary }}>
                默认时长 (duration)
              </Typography>
              <Box
                role="group"
                aria-label="默认时长"
                sx={{
                  display: 'inline-flex',
                  p: '2px',
                  bgcolor: ui.segmentedBg,
                  borderRadius: ui.controlRadius,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                {DURATION_OPTIONS.map((opt) => {
                  const active = defaultDuration === opt.value;
                  return (
                    <Box
                      key={opt.value}
                      component="button"
                      type="button"
                      aria-pressed={active}
                      onClick={() => setDefaultDuration(opt.value)}
                      className="font-mono-tabular"
                      sx={{
                        px: 1,
                        py: 0.3,
                        border: 'none',
                        borderRadius: ui.innerRadius,
                        cursor: 'pointer',
                        fontSize: '0.73rem',
                        fontWeight: active ? 600 : 500,
                        bgcolor: active ? theme.palette.background.paper : 'transparent',
                        color: active
                          ? theme.palette.text.primary
                          : theme.palette.text.secondary,
                        boxShadow: active ? theme.shadows[1] : 'none',
                        fontFamily: 'inherit',
                      }}
                    >
                      {opt.label}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Max Count */}
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <Typography sx={{ fontSize: '0.76rem', color: theme.palette.text.secondary }}>
                最大条数 (maxCount)
              </Typography>
              <Box
                role="group"
                aria-label="最大显示条数"
                sx={{
                  display: 'inline-flex',
                  p: '2px',
                  bgcolor: ui.segmentedBg,
                  borderRadius: ui.controlRadius,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                {MAX_COUNT_OPTIONS.map((opt) => {
                  const active = maxCount === opt.value;
                  return (
                    <Box
                      key={opt.label}
                      component="button"
                      type="button"
                      aria-pressed={active}
                      onClick={() => setMaxCount(opt.value)}
                      sx={{
                        px: 1,
                        py: 0.3,
                        border: 'none',
                        borderRadius: ui.innerRadius,
                        cursor: 'pointer',
                        fontSize: '0.73rem',
                        fontWeight: active ? 600 : 500,
                        bgcolor: active ? theme.palette.background.paper : 'transparent',
                        color: active
                          ? theme.palette.text.primary
                          : theme.palette.text.secondary,
                        boxShadow: active ? theme.shadows[1] : 'none',
                        fontFamily: 'inherit',
                      }}
                    >
                      {opt.label}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>

          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<DeleteSweepOutlinedIcon sx={{ fontSize: 16 }} />}
            data-testid="msg-destroy-all-btn"
            onClick={handleDestroyAll}
            sx={{
              fontSize: '0.76rem',
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
            }}
          >
            销毁全部 (destroy)
          </Button>
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2.5 }}>
          <FormControlLabel
            sx={{
              m: 0,
              '& .MuiFormControlLabel-label': {
                fontSize: '0.8rem',
                color: theme.palette.text.primary,
              },
            }}
            control={
              <Switch
                size="small"
                checked={pauseOnHover}
                onChange={(e) => setPauseOnHover(e.target.checked)}
              />
            }
            label="悬停暂停倒计时 (pauseOnHover)"
          />
          <FormControlLabel
            sx={{
              m: 0,
              '& .MuiFormControlLabel-label': {
                fontSize: '0.8rem',
                color: theme.palette.text.primary,
              },
            }}
            control={
              <Switch
                size="small"
                checked={defaultClosable}
                onChange={(e) => setDefaultClosable(e.target.checked)}
              />
            }
            label="显示关闭按钮 (closable)"
          />
          <FormControlLabel
            sx={{
              m: 0,
              '& .MuiFormControlLabel-label': {
                fontSize: '0.8rem',
                color: theme.palette.text.primary,
              },
            }}
            control={
              <Switch
                size="small"
                checked={rtl}
                onChange={(e) => setRtl(e.target.checked)}
              />
            }
            label="RTL 从右到左布局 (rtl)"
          />
        </Box>
      </Box>

      {/* Main 2-Column Workspace */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.95fr' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        {/* Left Column: Standard Types + Advanced AntD Scenarios */}
        <Box
          data-testid="msg-scenarios-panel"
          sx={{
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: ui.cardRadius,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {/* Group 1: Five Semantic Notice Types */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.92rem',
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              1. 基础语义提示（Info / Success / Warning / Error / Loading）
            </Typography>
            <Typography
              sx={{
                fontSize: '0.78rem',
                color: theme.palette.text.secondary,
                mt: 0.35,
                mb: 1.75,
              }}
            >
              通过 message.useMessage() 触发，自动继承上方切换的 MUI 浅色/深色与主色板主题
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
              <Button
                variant="contained"
                size="small"
                data-testid="msg-btn-info"
                startIcon={<InfoOutlinedIcon sx={{ fontSize: 16 }} />}
                onClick={() => triggerBasic('info', '这是一条普通全局提示信息')}
              >
                普通提示 Info
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                data-testid="msg-btn-success"
                startIcon={
                  <CheckCircleOutlineIcon
                    sx={{ fontSize: 16, color: theme.palette.success.main }}
                  />
                }
                onClick={() => triggerBasic('success', '合同审批已保存并同步至财务系统')}
                sx={{ borderColor: theme.palette.divider }}
              >
                成功 Success
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                data-testid="msg-btn-warning"
                startIcon={
                  <WarningAmberOutlinedIcon
                    sx={{ fontSize: 16, color: theme.palette.warning.main }}
                  />
                }
                onClick={() => triggerBasic('warning', '当前账号配额已使用 85%，请及时扩容')}
                sx={{ borderColor: theme.palette.divider }}
              >
                警告 Warning
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                data-testid="msg-btn-error"
                startIcon={
                  <ErrorOutlineIcon
                    sx={{ fontSize: 16, color: theme.palette.error.main }}
                  />
                }
                onClick={() => triggerBasic('error', '网关响应超时（504），请稍后重试')}
                sx={{ borderColor: theme.palette.divider }}
              >
                错误 Error
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                data-testid="msg-btn-loading"
                startIcon={
                  <AutorenewIcon
                    sx={{ fontSize: 16, color: theme.palette.primary.main }}
                  />
                }
                onClick={() => triggerBasic('loading', '正在拉取对账单数据，请稍候...')}
                sx={{ borderColor: theme.palette.divider }}
              >
                加载中 Loading
              </Button>
            </Box>
          </Box>

          <Divider />

          {/* Group 2: Ant Design Advanced Workflows */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.92rem',
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              2. 高级交互与异步流程（Promise 链 / key 原地更新 / 队列控制 / 静态调用）
            </Typography>
            <Typography
              sx={{
                fontSize: '0.78rem',
                color: theme.palette.text.secondary,
                mt: 0.35,
                mb: 1.75,
              }}
            >
              完整对齐 Ant Design v5 的异步 Promise 衔接、同 key 无闪烁更新、duration=0 常驻关闭与 FIFO 队列淘汰
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  p: 1.75,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: ui.controlRadius,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 1.25,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    按 key 原地更新（Loading → Success）
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.74rem', color: theme.palette.text.secondary, mt: 0.3 }}
                  >
                    复用相同 key，不新增节点且不触发 maxCount 淘汰
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  data-testid="msg-btn-key-update"
                  onClick={handleKeyUpdate}
                  sx={{ alignSelf: 'flex-start', borderColor: theme.palette.divider }}
                >
                  模拟异步更新
                </Button>
              </Box>

              <Box
                sx={{
                  p: 1.75,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: ui.controlRadius,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 1.25,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    Promise 接口链式衔接（.then）
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.74rem', color: theme.palette.text.secondary, mt: 0.3 }}
                  >
                    上一条关闭后自动触发下一条提示，支持 await
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  data-testid="msg-btn-promise"
                  onClick={handlePromiseChain}
                  sx={{ alignSelf: 'flex-start', borderColor: theme.palette.divider }}
                >
                  运行三段链式提示
                </Button>
              </Box>

              <Box
                sx={{
                  p: 1.75,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: ui.controlRadius,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 1.25,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    常驻提示（duration = 0 + 手动关闭）
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.74rem', color: theme.palette.text.secondary, mt: 0.3 }}
                  >
                    不会自动消失，直到用户点击关闭图标或调用 destroy()
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  data-testid="msg-btn-sticky"
                  onClick={handleStickyClosable}
                  sx={{ alignSelf: 'flex-start', borderColor: theme.palette.divider }}
                >
                  弹出常驻提示
                </Button>
              </Box>

              <Box
                sx={{
                  p: 1.75,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: ui.controlRadius,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 1.25,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    自定义图标、样式与 onClick 回调
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.74rem', color: theme.palette.text.secondary, mt: 0.3 }}
                  >
                    传入自定义 icon / style / onClick 实现交互式横幅
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  data-testid="msg-btn-custom"
                  onClick={handleCustomIconAndStyle}
                  sx={{ alignSelf: 'flex-start', borderColor: theme.palette.divider }}
                >
                  自定义样式提示
                </Button>
              </Box>

              <Box
                sx={{
                  p: 1.75,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: ui.controlRadius,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 1.25,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    并发连发（验证 maxCount FIFO 队列）
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.74rem', color: theme.palette.text.secondary, mt: 0.3 }}
                  >
                    一次性发射 6 条消息，超出上限自动淘汰最早条目
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  data-testid="msg-btn-burst"
                  onClick={handleBurstQueue}
                  sx={{ alignSelf: 'flex-start', borderColor: theme.palette.divider }}
                >
                  连发 6 条提示
                </Button>
              </Box>

              <Box
                sx={{
                  p: 1.75,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: ui.controlRadius,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 1.25,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    静态命令式调用（message.success）
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.74rem', color: theme.palette.text.secondary, mt: 0.3 }}
                  >
                    适合请求拦截器或非组件模块直接调用，无需 Hook
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  data-testid="msg-btn-static"
                  onClick={handleStaticCall}
                  sx={{ alignSelf: 'flex-start', borderColor: theme.palette.divider }}
                >
                  调用静态方法
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Right Column: Scoped Container Demo + Lifecycle Event Log */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Scoped Container (`getContainer`) Demo */}
          <Box
            ref={scopedBoxRef}
            data-testid="msg-scoped-box"
            sx={{
              position: 'relative',
              minHeight: 196,
              p: 2.5,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: ui.cardRadius,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              gap: 1.5,
              overflow: 'hidden',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                }}
              >
                自定义挂载容器（getContainer 局部作用域）
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.76rem',
                  color: theme.palette.text.secondary,
                  mt: 0.3,
                }}
              >
                将 Portal 挂载到指定 DOM 节点内部，提示仅在本卡片区域顶部弹出
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                data-testid="msg-btn-scoped-info"
                onClick={() => triggerScopedNotice('info')}
                sx={{ borderColor: theme.palette.divider }}
              >
                容器内 Info
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                data-testid="msg-btn-scoped-success"
                onClick={() => triggerScopedNotice('success')}
                sx={{ borderColor: theme.palette.divider }}
              >
                容器内 Success
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                data-testid="msg-btn-scoped-error"
                onClick={() => triggerScopedNotice('error')}
                sx={{ borderColor: theme.palette.divider }}
              >
                容器内 Error
              </Button>
            </Box>
          </Box>

          {/* Lifecycle Event Stream */}
          <Box
            data-testid="msg-event-log"
            sx={{
              flex: 1,
              p: 2.5,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: ui.cardRadius,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                }}
              >
                实时生命周期回调追踪（open / update / Promise.then / onClose）
              </Typography>
              {logs.length > 0 && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setLogs([])}
                  sx={{
                    minWidth: 0,
                    px: 0.75,
                    py: 0.15,
                    fontSize: '0.74rem',
                    color: theme.palette.text.secondary,
                  }}
                >
                  清空
                </Button>
              )}
            </Box>

            <Divider />

            {logs.length === 0 ? (
              <Typography
                sx={{
                  fontSize: '0.78rem',
                  color: theme.palette.text.secondary,
                  py: 1,
                }}
              >
                点击左侧任意触发按钮，此处将实时记录提示创建、key 原地更新、Promise.then 衔接及关闭回调。
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {logs.map((entry) => (
                  <Box
                    key={entry.id}
                    sx={{
                      py: 0.65,
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 1.5,
                      borderBottom: `1px solid ${ui.rowDivider}`,
                    }}
                  >
                    <Typography
                      component="span"
                      className="font-mono-tabular"
                      sx={{
                        fontSize: '0.73rem',
                        color: theme.palette.text.secondary,
                        flexShrink: 0,
                      }}
                    >
                      {entry.time}
                    </Typography>
                    <Typography
                      component="span"
                      className="font-mono-tabular"
                      sx={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: entry.event.includes('onClose')
                          ? theme.palette.success.main
                          : entry.event.includes('Promise')
                            ? theme.palette.warning.main
                            : theme.palette.primary.main,
                        minWidth: 122,
                        flexShrink: 0,
                      }}
                    >
                      {entry.event}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.76rem',
                        color: theme.palette.text.primary,
                        wordBreak: 'break-word',
                      }}
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
    </Box>
  );
};

export const MessageShowcase: React.FC = () => {
  const [themeMode, setThemeMode] = useState<PaletteMode>('light');
  const [accentKey, setAccentKey] = useState<MuiAccentKey>('blue');

  const muiMessageTheme = useMemo(
    () => createMuiDateTheme(themeMode, accentKey),
    [accentKey, themeMode],
  );

  return (
    <ThemeProvider theme={muiMessageTheme}>
      <MessageShowcaseBody
        themeMode={themeMode}
        accentKey={accentKey}
        onThemeModeChange={setThemeMode}
        onAccentChange={setAccentKey}
      />
    </ThemeProvider>
  );
};
