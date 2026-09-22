import { useState, useEffect, useMemo } from 'react';
import { Image } from '@client/src/components/ui/image';
import watercolorDecoImg from '@client/src/assets/watercolor-decoration.png';
import osmanthusYearHero from '@client/src/assets/osmanthus-year-hero-v2.png';
import watercolorDecor from '@client/src/assets/watercolor-week-switch.png';
import sleepBg from '@client/src/assets/watercolor-sleep.png';
import exerciseBg from '@client/src/assets/watercolor-exercise.png';
import waterBg from '@client/src/assets/watercolor-water.png';
import moodBg from '@client/src/assets/watercolor-mood.png';
import dietBg from '@client/src/assets/watercolor-diet.png';
import mealBg from '@client/src/assets/watercolor-meal.png';
import dayjs from 'dayjs';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getYearDetailStats } from '@client/src/api/stats';
import type { YearlyDetailStats } from '@shared/api.interface';

import ViewSkeleton from '../components/ViewSkeleton';
import ViewEmpty from '../components/ViewEmpty';
import YearBestOfChart from '../components/YearBestOfChart';
import YearColorCards from '../components/YearColorCards';
import YearKeywordCloud from '../components/YearKeywordCloud';
import SeasonSnapshot from '../components/SeasonSnapshot';
import HalfYearCompare from '../components/HalfYearCompare';


