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

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function getDateKey(dateStr?: string): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toDateString();
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export function MessageList({ messages, isLoading, typingIndicator, actionChips }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide"
    >
      <div className="flex flex-col gap-2">
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const sameSender = prevMessage?.role === message.role;
          const spacing = sameSender ? 'mt-1' : 'mt-3';

          const currentDateKey = getDateKey(message.createdAt);
          const prevDateKey = getDateKey(prevMessage?.createdAt);
          const showDateSeparator = currentDateKey && currentDateKey !== prevDateKey;

          return (
            <div key={message.id}>
              {showDateSeparator && (
                <DateSeparator label={formatDateSeparator(message.createdAt!)} />
              )}
              <div className={index > 0 && !showDateSeparator ? spacing : ''}>
                {message.role === 'user' ? (
                  <UserMessage content={message.content} />
                ) : (
                  <CoachMessage content={message.content} />
                )}
              </div>
            </div>
          );
        })}
        {actionChips}
        {isLoading && typingIndicator && (
          <div className="mt-3">{typingIndicator}</div>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
