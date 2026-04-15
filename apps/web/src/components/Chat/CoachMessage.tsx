import ReactMarkdown from 'react-markdown';
import { VitaGlyph } from '../Brand/Wordmark';

interface CoachMessageProps {
  content: string;
  /** When true, the avatar + name eyebrow are hidden — used for grouped follow-ups. */
  grouped?: boolean;
}

/**
 * Vita's voice. Editorial bubble on paper, with a small mono "VITA" eyebrow
 * and a serif body that reads like a note from a thoughtful person.
 */
export function CoachMessage({ content, grouped = false }: CoachMessageProps) {
  return (
    <div className="flex items-start gap-3">
      {/* Avatar — only on the first message of a Vita group */}
      <div className="flex-shrink-0" style={{ width: 36 }}>
        {!grouped && <VitaGlyph size={36} />}
      </div>

      <div className="max-w-[80%] flex-1">
        {!grouped && (
          <div
            className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em]"
            style={{ color: 'var(--color-apricot-700)', fontFamily: 'var(--font-mono)' }}
          >
            Vita
          </div>
        )}
        <div
          className="rounded-[20px] rounded-bl-[8px] border bg-white px-5 py-3.5 animate-settle"
          style={{
            borderColor: 'var(--color-line)',
            boxShadow: 'var(--shadow-quiet)',
          }}
        >
          <div
            className="vita-prose text-[15.5px] text-plum-900"
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 380,
              lineHeight: 1.55,
              fontVariationSettings: '"opsz" 24, "SOFT" 30',
            }}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                em: ({ children }) => (
                  <em
                    className="italic"
                    style={{
                      color: 'var(--color-apricot-700)',
                      fontVariationSettings: '"opsz" 24, "SOFT" 60, "WONK" 1',
                    }}
                  >
                    {children}
                  </em>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-plum-950">{children}</strong>
                ),
                ul: ({ children }) => (
                  <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="border-b border-[color:var(--color-line-strong)] text-plum-700 hover:text-apricot-700 hover:border-apricot-500"
                  >
                    {children}
                  </a>
                ),
                code: ({ children }) => (
                  <code
                    className="rounded bg-plum-50 px-1.5 py-0.5 text-[13px]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {children}
                  </code>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
