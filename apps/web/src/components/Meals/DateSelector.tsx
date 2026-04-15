import { useRef, useEffect, useState } from 'react';

interface DateSelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const WEEKDAY = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);

const isSameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const startOfWeek = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
};

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/**
 * A calendar week strip: a single soft-paper card showing the week
 * containing the selected date, with the date in serif as the headline
 * and a swipeable week navigator. Punctum dot marks today.
 */
export function DateSelector({ selectedDate, onSelectDate }: DateSelectorProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(selectedDate));
  const today = new Date();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWeekStart(startOfWeek(selectedDate));
  }, [selectedDate]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthLabel = selectedDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekdayLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
  });

  return (
    <div
      ref={containerRef}
      className="flex-shrink-0 border-b px-4 pb-4 pt-5 sm:px-6"
      style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper)' }}
    >
      <div className="mx-auto max-w-2xl">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p
              className="eyebrow mb-1.5"
              style={{ color: 'var(--color-apricot-700)' }}
            >
              {monthLabel}
            </p>
            <h1
              className="font-serif text-plum-900"
              style={{
                fontWeight: 380,
                fontSize: 'clamp(28px, 5vw, 36px)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                fontVariationSettings: '"opsz" 144, "SOFT" 50',
              }}
            >
              {weekdayLabel},{' '}
              <span style={{ color: 'var(--color-apricot-600)' }}>
                {selectedDate.getDate()}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              aria-label="Previous week"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-muted)] hover:bg-plum-50 hover:text-plum-900"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onSelectDate(today)}
              className="rounded-full border px-3 py-1.5 text-[12px] font-medium text-plum-800 hover:bg-plum-50"
              style={{ borderColor: 'var(--color-line-strong)' }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              aria-label="Next week"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-muted)] hover:bg-plum-50 hover:text-plum-900"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Week strip */}
        <div className="mt-5 grid grid-cols-7 gap-1">
          {days.map((d) => {
            const selected = isSameDay(d, selectedDate);
            const isToday = isSameDay(d, today);
            const future = d.getTime() > today.getTime() && !isToday;

            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => onSelectDate(d)}
                disabled={future}
                aria-pressed={selected}
                aria-label={d.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
                className="group relative flex flex-col items-center gap-1.5 rounded-2xl py-2.5 transition-colors disabled:opacity-30"
                style={{
                  background: selected ? 'var(--color-plum-900)' : 'transparent',
                  color: selected ? 'var(--color-paper)' : 'var(--color-plum-900)',
                  transitionDuration: 'var(--duration-soft)',
                  transitionTimingFunction: 'var(--ease-soft)',
                }}
              >
                <span
                  className="text-[10px] font-medium uppercase tracking-[0.14em]"
                  style={{
                    color: selected ? 'rgba(251,247,242,0.6)' : 'var(--color-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {WEEKDAY(d)}
                </span>
                <span
                  className="font-serif text-[18px]"
                  style={{
                    fontVariationSettings: '"opsz" 24, "SOFT" 30',
                    fontWeight: selected ? 500 : 400,
                  }}
                >
                  {d.getDate()}
                </span>
                {isToday && !selected && (
                  <span
                    aria-hidden
                    className="absolute bottom-1.5 h-1 w-1 rounded-full"
                    style={{ background: 'var(--color-apricot-500)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
