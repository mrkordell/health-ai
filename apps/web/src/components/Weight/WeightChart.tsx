import { useMemo } from 'react';
import {
  VictoryChart,
  VictoryLine,
  VictoryArea,
  VictoryAxis,
  VictoryScatter,
  VictoryVoronoiContainer,
} from 'victory';
import type { WeightEntry } from './WeightScreen';

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface WeightChartProps {
  entries: WeightEntry[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  targetWeightLbs?: number | null;
}

const TIME_RANGES: ReadonlyArray<TimeRange> = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

const APRICOT = '#F47A4A';
const APRICOT_WASH = 'rgba(244,122,74,0.10)';
const PLUM = '#2A1A33';
const MUTED = 'rgba(26,15,30,0.45)';
const HAIRLINE = 'rgba(26,15,30,0.10)';

interface ChartDatum {
  x: Date;
  y: number;
  notes: string | null;
}

export function WeightChart({
  entries,
  timeRange,
  onTimeRangeChange,
  targetWeightLbs,
}: WeightChartProps) {
  const chartData = useMemo<ChartDatum[]>(() => {
    return entries
      .map((e) => ({ x: new Date(e.loggedAt), y: e.weightLbs, notes: e.notes }))
      .sort((a, b) => a.x.getTime() - b.x.getTime());
  }, [entries]);

  const domain = useMemo(() => {
    if (chartData.length === 0) return { y: [0, 100] as [number, number] };
    const ys = chartData.map((d) => d.y);
    const all = targetWeightLbs != null ? [...ys, targetWeightLbs] : ys;
    const min = Math.min(...all);
    const max = Math.max(...all);
    const pad = (max - min) * 0.18 || 4;
    return { y: [Math.floor(min - pad), Math.ceil(max + pad)] as [number, number] };
  }, [chartData, targetWeightLbs]);

  const tickCount = useMemo(() => {
    switch (timeRange) {
      case '1W': return 7;
      case '1M': return 4;
      case '3M': return 4;
      case '6M': return 5;
      case '1Y': return 6;
      default: return 5;
    }
  }, [timeRange]);

  const formatX = (d: Date) =>
    timeRange === '1W'
      ? d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  const Tooltip = ({ datum, x, y }: { datum?: ChartDatum; x?: number; y?: number }) => {
    if (!datum || x == null || y == null) return null;
    const date = datum.x.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const hasNotes = datum.notes && datum.notes.trim().length > 0;
    return (
      <g>
        <foreignObject x={x - 80} y={y - (hasNotes ? 90 : 70)} width={160} height={hasNotes ? 86 : 64}>
          <div
            className="rounded-2xl border bg-white px-3 py-2 text-center"
            style={{ borderColor: 'var(--color-line)', boxShadow: 'var(--shadow-lifted)' }}
          >
            <p
              className="font-serif text-plum-900"
              style={{ fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em' }}
            >
              {datum.y.toFixed(1)} <span className="text-[12px] text-[color:var(--color-muted)]">lbs</span>
            </p>
            <p
              className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-muted)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {date}
            </p>
            {hasNotes && (
              <p className="mt-1 truncate font-serif italic text-[11px] text-[color:var(--color-muted)]">
                {datum.notes}
              </p>
            )}
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div className="mx-auto mt-5 max-w-2xl px-4 sm:px-6">
      <div
        className="rounded-[28px] border bg-white px-3 py-4 sm:px-5 sm:py-5"
        style={{ borderColor: 'var(--color-line)', boxShadow: 'var(--shadow-quiet)' }}
      >
        <div className="mb-3 flex items-baseline justify-between px-3">
          <p className="eyebrow">Trend · {timeRange.toLowerCase()}</p>
          {targetWeightLbs != null && (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-muted)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span className="block h-0.5 w-3" style={{ background: PLUM }} />
              Goal
            </span>
          )}
        </div>

        <div
          className="relative h-[240px] touch-pan-y"
          role="img"
          aria-label={`Weight trend chart, ${entries.length} entries over ${timeRange}`}
        >
          {entries.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p
                className="font-serif italic text-[15px] text-[color:var(--color-muted)]"
                style={{ fontVariationSettings: '"opsz" 24, "SOFT" 60' }}
              >
                No weigh-ins in this window.
              </p>
            </div>
          ) : (
            <VictoryChart
              width={400}
              height={220}
              padding={{ top: 16, bottom: 36, left: 44, right: 16 }}
              domain={domain}
              containerComponent={
                <VictoryVoronoiContainer
                  voronoiDimension="x"
                  labels={({ datum }) => `${(datum as ChartDatum).y.toFixed(1)}`}
                  labelComponent={<Tooltip />}
                />
              }
            >
              <VictoryAxis
                dependentAxis
                tickCount={4}
                style={{
                  axis: { stroke: 'transparent' },
                  ticks: { stroke: 'transparent' },
                  tickLabels: {
                    fill: MUTED,
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: 1.4,
                  },
                  grid: { stroke: HAIRLINE, strokeDasharray: '2,4' },
                }}
              />
              <VictoryAxis
                tickCount={tickCount}
                tickFormat={(t) => formatX(new Date(t))}
                style={{
                  axis: { stroke: HAIRLINE },
                  ticks: { stroke: 'transparent' },
                  tickLabels: {
                    fill: MUTED,
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: 1.4,
                  },
                  grid: { stroke: 'transparent' },
                }}
              />

              {targetWeightLbs != null && (
                <VictoryLine
                  data={[
                    { x: chartData[0]?.x ?? new Date(), y: targetWeightLbs },
                    { x: chartData[chartData.length - 1]?.x ?? new Date(), y: targetWeightLbs },
                  ]}
                  style={{
                    data: { stroke: PLUM, strokeWidth: 1.5, strokeDasharray: '4,5', strokeOpacity: 0.6 },
                  }}
                />
              )}

              <VictoryArea
                data={chartData}
                interpolation="monotoneX"
                style={{ data: { fill: APRICOT_WASH, stroke: 'transparent' } }}
              />
              <VictoryLine
                data={chartData}
                interpolation="monotoneX"
                style={{ data: { stroke: APRICOT, strokeWidth: 2, strokeLinecap: 'round' } }}
              />
              {chartData.length <= 40 && (
                <VictoryScatter
                  data={chartData}
                  size={({ active }: { active?: boolean }) => (active ? 5.5 : 3.5)}
                  style={{
                    data: {
                      fill: 'white',
                      stroke: APRICOT,
                      strokeWidth: 1.75,
                    },
                  }}
                />
              )}
            </VictoryChart>
          )}
        </div>

        {/* Time range selector */}
        <div
          className="mx-auto mt-3 flex max-w-md items-center justify-between gap-1 rounded-full border p-1"
          style={{ borderColor: 'var(--color-line)' }}
          role="group"
          aria-label="Time range"
        >
          {TIME_RANGES.map((r) => {
            const active = r === timeRange;
            return (
              <button
                key={r}
                onClick={() => onTimeRangeChange(r)}
                aria-pressed={active}
                className="flex-1 rounded-full px-2 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-all"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: active ? 'var(--color-plum-900)' : 'transparent',
                  color: active ? 'var(--color-paper)' : 'var(--color-muted)',
                  transitionDuration: 'var(--duration-soft)',
                  transitionTimingFunction: 'var(--ease-soft)',
                }}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
