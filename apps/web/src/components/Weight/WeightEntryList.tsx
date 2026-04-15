import type { WeightEntry } from './WeightScreen';

interface WeightEntryListProps {
  entries: WeightEntry[];
}

export function WeightEntryList({ entries }: WeightEntryListProps) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort(
    (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
  );

  const withChange = sorted.map((entry, i) => {
    const prev = sorted[i + 1];
    const change: number | null = prev ? entry.weightLbs - prev.weightLbs : null;
    return { ...entry, change };
  });

  return (
    <div className="mx-auto mt-8 max-w-2xl px-4 pb-6 sm:px-6">
      <h2
        className="mb-3 font-serif text-plum-900"
        style={{
          fontSize: 22,
          fontWeight: 400,
          letterSpacing: '-0.01em',
          fontVariationSettings: '"opsz" 144, "SOFT" 40',
        }}
      >
        History
      </h2>
      <div
        className="overflow-hidden rounded-2xl border bg-white"
        style={{ borderColor: 'var(--color-line)', boxShadow: 'var(--shadow-quiet)' }}
      >
        {withChange.map((entry, i) => (
          <Row key={entry.id} entry={entry} change={entry.change} divider={i > 0} />
        ))}
      </div>
    </div>
  );
}

function Row({
  entry,
  change,
  divider,
}: {
  entry: WeightEntry;
  change: number | null;
  divider: boolean;
}) {
  const date = new Date(entry.loggedAt);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
      style={divider ? { borderTop: '1px solid var(--color-line)' } : undefined}
    >
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-plum-900">{dateStr}</p>
        <p
          className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--color-muted)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {timeStr}
        </p>
      </div>
      <div className="flex items-baseline gap-3">
        {change !== null && Math.abs(change) >= 0.05 && (
          <span
            className="text-[12px] font-medium"
            style={{
              fontFamily: 'var(--font-mono)',
              color: change < 0 ? 'var(--color-sage-700)' : 'var(--color-apricot-700)',
            }}
          >
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}
          </span>
        )}
        <span
          className="font-serif text-plum-900"
          style={{
            fontSize: 20,
            fontWeight: 400,
            letterSpacing: '-0.01em',
            fontVariationSettings: '"opsz" 24, "SOFT" 30',
          }}
        >
          {entry.weightLbs.toFixed(1)}
          <span className="ml-1 text-[12px] text-[color:var(--color-muted)]">lbs</span>
        </span>
      </div>
    </div>
  );
}
