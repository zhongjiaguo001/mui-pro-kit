import React, { useMemo, useState } from 'react';
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
import {
  MUI_ACCENT_PRESETS,
  createMuiDateTheme,
  type MuiAccentKey,
} from '../theme';
import {
  CalendarPanel,
  DatePicker,
  addDays,
  formatDateValue,
  getRangeSpanDays,
  startOfDay,
  toDateKey,
  type DatePreset,
  type DateRangeValue,
  type PickerMode,
  type PickerSize,
  type PickerStatus,
  type PickerVariant,
} from './DatePicker';

interface DateEventLog {
  id: number;
  time: string;
  event: string;
  detail: string;
}

interface ScheduleMilestone {
  dateKey: string;
  title: string;
  category: 'release' | 'finance' | 'audit';
  owner: string;
}

function formatNowTime(): string {
  return new Date().toTimeString().slice(0, 8);
}

const MODE_OPTIONS: { value: PickerMode; label: string }[] = [
  { value: 'date', label: '日期 Date' },
  { value: 'week', label: '周 Week' },
  { value: 'month', label: '月份 Month' },
  { value: 'quarter', label: '季度 Quarter' },
  { value: 'year', label: '年份 Year' },
];

const SIZE_OPTIONS: { value: PickerSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'middle', label: 'Middle' },
  { value: 'large', label: 'Large' },
];

const VARIANT_OPTIONS: { value: PickerVariant; label: string }[] = [
  { value: 'outlined', label: 'Outlined' },
  { value: 'filled', label: 'Filled' },
  { value: 'underlined', label: 'Underlined' },
  { value: 'borderless', label: 'Borderless' },
];

interface DatePickerShowcaseBodyProps {
  themeMode: PaletteMode;
  accentKey: MuiAccentKey;
  onThemeModeChange: (mode: PaletteMode) => void;
  onAccentChange: (accent: MuiAccentKey) => void;
}

