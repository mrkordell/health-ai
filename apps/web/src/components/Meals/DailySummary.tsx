import type { DayData } from './MealsScreen';

interface DailySummaryProps {
  data: DayData;
}

const RING_RADIUS = 64;
const RING_STROKE = 12;
const CIRC = 2 * Math.PI * RING_RADIUS;

/**
 * Hero stat for the day's calories — a soft, off-center concentric ring,
 * the number set in Fraunces. Macros sit beneath as a quiet info row.
 */
export function DailySummary({ data }: DailySummaryProps) {
  const { totalCalories, totalProteinG, totalCarbsG, totalFatG, targets } = data;
  const calorieTarget = targets.dailyCalorieTarget;
  const progress = calorieTarget ? Math.min(totalCalories / calorieTarget, 1) : 0;
  const remaining = calorieTarget ? Math.max(calorieTarget - totalCalories, 0) : 0;

  return (
    <div className="mx-auto mt-5 max-w-2xl px-4 sm:px-6">
      <div
        className="relative overflow-hidden rounded-[28px] border bg-white p-6 sm:p-8"
        style={{ borderColor: 'var(--color-line)', boxShadow: 'var(--shadow-soft)' }}
      >
        {/* Soft ornamental gradient — top-right */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full"
          style={{
            background: 'radial-gradient(closest-side, rgba(244,122,74,0.18), transparent 70%)',
          }}
        />

        <div className="relative flex items-center gap-6 sm:gap-8">
          {/* Ring */}
          <div className="relative flex-shrink-0">
            <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden>
              <circle
                cx="80"
                cy="80"
                r={RING_RADIUS}
                fill="none"
                stroke="var(--color-plum-100)"
                strokeWidth={RING_STROKE}
              />
              {calorieTarget && (
                <circle
                  cx="80"
                  cy="80"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="var(--color-apricot-500)"
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress)}
                  transform="rotate(-90 80 80)"
                  style={{
                    transition: 'stroke-dashoffset var(--duration-bloom) var(--ease-bloom)',
                  }}
                />
              )}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="font-serif text-plum-900"
                style={{
                  fontWeight: 380,
                  fontSize: 36,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  fontVariationSettings: '"opsz" 144, "SOFT" 40',
                }}
              >
                {totalCalories.toLocaleString()}
              </span>
              <span
                className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                kcal
              </span>
            </div>
          </div>

          {/* Right side — context */}
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-2">Today, gently</p>
            {calorieTarget ? (
              <p
                className="font-serif text-plum-900"
                style={{
                  fontWeight: 380,
                  fontSize: 'clamp(20px, 3vw, 24px)',
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                  fontVariationSettings: '"opsz" 144, "SOFT" 50',
                }}
              >
                {remaining > 0 ? (
                  <>
                    <span className="text-apricot-600">{remaining.toLocaleString()}</span>{' '}
                    kcal of room left for the day.
                  </>
                ) : (
                  <>You've hit your target for today.</>
                )}
              </p>
            ) : (
              <p
                className="font-serif text-plum-900"
                style={{
                  fontWeight: 380,
                  fontSize: 22,
                  lineHeight: 1.2,
                  fontVariationSettings: '"opsz" 144, "SOFT" 50',
                }}
              >
                {totalCalories === 0
                  ? 'Nothing logged yet — no rush.'
                  : 'Tracking quietly in the background.'}
              </p>
            )}
            <p
              className="mt-2 text-[13px] text-[color:var(--color-muted)]"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {calorieTarget
                ? `of ${calorieTarget.toLocaleString()} kcal target`
                : 'No daily target set'}
            </p>
          </div>
        </div>

        {/* Macro row */}
        <div
          className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border"
          style={{
            borderColor: 'var(--color-line)',
            background: 'var(--color-line)',
          }}
        >
          <Macro
            label="Protein"
            value={totalProteinG}
            target={targets.dailyProteinTargetG}
            color="var(--color-sage-600)"
          />
          <Macro
            label="Carbs"
            value={totalCarbsG}
            target={targets.dailyCarbsTargetG}
            color="var(--color-apricot-600)"
          />
          <Macro
            label="Fat"
            value={totalFatG}
            target={targets.dailyFatTargetG}
            color="var(--color-honey-600)"
          />
        </div>
      </div>
    </div>
  );
}

interface MacroProps {
  label: string;
  value: number;
  target: number | null;
  color: string;
}

function Macro({ label, value, target, color }: MacroProps) {
  const pct = target ? Math.min(value / target, 1) : 0;
  return (
    <div className="flex flex-col gap-2 bg-white px-3 py-3.5">
      <div className="flex items-baseline gap-1">
        <span
          className="font-serif text-plum-900"
          style={{
            fontWeight: 380,
            fontSize: 22,
            letterSpacing: '-0.01em',
            fontVariationSettings: '"opsz" 24, "SOFT" 30',
          }}
        >
          {Math.round(value)}
          <span className="text-[13px] text-[color:var(--color-muted)]"> g</span>
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-muted)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {label}
        </span>
        {target && (
          <span className="text-[10px] text-[color:var(--color-muted)]">
            / {target}g
          </span>
        )}
      </div>
      {target && (
        <div className="h-[3px] overflow-hidden rounded-full" style={{ background: 'var(--color-plum-100)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct * 100}%`,
              background: color,
              transition: 'width var(--duration-bloom) var(--ease-bloom)',
            }}
          />
        </div>
      )}
    </div>
  );
}
