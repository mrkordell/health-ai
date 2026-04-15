import { useEffect, useRef } from 'react';
import { UserMessage } from './UserMessage';
import { CoachMessage } from './CoachMessage';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  typingIndicator?: React.ReactNode;
  actionChips?: React.ReactNode;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getDateKey(dateStr?: string): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toDateString();
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-4" role="separator">
      <div className="h-px flex-1" style={{ background: 'var(--color-line)' }} />
      <span
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: 'var(--color-line)' }} />
    </div>
  );
}

export function MessageList({
  messages,
  isLoading,
  typingIndicator,
  actionChips,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="scrollbar-hide flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-2xl flex-col gap-1 px-4 pb-4 pt-6 sm:px-6">
        {messages.map((message, index) => {
          const prev = messages[index - 1];
          const next = messages[index + 1];
          const sameAsPrev = prev?.role === message.role;
          const sameAsNext = next?.role === message.role;

          const currentDateKey = getDateKey(message.createdAt);
          const prevDateKey = getDateKey(prev?.createdAt);
          const showDateSeparator = currentDateKey && currentDateKey !== prevDateKey;

          // Show timestamp at the END of a sender's grouped run
          const showTimestamp = !sameAsNext && Boolean(message.createdAt);

          return (
            <div key={message.id}>
              {showDateSeparator && (
                <DateSeparator label={formatDateSeparator(message.createdAt!)} />
              )}
              <div className={sameAsPrev && !showDateSeparator ? 'mt-1' : 'mt-4'}>
                {message.role === 'user' ? (
                  <UserMessage content={message.content} />
                ) : (
                  <CoachMessage content={message.content} grouped={sameAsPrev} />
                )}
              </div>
              {showTimestamp && (
                <div
                  className={`mt-1 px-1 text-[11px] tracking-wide text-[color:var(--color-muted)] ${
                    message.role === 'user' ? 'text-right' : 'pl-[48px] text-left'
                  }`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {formatTime(message.createdAt!)}
                </div>
              )}
            </div>
          );
        })}
        {actionChips}
        {isLoading && typingIndicator && <div className="mt-4">{typingIndicator}</div>}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
