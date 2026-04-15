import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Quick-action chips shown above the composer (e.g. "Log a meal"). */
  suggestions?: ReadonlyArray<string>;
  onSuggestionClick?: (suggestion: string) => void;
}

const DEFAULT_SUGGESTIONS = [
  'Log a meal',
  'Log my weight',
  'How am I doing this week?',
] as const;

export function ChatInput({
  onSend,
  disabled,
  placeholder = 'Tell Vita about your day…',
  suggestions = DEFAULT_SUGGESTIONS,
  onSuggestionClick,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const max = 24 * 5; // up to 5 lines
    ta.style.height = `${Math.min(ta.scrollHeight, max)}px`;
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    adjustHeight();
  };

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    setShowSuggestions(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (s: string) => {
    if (disabled) return;
    setShowSuggestions(false);
    if (onSuggestionClick) {
      onSuggestionClick(s);
    } else {
      onSend(s);
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      className="safe-area-bottom flex-shrink-0 border-t"
      style={{
        borderColor: 'var(--color-line)',
        background: 'rgba(251,247,242,0.92)',
        backdropFilter: 'saturate(140%) blur(14px)',
      }}
    >
      <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
        {showSuggestions && suggestions.length > 0 && value.length === 0 && (
          <div className="scrollbar-hide mb-3 -mx-1 flex gap-2 overflow-x-auto px-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => handleSuggestion(s)}
                className="flex-shrink-0 rounded-full border bg-white px-3.5 py-1.5 text-[13px] font-medium text-plum-800 transition-all hover:bg-apricot-50 hover:text-apricot-700 disabled:opacity-50"
                style={{
                  borderColor: 'var(--color-line-strong)',
                  transitionDuration: 'var(--duration-soft)',
                  transitionTimingFunction: 'var(--ease-soft)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div
          className="flex items-end gap-2 rounded-[20px] border bg-white px-3 py-2 transition-shadow focus-within:shadow-[0_0_0_4px_rgba(138,95,163,0.18)]"
          style={{ borderColor: 'var(--color-line-strong)' }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-6 text-plum-950 outline-none placeholder:text-[color:var(--color-muted)] disabled:opacity-50"
            aria-label="Message Vita"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all"
            style={{
              background: canSend ? 'var(--color-apricot-500)' : 'var(--color-plum-100)',
              color: canSend ? 'var(--color-plum-950)' : 'var(--color-muted)',
              transitionDuration: 'var(--duration-soft)',
              transitionTimingFunction: 'var(--ease-soft)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
