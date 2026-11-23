import React, { useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createTheme, ThemeProvider, type Theme } from '@mui/material/styles';
import { MessageStore } from './core/messageStore';
import { MessageContainer } from './MessageContainer';
import { createMessageApi, useMessage } from './useMessage';
import type {
  ArgsProps,
  ConfigOptions,
  JointContent,
  MessageInstance,
  MessageType,
  NoticeType,
} from './types';

const globalStore = new MessageStore();
const baseStaticApi = createMessageApi(globalStore);

let mountedHostCount = 0;
let fallbackRoot: Root | null = null;
let fallbackHostEl: HTMLDivElement | null = null;
let customFallbackTheme: Theme | undefined;
let defaultFallbackTheme: Theme | null = null;

function resolveFallbackTheme(): Theme {
  if (customFallbackTheme) {
    return customFallbackTheme;
  }
  if (!defaultFallbackTheme) {
    defaultFallbackTheme = createTheme();
  }
  return defaultFallbackTheme;
}

function renderFallbackHost(): void {
  if (!fallbackRoot) return;
  fallbackRoot.render(
    <ThemeProvider theme={resolveFallbackTheme()}>
      <MessageContainer store={globalStore} />
    </ThemeProvider>,
  );
}

function ensureGlobalHostMounted(): void {
  if (typeof document === 'undefined' || mountedHostCount > 0 || fallbackRoot) {
    return;
  }
  fallbackHostEl = document.createElement('div');
  fallbackHostEl.setAttribute('data-mui-message-static-host', 'true');
  document.body.appendChild(fallbackHostEl);
  fallbackRoot = createRoot(fallbackHostEl);
  renderFallbackHost();
}

function teardownFallbackHost(): void {
  if (!fallbackRoot) return;
  const rootToUnmount = fallbackRoot;
  const elToRemove = fallbackHostEl;
  fallbackRoot = null;
  fallbackHostEl = null;
  queueMicrotask(() => {
    rootToUnmount.unmount();
    elToRemove?.remove();
  });
}

/**
 * Optional host component mounted inside your app's MUI `<ThemeProvider>`
 * so static imperative `message.success(...)` calls inherit your app theme
 * without creating an extra React root.
 */
export const MessageGlobalHost: React.FC = () => {
  useEffect(() => {
    mountedHostCount += 1;
    teardownFallbackHost();
    return () => {
      mountedHostCount = Math.max(0, mountedHostCount - 1);
    };
  }, []);

  return <MessageContainer store={globalStore} />;
};

function wrapStaticOpen(type: NoticeType) {
  return (
    content: JointContent,
    duration?: number | VoidFunction,
    onClose?: VoidFunction,
  ): MessageType => {
    ensureGlobalHostMounted();
    return baseStaticApi[type](content, duration, onClose);
  };
}

export interface StaticMessageApi extends MessageInstance {
  config: (options: ConfigOptions) => void;
  useMessage: typeof useMessage;
}

/**
 * Ant Design v5 compatible `message` singleton built with Material UI v7.
 * Supports both `message.useMessage()` (recommended for Theme/Context inheritance)
 * and static imperative calls (`message.info`, `success`, `error`, `warning`, `loading`, `open`, `config`, `destroy`).
 */
export const message: StaticMessageApi = {
  info: wrapStaticOpen('info'),
  success: wrapStaticOpen('success'),
  error: wrapStaticOpen('error'),
  warning: wrapStaticOpen('warning'),
  loading: wrapStaticOpen('loading'),
  open: (args: ArgsProps) => {
    ensureGlobalHostMounted();
    return baseStaticApi.open(args);
  },
  destroy: (key?: React.Key) => {
    baseStaticApi.destroy(key);
  },
  config: (options: ConfigOptions) => {
    const { theme, ...storeOptions } = options;
    if ('theme' in options) {
      customFallbackTheme = theme;
      renderFallbackHost();
    }
    globalStore.setConfig(storeOptions);
  },
  useMessage,
};

export { useMessage, MessageContainer };
export { MessageNotice } from './MessageNotice';
export { MessageStore, normalizeTypeOpenArgs } from './core/messageStore';
export type {
  ArgsProps,
  ConfigOptions,
  JointContent,
  MessageInstance,
  MessageRecord,
  MessageType,
  NoticeType,
  TypeOpen,
} from './types';
