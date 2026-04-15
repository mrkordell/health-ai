import type { WeightEntry } from './WeightScreen';

interface WeightEntryListProps {
  entries: WeightEntry[];
}

export function WeightEntryList({ entries }: WeightEntryListProps) {
  if (entries.length === 0) {
    return null;
  }

  // Sort entries by date descending (most recent first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
  );

  // Calculate changes from previous entry
  const entriesWithChange = sortedEntries.map((entry, index) => {
    const prevEntry = sortedEntries[index + 1];
    let change: number | null = null;
    if (prevEntry) {
      change = entry.weightLbs - prevEntry.weightLbs;
    }
    return { ...entry, change };
  });

  return (
    <div className="px-4 pb-4">
      <h3 className="text-[13px] font-semibold uppercase tracking-wide text-neutral-500 mt-4 mb-2">
        History
      </h3>
      <div className="space-y-2">
        {entriesWithChange.map((entry) => (
          <WeightEntryRow
            key={entry.id}
            entry={entry}
            change={entry.change}
          />
        ))}
      </div>
    </div>
  );
}

interface WeightEntryRowProps {
  entry: WeightEntry;
  change: number | null;
}

function WeightEntryRow({ entry, change }: WeightEntryRowProps) {
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
    <div className="bg-white rounded-xl p-3.5 flex items-center justify-between">
      <div>
        <p className="text-[15px] font-medium text-neutral-900">{dateStr}</p>
        <p className="text-[13px] text-neutral-500">{timeStr}</p>
      </div>
      <div className="text-right flex items-center gap-2">
        <div>
          <span className="text-[17px] font-semibold text-neutral-800">
            {entry.weightLbs.toFixed(1)}
          </span>
          <span className="text-[13px] text-neutral-400 ml-1">lbs</span>
        </div>
        {change !== null && (
          <span
            className={`text-[13px] font-medium px-1.5 py-0.5 rounded ${
              change < 0
                ? 'text-brand-600 bg-brand-50'
                : change > 0
                  ? 'text-rose-500 bg-rose-50'
                  : 'text-neutral-400 bg-neutral-100'
            }`}
          >
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}
