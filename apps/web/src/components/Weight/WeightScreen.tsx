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
  currentWeight: {
    weightLbs: number;
  } | null;
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
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
