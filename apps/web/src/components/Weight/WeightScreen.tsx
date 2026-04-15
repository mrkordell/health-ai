import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { CurrentWeightCard } from './CurrentWeightCard';
import { WeightChart } from './WeightChart';
import { WeightEntryList } from './WeightEntryList';
import { apiRequest } from '../../lib/api';

export interface WeightEntry {
  id: string;
  weightLbs: number;
  notes: string | null;
  loggedAt: string;
}

export interface WeightData {
  entries: WeightEntry[];
  trend: {
    startWeightLbs: number | null;
    endWeightLbs: number | null;
    changeLbs: number | null;
  };
  currentWeight: { weightLbs: number } | null;
  targetWeightLbs: number | null;
}

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  ALL: 365,
};

export function WeightScreen() {
  const { getToken } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [weightData, setWeightData] = useState<WeightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeight() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        const days = TIME_RANGE_DAYS[timeRange];
        const data = await apiRequest<WeightData>(`/api/weight?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWeightData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load weight data');
      } finally {
        setLoading(false);
      }
    }
    fetchWeight();
  }, [timeRange, getToken]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="scrollbar-hide flex-1 overflow-y-auto pb-6">
        {/* Page eyebrow + title */}
        <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6">
          <p className="eyebrow">02 · Body</p>
          <h1
            className="mt-2 font-serif text-plum-900"
            style={{
              fontSize: 'clamp(28px, 5vw, 36px)',
              fontWeight: 380,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              fontVariationSettings: '"opsz" 144, "SOFT" 50',
            }}
          >
            How the body's been showing up.
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span
              className="block h-2.5 w-2.5 rounded-full animate-breathe"
              style={{ background: 'var(--color-apricot-500)' }}
              aria-label="Loading"
            />
          </div>
        ) : error ? (
          <div
            className="mx-auto mt-6 max-w-md rounded-2xl border bg-white p-5 text-center text-[14px] text-rose-600"
            style={{ borderColor: 'var(--color-line)' }}
          >
            {error}
          </div>
        ) : weightData ? (
          <>
            <CurrentWeightCard data={weightData} />
            <WeightChart
              entries={weightData.entries}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              targetWeightLbs={weightData.targetWeightLbs}
            />
            <WeightEntryList entries={weightData.entries} />
          </>
        ) : null}
      </div>
    </div>
  );
}
