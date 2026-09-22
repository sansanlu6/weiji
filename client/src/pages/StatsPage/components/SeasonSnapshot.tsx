import React from 'react';

export interface SeasonSnapshotProps {
  monthlySleepHours: number[];
  monthlyMoodScore: number[];
  monthlyPainCount: number[];
  monthlyTakeoutCount: number[];
}

type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';
type DimensionKey = 'sleep' | 'mood' | 'pain' | 'takeout';

interface SeasonMeta {
  key: SeasonKey;
  label: string;
  monthIndices: [number, number, number];
}

interface DimensionMeta {
  key: DimensionKey;
  label: string;
  unit: string;
  format: (value: number) => string;
  getColor: (value: number, hasData: boolean) => string;
  hasData: (value: number) => boolean;
}

const SEASONS: SeasonMeta[] = [
  { key: 'spring', label: '春', monthIndices: [2, 3, 4] },
  { key: 'summer', label: '夏', monthIndices: [5, 6, 7] },
  { key: 'autumn', label: '秋', monthIndices: [8, 9, 10] },
  { key: 'winter', label: '冬', monthIndices: [11, 0, 1] },
];

const GREEN = '#2F9E6E';
const YELLOW = '#F2D88C';
const RED = '#EA6668';

function average(arr: number[]): number {
  const valid = arr.filter((v: number) => typeof v === 'number' && !Number.isNaN(v));
  if (valid.length === 0) return 0;
  return valid.reduce((sum: number, v: number) => sum + v, 0) / valid.length;
}

function sum(arr: number[]): number {
  return arr.reduce((s: number, v: number) => s + (typeof v === 'number' && !Number.isNaN(v) ? v : 0), 0);
}

const DIMENSIONS: DimensionMeta[] = [
  {
    key: 'sleep',
    label: '睡眠',
    unit: 'h',
    format: (v: number) => `${v.toFixed(1)}h`,
    hasData: (v: number) => v > 0,
    getColor: (v: number, hasDataFlag: boolean) => {
      if (!hasDataFlag) return '';
      if (v >= 7.2) return GREEN;
      if (v >= 6.8) return YELLOW;
      return RED;
    },
  },
  {
    key: 'mood',
    label: '情绪',
    unit: '分',
    format: (v: number) => `${v.toFixed(1)}分`,
    hasData: (v: number) => v > 0,
    getColor: (score02: number, hasDataFlag: boolean) => {
      if (!hasDataFlag) return '';
      const score15 = 1 + (score02 / 2) * 4;
      if (score15 >= 3.8) return GREEN;
      if (score15 >= 3.2) return YELLOW;
      return RED;
    },
  },
  {
    key: 'pain',
    label: '疼痛',
    unit: '次',
    format: (v: number) => `${Math.round(v)}次`,
    hasData: (v: number) => v > 0,
    getColor: (v: number, hasDataFlag: boolean) => {
      if (!hasDataFlag) return '';
      if (v <= 5) return GREEN;
      if (v <= 10) return YELLOW;
      return RED;
    },
  },
  {
    key: 'takeout',
    label: '外卖',
    unit: '次',
    format: (v: number) => `${Math.round(v)}次`,
    hasData: (v: number) => v > 0,
    getColor: (v: number, hasDataFlag: boolean) => {
      if (!hasDataFlag) return '';
      if (v <= 15) return GREEN;
      if (v <= 30) return YELLOW;
      return RED;
    },
  },
];

function computeSeasonValues(props: SeasonSnapshotProps): Record<SeasonKey, Record<DimensionKey, number>> {
  const result = {} as Record<SeasonKey, Record<DimensionKey, number>>;
  for (const season of SEASONS) {
    result[season.key] = {} as Record<DimensionKey, number>;
    const { monthIndices } = season;
    result[season.key].sleep = average(monthIndices.map((i: number) => props.monthlySleepHours[i] ?? 0));
    result[season.key].mood = average(monthIndices.map((i: number) => props.monthlyMoodScore[i] ?? 0));
    result[season.key].pain = sum(monthIndices.map((i: number) => props.monthlyPainCount[i] ?? 0));
    result[season.key].takeout = sum(monthIndices.map((i: number) => props.monthlyTakeoutCount[i] ?? 0));
  }
  return result;
}

