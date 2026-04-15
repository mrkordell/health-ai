interface UserMessageProps {
  content: string;
}

/**
 * The user's voice. Quiet, paper-on-plum bubble that reads like a sent
 * note — confident but never the loudest thing on screen.
 */
export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[78%] rounded-[20px] rounded-br-[8px] px-4 py-2.5 text-[15px] leading-relaxed text-paper animate-fade-up"
        style={{
          background: 'var(--color-plum-900)',
          color: 'var(--color-paper)',
        }}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  );
}
