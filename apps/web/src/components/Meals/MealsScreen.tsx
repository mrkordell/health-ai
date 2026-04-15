import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { DateSelector } from './DateSelector';
import { DailySummary } from './DailySummary';
import { MealList } from './MealList';
import { apiRequest } from '../../lib/api';

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

        const dateStr = selectedDate.toISOString().split('T')[0];
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
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
