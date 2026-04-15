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

interface WeightChartProps {
  entries: WeightEntry[];
  timeRange: string;
  onTimeRangeChange: (range: '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL') => void;
  targetWeightLbs?: number | null;
}

const TIME_RANGES = ['1W', '1M', '3M', '6M', '1Y', 'ALL'] as const;

const BRAND_GREEN = '#10b981';
const BRAND_GREEN_LIGHT = 'rgba(16, 185, 129, 0.15)';
const GOAL_COLOR = '#6366f1'; // Indigo for goal line

export function WeightChart({
  entries,
  timeRange,
  onTimeRangeChange,
  targetWeightLbs,
}: WeightChartProps) {
  // Transform and sort data for Victory
  const chartData = useMemo(() => {
    return entries
      .map((entry) => ({
        x: new Date(entry.loggedAt),
        y: entry.weightLbs,
        notes: entry.notes,
        label: '', // Will be set by custom label
      }))
      .sort((a, b) => a.x.getTime() - b.x.getTime());
  }, [entries]);

  // Calculate domain with padding
  const domain = useMemo(() => {
    if (chartData.length === 0) {
      return { y: [0, 100] as [number, number] };
    }

    const weights = chartData.map((d) => d.y);

    // Include target weight in domain if it exists
    const allValues = targetWeightLbs ? [...weights, targetWeightLbs] : weights;
    const domainMin = Math.min(...allValues);
    const domainMax = Math.max(...allValues);

    const padding = (domainMax - domainMin) * 0.15 || 5;

    return {
      y: [Math.floor(domainMin - padding), Math.ceil(domainMax + padding)] as [number, number],
    };
  }, [chartData, targetWeightLbs]);

  // Format date for tooltip
  const formatTooltipDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format X-axis ticks based on time range
  const formatXAxis = (date: Date) => {
    if (timeRange === '1W') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate tick count based on time range
  const tickCount = useMemo(() => {
    switch (timeRange) {
      case '1W': return 7;
      case '1M': return 4;
      case '3M': return 6;
      case '6M': return 6;
      case '1Y': return 6;
      default: return 6;
    }
  }, [timeRange]);

  // Custom flyout for tooltip
  const CustomTooltip = (props: any) => {
    const { datum, x, y } = props;
    if (!datum) return null;

    const date = formatTooltipDate(datum.x);
    const weight = datum.y.toFixed(1);
    const hasNotes = datum.notes && datum.notes.trim();

    return (
      <g>
        <foreignObject x={x - 70} y={y - 75} width={140} height={hasNotes ? 75 : 55}>
          <div className="bg-white px-3 py-2 rounded-xl shadow-lg border border-neutral-200 text-center">
            <p className="text-[15px] font-semibold text-neutral-900">{weight} lbs</p>
            <p className="text-[12px] text-neutral-500">{date}</p>
            {hasNotes && (
              <p className="text-[11px] text-neutral-600 mt-1 italic truncate">{datum.notes}</p>
            )}
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div className="mx-4 mt-4 p-4 bg-white rounded-2xl">
      {/* Chart Area */}
      <div
        className="relative h-[220px] touch-pan-y"
        role="img"
        aria-label={`Weight trend chart showing ${entries.length} entries over ${timeRange}`}
      >
        {entries.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[15px] text-neutral-400">No data for this period</p>
          </div>
        ) : (
          <VictoryChart
            width={350}
            height={200}
            padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
            domain={domain}
            containerComponent={
              <VictoryVoronoiContainer
                voronoiDimension="x"
                labels={({ datum }) => `${datum.y.toFixed(1)} lbs`}
                labelComponent={<CustomTooltip />}
              />
            }
          >
            {/* Y-Axis */}
            <VictoryAxis
              dependentAxis
              tickFormat={(t) => `${t}`}
              tickCount={5}
              style={{
                axis: { stroke: 'transparent' },
                ticks: { stroke: 'transparent' },
                tickLabels: {
                  fill: '#a3a3a3',
                  fontSize: 11,
                  fontFamily: 'inherit',
                },
                grid: {
                  stroke: '#f0f0f0',
                  strokeDasharray: '4,4',
                },
              }}
            />

            {/* X-Axis */}
            <VictoryAxis
              tickFormat={(t) => formatXAxis(new Date(t))}
              tickCount={tickCount}
              style={{
                axis: { stroke: '#e5e5e5' },
                ticks: { stroke: 'transparent' },
                tickLabels: {
                  fill: '#a3a3a3',
                  fontSize: 10,
                  fontFamily: 'inherit',
                  angle: 0,
                },
                grid: { stroke: 'transparent' },
              }}
            />

            {/* Goal Line */}
            {targetWeightLbs && (
              <VictoryLine
                data={[
                  { x: chartData[0]?.x || new Date(), y: targetWeightLbs },
                  { x: chartData[chartData.length - 1]?.x || new Date(), y: targetWeightLbs },
                ]}
                style={{
                  data: {
                    stroke: GOAL_COLOR,
                    strokeWidth: 2,
                    strokeDasharray: '6,4',
                  },
                }}
              />
            )}

            {/* Area Fill */}
            <VictoryArea
              data={chartData}
              interpolation="monotoneX"
              style={{
                data: {
                  fill: BRAND_GREEN_LIGHT,
                  stroke: 'transparent',
                },
              }}
            />

            {/* Main Line */}
            <VictoryLine
              data={chartData}
              interpolation="monotoneX"
              style={{
                data: {
                  stroke: BRAND_GREEN,
                  strokeWidth: 2.5,
                  strokeLinecap: 'round',
                },
              }}
            />

            {/* Data Points - only show if <= 30 entries */}
            {chartData.length <= 30 && (
              <VictoryScatter
                data={chartData}
                size={({ active }) => (active ? 7 : 5)}
                style={{
                  data: {
                    fill: BRAND_GREEN,
                    stroke: 'white',
                    strokeWidth: 2,
                  },
                }}
              />
            )}
          </VictoryChart>
        )}

        {/* Goal Label */}
        {targetWeightLbs && entries.length > 0 && (
          <div
            className="absolute right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600"
            style={{
              top: `${20 + ((domain.y[1] - targetWeightLbs) / (domain.y[1] - domain.y[0])) * 160}px`,
            }}
          >
            Goal
          </div>
        )}
      </div>

      {/* Time Range Selector */}
      <div
        className="flex justify-center gap-1 mt-4"
        role="group"
        aria-label="Time range selector"
      >
        {TIME_RANGES.map((range) => {
          const isSelected = timeRange === range;
          return (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              aria-pressed={isSelected}
              aria-label={`Show ${range === 'ALL' ? 'all' : range} of weight data`}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
                isSelected
                  ? 'bg-brand-100 text-brand-700'
                  : 'text-neutral-500 hover:bg-neutral-100 active:bg-neutral-200'
              }`}
            >
              {range}
            </button>
          );
        })}
      </div>
    </div>
  );
}
