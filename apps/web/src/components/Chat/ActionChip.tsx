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
        className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-soft"
        aria-hidden="true"
      />
    );
  }

  if (status === 'completed') {
    return (
      <svg
        className="w-3.5 h-3.5 text-brand-500 animate-scale-in"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 8.5L6.5 12L13 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (status === 'error') {
    return (
      <svg
        className="w-3.5 h-3.5 text-red-500 flex-shrink-0"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 5v4M8 11v.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return null;
}

export function ActionChip({
  status,
  label,
  staggerIndex = 0,
  onRetry,
  onExited,
}: ActionChipProps) {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting' | 'exited'>('entering');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('visible');
    }, 50 + staggerIndex * 75);
    return () => clearTimeout(timer);
  }, [staggerIndex]);

  useEffect(() => {
    if (status === 'completed' && phase === 'visible') {
      const holdTimer = setTimeout(() => {
        setPhase('exiting');
      }, 1200);
      return () => clearTimeout(holdTimer);
    }
  }, [status, phase]);

  useEffect(() => {
    if (phase === 'exiting') {
      const exitTimer = setTimeout(() => {
        setPhase('exited');
        onExited?.();
      }, 200);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, onExited]);

  if (phase === 'exited') return null;

  const isVisible = phase === 'visible' || (phase === 'exiting' && status !== 'completed');
  const isExiting = phase === 'exiting';

  const stateClasses = {
    in_progress: 'bg-neutral-100 border-neutral-200 text-neutral-500',
    completed: 'bg-brand-50 border-brand-200 text-brand-600',
    error: 'bg-red-50 border-red-200 text-red-600',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${status === 'in_progress' ? 'In progress: ' : status === 'completed' ? 'Completed: ' : 'Error: '}${label}`}
      className={`
        inline-flex items-center gap-2
        px-3 py-1.5
        rounded-full
        text-[13px] font-medium
        border
        transition-all duration-200 ease-out
        ${stateClasses[status]}
        ${isVisible && !isExiting ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'}
      `}
    >
      <ActionIcon status={status} />
      <span>{label}</span>
      {status === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="ml-1 text-red-500 hover:text-red-700 underline text-xs font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function InlineActionChip(props: ActionChipProps) {
  return (
    <div className="flex justify-center my-3">
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

  const visibleActions = actions.slice(0, 4);
  const overflowCount = actions.length - 4;

  return (
    <div
      className="flex flex-col items-center gap-2 my-3"
      role="group"
      aria-label="Background actions"
    >
      {visibleActions.map((action, index) => (
        <ActionChip
          key={action.id}
          status={action.status}
          label={action.label}
          staggerIndex={index}
          onExited={() => onActionExited?.(action.id)}
        />
      ))}
      {overflowCount > 0 && (
        <span className="text-xs text-neutral-400 font-medium">
          +{overflowCount} more {overflowCount === 1 ? 'action' : 'actions'}...
        </span>
      )}
    </div>
  );
}
