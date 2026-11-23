import React, { memo } from 'react';
import { CircularProgress, IconButton, Paper } from '@mui/material';
import { alpha, keyframes, styled, useTheme } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import type { MessageRecord, NoticeType } from './types';

export interface MessageNoticeProps {
  record: MessageRecord;
  prefixCls: string;
  rtl: boolean;
  onClose: (key: string) => void;
  onPause: (key: string) => void;
  onResume: (key: string) => void;
}

const msgEnterKeyframes = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.97);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const NoticeWrapper = styled('div', {
  shouldForwardProp: (prop) => prop !== 'closing',
})<{ closing: boolean }>(({ theme, closing }) => ({
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  overflow: 'visible',
  maxHeight: closing ? 0 : 140,
  marginBottom: closing ? 0 : theme.spacing(1.25),
  opacity: closing ? 0 : 1,
  transform: closing ? 'translateY(-8px) scale(0.97)' : 'translateY(0) scale(1)',
  willChange: 'transform, opacity',
  transition: theme.transitions.create(
    ['opacity', 'transform', 'max-height', 'margin-bottom'],
    { duration: 180, easing: theme.transitions.easing.easeOut },
  ),
  animation: closing ? 'none' : `${msgEnterKeyframes} 180ms ease-out`,
}));

const NoticeCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'clickable',
})<{ clickable: boolean }>(({ theme, clickable }) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    pointerEvents: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    maxWidth: 'min(92vw, 520px)',
    padding: `${theme.spacing(1.1)} ${theme.spacing(2)}`,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: `1px solid ${
      isDark ? alpha(theme.palette.common.white, 0.14) : theme.palette.divider
    }`,
    borderRadius: `${Number(theme.shape.borderRadius) + 2}px`,
    boxShadow: isDark
      ? '0 8px 24px rgba(0, 0, 0, 0.48), 0 2px 6px rgba(0, 0, 0, 0.32)'
      : theme.shadows[4],
    cursor: clickable ? 'pointer' : 'default',
    fontSize: '0.84rem',
    lineHeight: 1.45,
    fontWeight: 500,
    userSelect: 'text',
  };
});

const NoticeIconSlot = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const NoticeContentSlot = styled('span')({
  color: 'inherit',
  wordBreak: 'break-word',
});

function renderSemanticIcon(type: NoticeType, color: string): React.ReactNode {
  switch (type) {
    case 'success':
      return <CheckCircleIcon sx={{ fontSize: 18, color, display: 'block' }} />;
    case 'error':
      return <CancelIcon sx={{ fontSize: 18, color, display: 'block' }} />;
    case 'warning':
      return <WarningIcon sx={{ fontSize: 18, color, display: 'block' }} />;
    case 'loading':
      return (
        <CircularProgress
          size={15}
          thickness={5}
          sx={{ color, display: 'block' }}
        />
      );
    default:
      return <InfoIcon sx={{ fontSize: 18, color, display: 'block' }} />;
  }
}

export const MessageNotice: React.FC<MessageNoticeProps> = memo(
  ({ record, prefixCls, rtl, onClose, onPause, onResume }) => {
    const theme = useTheme();

    const semanticColor =
      record.type === 'success'
        ? theme.palette.success.main
        : record.type === 'error'
          ? theme.palette.error.main
          : record.type === 'warning'
            ? theme.palette.warning.main
            : record.type === 'loading'
              ? theme.palette.primary.main
              : theme.palette.info.main;

    const iconNode =
      record.icon !== undefined
        ? record.icon
        : renderSemanticIcon(record.type, semanticColor);

    const isAlertRole = record.type === 'error' || record.type === 'warning';

    return (
      <NoticeWrapper
        closing={record.closing}
        data-testid={`mui-message-item-${record.key}`}
        data-message-key={record.key}
        data-message-type={record.type}
        data-closing={record.closing ? 'true' : 'false'}
        className={`${prefixCls}-notice-wrapper`}
      >
        <NoticeCard
          elevation={0}
          clickable={Boolean(record.onClick)}
          role={isAlertRole ? 'alert' : 'status'}
          aria-live={record.type === 'error' ? 'assertive' : 'polite'}
          dir={rtl ? 'rtl' : 'ltr'}
          className={[
            `${prefixCls}-notice-content`,
            `${prefixCls}-${record.type}`,
            record.className,
          ]
            .filter(Boolean)
            .join(' ')}
          style={record.style}
          onClick={record.onClick}
          onMouseEnter={() => onPause(record.key)}
          onMouseLeave={() => onResume(record.key)}
        >
          {iconNode !== null && (
            <NoticeIconSlot className={`${prefixCls}-icon`}>
              {iconNode}
            </NoticeIconSlot>
          )}

          <NoticeContentSlot className={`${prefixCls}-content`}>
            {record.content}
          </NoticeContentSlot>

          {record.closable && (
            <IconButton
              size="small"
              aria-label="关闭提示"
              onClick={(e) => {
                e.stopPropagation();
                onClose(record.key);
              }}
              sx={{
                p: 0.25,
                ml: rtl ? 0 : 0.25,
                mr: rtl ? 0.25 : 0,
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.text.primary,
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <CloseIcon sx={{ fontSize: 15 }} />
            </IconButton>
          )}
        </NoticeCard>
      </NoticeWrapper>
    );
  },
);

MessageNotice.displayName = 'MessageNotice';
