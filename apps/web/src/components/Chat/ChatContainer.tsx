import { useState } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ActionChipStack } from './ActionChip';
import { useChat } from '../../hooks/useChat';

function OnboardingBanner() {
  return (
    <div
      className="border-b px-5 py-3"
      style={{
        borderColor: 'var(--color-line)',
        background: 'linear-gradient(90deg, var(--color-apricot-100), var(--color-paper-2))',
      }}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <span
          className="block h-1.5 w-1.5 rounded-full animate-breathe"
          style={{ background: 'var(--color-apricot-500)' }}
          aria-hidden
        />
        <p
          className="text-[14px] text-plum-900"
          style={{ fontFamily: 'var(--font-serif)', fontVariationSettings: '"opsz" 24, "SOFT" 50' }}
        >
          <span className="eyebrow mr-2 align-middle">First conversation</span>
          Tell Vita a little about you so she can be useful — not generic.
        </p>
      </div>
    </div>
  );
}

function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-up"
      style={{ background: 'rgba(26,15,30,0.45)' }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="max-w-sm rounded-[24px] bg-paper p-7 animate-bloom"
        style={{ background: 'var(--color-paper)', boxShadow: 'var(--shadow-lifted)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="confirm-title"
          className="mb-2 font-serif text-[24px] font-medium text-plum-900"
          style={{ letterSpacing: '-0.015em', fontVariationSettings: '"opsz" 144, "SOFT" 40' }}
        >
          Clear our conversation?
        </h3>
        <p
          className="mb-6 text-[14px] leading-relaxed text-[color:var(--color-muted)]"
          style={{ fontFamily: 'var(--font-serif)', fontWeight: 380 }}
        >
          We'll start fresh. Your meal logs and weight history stay — only the
          messages between us go away.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-full px-5 py-2.5 text-[14px] font-medium text-plum-800 hover:bg-plum-50"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-plum-900 px-5 py-2.5 text-[14px] font-medium text-paper hover:bg-plum-800"
            style={{ background: 'var(--color-plum-900)', color: 'var(--color-paper)' }}
          >
            Clear conversation
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <span
        className="block h-2.5 w-2.5 rounded-full animate-breathe"
        style={{ background: 'var(--color-apricot-500)' }}
        aria-label="Loading"
      />
    </div>
  );
}

function ChatHeader({ onClear }: { onClear: () => void }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-between border-b px-5 py-2.5"
      style={{ borderColor: 'var(--color-line)' }}
    >
      <span
        className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Conversation · with Vita
      </span>
      <button
        onClick={onClear}
        className="rounded-full px-3 py-1 text-[12px] font-medium text-[color:var(--color-muted)] transition-colors hover:bg-plum-50 hover:text-plum-900"
        title="Clear conversation"
      >
        Clear
      </button>
    </div>
  );
}

export function ChatContainer() {
  const {
    messages,
    activeActions,
    isLoading,
    isLoadingHistory,
    isOnboarding,
    sendMessage,
    clearHistory,
    handleActionExited,
  } = useChat();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearHistory = async () => {
    setShowConfirm(false);
    await clearHistory();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isOnboarding && <OnboardingBanner />}
      <ChatHeader onClear={() => setShowConfirm(true)} />

      {isLoadingHistory ? (
        <LoadingState />
      ) : (
        <MessageList
          messages={messages}
          isLoading={isLoading}
          typingIndicator={<TypingIndicator />}
          actionChips={
            activeActions.length > 0 ? (
              <ActionChipStack actions={activeActions} onActionExited={handleActionExited} />
            ) : null
          }
        />
      )}

      <ChatInput onSend={sendMessage} disabled={isLoading || isLoadingHistory} />

      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={handleClearHistory}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
