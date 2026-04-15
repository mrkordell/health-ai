import { useState, useEffect } from 'react';

export type ActionStatus = 'in_progress' | 'completed' | 'error';

interface ActionChipProps {
  status: ActionStatus;
  label: string;
  staggerIndex?: number;
  onRetry?: () => void;
  onExited?: () => void;
}

function ActionIcon({ status }: { status: ActionStatus }) {
  if (status === 'in_progress') {
    return (
      <span
        aria-hidden
        className="block h-1.5 w-1.5 rounded-full animate-breathe"
        style={{ background: 'var(--color-apricot-500)' }}
      />
    );
  }
  if (status === 'completed') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M3 8.5L6.5 12L13 4"
          stroke="var(--color-sage-600)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="var(--color-rose-500)" strokeWidth="1.5" />
      <path d="M8 5v4M8 11v.5" stroke="var(--color-rose-500)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ActionChip({ status, label, staggerIndex = 0, onRetry, onExited }: ActionChipProps) {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting' | 'exited'>('entering');

  useEffect(() => {
    const t = setTimeout(() => setPhase('visible'), 50 + staggerIndex * 75);
    return () => clearTimeout(t);
  }, [staggerIndex]);

  useEffect(() => {
    if (status === 'completed' && phase === 'visible') {
      const t = setTimeout(() => setPhase('exiting'), 1400);
      return () => clearTimeout(t);
    }
  }, [status, phase]);

  useEffect(() => {
    if (phase === 'exiting') {
      const t = setTimeout(() => {
        setPhase('exited');
        onExited?.();
      }, 220);
      return () => clearTimeout(t);
    }
  }, [phase, onExited]);

  if (phase === 'exited') return null;

  const isVisible = phase === 'visible' || (phase === 'exiting' && status !== 'completed');
  const isExiting = phase === 'exiting';

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 rounded-full border bg-white px-3.5 py-1.5 text-[13px] font-medium transition-all"
      style={{
        borderColor: 'var(--color-line)',
        color:
          status === 'in_progress'
            ? 'var(--color-muted)'
            : status === 'completed'
              ? 'var(--color-sage-700)'
              : 'var(--color-rose-600)',
        opacity: isVisible && !isExiting ? 1 : 0,
        transform: isVisible && !isExiting ? 'translateY(0) scale(1)' : 'translateY(2px) scale(0.96)',
        transitionDuration: 'var(--duration-soft)',
        transitionTimingFunction: 'var(--ease-soft)',
        boxShadow: 'var(--shadow-quiet)',
      }}
    >
      <ActionIcon status={status} />
      <span style={{ fontFamily: 'var(--font-sans)' }}>{label}</span>
      {status === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="ml-1 underline text-[12px] font-medium text-rose-600 hover:text-rose-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function InlineActionChip(props: ActionChipProps) {
  return (
    <div className="my-3 flex justify-center">
      <ActionChip {...props} />
    </div>
  );
}

export interface Action {
  id: string;
  label: string;
  status: ActionStatus;
}

interface ActionChipStackProps {
  actions: Action[];
  onActionExited?: (id: string) => void;
}

export function ActionChipStack({ actions, onActionExited }: ActionChipStackProps) {
  if (actions.length === 0) return null;

  const visible = actions.slice(0, 4);
  const overflow = actions.length - visible.length;

  return (
    <div
      className="my-4 flex flex-col items-center gap-2"
      role="group"
      aria-label="Background actions"
    >
      {visible.map((a, i) => (
        <ActionChip
          key={a.id}
          status={a.status}
          label={a.label}
          staggerIndex={i}
          onExited={() => onActionExited?.(a.id)}
        />
      ))}
      {overflow > 0 && (
        <span
          className="text-[11px] text-[color:var(--color-muted)]"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
        >
          +{overflow} more
        </span>
      )}
    </div>
  );
}
