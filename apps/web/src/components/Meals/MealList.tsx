import type { Meal } from './MealsScreen';

interface MealListProps {
  meals: Meal[];
}

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

export function MealList({ meals }: MealListProps) {
  // Group meals by type
  const groupedMeals = MEAL_ORDER.reduce(
    (acc, type) => {
      acc[type] = meals.filter((m) => m.mealType === type);
      return acc;
    },
    {} as Record<string, Meal[]>
  );

  const hasMeals = meals.length > 0;

  if (!hasMeals) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-neutral-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-[15px] text-neutral-500 font-medium">No meals logged</p>
        <p className="text-[13px] text-neutral-400 mt-1">
          Chat with Vita to log your first meal
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      {MEAL_ORDER.map((mealType) => {
        const typeMeals = groupedMeals[mealType];
        if (typeMeals.length === 0) return null;

        return (
          <div key={mealType}>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-neutral-500 mt-4 mb-2">
              {MEAL_LABELS[mealType]}
            </h3>
            <div className="space-y-2">
              {typeMeals.map((meal) => (
                <MealEntry key={meal.id} meal={meal} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface MealEntryProps {
  meal: Meal;
}

function MealEntry({ meal }: MealEntryProps) {
  return (
    <div className="bg-white rounded-xl p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-neutral-900 truncate">
          {meal.description}
        </p>
        <p className="text-[13px] text-neutral-500">
          P: {Math.round(meal.proteinG)}g · C: {Math.round(meal.carbsG)}g · F: {Math.round(meal.fatG)}g
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <span className="text-[15px] font-semibold text-neutral-700">
          {meal.calories}
        </span>
        <span className="text-[13px] text-neutral-400 ml-1">cal</span>
      </div>
    </div>
  );
}
