import type { CSSProperties } from 'react';

type WordmarkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PX: Record<WordmarkSize, number> = {
  xs: 22,
  sm: 28,
  md: 44,
  lg: 72,
  xl: 112,
};

interface WordmarkProps {
  size?: WordmarkSize;
  onDark?: boolean;
  className?: string;
}

/**
 * The Vita wordmark. Optical-size Fraunces with a single italic 'i'
 * and the apricot punctum dot.
 */
export function Wordmark({ size = 'md', onDark = false, className = '' }: WordmarkProps) {
  const px = SIZE_PX[size];
  const style: CSSProperties = {
    fontFamily: 'var(--font-serif)',
    fontWeight: 340,
    fontSize: `${px}px`,
    lineHeight: 0.85,
    letterSpacing: '-0.04em',
    color: onDark ? 'var(--color-paper)' : 'var(--color-plum-900)',
    fontVariationSettings: '"opsz" 144, "SOFT" 80',
  };

  return (
    <span
      className={`inline-flex items-end ${className}`}
      style={style}
      aria-label="Vita"
    >
      V<span className="vita-ita">i</span>ta<span className="vita-dot" aria-hidden />
    </span>
  );
}

/**
 * Compact circular glyph — the "V" mark used as Vita's avatar.
 */
export function VitaGlyph({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: 'linear-gradient(135deg, var(--color-plum-800), var(--color-plum-600))',
        boxShadow: 'var(--shadow-glyph)',
      }}
      aria-hidden
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 80% -10%, rgba(244,122,74,0.45), transparent 55%)',
        }}
      />
      <svg
        width={Math.round(size * 0.58)}
        height={Math.round(size * 0.58)}
        viewBox="0 0 32 32"
        fill="none"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <path
          d="M7 9 L16 23 L25 9"
          stroke="#FBF7F2"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="25" cy="9" r="3" fill="#F47A4A" />
      </svg>
    </span>
  );
}