function buildConclusion(values: Record<SeasonKey, Record<DimensionKey, number>>): string | null {
  // For each dimension, find the worst season.
  // Higher is worse: pain, takeout
  // Lower is worse: sleep, mood
  const worstByDimension: Partial<Record<DimensionKey, SeasonKey>> = {};

  const dimensionsDesc: { key: DimensionKey; higherWorse: boolean }[] = [
    { key: 'sleep', higherWorse: false },
    { key: 'mood', higherWorse: false },
    { key: 'pain', higherWorse: true },
    { key: 'takeout', higherWorse: true },
  ];

  for (const dim of dimensionsDesc) {
    let worstSeason: SeasonKey | null = null;
    let worstValue = dim.higherWorse ? -Infinity : Infinity;
    let hasAnyData = false;
    for (const season of SEASONS) {
      const v = values[season.key][dim.key];
      const dimMeta = DIMENSIONS.find((d: DimensionMeta) => d.key === dim.key)!;
      if (!dimMeta.hasData(v)) continue;
      hasAnyData = true;
      if (dim.higherWorse) {
        if (v > worstValue) {
          worstValue = v;
          worstSeason = season.key;
        }
      } else {
        if (v < worstValue) {
          worstValue = v;
          worstSeason = season.key;
        }
      }
    }
    if (hasAnyData && worstSeason) {
      worstByDimension[dim.key] = worstSeason;
    }
  }

  const entries = Object.entries(worstByDimension) as [DimensionKey, SeasonKey][];
  if (entries.length === 0) return null;

  const seasonLabel = (key: SeasonKey): string => {
    const s = SEASONS.find((x: SeasonMeta) => x.key === key);
    return s ? s.label : '';
  };
  const dimLabel = (key: DimensionKey): string => {
    const d = DIMENSIONS.find((x: DimensionMeta) => x.key === key);
    return d ? d.label : '';
  };

  return entries.map(([dim, season]: [DimensionKey, SeasonKey]) => {
    const suffix = dim === 'pain' ? '最多' : '最差';
    return `${seasonLabel(season)}季${dimLabel(dim)}${suffix}`;
  }).join(' · ');
}

const SeasonSnapshot: React.FC<SeasonSnapshotProps> = (props) => {
  const values = computeSeasonValues(props);
  const conclusion = buildConclusion(values);

  return (
    <div className="p-4 rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.66)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(39, 71, 55, 0.04)' }}>
      <div className="mb-4">
        <h3 className="text-lg font-sans-hei font-semibold text-foreground">四季快照</h3>
        <p className="text-sm text-muted-foreground mt-1">春夏秋冬 · 四个维度的季节性格局</p>
      </div>

      {/* Matrix */}
      <div className="space-y-1 mx-auto max-w-[280px] md:max-w-md">
        {/* Header row */}
        <div className="grid grid-cols-5 md:grid-cols-[auto_repeat(4,minmax(0,1fr))] gap-1 md:gap-2">
          <div className="text-right" />
          {DIMENSIONS.map((dim: DimensionMeta) => (
            <div
              key={dim.key}
              className="text-sm text-muted-foreground text-center font-medium h-8 flex items-center justify-center"
            >
              {dim.label}
            </div>
          ))}
        </div>

        {SEASONS.map((season: SeasonMeta) => (
          <div key={season.key} className="grid grid-cols-5 md:grid-cols-[auto_repeat(4,minmax(0,1fr))] gap-1 md:gap-2">
            <div className="text-sm text-muted-foreground text-right pr-1 md:px-2 flex items-center justify-end md:w-12 md:shrink-0">
              {season.label}
            </div>
            {DIMENSIONS.map((dim: DimensionMeta) => {
              const value = values[season.key][dim.key];
              const hasData = dim.hasData(value);
              const color = dim.getColor(value, hasData);
              return (
                <div
                  key={dim.key}
                  className="rounded-lg h-9 flex items-center justify-center text-sm font-medium tabular-nums"
                  style={{
                    backgroundColor: hasData ? color : undefined,
                    color: hasData ? '#ffffff' : undefined,
                  }}
                  aria-label={`${season.label}季${dim.label}`}
                >
                  {hasData ? (
                    <span style={{ color: '#ffffff' }}>{dim.format(value)}</span>
                  ) : (
                    <span className="text-muted-foreground/50 bg-muted/30 w-full h-full flex items-center justify-center rounded-lg">
                      —
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-4">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: GREEN }}
          />
          <span className="text-xs text-muted-foreground">好</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: YELLOW }}
          />
          <span className="text-xs text-muted-foreground">一般</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: RED }}
          />
          <span className="text-xs text-muted-foreground">需注意</span>
        </div>
      </div>

      {/* Conclusion */}
      {conclusion && (
        <p className="text-center text-sm text-foreground/80 mt-3 font-medium">
          {conclusion}
        </p>
      )}
    </div>
  );
};

export default SeasonSnapshot;
