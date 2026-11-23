# mui-pro-kit

基于 MUI（v7 / v9）与 TanStack Table v9 构建的 React 企业级组件套件，包含 `DataGridPro`、`DatePicker` / `RangePicker` / `CalendarPanel`、`Message` 和 `NavMenu`，使用 **Rslib**（bundleless 模式）打包为可 Tree-shaking 的 npm 包。

> **AI 编程助手入口**：本包随 npm 一并发布完整 AI 文档与 Skill。在业务项目中安装后，可直接让 AI 阅读 `node_modules/mui-pro-kit/llms.txt`、[`docs/`](./docs/) 以及 [`skills/mui-pro-kit/SKILL.md`](./skills/mui-pro-kit/SKILL.md)。

## 安装

本库将 React、MUI 与 Emotion 声明为 `peerDependencies`，需在宿主项目中自行安装（以便共享 `<ThemeProvider>` 主题与 Emotion 缓存）：

```bash
npm install mui-pro-kit @mui/material @mui/icons-material @emotion/react @emotion/styled react react-dom
```

## 使用方式

**开箱即用，无需手动引入 CSS**：所有组件会自动联动宿主应用的 MUI `<ThemeProvider>`（暗黑模式、主色调、边框色等），`DataGridPro` 与 `DatePicker` 的静态热路径样式也会在首次挂载时通过 MUI `<GlobalStyles />` 一次性注入（零行/单元格级 Emotion 运行时开销）。

支持统一入口或按组件子路径导入：

```tsx
// 统一入口
import { DataGridPro, DatePicker, message, NavMenu } from 'mui-pro-kit';

// 或按需子路径导入
import { DataGridPro, useGridApiRef } from 'mui-pro-kit/data-grid';
import { DatePicker, RangePicker, CalendarPanel } from 'mui-pro-kit/date-picker';
import { message, useMessage, MessageGlobalHost } from 'mui-pro-kit/message';
import { NavMenu } from 'mui-pro-kit/nav-menu';
```

> 提示：
> - 若仍有静态 CSS 文件按需加载需求，`mui-pro-kit/styles.css` 依然保留为可选导出，不再是必选项。
> - 在 React 组件内推荐优先使用 `useMessage()`；若使用 `message.success(...)` 等静态调用，建议在应用 `<ThemeProvider>` 内部挂载 `<MessageGlobalHost />`，或通过 `message.config({ theme })` 注入主题。

## 组件文档

- [DataGridPro 完整参考](./docs/data-grid.md)
- [DatePicker / RangePicker / CalendarPanel 完整参考](./docs/date-picker.md)
- [Message 完整参考](./docs/message.md)
- [NavMenu 完整参考](./docs/nav-menu.md)

## 在业务项目中让 AI 自动理解本组件库

1. **通用方式（所有 AI IDE / CLI 通用）**：在宿主项目的 `AGENTS.md` / `CLAUDE.md` / `.cursor/rules` 中加上一句：
   ```markdown
   使用 `mui-pro-kit` 组件前，请先阅读 `node_modules/mui-pro-kit/llms.txt` 及对应 `node_modules/mui-pro-kit/docs/*.md`。
   ```
2. **Agent Skill 方式**：本仓库与 npm 包均内置 [`skills/mui-pro-kit/SKILL.md`](./skills/mui-pro-kit/SKILL.md)，支持 Skills 的 AI 工具可直接从本仓库或 `node_modules/mui-pro-kit/skills/mui-pro-kit` 加载。

## 本地开发与发包命令

```bash
# 启动本地组件演示页（Vite）
npm run dev

# 使用 Rslib 构建 npm 包产物（输出至 dist/）
npm run build

# 类型检查
npm run lint

# 构建本地演示页静态产物（输出至 dist-demo/）
npm run build:demo
```
