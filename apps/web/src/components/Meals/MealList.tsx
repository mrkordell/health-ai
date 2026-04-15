import type { Meal } from './MealsScreen';

interface MealListProps {
  meals: Meal[];
}

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
type MealType = (typeof MEAL_ORDER)[number];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

export function MealList({ meals }: MealListProps) {
  const grouped = MEAL_ORDER.reduce<Record<MealType, Meal[]>>(
    (acc, type) => {
      acc[type] = meals.filter((m) => m.mealType === type);
      return acc;
    },
    { breakfast: [], lunch: [], dinner: [], snack: [] }
  );

  if (meals.length === 0) {
    return (
      <div className="mx-auto mt-8 max-w-2xl px-4 sm:px-6">
        <div
          className="flex flex-col items-center gap-4 rounded-[24px] border border-dashed px-6 py-12 text-center"
          style={{ borderColor: 'var(--color-line-strong)' }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="var(--color-plum-300)" strokeWidth="1.5" />
            <path
              d="M8.5 13c.6 1.5 2 2.5 3.5 2.5s2.9-1 3.5-2.5"
              stroke="var(--color-plum-300)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <div>
            <p
              className="font-serif text-[20px] text-plum-900"
              style={{
                fontWeight: 400,
                letterSpacing: '-0.01em',
                fontVariationSettings: '"opsz" 144, "SOFT" 50',
              }}
            >
              Nothing logged yet.
            </p>
            <p
              className="mt-1.5 max-w-xs text-[14px] text-[color:var(--color-muted)]"
              style={{ fontFamily: 'var(--font-serif)', fontWeight: 380 }}
            >
              Tell Vita what you ate — a sentence is enough. She'll handle the rest.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6 sm:px-6">
      {MEAL_ORDER.map((type) => {
        const items = grouped[type];
        if (items.length === 0) return null;
        const total = items.reduce((sum, m) => sum + m.calories, 0);

        return (
          <section key={type} className="mt-8">
            <header className="mb-3 flex items-baseline justify-between">
              <h2
                className="font-serif text-plum-900"
                style={{
                  fontSize: 22,
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  fontVariationSettings: '"opsz" 144, "SOFT" 40',
                }}
              >
                {MEAL_LABELS[type]}
              </h2>
              <span
                className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--color-muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {total.toLocaleString()} kcal
              </span>
            </header>
            <div className="flex flex-col gap-2">
              {items.map((m) => (
                <MealEntry key={m.id} meal={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MealEntry({ meal }: { meal: Meal }) {
  return (
    <article
      className="rounded-2xl border bg-white p-4 sm:p-5"
      style={{ borderColor: 'var(--color-line)', boxShadow: 'var(--shadow-quiet)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className="font-serif text-plum-900"
            style={{
              fontSize: 17,
              fontWeight: 400,
              lineHeight: 1.35,
              letterSpacing: '-0.005em',
              fontVariationSettings: '"opsz" 24, "SOFT" 30',
            }}
          >
            {meal.description}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <span
            className="font-serif text-plum-900"
            style={{
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              fontVariationSettings: '"opsz" 24, "SOFT" 30',
            }}
          >
            {meal.calories}
          </span>
          <span className="ml-1 text-[12px] text-[color:var(--color-muted)]">kcal</span>
        </div>
      </div>
      <div
        className="mt-3 flex items-center gap-4 text-[12px] text-[color:var(--color-muted)]"
        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
      >
        <MacroDot color="var(--color-sage-600)" label="P" value={meal.proteinG} />
        <MacroDot color="var(--color-apricot-600)" label="C" value={meal.carbsG} />
        <MacroDot color="var(--color-honey-600)" label="F" value={meal.fatG} />
      </div>
    </article>
  );
}

function MacroDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="block h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {label} {Math.round(value)}g
    </span>
  );
}
