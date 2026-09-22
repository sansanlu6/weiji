import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Utensils,
  Moon,
  Droplets,
  Dumbbell,
  HeartPulse,
  Pill,
  Smile,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getHalfYearDetailStats } from '@client/src/api/stats';
import type { HalfYearMonthlyStats } from '@shared/api.interface';
import HalfYearSleepChart from '../charts/HalfYearSleepChart';
import HalfYearMoodChart from '../charts/HalfYearMoodChart';
import HalfYearDietChart from '../charts/HalfYearDietChart';
import HalfYearMedicationChart from '../charts/HalfYearMedicationChart';
import { Image } from '@client/src/components/ui/image';
import osmanthusTreeBg from '@client/src/assets/osmanthus-tree-bg.png';
import watercolorDecor from '@client/src/assets/watercolor-week-switch.png';
import HalfYearPoopChart from '../charts/HalfYearPoopChart';
import HalfYearExerciseChart from '../charts/HalfYearExerciseChart';
import HalfYearPainChart from '../charts/HalfYearPainChart';
import HalfYearWaterChart from '../charts/HalfYearWaterChart';
import ViewSkeleton from '../components/ViewSkeleton';
import ViewEmpty from '../components/ViewEmpty';

const HalfYearView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HalfYearMonthlyStats | null>(null);
  const [halfOffset, setHalfOffset] = useState(0);

  const currentEndMonth = useMemo(() => dayjs().startOf('month'), []);
  const endMonth = useMemo(
    () => currentEndMonth.add(halfOffset * 6, 'month'),
    [currentEndMonth, halfOffset],
  );
  const startMonth = useMemo(
    () => endMonth.add(-5, 'month'),
    [endMonth],
  );
  const isCurrentHalf = halfOffset === 0;

  const titleRange = useMemo(() => {
    const sameYear = startMonth.year() === endMonth.year();
    return sameYear
      ? `${startMonth.year()}年${startMonth.month() + 1}月-${endMonth.month() + 1}月`
      : `${startMonth.year()}年${startMonth.month() + 1}月-${endMonth.year()}年${endMonth.month() + 1}月`;
  }, [startMonth, endMonth]);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        const endParam = endMonth.format('YYYY-MM');
        const res = await getHalfYearDetailStats(endParam);
        setData(res);
      } catch (err) {
        logger.error('[stats-halfyear] fetch failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [endMonth]);

  if (loading) return <ViewSkeleton rows={6} />;

  const hasAnyData = data
    ? [
        ...data.sleep.avgHours,
        ...data.mood.score,
        ...data.diet.takeoutCount,
        ...data.exercise.sessionCount,
        ...data.pain.episodeDays,
        ...data.water.totalCups,
        data.medication.totalDoses,
        ...data.poop.totalCount,
      ].some((v) => v > 0)
    : false;

  // 结论标签生成
  const months = data?.months ?? (() => {
    const labels: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      labels.push(`${startMonth.add(i, 'month').month() + 1}月`);
    }
    return labels;
  })();
  const sleepConclusion = data
    ? (() => {
        const { bestMonthIdx, bestHours, targetHours } = data.sleep;
        if (bestHours === 0) return '半年睡眠记录较少';
        const bestMonth = months[bestMonthIdx];
        if (bestHours >= targetHours) {
          return `${bestMonth}睡眠最佳，平均${bestHours}h`;
        }
        return `睡眠最好在${bestMonth}，平均${bestHours}h`;
      })()
    : '';

  const moodConclusion = data
    ? (() => {
        const { peakMonthIdx, valleyMonthIdx, peakScore, valleyScore, score } = data.mood;
        const hasData = score.some((s: number) => s > 0);
        if (!hasData) return '半年情绪记录较少';
        if (peakScore - valleyScore < 0.3) {
          return `${months[peakMonthIdx]}情绪最稳定`;
        }
        return `${months[peakMonthIdx]}心情最好，${months[valleyMonthIdx]}偏低`;
      })()
    : '';

  const dietConclusion = data
    ? (() => {
        const { peakMonthIdx, peakCount, takeoutTrend } = data.diet;
        if (peakCount === 0) return '半年没有外卖记录';
        const trend = takeoutTrend[takeoutTrend.length - 1] - takeoutTrend[0];
        const trendText = trend > 0 ? '占比上升' : trend < 0 ? '占比下降' : '占比平稳';
        return `外卖高峰在${months[peakMonthIdx]}，${trendText}`;
      })()
    : '';

  const medicationConclusion = data
    ? (() => {
        const { medicines, totalDoses } = data.medication;
        if (totalDoses === 0) return '半年无用药记录';
        const top = medicines[0];
        return `共${totalDoses}次用药，${top?.name ?? ''}最多`;
      })()
    : '';

  const poopConclusion = data
    ? (() => {
        const { maxMonthIdx, maxCount, abnormalCount, totalCount } = data.poop;
        if (maxCount === 0) return '半年排便记录较少';
        const maxAbnormal = abnormalCount[maxMonthIdx];
        const maxTotal = totalCount[maxMonthIdx];
        if (maxAbnormal > 0) {
          return `${months[maxMonthIdx]}排便最多，异常${maxAbnormal}次`;
        }
        return `${months[maxMonthIdx]}排便${maxTotal}次，全部正常`;
      })()
    : '';

  const exerciseConclusion = data
    ? (() => {
        const { peakMonthIdx, peakCount, totalMinutes } = data.exercise;
        const totalMin = totalMinutes.reduce((s: number, n: number) => s + n, 0);
        if (peakCount === 0) return '半年运动记录较少';
        return `${months[peakMonthIdx]}运动最多，累计${totalMin}分钟`;
      })()
    : '';

  const painConclusion = data
    ? (() => {
        const { peakMonthIdx, peakDays, topSymptoms } = data.pain;
        if (peakDays === 0) return '半年无疼痛记录';
        const top = topSymptoms[0];
        return `高峰期${months[peakMonthIdx]}，${top?.symptom ?? ''}最多`;
      })()
    : '';

  const waterConclusion = data
    ? (() => {
        const { totalCups, targetCups } = data.water;
        const hasData = totalCups.some((c: number) => c > 0);
        if (!hasData) return '半年喝水记录较少';
        let bestIdx = 0;
        let bestVal = totalCups[0];
        for (let i = 1; i < totalCups.length; i += 1) {
          if (totalCups[i] > bestVal) {
            bestVal = totalCups[i];
            bestIdx = i;
          }
        }
        const status = bestVal >= targetCups * 30 ? '已达标' : '继续加油';
        return `${months[bestIdx]}喝水最多（${bestVal}杯）`;
      })()
    : '';

  return (
    <div className="space-y-5">
      <div className="paper-card relative overflow-hidden p-4 flex flex-col items-center gap-3" style={{ background: 'rgba(255, 255, 255, 0.75)' }}>
        <Image
          src={osmanthusTreeBg}
          alt=""
          className="absolute right-[-10%] top-1/2 -translate-y-1/2 h-[160%] w-auto opacity-80 pointer-events-none z-0 object-contain md:hidden"
        />
        <Image
          src={watercolorDecor}
          alt=""
          className="absolute right-0 top-0 w-3/4 h-auto opacity-60 pointer-events-none z-0 object-contain translate-x-[20%] -translate-y-[25%]"
        />
        <div className="w-full flex items-center justify-between relative z-10">
          <button
            onClick={() => setHalfOffset((v) => v - 1)}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary-light transition-colors shrink-0"
            aria-label="上一个半年"
          >
            <ChevronLeft className="w-5 h-5 text-foreground/70" strokeWidth={2} />
          </button>

          <div className="text-center min-w-0 flex-1 px-3">
            <div className="text-lg font-sans-hei font-medium text-foreground whitespace-nowrap">
              {titleRange}
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              健康时间线
            </div>
          </div>

          <button
            onClick={() => setHalfOffset((v) => v + 1)}
            disabled={isCurrentHalf}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              isCurrentHalf
                ? 'bg-muted cursor-not-allowed opacity-50'
                : 'bg-secondary hover:bg-primary-light'
            }`}
            aria-label="下一个半年"
          >
            <ChevronRight className={`w-5 h-5 ${
              isCurrentHalf ? 'text-muted-foreground' : 'text-foreground/70'
            }`} strokeWidth={2} />
          </button>
        </div>

        {!isCurrentHalf && (
          <button
            onClick={() => setHalfOffset(0)}
            className="text-xs font-medium px-4 py-1.5 rounded-full transition-all text-primary bg-primary-light/60 hover:bg-primary-light hover:-translate-y-0.5 border border-primary/10 relative z-10"
          >
            回到当前
          </button>
        )}
      </div>

      {!data ? (
        <ViewEmpty text="该时段暂无记录" />
      ) : !hasAnyData ? (
        <ViewEmpty text="近半年还没有记录哦" />
      ) : (
        <div className="flex flex-col gap-4">
        {/* 睡眠 */}
        <div className="paper-card p-4 flex flex-col gap-3 w-full h-[294px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-module-sleep-bg flex items-center justify-center">
                <Moon className="w-4 h-4 text-module-sleep" strokeWidth={2} />
              </div>
              <div className="text-base font-semibold font-sans-hei">睡眠统计</div>
            </div>
            <div className="text-sm bg-module-sleep-bg text-foreground/70 px-3 py-1 rounded-full">
              {sleepConclusion}
            </div>
          </div>
          <div className="h-[210px]">
            <HalfYearSleepChart
              months={data.months}
              good={data.sleep.good}
              medium={data.sleep.medium}
              poor={data.sleep.poor}
              avgHours={data.sleep.avgHours}
              targetHours={data.sleep.targetHours}
            />
          </div>
        </div>

        {/* 情绪 */}
        <div className="paper-card p-4 flex flex-col gap-3 w-full h-[294px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-module-mood-bg flex items-center justify-center">
                <Smile className="w-4 h-4 text-module-mood" strokeWidth={2} />
              </div>
              <div className="text-base font-semibold font-sans-hei">情绪统计</div>
            </div>
            <div className="text-sm bg-module-mood-bg text-foreground/70 px-3 py-1 rounded-full">
              {moodConclusion}
            </div>
          </div>
          <div className="h-[210px] m-0">
            <HalfYearMoodChart
              months={data.months}
              score={data.mood.score}
              positiveRate={data.mood.positiveRate}
            />
          </div>
        </div>

        {/* 饮食 */}
        <div className="paper-card p-4 flex flex-col gap-3 w-full h-[294px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-module-diet-bg flex items-center justify-center">
                <Utensils className="w-4 h-4 text-module-diet" strokeWidth={2} />
              </div>
              <div className="text-base font-semibold font-sans-hei">饮食统计</div>
            </div>
            <div className="text-sm bg-module-diet-bg text-foreground/70 px-3 py-1 rounded-full">
              {dietConclusion}
            </div>
          </div>
          <div className="h-[210px] w-full m-[4px_0]">
            <HalfYearDietChart
              months={data.months}
              takeoutCount={data.diet.takeoutCount}
              takeoutTrend={data.diet.takeoutTrend}
            />
          </div>
        </div>

        {/* 运动 */}
        <div className="paper-card p-4 flex flex-col gap-3 w-full h-[294px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-module-exercise-bg flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-module-exercise" strokeWidth={2} />
              </div>
              <div className="text-base font-semibold font-sans-hei">运动统计</div>
            </div>
            <div className="text-sm bg-module-exercise-bg text-foreground/70 px-3 py-1 rounded-full w-[180px]">
              {exerciseConclusion}
            </div>
          </div>
          <div className="h-[210px]">
            <HalfYearExerciseChart
              months={data.months}
              sessionCount={data.exercise.sessionCount}
            />
          </div>
        </div>

        {/* 病痛 */}
        <div className="paper-card p-4 flex flex-col gap-3 w-full h-[294px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-module-pain-bg flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-module-pain" strokeWidth={2} />
              </div>
              <div className="text-base font-semibold font-sans-hei">病痛统计</div>
            </div>
            <div className="text-sm bg-module-pain-bg text-foreground/70 px-3 py-1 rounded-full w-[180px] h-[28px]">
              {painConclusion}
            </div>
          </div>
          <div className="h-[210px]">
            <HalfYearPainChart
              months={data.months}
              episodeDays={data.pain.episodeDays}
              severeDays={data.pain.severeDays}
              peakIdx={data.pain.peakMonthIdx}
            />
          </div>
        </div>

        {/* 喝水 */}
        <div className="paper-card p-4 flex flex-col gap-3 w-full h-[294px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-module-water-bg flex items-center justify-center">
                <Droplets className="w-4 h-4 text-module-water" strokeWidth={2} />
              </div>
              <div className="text-base font-semibold font-sans-hei">喝水统计</div>
              <div className="text-sm bg-module-water-bg text-foreground/70 px-3 py-1 rounded-full w-[160px] h-[28px]">
                {waterConclusion}
              </div>
            </div>
          </div>
          <div className="h-[210px]">
            <HalfYearWaterChart
              months={data.months}
              totalCups={data.water.totalCups}
              targetCups={data.water.targetCups * 30}
              bestIdx={data.water.bestMonthIdx}
            />
          </div>
        </div>

        {/* 用药 */}
        <div className="paper-card p-4 flex flex-col gap-3 w-full h-[294px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-module-medication-bg flex items-center justify-center">
                <Pill className="w-4 h-4 text-module-medication" strokeWidth={2} />
              </div>
              <div className="text-base font-semibold font-sans-hei">用药统计</div>
            </div>
            <div className="text-sm bg-module-medication-bg text-foreground/70 px-3 py-1 rounded-full w-[180px]">
              {medicationConclusion}
            </div>
          </div>
          <div className="h-[210px]">
            <HalfYearMedicationChart medicines={data.medication.medicines} />
          </div>
        </div>

        {/* 排便 */}
        <div className="paper-card p-4 flex flex-col gap-3 w-full h-[294px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-module-poop-bg flex items-center justify-center">
                <Activity className="w-4 h-4 text-module-poop" strokeWidth={2} />
              </div>
              <div className="text-base font-semibold font-sans-hei">排便统计</div>
            </div>
            <div className="text-sm bg-module-poop-bg text-foreground/70 px-3 py-1 rounded-full">
              {poopConclusion}
            </div>
          </div>
          <div className="h-[210px] my-1">
            <HalfYearPoopChart
              months={data.months}
              totalCount={data.poop.totalCount}
              abnormalCount={data.poop.abnormalCount}
            />
          </div>
         </div>
        </div>
      )}
    </div>
  );
};

export default HalfYearView;
