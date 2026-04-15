import type { DayData } from './MealsScreen';

interface DailySummaryProps {
  data: DayData;
}

export function DailySummary({ data }: DailySummaryProps) {
  const { totalCalories, totalProteinG, totalCarbsG, totalFatG, targets } = data;
  const calorieTarget = targets.dailyCalorieTarget;
  const calorieProgress = calorieTarget ? Math.min((totalCalories / calorieTarget) * 100, 100) : 0;

  return (
    <div className="mx-4 mt-4 p-5 bg-white rounded-2xl shadow-sm">
      {/* Calories - Primary Metric */}
      <div className="text-center mb-4">
        <div className="relative inline-flex items-center justify-center">
          {/* Progress Ring */}
          {calorieTarget && (
            <svg className="absolute w-24 h-24 -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke="#e5e5e5"
                strokeWidth="6"
              />
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke="#10b981"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - calorieProgress / 100)}
                strokeLinecap="round"
              />
            </svg>
          )}
          <div className="w-24 h-24 flex flex-col items-center justify-center">
            <span className="text-[32px] font-bold text-neutral-900">
              {totalCalories.toLocaleString()}
            </span>
          </div>
        </div>
        <p className="text-[13px] font-medium text-neutral-500 mt-1">
          {calorieTarget ? `of ${calorieTarget.toLocaleString()} cal` : 'calories'}
        </p>
      </div>

      {/* Macros - Secondary Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MacroPill
          label="Protein"
          value={totalProteinG}
          target={targets.dailyProteinTargetG}
          color="text-accent-500"
        />
        <MacroPill
          label="Carbs"
          value={totalCarbsG}
          target={targets.dailyCarbsTargetG}
          color="text-amber-500"
        />
        <MacroPill
          label="Fat"
          value={totalFatG}
          target={targets.dailyFatTargetG}
          color="text-rose-400"
        />
      </div>
    </div>
  );
}

interface MacroPillProps {
  label: string;
  value: number;
  target: number | null;
  color: string;
}

function MacroPill({ label, value, target, color }: MacroPillProps) {
  return (
    <div className="text-center">
      <span className={`text-[18px] font-semibold ${color}`}>
        {Math.round(value)}g
      </span>
      {target && (
        <span className="text-[13px] text-neutral-400 ml-1">
          / {target}g
        </span>
      )}
      <p className="text-[11px] font-medium text-neutral-500 mt-0.5">{label}</p>
    </div>
  );
}
