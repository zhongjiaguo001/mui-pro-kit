import type {
  ArgsProps,
  ConfigOptions,
  JointContent,
  MessageRecord,
  MessageType,
  NoticeType,
} from '../types';

export interface ResolvedMessageConfig {
  top: number | string;
  duration: number;
  prefixCls: string;
  maxCount?: number;
  rtl: boolean;
  pauseOnHover: boolean;
  getContainer?: () => HTMLElement;
}

export const DEFAULT_MESSAGE_CONFIG: ResolvedMessageConfig = {
  top: 16,
  duration: 3,
  prefixCls: 'mui-message',
  maxCount: undefined,
  rtl: false,
  pauseOnHover: true,
  getContainer: undefined,
};

export interface TimerEntry {
  timerId: ReturnType<typeof setTimeout> | null;
  startedAt: number;
  remainingMs: number;
  paused: boolean;
}

interface InternalEntry {
  record: MessageRecord;
  resolveClosed: (closed: boolean) => void;
  closedPromise: Promise<boolean>;
  settled: boolean;
  timer: TimerEntry | null;
  exitTimerId: ReturnType<typeof setTimeout> | null;
}

export type StoreListener = () => void;

export interface MessageStoreOptions {
  /** Exit transition duration before removing node from DOM (ms, default: 180) */
  exitDurationMs?: number;
  /** Injectable clock for deterministic unit testing */
  now?: () => number;
}

/**
 * Pure TypeScript argument normalizer supporting both Ant Design shorthand signatures:
 * - `message.success('Saved', 2, onClose)`
 * - `message.success('Saved', onClose)`
 * - `message.success({ content: 'Saved', key: 'k1', duration: 2 })`
 */
export function normalizeTypeOpenArgs(
  type: NoticeType,
  content: JointContent,
  duration?: number | VoidFunction,
  onClose?: VoidFunction,
): ArgsProps {
  if (
    content !== null &&
    typeof content === 'object' &&
    'content' in content &&
    !(typeof (content as { $$typeof?: unknown }).$$typeof === 'symbol')
  ) {
    return {
      ...(content as ArgsProps),
      type: (content as ArgsProps).type ?? type,
    };
  }

  let resolvedDuration: number | undefined;
  let resolvedOnClose: VoidFunction | undefined = onClose;

  if (typeof duration === 'function') {
    resolvedOnClose = duration;
  } else if (typeof duration === 'number') {
    resolvedDuration = duration;
  }

  return {
    type,
    content: content as React.ReactNode,
    duration: resolvedDuration,
    onClose: resolvedOnClose,
  };
}

/**
 * Pure, framework-agnostic state & timer store for Ant Design v5-parity Message.
 * Handles:
 * - In-place updates via matching `key` without closing or duplicating
 * - FIFO `maxCount` eviction
 * - Accurate pause-on-hover remaining-time countdown & resume
 * - Single-fire `onClose` + callable/PromiseLike `MessageType` handle
 * - Clean exit transition lifecycle and full timer cleanup on `destroy()`
 */
export class MessageStore {
  private entries: InternalEntry[] = [];
  private listeners = new Set<StoreListener>();
  private config: ResolvedMessageConfig;
  private seq = 0;
  private exitDurationMs: number;
  private now: () => number;
  private cachedSnapshot: readonly MessageRecord[] = [];

  constructor(
    initialConfig?: ConfigOptions,
    options?: MessageStoreOptions,
  ) {
    this.config = {
      ...DEFAULT_MESSAGE_CONFIG,
      ...initialConfig,
    };
    this.exitDurationMs = options?.exitDurationMs ?? 180;
    this.now = options?.now ?? (() => Date.now());
  }

  public getConfig(): ResolvedMessageConfig {
    return this.config;
  }

