import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react';
import {
  getDietMealStats,
  getWeeklyDetailStats,
} from '@client/src/api/stats';
import type { DietMealStat } from '@client/src/api/stats';
import type { WeeklyDetailStats } from '@shared/api.interface';
import { MEAL_COLORS, MEAL_LABELS, MAIN_MEALS } from '../components/meal-constants';
import StatCard from '../components/StatCard';
import ViewSkeleton from '../components/ViewSkeleton';
import ViewEmpty from '../components/ViewEmpty';
import DietModule from './week-modules/DietModule';
import SleepModule from './week-modules/SleepModule';
import WaterModule from './week-modules/WaterModule';
import ExerciseModule from './week-modules/ExerciseModule';
import MoodModule from './week-modules/MoodModule';
import PainModule from './week-modules/PainModule';
import MedicationModule from './week-modules/MedicationModule';
import PoopModule from './week-modules/PoopModule';
import osmanthusTreeBg from '@client/src/assets/osmanthus-tree-bg.png';
import watercolorDecor from '@client/src/assets/watercolor-week-switch.png';
import mealWeeklyBg from '@client/src/assets/meal-weekly-bg.png';
import { Image } from '@client/src/components/ui/image';

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

const WeekView: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mealData, setMealData] = useState<DietMealStat[]>([]);
  const [detailStats, setDetailStats] = useState<WeeklyDetailStats | null>(null);

  // 计算当前周起止（周一到周日）
  const { weekStart, weekEnd } = useMemo(() => {
    const today = dayjs().add(weekOffset, 'week');
    // 周一 = 第0位，周日 = 第6位；dayjs day(): 周日=0, 周一=1...
    const dayNum = today.day();
    const mondayOffset = dayNum === 0 ? -6 : 1 - dayNum;
    const start = today.add(mondayOffset, 'day').startOf('day');
    const end = start.add(6, 'day').endOf('day');
    return { weekStart: start, weekEnd: end };
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    const days: dayjs.Dayjs[] = [];
    for (let i = 0; i < 7; i += 1) {
      days.push(weekStart.add(i, 'day'));
    }
    return days;
  }, [weekStart]);

  const isToday = (d: dayjs.Dayjs): boolean => d.isSame(dayjs(), 'day');
  const isCurrentWeek = weekOffset === 0;

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

  // 打卡统计
  const stats = useMemo(() => {
    let checkDays = 0;
    let fullDays = 0;
    let streak = 0;
    let currentStreak = 0;

    for (const d of weekDays) {
      const dateStr = d.format('YYYY-MM-DD');
      const meals = mealMap.get(dateStr);
      const hasAny = meals && meals.size > 0;
      const hasAllThree =
        meals && MAIN_MEALS.every((m) => meals.has(m));

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
  }, [weekDays, mealMap]);


  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        const start = weekStart.format('YYYY-MM-DD');
        const end = weekEnd.format('YYYY-MM-DD');

        const results = await Promise.allSettled([
          getDietMealStats(start, end),
          getWeeklyDetailStats(start, end),
        ]);

        const [mealRes, detailRes] = results;
        if (mealRes.status === 'fulfilled') setMealData(mealRes.value);
        if (detailRes.status === 'fulfilled') setDetailStats(detailRes.value);
      } catch (err) {
        logger.error('[stats-week] fetch failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [weekStart, weekEnd]);

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

  if (loading) return <ViewSkeleton rows={2} />;

  const weekSwitchBar = (
    <div className="paper-card relative overflow-hidden rounded-2xl p-4 flex flex-col items-center gap-2" style={{ background: 'rgba(255, 255, 255, 0.75)' }}>
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
          onClick={() => setWeekOffset((v) => v - 1)}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary-light transition-colors shrink-0"
          aria-label="上一周"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/70" strokeWidth={2} />
        </button>

        <div className="text-center min-w-0 flex-1 px-2">
          <div className="text-lg font-medium font-sans-hei truncate">
            {weekStart.format('M月D日')} — {weekEnd.format('M月D日')}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
            {weekStart.format('YYYY年')} 第{Math.ceil((weekStart.diff(weekStart.startOf('year'), 'day') + 1) / 7)}周
          </div>
        </div>

        <button
          onClick={() => setWeekOffset((v) => v + 1)}
          disabled={weekOffset >= 0}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            weekOffset >= 0
              ? 'bg-muted/30 text-foreground/30 cursor-not-allowed'
              : 'bg-secondary hover:bg-primary-light text-foreground/70'
          }`}
          aria-label="下一周"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      {!isCurrentWeek && (
        <button
          onClick={() => setWeekOffset(0)}
          className="text-xs font-medium px-4 py-1.5 rounded-full transition-all text-primary bg-primary-light/60 hover:bg-primary-light hover:-translate-y-0.5 border border-primary/10 relative z-10"
        >
          回到本周
        </button>
      )}
    </div>
  );

  if (!detailStats || !hasAnyRecords) {
    return (
      <div className="space-y-5">
        {weekSwitchBar}
        <ViewEmpty text="本周还没有记录哦" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {weekSwitchBar}

      {mealData.length === 0 ? (
        <ViewEmpty text="本周还没有饮食记录，快去打卡吧～" />
      ) : (
        <>
          {/* 统计条 */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard value={stats.checkDays} label="打卡天数" />
            <StatCard value={stats.fullDays} label="全勤天数" />
            <StatCard value={stats.streak} label="连续打卡" />
          </div>

          {/* 周历主体 - 水彩桂花背景 */}
          <div className="relative overflow-hidden rounded-3xl shadow-sm">
            <Image
              src={mealWeeklyBg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-70"
              style={{ borderRadius: '24px' }}
            />
            <div className="relative z-10 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(4px)' }}
                >
                  <UtensilsCrossed className="w-4 h-4" style={{ color: '#5a8a55' }} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold font-sans-hei leading-tight" style={{ color: '#2e5a3e' }}>
                    周历餐次打卡
                  </h3>
                  <p className="text-xs mt-0.5 font-sans-hei" style={{ color: 'rgba(46, 90, 62, 0.65)' }}>
                    记录三餐，吃出好状态
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
              {weekDays.map((d, idx) => {
                const dateStr = d.format('YYYY-MM-DD');
                const meals = mealMap.get(dateStr) ?? new Set<string>();
                const today = isToday(d);
                return (
                   <div
                     key={dateStr}
                     className="flex flex-col items-center gap-2 rounded-2xl p-2 pb-3 transition-all"
                     style={{
                       background: today ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)',
                       boxShadow: today ? '0 0 0 2px rgba(123, 168, 154, 0.5), 0 2px 8px rgba(42, 72, 58, 0.08)' : '0 1px 4px rgba(42, 72, 58, 0.04)',
                       backdropFilter: today ? 'blur(6px)' : 'blur(2px)',
                     }}
                   >
                    {/* 日期 + 星期 */}
                    <div className="text-center">
                       <div
                         className="text-base font-semibold tabular-nums font-sans-hei"
                         style={{ color: today ? '#3d7a55' : '#2e5a3e' }}
                       >
                        {d.date()}
                      </div>
                       <div className="text-xs mt-0.5 font-medium font-sans-hei" style={{ color: idx === 0 ? '#3d7a55' : 'rgba(46, 90, 62, 0.6)' }}>
                        {WEEK_LABELS[idx]}
                      </div>
                    </div>

                    {/* 三餐格子 */}
                    <div className="flex flex-col gap-1.5 w-full">
                      {MAIN_MEALS.map((meal) => {
                        const has = meals.has(meal);
                        const color = MEAL_COLORS[meal] ?? '#ccc';
                        return (
                           <div
                             key={meal}
                              className="w-full py-2 rounded-xl text-sm font-medium text-center font-sans-hei"
                             style={{
                               backgroundColor: has ? color : 'rgba(255,255,255,0.7)',
                               color: has ? '#ffffff' : 'rgba(46, 90, 62, 0.5)',
                               border: has ? 'none' : '1px solid rgba(123, 168, 154, 0.25)',
                               boxShadow: has ? '0 1px 3px rgba(42, 72, 58, 0.1)' : 'none',
                             }}
                           >
                            {MEAL_LABELS[meal] ?? meal}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 本周详细统计 - 8大模块 */}
      {hasAnyRecords && (
        <div>
          <h2 className="text-lg font-semibold font-title mb-3">
            本周详细统计
          </h2>
          {!detailStats ? (
            <ViewSkeleton rows={3} />
          ) : (
             <div className="flex flex-col gap-3">
               <div className="w-full">
                 <DietModule data={detailStats.diet} />
               </div>
               <div className="w-full">
                 <SleepModule data={detailStats.sleep} />
               </div>
               <div className="w-full">
                 <WaterModule data={detailStats.water} />
               </div>
               <div className="w-full">
                 <ExerciseModule data={detailStats.exercise} />
               </div>
               <div className="w-full">
                 <MoodModule data={detailStats.mood} />
               </div>
               <div className="w-full">
                 <PainModule data={detailStats.pain} />
               </div>
               <div className="w-full">
                 <MedicationModule data={detailStats.medication} />
               </div>
               <div className="w-full">
                 <PoopModule data={detailStats.poop} />
               </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeekView;
