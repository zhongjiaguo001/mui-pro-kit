# Message Documentation (AI-Ready Reference)

> **Architecture**: Ant Design v5 API-compatible global feedback toast built natively with Material UI (`Paper`, `Portal`, `useTheme`, `styled`) and a pure framework-agnostic `MessageStore` using `useSyncExternalStore`.

---

## 1. Module Entry

```ts
import {
  message,
  useMessage,
  MessageGlobalHost,
  MessageContainer,
  MessageNotice,
  MessageStore,
  normalizeTypeOpenArgs,
  type ArgsProps,
  type ConfigOptions,
  type JointContent,
  type MessageInstance,
  type MessageRecord,
  type MessageType,
  type NoticeType,
  type StaticMessageApi,
} from 'mui-pro-kit/message';
// Also re-exported from 'mui-pro-kit'
```

### Theming & Styles
- 100% MUI-themed (`useTheme()` for `palette.background.paper`, `palette.text.primary`, `palette.success/error/warning/primary`, `shape.borderRadius`, `shadows`, `zIndex.snackbar`).
- Does **not** require `mui-pro-kit/styles.css`.

---

## 2. Critical Rules for AI Code Generation

1. **Prefer `useMessage()` inside React components**: Returns `[messageApi, contextHolder]`. Render `{contextHolder}` inside your MUI `<ThemeProvider>` so notices automatically inherit Light/Dark mode, custom brand colors, and React Context.
2. **Static imperative `message.*` theming**: If you call `message.success(...)` outside React components (e.g., inside Axios/fetch interceptors):
   - **Best**: Mount `<MessageGlobalHost />` once inside your root `<ThemeProvider>` (reuses your app theme with zero extra React root).
   - **Alternative**: Call `message.config({ theme: myMuiTheme })` to pass your MUI theme into the standalone fallback root (otherwise falls back to default MUI `createTheme()`).
3. **In-Place Key Updates (Loading -> Success/Error)**: Pass the same `key` to update an existing notice in place without closing or duplicating it. Set `duration: 0` on loading messages so they never auto-dismiss before the async task finishes.
4. **Callable + PromiseLike Handle (`MessageType`)**: Every `message.*` call returns a handle that can BOTH be called to dismiss early (`const hide = message.loading('...', 0); hide();`) AND awaited (`await message.success('已保存', 1.5)`).

---

## 3. Quick Start Examples

### Recommended: Hook API (`useMessage`)
```tsx
import { Button } from '@mui/material';
import { useMessage } from 'mui-pro-kit/message';

export function SaveAction() {
  const [messageApi, contextHolder] = useMessage({ maxCount: 3 });

  const handleSave = async () => {
    const key = 'save-order';
    messageApi.open({ key, type: 'loading', content: '正在保存...', duration: 0 });
    await saveOrder();
    messageApi.open({ key, type: 'success', content: '保存成功', duration: 2 });
  };

  return (
    <>
      {contextHolder}
      <Button onClick={handleSave}>保存</Button>
    </>
  );
}
```

### Static Imperative API + `<MessageGlobalHost />`
```tsx
// App root (inside MUI <ThemeProvider>)
import { ThemeProvider } from '@mui/material/styles';
import { MessageGlobalHost, message } from 'mui-pro-kit/message';

export function AppRoot({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={myTheme}>
      <MessageGlobalHost />
      {children}
    </ThemeProvider>
  );
}

// Anywhere in services / interceptors / event handlers:
message.success('操作成功');
message.error('请求失败', 5, () => console.log('closed'));
```

### Scoped Container Inside a Modal or Panel
```tsx
const containerRef = useRef<HTMLDivElement>(null);
const [api, holder] = useMessage({
  getContainer: () => containerRef.current ?? document.body,
  top: 12,
});
```

---

## 4. API Reference

### 4.1 Methods on `message` and `messageApi` (`MessageInstance`)

All typed methods support Ant Design shorthand signatures:
- `api.info(content, duration?, onClose?)`
- `api.success(content, duration?, onClose?)`
- `api.error(content, duration?, onClose?)`
- `api.warning(content, duration?, onClose?)`
- `api.loading(content, duration?, onClose?)`
  - `content` can be `ReactNode` OR an `ArgsProps` config object.
  - `duration` can be `number` (seconds, `0` disables auto-close) OR directly `onClose: () => void`.
- `api.open(args: ArgsProps): MessageType`
- `api.destroy(key?: React.Key): void` — closes one message by `key`, or clears all active messages when omitted.
- Static-only: `message.config(options: ConfigOptions)` and `message.useMessage` (alias for `useMessage`).

### 4.2 `ArgsProps`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | `ReactNode` | **Required** | Notice body content. |
| `type` | `'info' \| 'success' \| 'error' \| 'warning' \| 'loading'` | `'info'` | Semantic visual type & icon. |
| `duration` | `number` | `3` (from config) | Auto-close delay in **seconds**. Set `0` to persist until manually closed or updated. |
| `key` | `string \| number` | Auto-generated | Unique key for in-place updates or targeted `destroy(key)`. |
| `icon` | `ReactNode` | Semantic icon | Custom leading icon node. |
| `closable` | `boolean` | `false` | Renders an explicit close (`×`) button. |
| `pauseOnHover` | `boolean` | `true` (from config) | Pauses countdown timer while pointer hovers over notice. |
| `className` / `style` | `string` / `CSSProperties` | `undefined` | Custom styling hooks on the notice card. |
| `onClose` | `() => void` | `undefined` | Fired once when the notice closes (guaranteed single-fire). |
| `onClick` | `(e: MouseEvent<HTMLDivElement>) => void` | `undefined` | Click handler on the notice card. |

### 4.3 `ConfigOptions` (for `useMessage(config)` & `message.config(config)`)

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `top` | `number \| string` | `16` | Distance from viewport/container top (px or CSS length). |
| `duration` | `number` | `3` | Default auto-dismiss duration in seconds. |
| `maxCount` | `number` | `undefined` | Max concurrent active notices; oldest evicted FIFO when exceeded. |
| `prefixCls` | `string` | `'mui-message'` | CSS class prefix & `data-testid` prefix (`${prefixCls}-container`). |
| `getContainer` | `() => HTMLElement` | `() => document.body` | Custom Portal mount target (automatically uses `position: absolute` when scoped). |
| `rtl` | `boolean` | `false` | Right-to-left layout direction. |
| `pauseOnHover` | `boolean` | `true` | Pause auto-dismiss countdown on hover. |
| `theme` | `Theme` (`@mui/material/styles`) | MUI default `createTheme()` | Static `message.config({ theme })` only: MUI theme for the standalone fallback host. |