const DatePickerShowcaseBody: React.FC<DatePickerShowcaseBodyProps> = ({
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

  const today = useMemo(() => startOfDay(new Date()), []);

  // Playground feature controls
  const [picker, setPicker] = useState<PickerMode>('date');
  const [size, setSize] = useState<PickerSize>('middle');
  const [variant, setVariant] = useState<PickerVariant>('outlined');
  const [status, setStatus] = useState<PickerStatus>('');
  const [showTime, setShowTime] = useState(false);
  const [enablePresets, setEnablePresets] = useState(true);
  const [disablePast, setDisablePast] = useState(false);
  const [multiple, setMultiple] = useState(false);
  const [needConfirm, setNeedConfirm] = useState(false);

  // Playground live values
  const [singleValue, setSingleValue] = useState<Date | Date[] | null>(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30, 0),
  );
  const [rangeValue, setRangeValue] = useState<DateRangeValue | null>(() => [
    today,
    addDays(today, 6),
  ]);
  const [eventLogs, setEventLogs] = useState<DateEventLog[]>([]);

  // Secondary scenario states
  const [weekValue, setWeekValue] = useState<Date | Date[] | null>(today);
  const [quarterValue, setQuarterValue] = useState<Date | Date[] | null>(today);
  const [multiValue, setMultiValue] = useState<Date | Date[] | null>(() => [
    today,
    addDays(today, 2),
    addDays(today, 5),
  ]);
  const [dateTimeRange, setDateTimeRange] = useState<DateRangeValue | null>(() => [
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 18, 0, 0),
  ]);
  const [partialLockedRange, setPartialLockedRange] = useState<DateRangeValue | null>(
    () => [today, addDays(today, 14)],
  );
  const [customCellDate, setCustomCellDate] = useState<Date | Date[] | null>(today);
  const [calendarDate, setCalendarDate] = useState<Date>(today);

  const pushLog = (event: string, detail: string) => {
    setEventLogs((prev) =>
      [
        {
          id: (prev[0]?.id ?? 0) + 1,
          time: formatNowTime(),
          event,
          detail,
        },
        ...prev,
      ].slice(0, 7),
    );
  };

  // Single & Range presets
  const singlePresets = useMemo<DatePreset<Date>[]>(
    () => [
      { label: '今天', value: () => new Date() },
      { label: '明天', value: () => addDays(new Date(), 1) },
      { label: '7 天后', value: () => addDays(new Date(), 7) },
      { label: '30 天后', value: () => addDays(new Date(), 30) },
      { label: '7 天前', value: () => addDays(new Date(), -7) },
    ],
    [],
  );

  const rangePresets = useMemo<DatePreset<DateRangeValue>[]>(
    () => [
      {
        label: '近 7 天',
        value: () => [addDays(startOfDay(new Date()), -6), startOfDay(new Date())],
      },
      {
        label: '近 30 天',
        value: () => [addDays(startOfDay(new Date()), -29), startOfDay(new Date())],
      },
      {
        label: '未来 7 天',
        value: () => [startOfDay(new Date()), addDays(startOfDay(new Date()), 6)],
      },
      {
        label: '本月至今',
        value: () => {
          const now = new Date();
          return [new Date(now.getFullYear(), now.getMonth(), 1), startOfDay(now)];
        },
      },
      {
        label: '本季度',
        value: () => {
          const now = new Date();
          const qStart = Math.floor(now.getMonth() / 3) * 3;
          return [
            new Date(now.getFullYear(), qStart, 1),
            new Date(now.getFullYear(), qStart + 3, 0),
          ];
        },
      },
    ],
    [],
  );

  // Dynamic milestones around current month for Calendar & custom cellRender
  const milestones = useMemo<ScheduleMilestone[]>(() => {
    const y = today.getFullYear();
    const m = today.getMonth();
    return [
      {
        dateKey: toDateKey(new Date(y, m, 5)),
        title: '月度财务结账截止',
        category: 'finance',
        owner: '财务部',
      },
      {
        dateKey: toDateKey(new Date(y, m, 12)),
        title: '大客户 SLA 续约评审',
        category: 'audit',
        owner: '华东交付中心',
      },
      {
        dateKey: toDateKey(today),
        title: '核心交易网关灰度发布',
        category: 'release',
        owner: '平台架构组',
      },
      {
        dateKey: toDateKey(new Date(y, m, Math.min(25, 28))),
        title: '发薪日与社保代扣确认',
        category: 'finance',
        owner: '薪酬核算组',
      },
      {
        dateKey: toDateKey(new Date(y, m, Math.min(28, 28))),
        title: '安全合规季度审计归档',
        category: 'audit',
        owner: '信息安全委员会',
      },
    ];
  }, [today]);

  const milestoneByKey = useMemo(() => {
    const map = new Map<string, ScheduleMilestone>();
    milestones.forEach((item) => map.set(item.dateKey, item));
    return map;
  }, [milestones]);

  const disabledPastFn = useMemo(
    () =>
      disablePast
        ? (d: Date) => startOfDay(d).getTime() < today.getTime()
        : undefined,
    [disablePast, today],
  );

  const singleFormatted = useMemo(() => {
    if (!singleValue) return '未选择';
    if (Array.isArray(singleValue)) {
      if (singleValue.length === 0) return '未选择 (0 项)';
      return singleValue
        .map((d) => formatDateValue(d, picker, undefined, false))
        .join(', ');
    }
    return formatDateValue(singleValue, picker, undefined, showTime);
  }, [picker, showTime, singleValue]);

  const rangeFormatted = useMemo(() => {
    if (!rangeValue || (!rangeValue[0] && !rangeValue[1])) return '未选择';
    const s = rangeValue[0]
      ? formatDateValue(rangeValue[0], picker, undefined, showTime)
      : '—';
    const e = rangeValue[1]
      ? formatDateValue(rangeValue[1], picker, undefined, showTime)
      : '—';
    return `${s} → ${e}`;
  }, [picker, rangeValue, showTime]);

  const spanDays = useMemo(
    () =>
      rangeValue ? getRangeSpanDays(rangeValue[0], rangeValue[1]) : null,
    [rangeValue],
  );

  const activeCalendarMilestone = milestoneByKey.get(toDateKey(calendarDate));

  return (
    <Box
      data-testid="mui-date-themed-root"
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
      {/* Workspace Header + MUI Theme Controls + Granularity Selector */}
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
            日期选择组件套件（Ant Design 功能对齐 · MUI 主题系统驱动）
          </Typography>
          <Typography
            sx={{
              mt: 0.4,
              fontSize: '0.82rem',
              color: theme.palette.text.secondary,
            }}
          >
            基于 MUI ThemeProvider / useTheme 语义令牌 · 支持浅色/深色模式与主色板实时切换 · 五粒度单选/多选/范围/独立日历
          </Typography>
        </Box>

        {/* Right Controls: MUI Theme Mode + Primary Palette Swatches */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          {/* MUI Palette Mode Toggle (Light / Dark) */}
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
                  data-testid={`mui-theme-mode-${item.value}`}
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

          {/* MUI Primary Accent Palette Selector */}
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
                  data-testid={`mui-theme-accent-${preset.key}`}
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

      {/* Granularity + Feature Controls Strip */}
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
          {/* Picker Granularity Segmented Selector */}
          <Box
            role="group"
            aria-label="日期粒度模式"
            sx={{
              display: 'inline-flex',
              p: '2px',
              bgcolor: ui.segmentedBg,
              borderRadius: ui.controlRadius,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {MODE_OPTIONS.map((opt) => {
              const active = picker === opt.value;
              return (
                <Box
                  key={opt.value}
                  component="button"
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setPicker(opt.value);
                    if (opt.value !== 'date') {
                      setShowTime(false);
                    }
                  }}
                  sx={{
                    px: 1.3,
                    py: 0.45,
                    border: 'none',
                    borderRadius: ui.innerRadius,
                    cursor: 'pointer',
                    fontSize: '0.76rem',
                    fontWeight: active ? 600 : 500,
                    bgcolor: active ? theme.palette.background.paper : 'transparent',
                    color: active
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    boxShadow: active ? theme.shadows[1] : 'none',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    transition: theme.transitions.create(
                      ['background-color', 'color'],
                      { duration: 140 },
                    ),
                  }}
                >
                  {opt.label}
                </Box>
              );
            })}
          </Box>

          {/* Size / Variant / Status Controls */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
            <Box
              role="group"
              aria-label="组件尺寸"
              sx={{
                display: 'inline-flex',
                p: '2px',
                bgcolor: ui.segmentedBg,
                borderRadius: ui.controlRadius,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {SIZE_OPTIONS.map((s) => {
                const active = size === s.value;
                return (
                  <Box
                    key={s.value}
                    component="button"
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSize(s.value)}
                    sx={{
                      px: 1.05,
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
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label}
                  </Box>
                );
              })}
            </Box>

            <Box
              role="group"
              aria-label="输入框形态"
              sx={{
                display: 'inline-flex',
                p: '2px',
                bgcolor: ui.segmentedBg,
                borderRadius: ui.controlRadius,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {VARIANT_OPTIONS.map((v) => {
                const active = variant === v.value;
                return (
                  <Box
                    key={v.value}
                    component="button"
                    type="button"
                    aria-pressed={active}
                    onClick={() => setVariant(v.value)}
                    sx={{
                      px: 1.05,
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
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {v.label}
                  </Box>
                );
              })}
            </Box>

            <Box
              role="group"
              aria-label="校验状态"
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
                  { value: '', label: '正常' },
                  { value: 'warning', label: '警告' },
                  { value: 'error', label: '错误' },
                ] as const
              ).map((st) => {
                const active = status === st.value;
                return (
                  <Box
                    key={st.label}
                    component="button"
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatus(st.value)}
                    sx={{
                      px: 1.05,
                      py: 0.3,
                      border: 'none',
                      borderRadius: ui.innerRadius,
                      cursor: 'pointer',
                      fontSize: '0.73rem',
                      fontWeight: active ? 600 : 500,
                      bgcolor: active ? theme.palette.background.paper : 'transparent',
                      color:
                        active && st.value === 'error'
                          ? theme.palette.error.main
                          : active && st.value === 'warning'
                            ? theme.palette.warning.main
                            : active
                              ? theme.palette.text.primary
                              : theme.palette.text.secondary,
                      boxShadow: active ? theme.shadows[1] : 'none',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {st.label}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Feature Switches */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
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
                checked={showTime}
                disabled={picker !== 'date' || multiple}
                onChange={(e) => setShowTime(e.target.checked)}
              />
            }
            label="时间选择 (showTime)"
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
                checked={enablePresets}
                onChange={(e) => setEnablePresets(e.target.checked)}
              />
            }
            label="快捷预设 (presets)"
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
                checked={disablePast}
                onChange={(e) => setDisablePast(e.target.checked)}
              />
            }
            label="禁用过去日期 (disabledDate)"
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
                checked={multiple}
                onChange={(e) => {
                  const next = e.target.checked;
                  setMultiple(next);
                  if (next) {
                    setShowTime(false);
                    setSingleValue([today, addDays(today, 2)]);
                  } else {
                    setSingleValue(today);
                  }
                }}
              />
            }
            label="多日期选择 (multiple)"
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
                checked={needConfirm}
                onChange={(e) => setNeedConfirm(e.target.checked)}
              />
            }
            label="需确认 (needConfirm)"
          />
        </Box>
      </Box>

      {/* Main Live Interactive Playground */}
      <Box
        data-testid="date-picker-playground"
        sx={{
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: ui.cardRadius,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.05fr 1fr' },
          overflow: 'hidden',
        }}
      >
        {/* Left: Live DatePicker & RangePicker Controls */}
        <Box
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            borderRight: { xs: 'none', lg: `1px solid ${theme.palette.divider}` },
            borderBottom: { xs: `1px solid ${theme.palette.divider}`, lg: 'none' },
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
              DatePicker（单日期 / 多日期 / 日期时间选择）
            </Typography>
            <Typography
              sx={{
                fontSize: '0.77rem',
                color: theme.palette.text.secondary,
                mt: 0.35,
                mb: 1.5,
              }}
            >
              支持手动键盘输入解析、点击年月标题逐级上钻、方向键/Home/End 导航及快捷预设悬停预览
            </Typography>
            <DatePicker
              data-testid="playground-single-picker"
              value={singleValue}
              picker={picker}
              multiple={multiple}
              showTime={showTime}
              needConfirm={needConfirm || undefined}
              presets={enablePresets && picker === 'date' ? singlePresets : undefined}
              disabledDate={disabledPastFn}
              size={size}
              variant={variant}
              status={status}
              renderExtraFooter={(mode) => (
                <span>
                  当前面板视图：{mode} · 支持方向键切换与 Esc 快速收起
                </span>
              )}
              onChange={(val, dateStr) => {
                setSingleValue(val);
                pushLog(
                  'DatePicker.onChange',
                  Array.isArray(dateStr)
                    ? `[${dateStr.join(', ')}]`
                    : dateStr || 'null (已清空)',
                );
              }}
              onOk={(val) => {
                pushLog(
                  'DatePicker.onOk',
                  val && !Array.isArray(val)
                    ? formatDateValue(val, picker, undefined, showTime)
                    : 'confirmed',
                );
              }}
              ariaLabel="主演示单日期选择器"
            />
          </Box>

          <Divider />

          <Box>
            <Typography
              sx={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              DatePicker.RangePicker（双面板联动范围选择器）
            </Typography>
            <Typography
              sx={{
                fontSize: '0.77rem',
                color: theme.palette.text.secondary,
                mt: 0.35,
                mb: 1.5,
              }}
            >
              双月面板联动翻页、悬停区段实时高亮预览、逆序选择自动归一化，支持时间区间与预设快选
            </Typography>
            <DatePicker.RangePicker
              data-testid="playground-range-picker"
              value={rangeValue}
              picker={picker}
              showTime={showTime}
              needConfirm={needConfirm || undefined}
              presets={enablePresets && picker === 'date' ? rangePresets : undefined}
              disabledDate={disabledPastFn}
              size={size}
              variant={variant}
              status={status}
              onChange={(dates, strs) => {
                setRangeValue(dates);
                pushLog(
                  'RangePicker.onChange',
                  dates ? `${strs[0] || '—'} → ${strs[1] || '—'}` : 'null (已清空)',
                );
              }}
              onCalendarChange={(_dates, strs, info) => {
                pushLog(
                  'onCalendarChange',
                  `[${info.range}] ${strs[0] || '…'} → ${strs[1] || '…'}`,
                );
              }}
              onOk={(dates) => {
                pushLog(
                  'RangePicker.onOk',
                  dates && dates[0] && dates[1]
                    ? `${formatDateValue(dates[0], picker, undefined, showTime)} → ${formatDateValue(dates[1], picker, undefined, showTime)}`
                    : 'confirmed',
                );
              }}
              ariaLabel="主演示日期范围选择器"
            />
          </Box>
        </Box>

        {/* Right: Structured Live State & Event Log Readout */}
        <Box
          sx={{
            p: 3,
            bgcolor: theme.palette.background.default,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{ fontSize: '0.74rem', color: theme.palette.text.secondary }}
              >
                DatePicker 当前值
              </Typography>
              <Typography
                data-testid="date-state-single"
                className="font-mono-tabular"
                sx={{
                  mt: 0.4,
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  wordBreak: 'break-all',
                }}
              >
                {singleFormatted}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{ fontSize: '0.74rem', color: theme.palette.text.secondary }}
              >
                RangePicker 当前区间{spanDays !== null ? ` · 共 ${spanDays} 天` : ''}
              </Typography>
              <Typography
                data-testid="date-state-range"
                className="font-mono-tabular"
                sx={{
                  mt: 0.4,
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  wordBreak: 'break-all',
                }}
              >
                {rangeFormatted}
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* Event Stream */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                实时回调事件追踪（onChange / onCalendarChange / onOk）
              </Typography>
              {eventLogs.length > 0 && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setEventLogs([])}
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

            {eventLogs.length === 0 ? (
              <Typography
                sx={{
                  fontSize: '0.78rem',
                  color: theme.palette.text.secondary,
                  py: 1,
                }}
              >
                点击左侧日期或区间选择器进行交互，此处将实时记录回调参数与格式化输出。
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {eventLogs.map((entry) => (
                  <Box
                    key={entry.id}
                    sx={{
                      py: 0.6,
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
                        color: entry.event.includes('onOk')
                          ? theme.palette.success.main
                          : theme.palette.primary.main,
                        minWidth: 132,
                        flexShrink: 0,
                      }}
                    >
                      {entry.event}
                    </Typography>
                    <Typography
                      component="span"
                      className="font-mono-tabular"
                      sx={{
                        fontSize: '0.75rem',
                        color: theme.palette.text.primary,
                        wordBreak: 'break-all',
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

      {/* Section 2: Balanced 2-Column Specialized Scenarios + Enterprise Calendar */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1.25fr' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        {/* Left: Ant Design Specialized Scenario Matrix */}
        <Box
          data-testid="date-scenarios-matrix"
          sx={{
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: ui.cardRadius,
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.25,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              典型业务场景矩阵
            </Typography>
            <Typography
              sx={{
                fontSize: '0.78rem',
                color: theme.palette.text.secondary,
                mt: 0.25,
              }}
            >
              周报/季报粒度、多日期排班、精确时分秒区间、起始日期锁定与自定义单元格标记
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 0.75,
                }}
              >
                ISO 周选择器（picker=&quot;week&quot;）
              </Typography>
              <DatePicker
                data-testid="scenario-week-picker"
                picker="week"
                value={weekValue}
                onChange={(v) => setWeekValue(v)}
                ariaLabel="周报选择器"
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 0.75,
                }}
              >
                财报季度选择器（picker=&quot;quarter&quot;）
              </Typography>
              <DatePicker
                data-testid="scenario-quarter-picker"
                picker="quarter"
                value={quarterValue}
                onChange={(v) => setQuarterValue(v)}
                ariaLabel="季度选择器"
              />
            </Box>
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: '0.76rem',
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.75,
              }}
            >
              多日期批量选择（multiple · 标签可逐项移除）
            </Typography>
            <DatePicker
              data-testid="scenario-multi-picker"
              multiple
              value={multiValue}
              onChange={(v) => setMultiValue(v)}
              ariaLabel="多日期排班选择器"
              style={{ maxWidth: '100%' }}
            />
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: '0.76rem',
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.75,
              }}
            >
              精确日期时间区间（RangePicker + showTime + 预设）
            </Typography>
            <DatePicker.RangePicker
              data-testid="scenario-datetime-range"
              value={dateTimeRange}
              showTime={{ showSecond: true, minuteStep: 5 }}
              presets={rangePresets}
              onChange={(v) => setDateTimeRange(v)}
              ariaLabel="日期时间区间选择器"
              style={{ maxWidth: '100%' }}
            />
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1.25fr 1fr' },
              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 0.75,
                }}
              >
                部分禁用区间（disabled=[true, false]）
              </Typography>
              <DatePicker.RangePicker
                data-testid="scenario-partial-disabled"
                value={partialLockedRange}
                disabled={[true, false]}
                onChange={(v) => setPartialLockedRange(v)}
                ariaLabel="锁定起始日期的范围选择器"
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 0.75,
                }}
              >
                自定义单元格（cellRender 里程碑标点）
              </Typography>
              <DatePicker
                data-testid="scenario-custom-cell"
                value={customCellDate}
                onChange={(v) => setCustomCellDate(v)}
                ariaLabel="自定义单元格日期选择器"
                cellRender={(current, info) => {
                  const hasMilestone = milestoneByKey.has(toDateKey(current));
                  if (!hasMilestone || info.type !== 'date') return info.originNode;
                  return (
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      {info.originNode}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 1,
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          bgcolor: info.isSelected
                            ? theme.palette.primary.contrastText
                            : theme.palette.warning.main,
                        }}
                      />
                    </Box>
                  );
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Right: Standalone Ant Design Calendar Parity Component */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <CalendarPanel
            data-testid="enterprise-calendar"
            value={calendarDate}
            onSelect={(d) => setCalendarDate(d)}
            cellRender={(date, info) => {
              if (info.type === 'month') {
                const count = milestones.filter((item) => {
                  const [y, m] = item.dateKey.split('-').map(Number);
                  return y === date.getFullYear() && m - 1 === date.getMonth();
                }).length;
                if (count === 0) return null;
                return (
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      color: theme.palette.primary.main,
                      fontWeight: 500,
                      mt: 0.5,
                    }}
                  >
                    {count} 项排期节点
                  </Typography>
                );
              }

              const ms = milestoneByKey.get(toDateKey(date));
              if (!ms) return null;
              const accent =
                ms.category === 'finance'
                  ? theme.palette.warning.main
                  : ms.category === 'release'
                    ? theme.palette.success.main
                    : theme.palette.primary.main;
              return (
                <Typography
                  sx={{
                    fontSize: '0.68rem',
                    color: accent,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3,
                  }}
                >
                  {ms.title}
                </Typography>
              );
            }}
          />

          {/* Selected Day Agenda Summary Strip */}
          <Box
            data-testid="calendar-selected-agenda"
            sx={{
              px: 2,
              py: 1.25,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: ui.cardRadius,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, minWidth: 0 }}>
              <Typography
                className="font-mono-tabular"
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  flexShrink: 0,
                }}
              >
                {formatDateValue(calendarDate, 'date')}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  color: activeCalendarMilestone
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeCalendarMilestone
                  ? `${activeCalendarMilestone.title} · 责任团队：${activeCalendarMilestone.owner}`
                  : '当日暂无重点排期里程碑'}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '0.74rem',
                color: theme.palette.text.secondary,
                flexShrink: 0,
              }}
            >
              点击日期切换排期
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export const DatePickerShowcase: React.FC = () => {
  const [themeMode, setThemeMode] = useState<PaletteMode>('light');
  const [accentKey, setAccentKey] = useState<MuiAccentKey>('blue');

  const muiDateTheme = useMemo(
    () => createMuiDateTheme(themeMode, accentKey),
    [accentKey, themeMode],
  );

  return (
    <ThemeProvider theme={muiDateTheme}>
      <DatePickerShowcaseBody
        themeMode={themeMode}
        accentKey={accentKey}
        onThemeModeChange={setThemeMode}
        onAccentChange={setAccentKey}
      />
    </ThemeProvider>
  );
};
