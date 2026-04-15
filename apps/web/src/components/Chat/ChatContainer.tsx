import { useState } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { ActionChipStack } from './ActionChip';
import { useChat } from '../../hooks/useChat';

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
      />
    </svg>
  );
}

function OnboardingBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-4 py-3">
      <div className="flex items-center gap-2">
        <SparklesIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div>
          <span className="text-sm font-medium text-blue-900">Getting to know you</span>
          <span className="text-sm text-blue-700 ml-2">
            Tell Vita about yourself for personalized coaching
          </span>
        </div>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Clear chat history?
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          This will permanently delete all your messages. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Clear history
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
    <div className="flex flex-col flex-1 min-h-0">
      {isOnboarding && <OnboardingBanner />}

      <div className="flex items-center justify-end px-4 py-2 border-b border-gray-100">
        <button
          onClick={() => setShowConfirm(true)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Clear chat history"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>

      {isLoadingHistory ? (
        <LoadingSpinner />
      ) : (
        <MessageList
          messages={messages}
          isLoading={isLoading}
          typingIndicator={<TypingIndicator />}
          actionChips={
            activeActions.length > 0 ? (
              <ActionChipStack
                actions={activeActions}
                onActionExited={handleActionExited}
              />
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
