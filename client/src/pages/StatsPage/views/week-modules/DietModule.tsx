import { Utensils } from 'lucide-react';
import CompactPieChart from '../../charts/CompactPieChart';
import type { WeeklyDetailStats } from '@shared/api.interface';

interface DietModuleProps {
  data: WeeklyDetailStats['diet'];
}

const DIET_COLORS = ['#f7b297', '#ffd9b8', '#ffe8d0', '#ffccb3'];

const DietModule: React.FC<DietModuleProps> = ({ data }) => {
  const pieData = data.mealTypeComposition.length > 0
    ? data.mealTypeComposition.map((t) => ({ name: t.type, value: t.count }))
    : [{ name: '暂无数据', value: 1 }];

  const missRate = Math.round((data.missedCount / 21) * 100);

  return (
    <div className="paper-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-diet-bg flex items-center justify-center">
          <Utensils className="w-3.5 h-3.5 text-module-diet" strokeWidth={2} />
        </div>
        <div className="text-base font-semibold font-sans-hei">饮食统计</div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-module-diet-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.fullMealDays}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">三餐完整天</div>
        </div>
        <div className="bg-module-diet-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.takeoutCount}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">外卖次数</div>
        </div>
        <div className="bg-module-diet-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.takeoutRate}%
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">外卖占比</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <CompactPieChart data={pieData} colors={DIET_COLORS} size={96} />
        <div className="flex-1 space-y-1 min-w-0">
          <div className="text-base font-semibold text-foreground/80 mb-1">餐食类型</div>
          {data.mealTypeComposition.length === 0 ? (
            <div className="text-sm text-muted-foreground">暂无记录</div>
          ) : (
data.mealTypeComposition.slice(0, 3).map((item, idx) => (
               <div key={item.type} className="flex items-center gap-1.5 text-sm text-foreground/70">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DIET_COLORS[idx % DIET_COLORS.length] }} />
                <span className="truncate">{item.type}</span>
                <span className="ml-auto tabular-nums">{item.count}次</span>
              </div>
            ))
          )}
        </div>
      </div>

      {data.takeoutByMeal.length > 0 && (
        <div className="pt-1 border-t border-border/50">
          <div className="text-base font-semibold text-foreground/80 mb-1.5">外卖分布</div>
          <div className="flex items-end gap-3 h-12">
            {data.takeoutByMeal.map((item) => {
              const max = Math.max(...data.takeoutByMeal.map((t) => t.count), 1);
              const h = (item.count / max) * 100;
              const labels: Record<string, string> = { lunch: '午餐', dinner: '晚餐', weekend: '周末' };
              return (
                <div key={item.meal} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full max-w-[20px] rounded-t-sm"
                    style={{ backgroundColor: '#f7b297', height: `${h}%`, minHeight: item.count > 0 ? 4 : 0 }}
                  />
                  <div className="text-sm text-muted-foreground">{labels[item.meal] ?? item.meal}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-1 border-t border-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">最易漏餐</span>
          <span className="font-medium text-destructive">
            {data.mostMissedMeal} · 漏{data.missedCount}次 ({missRate}%)
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${missRate}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default DietModule;
