import { useState, useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { ChevronLeft, ChevronRight, Moon, Smile, Dumbbell, Droplet } from 'lucide-react';
import {
  getDietMealStats,
  getMonthlyDetailStats,
} from '@client/src/api/stats';
import type { DietMealStat } from '@client/src/api/stats';
import type { MonthlyDetailStats } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';
import mealMonthBg from '@client/src/assets/meal-month-bg.png';
import osmanthusTreeBg from '@client/src/assets/osmanthus-tree-bg.png';
import watercolorDecor from '@client/src/assets/watercolor-week-switch.png';
import { MEAL_COLORS, MAIN_MEALS } from '../components/meal-constants';
import ViewSkeleton from '../components/ViewSkeleton';
import ViewEmpty from '../components/ViewEmpty';
import SleepMonthModule from './month-modules/SleepMonthModule';
import MoodMonthModule from './month-modules/MoodMonthModule';
import PainMonthModule from './month-modules/PainMonthModule';
import DietMonthModule from './month-modules/DietMonthModule';
import ExerciseMonthModule from './month-modules/ExerciseMonthModule';
import WaterMonthModule from './month-modules/WaterMonthModule';
import MedicationMonthModule from './month-modules/MedicationMonthModule';
import PoopMonthModule from './month-modules/PoopMonthModule';

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

interface MonthCacheEntry {
  mealData: DietMealStat[];
  detailStats: MonthlyDetailStats;
}

const MonthView: React.FC = () => {
  const [monthOffset, setMonthOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mealData, setMealData] = useState<DietMealStat[]>([]);
  const [detailStats, setDetailStats] = useState<MonthlyDetailStats | null>(null);

  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, MonthCacheEntry>>(new Map());

  // 当月第一天
  const currentMonth = useMemo(
    () => dayjs().add(monthOffset, 'month').startOf('month'),
    [monthOffset],
  );

  // 月历网格（6行 x 7列，周一开头）
  const calendarCells = useMemo(() => {
    const firstDay = currentMonth;
    const firstWeekday = firstDay.day(); // 周日=0
    const mondayOffset = firstWeekday === 0 ? -6 : 1 - firstWeekday;
    const gridStart = firstDay.add(mondayOffset, 'day');
    const cells: { date: dayjs.Dayjs; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i += 1) {
      const d = gridStart.add(i, 'day');
      cells.push({
        date: d,
        inMonth: d.month() === firstDay.month(),
      });
    }
    return cells;
  }, [currentMonth]);

  const isCurrentMonth = monthOffset === 0;
  const daysInMonth = currentMonth.daysInMonth();

  // 餐次数据按日期索引
  const mealMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const item of mealData) {
      const set = map.get(item.date) ?? new Set<string>();
      set.add(item.mealType);
      map.set(item.date, set);
    }
    return map;
  }, [mealData]);

  // 打卡统计（只算当月）
  const stats = useMemo(() => {
    let checkDays = 0;
    let fullDays = 0;
    let streak = 0;
    let currentStreak = 0;

    for (let i = 1; i <= daysInMonth; i += 1) {
      const d = currentMonth.date(i);
      const dateStr = d.format('YYYY-MM-DD');
      const meals = mealMap.get(dateStr);
      const hasAny = meals && meals.size > 0;
      const hasAllThree = meals && MAIN_MEALS.every((m) => meals.has(m));

      if (hasAny) {
        checkDays += 1;
        currentStreak += 1;
      } else {
        currentStreak = 0;
      }
      if (hasAllThree) fullDays += 1;
      streak = Math.max(streak, currentStreak);
    }

    return { checkDays, fullDays, streak };
  }, [currentMonth, daysInMonth, mealMap]);

  // 顶部 4 个关键数字
  const topStats = useMemo(() => {
    if (!detailStats) return null;
    const { sleep, mood, exercise, water } = detailStats;

    // 睡眠月均时长
    const avgSleepHours = sleep.avgHours ?? 0;

    // 积极情绪占比 + 最多情绪
    const moodDist = mood.distribution ?? [];
    const totalMood = moodDist.reduce((s, d) => s + d.count, 0);
    const positiveMoods = ['开心', '平静', '幸福', '充实', '感动', '满足'];
    const positiveCount = moodDist
      .filter((d) => positiveMoods.includes(d.mood))
      .reduce((s, d) => s + d.count, 0);
    const positiveRate = totalMood > 0 ? Math.round((positiveCount / totalMood) * 100) : 0;
    const topMood = mood.topMood ?? '';
    const topMoodDays = mood.topMoodDays ?? 0;

    // 运动月总时长
    const totalExercise = exercise.totalMinutes ?? 0;
    const exerciseCount = exercise.sessionCount ?? 0;

    // 喝水
    const avgWater = water.avgCups ?? 0;
    const dailyCups = water.dailyCups ?? [];
    const targetCups = 8;
    const meetWaterDays = dailyCups.filter((d) => d.cups >= targetCups).length;

    return {
      avgSleepHours,
      positiveRate,
      topMood,
      topMoodDays,
      totalExercise,
      exerciseCount,
      avgWater,
      meetWaterDays,
    };
  }, [detailStats]);

  useEffect(() => {
    const monthKey = currentMonth.format('YYYY-MM');
    const start = currentMonth.format('YYYY-MM-DD');
    const end = currentMonth.endOf('month').format('YYYY-MM-DD');

    // 检查缓存
    const cached = cacheRef.current.get(monthKey);
    if (cached) {
      setMealData(cached.mealData);
      setDetailStats(cached.detailStats);
      setLoading(false);
      return;
    }

    // 请求锁
    if (isFetchingRef.current) return;

    // 中断之前未完成的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    isFetchingRef.current = true;
    setLoading(true);

    const fetchData = async (): Promise<void> => {
      try {
        const results = await Promise.allSettled([
          getDietMealStats(start, end),
          getMonthlyDetailStats(start, end),
        ]);

        if (controller.signal.aborted) return;

        const [mealRes, detailRes] = results;
        const mealResult: DietMealStat[] =
          mealRes.status === 'fulfilled' ? mealRes.value : [];
        const detailResult: MonthlyDetailStats | null =
          detailRes.status === 'fulfilled' ? detailRes.value : null;

        setMealData(mealResult);
        if (detailResult) setDetailStats(detailResult);

        // 写入缓存
        if (detailResult) {
          cacheRef.current.set(monthKey, {
            mealData: mealResult,
            detailStats: detailResult,
          });
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        logger.error('[stats-month] fetch failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          isFetchingRef.current = false;
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
      isFetchingRef.current = false;
    };
  }, [currentMonth]);

  const hasAnyRecords = useMemo(() => {
    if (!detailStats) return false;
    const { diet, sleep, water, exercise, mood, pain, medication, poop } = detailStats;
    return (
      (diet.mealTypeComposition ?? []).length > 0 ||
      (diet.takeoutByMeal ?? []).length > 0 ||
      (sleep.dailyHours ?? []).length > 0 ||
      (water.dailyCups ?? []).length > 0 ||
      (exercise.typeComposition ?? []).length > 0 ||
      (mood.distribution ?? []).some((d) => d.count > 0) ||
      (pain.topSymptoms ?? []).length > 0 ||
      medication.totalDoses > 0 ||
      poop.totalCount > 0 ||
      mealData.length > 0
    );
  }, [detailStats, mealData]);

  if (loading && !detailStats) return <ViewSkeleton rows={2} />;

  const monthSwitchBar = (
    <div className="paper-card relative overflow-hidden p-4 flex flex-col items-center gap-2" style={{ background: 'rgba(255, 255, 255, 0.75)' }}>
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
          onClick={() => setMonthOffset((v) => v - 1)}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary-light transition-colors shrink-0"
          aria-label="上个月"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/70" strokeWidth={2} />
        </button>

        <div className="text-center min-w-0 flex-1 px-2">
          <div className="text-lg font-sans-hei font-medium truncate">
            {currentMonth.format('YYYY年M月')}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
            共 {daysInMonth} 天
          </div>
        </div>

        <button
          onClick={() => setMonthOffset((v) => v + 1)}
          disabled={isCurrentMonth}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            isCurrentMonth
              ? 'bg-muted cursor-not-allowed opacity-50'
              : 'bg-secondary hover:bg-primary-light'
          }`}
          aria-label="下个月"
        >
          <ChevronRight className={`w-5 h-5 ${
            isCurrentMonth ? 'text-muted-foreground' : 'text-foreground/70'
          }`} strokeWidth={2} />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          onClick={() => setMonthOffset(0)}
          className="text-xs font-medium px-4 py-1.5 rounded-full transition-all text-primary bg-primary-light/60 hover:bg-primary-light hover:-translate-y-0.5 border border-primary/10 relative z-10"
        >
          回到本月
        </button>
      )}
    </div>
  );

  if (!detailStats || !hasAnyRecords) {
    return (
      <div className="space-y-5">
        {monthSwitchBar}
        <ViewEmpty text="本月还没有记录哦" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {monthSwitchBar}

      {/* 顶部 4 个关键数字卡 */}
      {hasAnyRecords && topStats && (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
          {/* 月均睡眠时长 */}
          <div className="bg-module-sleep-bg rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-1 mb-2">
              <div className="w-7 h-7 rounded-lg bg-module-sleep-bg flex items-center justify-center">
                <Moon className="w-4 h-4 text-module-sleep" strokeWidth={2} />
              </div>
              <span className="text-base font-sans-hei text-[#556c5f]">月均睡眠</span>
            </div>
            <div className="text-xl font-semibold tabular-nums text-foreground text-center">
              {topStats.avgSleepHours}
              <span className="text-base font-normal text-muted-foreground ml-1">小时</span>
            </div>
          </div>

          {/* 积极情绪占比 */}
          <div className="bg-module-mood-bg rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-1 mb-2">
              <div className="w-7 h-7 rounded-lg bg-module-mood-bg flex items-center justify-center">
                <Smile className="w-4 h-4 text-module-mood" strokeWidth={2} />
              </div>
              <span className="text-base font-sans-hei text-[#556c5f]">积极情绪</span>
            </div>
            <div className="text-xl font-semibold tabular-nums text-foreground text-center">
              {topStats.positiveRate}
              <span className="text-base font-normal text-muted-foreground ml-1">%</span>
            </div>
            {topStats.topMood && (
              <div className="text-sm text-muted-foreground mt-0.5 text-center">
                {topStats.topMood} {topStats.topMoodDays}次最多
              </div>
            )}
          </div>

          {/* 运动月总时长 */}
          <div className="bg-module-exercise-bg rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-1 mb-2">
              <div className="w-7 h-7 rounded-lg bg-module-exercise-bg flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-module-exercise" strokeWidth={2} />
              </div>
              <span className="text-base font-sans-hei text-[#556c5f]">运动总时长</span>
            </div>
            <div className="text-xl font-semibold tabular-nums text-foreground text-center">
              {topStats.totalExercise}
              <span className="text-base font-normal text-muted-foreground ml-1">分钟</span>
            </div>
            <div className="text-sm text-muted-foreground mt-0.5 text-center">
              共 {topStats.exerciseCount} 次
            </div>
          </div>

          {/* 日均喝水杯数 */}
          <div className="bg-module-water-bg rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-1 mb-2">
              <div className="w-7 h-7 rounded-lg bg-module-water-bg flex items-center justify-center">
                <Droplet className="w-4 h-4 text-module-water" strokeWidth={2} />
              </div>
              <span className="text-base font-sans-hei text-[#556c5f]">日均喝水</span>
            </div>
            <div className="text-xl font-semibold tabular-nums text-foreground text-center">
              {topStats.avgWater}
              <span className="text-base font-normal text-muted-foreground ml-1">杯</span>
            </div>
            <div className="text-sm text-muted-foreground mt-0.5 text-center">
              达标 {topStats.meetWaterDays} 天
            </div>
          </div>
        </div>
      )}

      {/* 月度餐次打卡日历 */}
      <div className="paper-card relative overflow-hidden p-4">
        <Image
          src={mealMonthBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-75 pointer-events-none z-0"
        />
        <div className="relative z-10">
        <h3 className="text-lg font-sans-hei font-semibold m-[0px_12px_8px_12px] p-[4px_0px_4px_0px]">月度餐次打卡</h3>

        {/* 星期头 */}
        <div className="grid grid-cols-7 mb-1">
          {WEEK_LABELS.map((w) => (
            <div key={w} className="text-center text-sm font-sans-hei text-foreground/80 py-0.5 font-medium">
              {w}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map(({ date, inMonth }) => {
            const dateStr = date.format('YYYY-MM-DD');
            const meals = mealMap.get(dateStr) ?? new Set<string>();
            const today = date.isSame(dayjs(), 'day');
            return (
              <div
                key={dateStr}
                className={`aspect-square rounded-full flex flex-col items-center justify-center ${
                  !inMonth
                    ? 'opacity-30'
                    : today
                    ? 'ring-2 ring-primary/40 bg-primary-light/70 shadow-sm'
                    : 'bg-primary-light/25'
                }`}
              >
                <span
                  className={`text-sm font-sans-hei font-bold tabular-nums leading-none ${
                    today ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {date.date()}
                </span>
                <div className="flex gap-0.5 mt-0.5">
                  {MAIN_MEALS.map((meal) => {
                    const has = meals.has(meal);
                    const color = MEAL_COLORS[meal] ?? '#ccc';
                    return (
                      <span
                        key={meal}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: has ? color : 'transparent',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 图例 */}
        <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-border/50">
          {MAIN_MEALS.map((meal) => (
            <div key={meal} className="flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: MEAL_COLORS[meal] }}
              />
              <span className="text-sm font-sans-hei text-foreground/70 font-medium">
                {meal === 'breakfast' ? '早餐' : meal === 'lunch' ? '午餐' : '晚餐'}
              </span>
            </div>
          ))}
        </div>

        {/* 底部统计 */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
          <div className="text-center">
            <div className="text-base font-sans-hei font-bold tabular-nums text-foreground">
              {stats.checkDays}
            </div>
            <div className="text-sm font-sans-hei text-foreground/70 font-medium">打卡天数</div>
          </div>
          <div className="text-center">
            <div className="text-base font-sans-hei font-bold tabular-nums text-foreground">
              {stats.fullDays}
            </div>
            <div className="text-sm font-sans-hei text-foreground/70 font-medium">全勤天数</div>
          </div>
          <div className="text-center">
            <div className="text-base font-sans-hei font-bold tabular-nums text-foreground">
              {stats.streak}
            </div>
            <div className="text-sm font-sans-hei text-foreground/70 font-medium">最长连续</div>
          </div>
        </div>
        </div>
      </div>

      {/* 本月详细统计 - 8大模块 */}
      {hasAnyRecords && (
        <div>
          <h2 className="text-xl font-title font-semibold mb-3">
            本月详细统计
          </h2>
          <div className="flex flex-col gap-3">
              <div className="w-full">
                <SleepMonthModule data={detailStats.sleep} />
              </div>
              <div className="w-full">
                <MoodMonthModule data={detailStats.mood} currentMonth={currentMonth} />
              </div>
              <div className="w-full">
                <PainMonthModule data={detailStats.pain} />
              </div>
              <div className="w-full">
                <DietMonthModule data={detailStats.diet} daysInMonth={daysInMonth} />
              </div>
              <div className="w-full">
                <ExerciseMonthModule data={detailStats.exercise} />
              </div>
              <div className="w-full">
                <WaterMonthModule
                 data={detailStats.water}
                 daysInMonth={daysInMonth}
                 targetCups={8}
               />
             </div>
             <div className="w-full">
               <MedicationMonthModule data={detailStats.medication} />
             </div>
             <div className="w-full">
               <PoopMonthModule data={detailStats.poop} daysInMonth={daysInMonth} />
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MonthView;
