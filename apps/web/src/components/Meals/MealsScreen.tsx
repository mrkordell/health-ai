import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { DateSelector } from './DateSelector';
import { DailySummary } from './DailySummary';
import { MealList } from './MealList';
import { apiRequest } from '../../lib/api';

// YYYY-MM-DD in the browser's local timezone — NOT toISOString(), which is UTC
// and flips the day boundary for users in non-UTC zones.
function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface Meal {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: string;
}

export interface DayData {
  date: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  meals: Meal[];
  targets: {
    dailyCalorieTarget: number | null;
    dailyProteinTargetG: number | null;
    dailyCarbsTargetG: number | null;
    dailyFatTargetG: number | null;
  };
}

export function MealsScreen() {
  const { getToken } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMeals() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        const dateStr = formatLocalDate(selectedDate);
        const data = await apiRequest<DayData>(`/api/meals?date=${dateStr}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDayData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load meals');
      } finally {
        setLoading(false);
      }
    }
    fetchMeals();
  }, [selectedDate, getToken]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <div className="scrollbar-hide flex-1 overflow-y-auto pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span
              className="block h-2.5 w-2.5 rounded-full animate-breathe"
              style={{ background: 'var(--color-apricot-500)' }}
              aria-label="Loading"
            />
          </div>
        ) : error ? (
          <div className="mx-auto mt-8 max-w-md rounded-2xl border bg-white p-5 text-center text-[14px] text-rose-600" style={{ borderColor: 'var(--color-line)' }}>
            {error}
          </div>
        ) : dayData ? (
          <>
            <DailySummary data={dayData} />
            <MealList meals={dayData.meals} />
          </>
        ) : null}
      </div>
    </div>
  );
}
