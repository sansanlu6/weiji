import React from 'react';

export interface HalfYearCompareProps {
  sleepFirstHalf: number;
  sleepSecondHalf: number;
  moodFirstHalf: number;
  moodSecondHalf: number;
  exerciseFirstHalf: number;
  exerciseSecondHalf: number;
  takeoutFirstHalf: number;
  takeoutSecondHalf: number;
}

type DimensionKey = 'sleep' | 'mood' | 'exercise' | 'takeout';

interface DimensionRow {
  key: DimensionKey;
  label: string;
  color: string;
  firstHalf: number;
  secondHalf: number;
  higherIsBetter: boolean;
  formatDiff: (first: number, second: number) => string;
}

const DIMENSION_COLORS: Record<DimensionKey, string> = {
  sleep: '#A9A1F0',
  mood: '#F4B393',
  exercise: '#9CCC65',
  takeout: '#E8C878',
};

const GOOD_GREEN = '#2F9E6E';
const BAD_RED = '#EA6668';

function percentChange(first: number, second: number): number | null {
  if (first <= 0) return null;
  return ((second - first) / first) * 100;
}

function formatMoodScore15(score02: number): number {
  return 1 + (score02 / 2) * 4;
}

function isBetter(dim: DimensionRow): boolean | null {
  const { firstHalf, secondHalf, higherIsBetter } = dim;
  if (firstHalf <= 0 && secondHalf <= 0) return null;
  if (firstHalf <= 0) return true; // 新增，视为改善
  if (secondHalf > firstHalf) return higherIsBetter;
  if (secondHalf < firstHalf) return !higherIsBetter;
  return null; // equal
}

const HalfYearCompare: React.FC<HalfYearCompareProps> = (props) => {
  const rows: DimensionRow[] = [
    {
      key: 'sleep',
      label: '睡眠',
      color: DIMENSION_COLORS.sleep,
      firstHalf: props.sleepFirstHalf,
      secondHalf: props.sleepSecondHalf,
      higherIsBetter: true,
      formatDiff: (first: number, second: number) => {
        if (first <= 0 && second <= 0) return '—';
        if (first <= 0) return '新增';
        const diff = second - first;
        const sign = diff > 0 ? '+' : '';
        return `${sign}${diff.toFixed(1)}h`;
      },
    },
    {
      key: 'mood',
      label: '情绪',
      color: DIMENSION_COLORS.mood,
      firstHalf: props.moodFirstHalf,
      secondHalf: props.moodSecondHalf,
      higherIsBetter: true,
      formatDiff: (first: number, second: number) => {
        if (first <= 0 && second <= 0) return '—';
        if (first <= 0) return '新增';
        const diff = formatMoodScore15(second) - formatMoodScore15(first);
        const sign = diff > 0 ? '+' : '';
        return `${sign}${diff.toFixed(1)}分`;
      },
    },
    {
      key: 'exercise',
      label: '运动',
      color: DIMENSION_COLORS.exercise,
      firstHalf: props.exerciseFirstHalf,
      secondHalf: props.exerciseSecondHalf,
      higherIsBetter: true,
      formatDiff: (first: number, second: number) => {
        if (first <= 0 && second <= 0) return '—';
        if (first <= 0) return '新增';
        const pct = percentChange(first, second);
        if (pct === null) return '—';
        const rounded = Math.ceil(Math.abs(pct));
        const sign = pct > 0 ? '+' : pct < 0 ? '-' : '';
        return `${sign}${rounded}%`;
      },
    },
    {
      key: 'takeout',
      label: '外卖',
      color: DIMENSION_COLORS.takeout,
      firstHalf: props.takeoutFirstHalf,
      secondHalf: props.takeoutSecondHalf,
      higherIsBetter: false,
      formatDiff: (first: number, second: number) => {
        if (first <= 0 && second <= 0) return '—';
        if (first <= 0) return '新增';
        const pct = percentChange(first, second);
        if (pct === null) return '—';
        const rounded = Math.ceil(Math.abs(pct));
        // 外卖减少为好（负数 pct = 减少），用绿色；增加用红色
        const sign = pct > 0 ? '+' : pct < 0 ? '-' : '';
        return `${sign}${rounded}%`;
      },
    },
  ];

  return (
    <div className="p-4 rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.66)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(39, 71, 55, 0.04)' }}>
      <div className="mb-4">
        <h3 className="text-lg font-sans-hei font-semibold text-foreground">上下半年对比</h3>
        <p className="text-sm text-muted-foreground mt-1">
          下半年 vs 上半年 · 进步还是退步？
        </p>
      </div>

      <div className="space-y-3 w-[285px] md:w-full">
        {rows.map((row: DimensionRow) => {
          const maxVal = Math.max(row.firstHalf, row.secondHalf);
          const hasData = row.firstHalf > 0 || row.secondHalf > 0;
          const firstWidth = maxVal > 0 ? (row.firstHalf / maxVal) * 100 : 0;
          const secondWidth = maxVal > 0 ? (row.secondHalf / maxVal) * 100 : 0;
          const better = isBetter(row);
          const diffText = row.formatDiff(row.firstHalf, row.secondHalf);
          const diffColor = better === null
            ? 'text-muted-foreground'
            : better
              ? ''
              : '';

          return (
            <div key={row.key} className="flex items-center gap-2">
              {/* Dimension name */}
              <div className="text-sm font-medium text-foreground w-16 flex-shrink-0 md:px-3">
                {row.label}
              </div>

              {/* Bars */}
              <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                {/* First half (light) */}
                <div className="h-4 w-full bg-muted/40 rounded-full overflow-hidden">
                  {hasData ? (
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${firstWidth}%`,
                        backgroundColor: row.color,
                        opacity: 0.3,
                      }}
                    />
                  ) : (
                    <div className="h-full w-full bg-muted/40 rounded-full" />
                  )}
                </div>
                {/* Second half (solid) */}
                <div className="h-4 w-full bg-muted/40 rounded-full overflow-hidden">
                  {hasData ? (
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${secondWidth}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  ) : (
                    <div className="h-full w-full bg-muted/40 rounded-full" />
                  )}
                </div>
              </div>

              {/* Diff label */}
              <div
                className="text-sm font-medium tabular-nums w-14 text-right flex-shrink-0 md:px-3"
                style={{
                  color: better === null
                    ? undefined
                    : better
                      ? GOOD_GREEN
                      : BAD_RED,
                }}
              >
                {diffText}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-muted/60" />
          <span className="text-xs text-muted-foreground">上半年</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">下半年</span>
        </div>
      </div>
    </div>
  );
};

export default HalfYearCompare;
