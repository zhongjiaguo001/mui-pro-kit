import type React from 'react';
import type { Theme } from '@mui/material/styles';

export type NoticeType = 'info' | 'success' | 'error' | 'warning' | 'loading';

export type JointContent = React.ReactNode | ArgsProps;

export interface ArgsProps {
  /** Message body content */
  content: React.ReactNode;
  /** Auto-dismiss duration in seconds. Set to `0` to disable auto-close. */
  duration?: number;
  /** Visual semantic type */
  type?: NoticeType;
  /** Unique identifier for updating or destroying an existing message in place */
  key?: string | number;
  /** Custom leading icon node */
  icon?: React.ReactNode;
  /** Custom CSS class name applied to the notice card */
  className?: string;
  /** Custom inline style applied to the notice card */
  style?: React.CSSProperties;
  /** Callback fired once when the message closes */
  onClose?: () => void;
  /** Click handler on the notice card */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Show an explicit close icon button */
  closable?: boolean;
  /** Override global pauseOnHover behavior for this message */
  pauseOnHover?: boolean;
}

export interface ConfigOptions {
  /** Distance from viewport/container top in pixels or CSS length (default: 16) */
  top?: number | string;
  /** Default auto-dismiss duration in seconds (default: 3) */
  duration?: number;
  /** Prefix class name for styling hooks (default: 'mui-message') */
  prefixCls?: string;
  /** Return custom mount node for the Portal (default: () => document.body) */
  getContainer?: () => HTMLElement;
  /** Maximum visible messages simultaneously; oldest evicted FIFO when exceeded */
  maxCount?: number;
  /** Enable right-to-left layout direction */
  rtl?: boolean;
  /** Pause auto-dismiss timer when hovering a notice (default: true) */
  pauseOnHover?: boolean;
  /** Optional MUI Theme used by the standalone fallback host for static `message.*` calls */
  theme?: Theme;
}

/**
 * Ant Design compatible callable + PromiseLike handle returned by every message call.
 * - Call `handle()` to dismiss the message immediately.
 * - Chain `handle.then(onClose)` or `await handle` to run logic after it closes.
 */
export interface MessageType extends PromiseLike<boolean> {
  (): void;
}

export type TypeOpen = (
  content: JointContent,
  duration?: number | VoidFunction,
  onClose?: VoidFunction,
) => MessageType;

export interface MessageInstance {
  info: TypeOpen;
  success: TypeOpen;
  error: TypeOpen;
  warning: TypeOpen;
  loading: TypeOpen;
  open: (args: ArgsProps) => MessageType;
  destroy: (key?: React.Key) => void;
}

export interface MessageRecord {
  key: string;
  type: NoticeType;
  content: React.ReactNode;
  duration: number;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClose?: () => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  closable?: boolean;
  pauseOnHover: boolean;
  /** Monotonic version incremented when updated in place via the same key */
  updateCount: number;
  /** Whether the notice is currently playing its exit transition */
  closing: boolean;
  createdAt: number;
}
