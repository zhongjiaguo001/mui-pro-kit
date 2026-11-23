import React, { useEffect, useId, useMemo, useRef } from 'react';
import {
  MessageStore,
  normalizeTypeOpenArgs,
} from './core/messageStore';
import { MessageContainer } from './MessageContainer';
import type {
  ArgsProps,
  ConfigOptions,
  JointContent,
  MessageInstance,
  MessageType,
  NoticeType,
} from './types';

export function createMessageApi(store: MessageStore): MessageInstance {
  const openType =
    (type: NoticeType) =>
    (
      content: JointContent,
      duration?: number | VoidFunction,
      onClose?: VoidFunction,
    ): MessageType =>
      store.open(normalizeTypeOpenArgs(type, content, duration, onClose));

  return {
    info: openType('info'),
    success: openType('success'),
    error: openType('error'),
    warning: openType('warning'),
    loading: openType('loading'),
    open: (args: ArgsProps) => store.open(args),
    destroy: (key?: React.Key) => store.destroy(key as string | number | undefined),
  };
}

/**
 * Ant Design v5 `message.useMessage(config?)` hook implemented with Material UI v7.
 * Returns `[messageApi, contextHolder]`. Render `contextHolder` inside your MUI
 * `<ThemeProvider>` tree so all notices automatically inherit Light/Dark & primary tokens.
 */
export function useMessage(
  config?: ConfigOptions,
): readonly [MessageInstance, React.ReactElement] {
  const holderId = useId();
  const storeRef = useRef<MessageStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new MessageStore(config);
  }

  const hasConfig = Boolean(config);
  const top = config?.top;
  const duration = config?.duration;
  const maxCount = config?.maxCount;
  const rtl = config?.rtl;
  const prefixCls = config?.prefixCls;
  const pauseOnHover = config?.pauseOnHover;
  const getContainer = config?.getContainer;

  useEffect(() => {
    if (!hasConfig) return;
    storeRef.current?.setConfig({
      top,
      duration,
      maxCount,
      rtl,
      prefixCls,
      pauseOnHover,
      getContainer,
    });
  }, [hasConfig, duration, getContainer, maxCount, pauseOnHover, prefixCls, rtl, top]);

  useEffect(() => {
    const store = storeRef.current;
    return () => {
      store?.destroy();
    };
  }, []);

  const api = useMemo(() => createMessageApi(storeRef.current!), []);
  const contextHolder = useMemo(
    () => (
      <MessageContainer
        key={`mui-message-holder-${holderId}`}
        store={storeRef.current!}
      />
    ),
    [holderId],
  );

  return [api, contextHolder] as const;
}
