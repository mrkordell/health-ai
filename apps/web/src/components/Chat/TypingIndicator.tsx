export function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
        <span className="text-brand-600 text-sm font-medium">V</span>
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-neutral-200">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