interface StatCardProps {
  imageSrc: string;
  value: string;
  unit: string;
  label: string;
  sub: string;
  valueColor: string;
  unitColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ imageSrc, value, unit, label, sub, valueColor, unitColor }) => {
  return (
    <div
      className="relative font-sans-hei"
      style={{
        width: '166px',
        height: '96px',
        overflow: 'hidden',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 2px 8px rgba(42, 72, 58, 0.06)',
      }}
    >
      <Image
        src={watercolorDecoImg}
        alt=""
        style={{
          position: 'absolute',
          top: '-8px',
          right: '-18px',
          width: '120px',
          height: 'auto',
          zIndex: 1,
          opacity: 0.65,
          pointerEvents: 'none',
          userSelect: 'none',
          transform: 'rotate(6deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '14px',
          right: '55px',
          top: 0,
          bottom: 0,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div className="text-xl font-semibold tabular-nums leading-tight" style={{ color: valueColor }}>
          {value}
          {unit && <span className="text-xs font-normal ml-0.5" style={{ color: unitColor }}>{unit}</span>}
        </div>
        <div className="text-base mt-1 leading-tight" style={{ color: '#4B6458' }}>
          {label}
        </div>
        {sub && (
          <div className="text-xs mt-0.5 leading-tight" style={{ color: 'rgba(75, 100, 88, 0.7)' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
};

const YearView: React.FC = () => {
  const [yearOffset, setYearOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [yearStats, setYearStats] = useState<YearlyDetailStats | null>(null);


  const { startDate, endDate, year } = useMemo(() => {
    const y = dayjs().add(yearOffset, 'year').year();
    const start = dayjs(`${y}-01-01`).startOf('day');
    const end = dayjs(`${y}-12-31`).endOf('day');
    return { startDate: start, endDate: end, year: y };
  }, [yearOffset]);

  const keyMetrics = useMemo(() => {
    if (!yearStats) {
      return {
        totalRecords: 0, recordDays: 0, dimensionCount: 0,
        avgSleepH: 0, bestSleepMonth: '', bestSleepHours: 0,
        totalExercise: 0, bestExerciseMonth: '', bestExerciseCount: 0,
        avgWaterMl: 0, avgWaterCups: 0,
        topMood: '—', topMoodCount: 0,
      };
    }
    const { months } = yearStats;

    const avgSleepH = yearStats.sleep.bestHours > 0
      ? Number((yearStats.sleep.avgHours.reduce((s, v) => s + v, 0) / Math.max(months.filter((_, i) => yearStats.sleep.avgHours[i] > 0).length, 1)).toFixed(1))
      : 0;
    const bestSleepMonth = months[yearStats.sleep.bestMonthIdx] ?? '';
    const bestSleepHours = Number(yearStats.sleep.bestHours.toFixed(1));

    const totalExercise = yearStats.exercise.sessionCount.reduce((s, v) => s + v, 0);
    const bestExerciseMonth = months[yearStats.exercise.peakMonthIdx] ?? '';
    const bestExerciseCount = yearStats.exercise.peakCount;

    const waterDays = yearStats.water.avgMl.filter((v) => v > 0).length;
    const totalWaterMl = yearStats.water.yearTotalMl;
    const avgWaterMl = waterDays > 0 ? Math.round(totalWaterMl / waterDays) : 0;
    const avgWaterCups = Number((avgWaterMl / 250).toFixed(1));

    const topMood = yearStats.mood.topMood || '—';
    const topMoodCount = yearStats.mood.topMoodCount;

    const totalMeals = yearStats.diet.yearTotalMeals || 0;
    const totalTakeout = yearStats.diet.yearTakeoutCount || 0;
    const takeoutRate = totalMeals > 0 ? Math.round((totalTakeout / totalMeals) * 100) : 0;
    const mostCommonMealType = yearStats.diet.mostCommonMealType || '—';
    const mostCommonMealTypeCount = yearStats.diet.mostCommonMealTypeCount || 0;

    return {
      totalRecords: yearStats.totalRecords,
      recordDays: yearStats.recordDays,
      dimensionCount: yearStats.dimensionCount,
      avgSleepH, bestSleepMonth, bestSleepHours,
      totalExercise, bestExerciseMonth, bestExerciseCount,
      avgWaterMl, avgWaterCups,
      topMood, topMoodCount,
      totalMeals, totalTakeout, takeoutRate,
      mostCommonMealType, mostCommonMealTypeCount,
    };
  }, [yearStats]);

  const halfYearCompareData = useMemo(() => {
    if (!yearStats) {
      return {
        sleepFirst: 0, sleepSecond: 0,
        moodFirst: 0, moodSecond: 0,
        exerciseFirst: 0, exerciseSecond: 0,
        takeoutFirst: 0, takeoutSecond: 0,
      };
    }
    const avg = (arr: number[], start: number, end: number): number => {
      const slice = arr.slice(start, end);
      const valid = slice.filter((v) => v > 0);
      return valid.length > 0 ? valid.reduce((s, v) => s + v, 0) / valid.length : 0;
    };
    const avgPerMonth = (arr: number[], start: number, end: number): number => {
      const slice = arr.slice(start, end);
      return slice.reduce((s, v) => s + v, 0) / 6;
    };
    return {
      sleepFirst: avg(yearStats.sleep.avgHours, 0, 6),
      sleepSecond: avg(yearStats.sleep.avgHours, 6, 12),
      moodFirst: avg(yearStats.mood.score, 0, 6),
      moodSecond: avg(yearStats.mood.score, 6, 12),
      exerciseFirst: avgPerMonth(yearStats.exercise.sessionCount, 0, 6),
      exerciseSecond: avgPerMonth(yearStats.exercise.sessionCount, 6, 12),
      takeoutFirst: avgPerMonth(yearStats.diet.takeoutCount, 0, 6),
      takeoutSecond: avgPerMonth(yearStats.diet.takeoutCount, 6, 12),
    };
  }, [yearStats]);

  const hasAnyData = keyMetrics.totalRecords > 0;

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        const start = startDate.format('YYYY-MM-DD');
        const end = endDate.format('YYYY-MM-DD');

        const results = await Promise.allSettled([
          getYearDetailStats(year),
        ]);

        const [yearRes] = results;
        if (yearRes.status === 'fulfilled') setYearStats(yearRes.value);
      } catch (err) {
        logger.error('[stats-year] fetch failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year, startDate, endDate]);

  if (loading) return <ViewSkeleton rows={5} />;

  const fmt = (n: number): string => n.toLocaleString('zh-CN');

  return (
    <div className="space-y-5">
      {/* 顶部标题栏 */}
      <div className="paper-card relative overflow-hidden p-4 flex flex-col items-center gap-2" style={{ background: 'rgba(255, 255, 255, 0.75)' }}>
         <Image
           src={watercolorDecor}
           alt=""
           className="absolute right-0 top-0 w-3/4 h-auto opacity-60 pointer-events-none z-0 object-contain translate-x-[20%] -translate-y-[25%]"
         />
         <div className="w-full flex items-center justify-between gap-2 relative z-10">
           <div className="flex items-center gap-2">
             <button
               onClick={() => setYearOffset((v) => v - 1)}
               className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary-light transition-colors"
               aria-label="上一年"
             >
               <ChevronLeft className="w-5 h-5 text-foreground/70" strokeWidth={2} />
             </button>
           </div>
           <h1 className="font-sans-hei text-lg font-medium text-center flex-1 min-w-0">
             {year}年度画像
           </h1>
           <div className="flex items-center gap-2">
             {yearOffset !== 0 && (
               <button
                 onClick={() => setYearOffset(0)}
                  className="text-xs font-medium px-4 py-1.5 rounded-full transition-all text-primary bg-primary-light/60 hover:bg-primary-light hover:-translate-y-0.5 border border-primary/10 relative z-10"
                >
                  回到今年
               </button>
             )}
             <button
               onClick={() => setYearOffset((v) => v + 1)}
               disabled={yearOffset >= 0}
               className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                 yearOffset >= 0
                   ? 'bg-muted/30 text-foreground/30 cursor-not-allowed'
                   : 'bg-secondary hover:bg-primary-light text-foreground/70'
               }`}
               aria-label="下一年"
             >
               <ChevronRight className="w-5 h-5" strokeWidth={2} />
             </button>
           </div>
         </div>
      </div>

      {/* 无数据空态 */}
      {!hasAnyData && (
        <ViewEmpty text={yearOffset === 0 ? '今年还没有记录哦' : '当前年度无记录'} />
      )}

      {/* 有数据时的内容 */}
      {hasAnyData && (
        <>
      {/* 全年记录总览大卡片 */}
      <div className="relative overflow-hidden rounded-3xl p-6 shadow-sm" style={{ background: 'rgba(254, 248, 229, 0.38)' }}>
        <Image
          src={osmanthusYearHero}
          alt=""
          className="absolute right-0 top-0 h-full w-auto opacity-85 pointer-events-none z-0 object-contain md:hidden"
        />
        <div className="relative z-10">
          <div className="font-title text-3xl font-semibold tabular-nums" style={{ color: '#2a483a' }}>
            {fmt(keyMetrics.totalRecords)} 条内容
          </div>
          <div className="text-sm mt-2" style={{ color: '#637a6d' }}>
            记录 {keyMetrics.recordDays} 天 · 覆盖 {keyMetrics.dimensionCount} 个维度
          </div>
        </div>
      </div>

      {/* 关键指标 - 网格布局 */}
      <div
        className="grid grid-cols-2 md:grid-cols-3"
        style={{ rowGap: '10px', columnGap: '16px', justifyItems: 'center' }}
      >
        <StatCard
          imageSrc={sleepBg}
          value={String(keyMetrics.avgSleepH || '—')}
          unit="小时/晚"
          label="平均睡眠"
          sub={keyMetrics.bestSleepMonth ? `最佳${keyMetrics.bestSleepMonth}（${keyMetrics.bestSleepHours}h）` : ''}
          valueColor="#5A4A8C"
          unitColor="rgba(90, 74, 140, 0.7)"
        />
        <StatCard
          imageSrc={exerciseBg}
          value={fmt(keyMetrics.totalExercise)}
          unit="次"
          label="全年运动"
          sub={keyMetrics.bestExerciseMonth ? `最勤${keyMetrics.bestExerciseMonth}（${keyMetrics.bestExerciseCount}次）` : ''}
          valueColor="#3D7A5E"
          unitColor="rgba(61, 122, 94, 0.7)"
        />
        <StatCard
          imageSrc={waterBg}
          value={fmt(keyMetrics.avgWaterMl)}
          unit="ml"
          label="日均喝水"
          sub={`约 ${keyMetrics.avgWaterCups} 杯`}
          valueColor="#3A7290"
          unitColor="rgba(58, 114, 144, 0.7)"
        />
        <StatCard
          imageSrc={moodBg}
          value={keyMetrics.topMood}
          unit=""
          label="最常情绪"
          sub={`全年 ${keyMetrics.topMoodCount} 次`}
          valueColor="#9B7736"
          unitColor="rgba(155, 119, 54, 0.7)"
        />
        <StatCard
          imageSrc={dietBg}
          value={fmt(keyMetrics.totalMeals)}
          unit="餐"
          label="全年餐食"
          sub={`外卖 ${keyMetrics.totalTakeout} 次（${keyMetrics.takeoutRate}%）`}
          valueColor="#926538"
          unitColor="rgba(146, 101, 56, 0.7)"
        />
        <StatCard
          imageSrc={mealBg}
          value={keyMetrics.mostCommonMealType}
          unit=""
          label="最常餐食类型"
          sub={`全年 ${keyMetrics.mostCommonMealTypeCount} 次`}
          valueColor="#8F6238"
          unitColor="rgba(143, 98, 56, 0.7)"
        />
      </div>

      {/* 年度之最 */}
      {yearStats && (
        <YearBestOfChart
          months={yearStats.months}
          sleep={yearStats.sleep.avgHours}
          mood={yearStats.mood.score}
          exercise={yearStats.exercise.sessionCount}
          pain={yearStats.pain.episodeCount}
          takeout={yearStats.diet.takeoutCount}
        />
      )}

      {/* 年度健康色卡 */}
      {yearStats && (
        <YearColorCards
          topMood={yearStats.mood.topMood || '平静'}
          topMoodCount={yearStats.mood.topMoodCount}
          negativePeakMonth={yearStats.months[yearStats.mood.negativePeakMonthIdx] || ''}
          negativePeakCount={yearStats.mood.negativePeakCount}
          totalExercise={yearStats.exercise.sessionCount.reduce((s, v) => s + v, 0)}
        />
      )}

      {/* 年度健康关键词 */}
      {yearStats && yearStats.keywords.length > 0 && (
        <YearKeywordCloud keywords={yearStats.keywords} />
      )}

      {/* 四季健康快照 */}
      {yearStats && (
        <SeasonSnapshot
          monthlySleepHours={yearStats.sleep.avgHours}
          monthlyMoodScore={yearStats.mood.score}
          monthlyPainCount={yearStats.pain.episodeCount}
          monthlyTakeoutCount={yearStats.diet.takeoutCount}
        />
      )}

      {/* 上下半年对比 */}
      {yearStats && (
        <HalfYearCompare
          sleepFirstHalf={halfYearCompareData.sleepFirst}
          sleepSecondHalf={halfYearCompareData.sleepSecond}
          moodFirstHalf={halfYearCompareData.moodFirst}
          moodSecondHalf={halfYearCompareData.moodSecond}
          exerciseFirstHalf={halfYearCompareData.exerciseFirst}
          exerciseSecondHalf={halfYearCompareData.exerciseSecond}
          takeoutFirstHalf={halfYearCompareData.takeoutFirst}
          takeoutSecondHalf={halfYearCompareData.takeoutSecond}
        />
      )}

        </>
      )}

    </div>
  );
};

export default YearView;
