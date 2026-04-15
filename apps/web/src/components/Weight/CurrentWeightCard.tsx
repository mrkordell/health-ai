import type { WeightData } from './WeightScreen';

interface CurrentWeightCardProps {
  data: WeightData;
}

/**
 * Confident hero number in Fraunces. The card reads like an editorial
 * stat block — generous whitespace, a small mono eyebrow, and the
 * trend rendered as a quiet caption rather than a giant green badge.
 */
export function CurrentWeightCard({ data }: CurrentWeightCardProps) {
  const { currentWeight, trend, targetWeightLbs } = data;

  if (!currentWeight) {
    return (
      <div className="mx-auto mt-5 max-w-2xl px-4 sm:px-6">
        <div
          className="rounded-[28px] border border-dashed p-8 text-center"
          style={{ borderColor: 'var(--color-line-strong)' }}
        >
          <p className="eyebrow mb-3">No weigh-ins yet</p>
          <p
            className="font-serif text-plum-900"
            style={{ fontSize: 22, fontWeight: 400, fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
          >
            Step on a scale when you're ready — Vita will remember the rest.
          </p>
        </div>
      </div>
    );
  }

  const change = trend.changeLbs;
  const changeDirection: 'up' | 'down' | 'flat' =
    change == null || Math.abs(change) < 0.05 ? 'flat' : change < 0 ? 'down' : 'up';

  const distanceToGoal =
    targetWeightLbs != null ? currentWeight.weightLbs - targetWeightLbs : null;

  return (
    <div className="mx-auto mt-5 max-w-2xl px-4 sm:px-6">
      <div
        className="relative overflow-hidden rounded-[28px] border bg-white px-6 py-7 sm:px-9 sm:py-9"
        style={{ borderColor: 'var(--color-line)', boxShadow: 'var(--shadow-soft)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full"
          style={{
            background: 'radial-gradient(closest-side, rgba(138,95,163,0.16), transparent 70%)',
          }}
        />
        <p className="eyebrow mb-3">As of today</p>

        <div className="flex items-baseline gap-2">
          <span
            className="font-serif text-plum-900"
            style={{
              fontSize: 'clamp(64px, 14vw, 96px)',
              fontWeight: 340,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              fontVariationSettings: '"opsz" 144, "SOFT" 60',
            }}
          >
            {currentWeight.weightLbs.toFixed(1)}
          </span>
          <span
            className="font-serif text-[color:var(--color-muted)]"
            style={{
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: '-0.01em',
            }}
          >
            lbs
          </span>
        </div>

        {/* Trend caption */}
        {change !== null && (
          <p
            className="mt-3 font-serif text-[16px] text-plum-800"
            style={{ fontWeight: 400, fontVariationSettings: '"opsz" 24, "SOFT" 30' }}
          >
            {changeDirection === 'flat' ? (
              <>Holding steady this period.</>
            ) : changeDirection === 'down' ? (
              <>
                Down{' '}
                <span style={{ color: 'var(--color-sage-700)' }}>
                  {Math.abs(change).toFixed(1)} lbs
                </span>{' '}
                <span className="text-[color:var(--color-muted)]">over the period.</span>
              </>
            ) : (
              <>
                Up{' '}
                <span style={{ color: 'var(--color-apricot-700)' }}>
                  {change.toFixed(1)} lbs
                </span>{' '}
                <span className="text-[color:var(--color-muted)]">over the period.</span>
              </>
            )}
          </p>
        )}

        {/* Goal */}
        {targetWeightLbs != null && (
          <div
            className="mt-6 flex items-center gap-3 border-t pt-5"
            style={{ borderColor: 'var(--color-line)' }}
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ background: 'var(--color-plum-700)' }}
            />
            <span
              className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Goal
            </span>
            <span className="font-serif text-[16px] text-plum-900">
              {targetWeightLbs.toFixed(1)} lbs
            </span>
            {distanceToGoal != null && Math.abs(distanceToGoal) >= 0.1 && (
              <span className="ml-auto text-[12px] text-[color:var(--color-muted)]">
                {distanceToGoal > 0
                  ? `${distanceToGoal.toFixed(1)} to go`
                  : `${Math.abs(distanceToGoal).toFixed(1)} past goal`}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
