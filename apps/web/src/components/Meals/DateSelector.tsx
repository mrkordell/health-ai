import { useRef, useEffect } from 'react';

interface DateSelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

function formatDayAbbrev(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

function formatDayNumber(date: Date): string {
  return date.getDate().toString();
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

export function DateSelector({ selectedDate, onSelectDate }: DateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Generate last 14 days + today + next 7 days
  const dates: Date[] = [];
  const today = new Date();
  for (let i = -14; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }

  // Scroll to selected date on mount
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const element = selectedRef.current;
      const containerWidth = container.offsetWidth;
      const elementLeft = element.offsetLeft;
      const elementWidth = element.offsetWidth;
      container.scrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2;
    }
  }, []);

  return (
    <div className="flex-shrink-0 bg-white border-b border-neutral-200">
      <div
        ref={scrollRef}
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {dates.map((date) => {
          const selected = isSameDay(date, selectedDate);
          const todayDate = isToday(date);

          return (
            <button
              key={date.toISOString()}
              ref={selected ? selectedRef : null}
              onClick={() => onSelectDate(date)}
              className={`flex flex-col items-center justify-center min-w-[44px] h-[52px] px-2 rounded-xl transition-colors duration-150 scroll-snap-align-center ${
                selected
                  ? 'bg-brand-600 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              style={{ scrollSnapAlign: 'center' }}
            >
              <span className="text-[11px] font-medium">{formatDayAbbrev(date)}</span>
              <span className="text-[16px] font-semibold">{formatDayNumber(date)}</span>
              {todayDate && !selected && (
                <span className="w-1 h-1 rounded-full bg-brand-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
