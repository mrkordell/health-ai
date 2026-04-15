import { VitaGlyph } from '../Brand/Wordmark';

/**
 * "Vita is thinking" — a single breathing apricot dot, paired with the
 * mono eyebrow. No bouncing dots, no spinners.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3" aria-live="polite" aria-label="Vita is thinking">
      <VitaGlyph size={36} />
      <div className="flex-1">
        <div
          className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: 'var(--color-apricot-700)', fontFamily: 'var(--font-mono)' }}
        >
          Vita
        </div>
        <div
          className="inline-flex items-center gap-3 rounded-[20px] rounded-bl-[8px] border bg-white px-5 py-3.5"
          style={{ borderColor: 'var(--color-line)', boxShadow: 'var(--shadow-quiet)' }}
        >
          <span
            className="block h-2 w-2 rounded-full animate-breathe"
            style={{ background: 'var(--color-apricot-500)' }}
            aria-hidden
          />
          <span
            className="font-serif italic text-[14px] text-[color:var(--color-muted)]"
            style={{ fontVariationSettings: '"opsz" 24, "SOFT" 60' }}
          >
            thinking…
          </span>
        </div>
      </div>
    </div>
  );
}
