import type { WeightData } from './WeightScreen';

interface CurrentWeightCardProps {
  data: WeightData;
}

export function CurrentWeightCard({ data }: CurrentWeightCardProps) {
  const { currentWeight, trend, targetWeightLbs } = data;

  if (!currentWeight) {
    return (
      <div className="mx-4 mt-4 p-6 bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl text-white text-center">
        <p className="text-[15px] opacity-80">No weight logged yet</p>
        <p className="text-[13px] opacity-60 mt-1">
          Chat with Vita to log your first weigh-in
        </p>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4 p-6 bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl text-white">
      <div className="text-center">
        {/* Current Weight */}
        <p className="text-[13px] font-medium opacity-70">Current Weight</p>
        <div className="flex items-baseline justify-center gap-1 mt-1">
          <span className="text-[40px] font-bold">{currentWeight.weightLbs.toFixed(1)}</span>
          <span className="text-[20px] font-medium opacity-80">lbs</span>
        </div>

        {/* Change Indicator */}
        {trend.changeLbs !== null && (
          <div className="flex items-center justify-center gap-1 mt-2">
            <ChangeArrow change={trend.changeLbs} />
            <span className="text-[15px] font-medium opacity-90">
              {trend.changeLbs > 0 ? '+' : ''}
              {trend.changeLbs.toFixed(1)} lbs
            </span>
            <span className="text-[13px] opacity-60 ml-1">this period</span>
          </div>
        )}

        {/* Target */}
        {targetWeightLbs && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-[13px] opacity-60">
              Target: {targetWeightLbs.toFixed(1)} lbs
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChangeArrow({ change }: { change: number }) {
  if (change === 0) return null;

  return (
    <svg
      className={`w-4 h-4 ${change > 0 ? '' : 'rotate-180'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
        clipRule="evenodd"
      />
    </svg>
  );
}