  public setConfig(next: ConfigOptions): void {
    this.config = {
      ...this.config,
      ...(next.top !== undefined ? { top: next.top } : {}),
      ...(next.duration !== undefined ? { duration: next.duration } : {}),
      ...(next.prefixCls !== undefined ? { prefixCls: next.prefixCls } : {}),
      ...(next.rtl !== undefined ? { rtl: next.rtl } : {}),
      ...(next.pauseOnHover !== undefined
        ? { pauseOnHover: next.pauseOnHover }
        : {}),
      ...('maxCount' in next ? { maxCount: next.maxCount } : {}),
      ...('getContainer' in next ? { getContainer: next.getContainer } : {}),
    };
    if (this.config.maxCount && this.config.maxCount > 0) {
      this.enforceMaxCount();
    }
    this.emit();
  }

  public getSnapshot(): readonly MessageRecord[] {
    return this.cachedSnapshot;
  }

  public subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    this.cachedSnapshot = this.entries.map((item) => item.record);
    this.listeners.forEach((fn) => fn());
  }

  private generateKey(): string {
    this.seq += 1;
    return `mui-msg-${this.seq}`;
  }

  private clearAutoTimer(entry: InternalEntry): void {
    if (entry.timer?.timerId !== null && entry.timer?.timerId !== undefined) {
      clearTimeout(entry.timer.timerId);
      entry.timer.timerId = null;
    }
  }

  private clearExitTimer(entry: InternalEntry): void {
    if (entry.exitTimerId !== null) {
      clearTimeout(entry.exitTimerId);
      entry.exitTimerId = null;
    }
  }

  private scheduleAutoClose(entry: InternalEntry, delayMs: number): void {
    this.clearAutoTimer(entry);
    if (delayMs <= 0) {
      entry.timer = null;
      return;
    }
    const timer: TimerEntry = {
      startedAt: this.now(),
      remainingMs: delayMs,
      paused: false,
      timerId: setTimeout(() => {
        this.close(entry.record.key);
      }, delayMs),
    };
    entry.timer = timer;
  }

  private settleEntry(entry: InternalEntry): void {
    if (entry.settled) return;
    entry.settled = true;
    try {
      entry.record.onClose?.();
    } finally {
      entry.resolveClosed(true);
    }
  }

  private enforceMaxCount(): void {
    const limit = this.config.maxCount;
    if (!limit || limit <= 0) return;

    const active = this.entries.filter((e) => !e.record.closing);
    if (active.length > limit) {
      const excess = active.length - limit;
      for (let i = 0; i < excess; i += 1) {
        this.closeInternal(active[i].record.key, true);
      }
    }

    // Bound in-flight exit-animating nodes during high-frequency burst storms
    // so DOM node count and memory remain O(maxCount) instead of O(burstSize).
    const maxClosingBuffer = Math.max(limit, 3);
    const closing = this.entries.filter((e) => e.record.closing);
    if (closing.length > maxClosingBuffer) {
      const overflow = closing.length - maxClosingBuffer;
      for (let i = 0; i < overflow; i += 1) {
        this.removeImmediately(closing[i].record.key, true);
      }
    }
  }

  public open(args: ArgsProps): MessageType {
    const key =
      args.key !== undefined && args.key !== null
        ? String(args.key)
        : this.generateKey();
    const type: NoticeType = args.type ?? 'info';
    const duration =
      args.duration !== undefined ? args.duration : this.config.duration;
    const pauseOnHover =
      args.pauseOnHover !== undefined
        ? args.pauseOnHover
        : this.config.pauseOnHover;

    const existing = this.entries.find((e) => e.record.key === key);

    if (existing) {
      // Update existing message in place (Ant Design key-update semantics)
      const wasClosing = existing.record.closing;
      this.clearExitTimer(existing);

      // If reviving an entry that already started closing/settled, issue a fresh lifecycle promise
      if (existing.settled || wasClosing) {
        let resolveClosed!: (closed: boolean) => void;
        existing.closedPromise = new Promise<boolean>((resolve) => {
          resolveClosed = resolve;
        });
        existing.resolveClosed = resolveClosed;
        existing.settled = false;
      }

      existing.record = {
        ...existing.record,
        type,
        content: args.content,
        duration,
        icon: args.icon,
        className: args.className,
        style: args.style,
        onClose:
          args.onClose !== undefined
            ? args.onClose
            : wasClosing
              ? undefined
              : existing.record.onClose,
        onClick: args.onClick,
        closable: args.closable,
        pauseOnHover,
        closing: false,
        updateCount: existing.record.updateCount + 1,
      };
      if (duration > 0) {
        this.scheduleAutoClose(existing, duration * 1000);
      } else {
        this.clearAutoTimer(existing);
        existing.timer = null;
      }
      if (wasClosing) {
        this.enforceMaxCount();
      }
      this.emit();
      return this.createHandle(existing);
    }

    let resolveClosed!: (closed: boolean) => void;
    const closedPromise = new Promise<boolean>((resolve) => {
      resolveClosed = resolve;
    });

    const entry: InternalEntry = {
      record: {
        key,
        type,
        content: args.content,
        duration,
        icon: args.icon,
        className: args.className,
        style: args.style,
        onClose: args.onClose,
        onClick: args.onClick,
        closable: args.closable,
        pauseOnHover,
        updateCount: 0,
        closing: false,
        createdAt: this.now(),
      },
      resolveClosed,
      closedPromise,
      settled: false,
      timer: null,
      exitTimerId: null,
    };

    this.entries.push(entry);

    if (duration > 0) {
      this.scheduleAutoClose(entry, duration * 1000);
    }

    this.enforceMaxCount();
    this.emit();
    return this.createHandle(entry);
  }

  private createHandle(entry: InternalEntry): MessageType {
    const closeFn = (() => {
      this.close(entry.record.key);
    }) as MessageType;

    closeFn.then = (onfulfilled, onrejected) =>
      entry.closedPromise.then(onfulfilled, onrejected);

    return closeFn;
  }

  public pause(key: string): void {
    const entry = this.entries.find((e) => e.record.key === key);
    if (!entry || !entry.record.pauseOnHover || entry.record.closing) return;
    const timer = entry.timer;
    if (!timer || timer.paused) return;

    this.clearAutoTimer(entry);
    const elapsed = Math.max(0, this.now() - timer.startedAt);
    timer.remainingMs = Math.max(50, timer.remainingMs - elapsed);
    timer.paused = true;
  }

  public resume(key: string): void {
    const entry = this.entries.find((e) => e.record.key === key);
    if (!entry || !entry.record.pauseOnHover || entry.record.closing) return;
    const timer = entry.timer;
    if (!timer || !timer.paused) return;

    this.scheduleAutoClose(entry, timer.remainingMs);
  }

  public close(key: string): void {
    this.closeInternal(key, false);
  }

  private closeInternal(key: string, silent: boolean): void {
    const entry = this.entries.find((e) => e.record.key === key);
    if (!entry || entry.record.closing) return;

    this.clearAutoTimer(entry);
    entry.timer = null;
    entry.record = { ...entry.record, closing: true };
    this.settleEntry(entry);

    if (this.exitDurationMs <= 0) {
      this.removeImmediately(key, silent);
      return;
    }

    if (!silent) {
      this.emit();
    }
    entry.exitTimerId = setTimeout(() => {
      this.removeImmediately(key, false);
    }, this.exitDurationMs);
  }

  private removeImmediately(key: string, silent = false): void {
    const idx = this.entries.findIndex((e) => e.record.key === key);
    if (idx === -1) return;
    const [removed] = this.entries.splice(idx, 1);
    this.clearAutoTimer(removed);
    this.clearExitTimer(removed);
    if (!silent) {
      this.emit();
    }
  }

  public destroy(key?: string | number): void {
    if (key !== undefined && key !== null) {
      this.close(String(key));
      return;
    }

    const snapshot = [...this.entries];
    for (const entry of snapshot) {
      this.clearAutoTimer(entry);
      this.clearExitTimer(entry);
      this.settleEntry(entry);
    }
    this.entries = [];
    this.emit();
  }

  public getRemainingMs(key: string): number | null {
    const entry = this.entries.find((e) => e.record.key === key);
    if (!entry?.timer) return null;
    if (entry.timer.paused) return entry.timer.remainingMs;
    const elapsed = Math.max(0, this.now() - entry.timer.startedAt);
    return Math.max(0, entry.timer.remainingMs - elapsed);
  }
}
