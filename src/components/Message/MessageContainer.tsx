import React, { useCallback, useSyncExternalStore } from 'react';
import { Box, Portal } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { MessageStore } from './core/messageStore';
import { MessageNotice } from './MessageNotice';

export interface MessageContainerProps {
  store: MessageStore;
}

/**
 * Portal-mounted floating stack container for MUI Message notices.
 * Renders nothing when the queue is empty to keep DOM overhead at zero.
 */
export const MessageContainer: React.FC<MessageContainerProps> = ({ store }) => {
  const theme = useTheme();

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribe(onStoreChange),
    [store],
  );
  const getSnapshot = useCallback(() => store.getSnapshot(), [store]);

  const records = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const config = store.getConfig();

  const handleClose = useCallback((key: string) => store.close(key), [store]);
  const handlePause = useCallback((key: string) => store.pause(key), [store]);
  const handleResume = useCallback((key: string) => store.resume(key), [store]);

  if (records.length === 0) {
    return null;
  }

  const customContainer = config.getContainer?.();
  const isScoped = Boolean(customContainer && customContainer !== document.body);
  const topCss = typeof config.top === 'number' ? `${config.top}px` : config.top;

  return (
    <Portal container={customContainer}>
      <Box
        data-testid={`${config.prefixCls}-container`}
        data-message-scoped={isScoped ? 'true' : 'false'}
        className={[
          config.prefixCls,
          config.rtl ? `${config.prefixCls}-rtl` : '',
        ]
          .filter(Boolean)
          .join(' ')}
        sx={{
          position: isScoped ? 'absolute' : 'fixed',
          top: topCss,
          left: 0,
          right: 0,
          zIndex: isScoped ? 30 : theme.zIndex.snackbar + 200,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 2,
          boxSizing: 'border-box',
        }}
      >
        {records.map((record) => (
          <MessageNotice
            key={record.key}
            record={record}
            prefixCls={config.prefixCls}
            rtl={config.rtl}
            onClose={handleClose}
            onPause={handlePause}
            onResume={handleResume}
          />
        ))}
      </Box>
    </Portal>
  );
};
