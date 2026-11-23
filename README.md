# mui-pro-kit

基于 MUI（v7 / v9）与 TanStack Table 构建的 React 企业级组件库，包含 `DataGridPro`、`DatePicker`、`Message` 和 `NavMenu`，使用 **Rslib**（bundleless 模式）打包为可 Tree-shaking 的 npm 包。

## 安装

本库将 React、MUI 与 Emotion 声明为 `peerDependencies`，需在宿主项目中自行安装：

```bash
npm install mui-pro-kit @mui/material @mui/icons-material @emotion/react @emotion/styled react react-dom
```

## 使用方式

### 1. 引入样式

在应用入口引入一次组件样式（仅包含 `.MuiDataGrid-*` 与等宽数字等必要样式，不含 Tailwind 或全局 reset）：

```ts
import 'mui-pro-kit/styles.css';
```

### 2. 引入组件

支持全量入口或按组件子路径导入：

```tsx
// 统一入口
import { DataGridPro, DatePicker, message, NavMenu } from 'mui-pro-kit';

// 或按需子路径导入
import { DataGridPro, useGridApiRef } from 'mui-pro-kit/data-grid';
import { DatePicker, RangePicker } from 'mui-pro-kit/date-picker';
import { message, useMessage, MessageGlobalHost } from 'mui-pro-kit/message';
import { NavMenu } from 'mui-pro-kit/nav-menu';
```

> 提示：使用 `message` 静态调用（如 `message.success(...)`）时，建议在应用 `<ThemeProvider>` 内部挂载 `<MessageGlobalHost />`，或通过 `message.config({ theme })` 注入主题。

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
