import { Moon } from 'lucide-react';
import CompactBarChart from '../../charts/CompactBarChart';
import type { WeeklyDetailStats } from '@shared/api.interface';

interface SleepModuleProps {
  data: WeeklyDetailStats['sleep'];
}

const SleepModule: React.FC<SleepModuleProps> = ({ data }) => {
  const days = ['一', '二', '三', '四', '五', '六', '日'];
  const hoursByDay: number[] = new Array(7).fill(0);
  for (const item of data.dailyHours) {
    const [year, month, day] = item.date.split('-').map(Number);
    if (!year || !month || !day) continue;

    // 使用 UTC 构造纯日期，避免手机时区把星期几再次偏移。
    const weekDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const mondayIndex = weekDay === 0 ? 6 : weekDay - 1;
    hoursByDay[mondayIndex] += item.hours;
  }

  const meetRate = Math.round((data.meetTargetDays / 7) * 100);

  return (
    <div className="paper-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-sleep-bg flex items-center justify-center">
          <Moon className="w-3.5 h-3.5 text-module-sleep" strokeWidth={2} />
        </div>
        <div className="text-base font-semibold font-sans-hei">睡眠统计</div>
        <div className="ml-auto text-sm text-muted-foreground">
          目标 {data.targetHours}h
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-module-sleep-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.avgHours}
          </div>
           <div className="text-sm text-muted-foreground mt-0.5">日均小时</div>
        </div>
        <div className="bg-module-sleep-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.bestDay?.hours ?? 0}
          </div>
           <div className="text-sm text-muted-foreground mt-0.5">最佳日</div>
        </div>
        <div className="bg-module-sleep-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.meetTargetDays}
          </div>
           <div className="text-sm text-muted-foreground mt-0.5">达标天</div>
        </div>
      </div>

      <div className="h-[170px] -mx-1">
        <CompactBarChart
          xData={days}
          yData={hoursByDay}
          color="#9aaedb"
          unit="小时"
          barMaxWidth={18}
        />
      </div>

      {data.qualityDistribution.length > 0 && (
        <div className="pt-1 border-t border-border/50">
          <div className="text-base font-semibold text-foreground/80 mb-1.5">睡眠质量构成</div>
          <div className="flex items-center gap-2">
            {['好', '中', '差'].map((q) => {
              const item = data.qualityDistribution.find((d) => d.quality === q);
              const count = item?.count ?? 0;
              const colors: Record<string, string> = { 好: '#9aaedb', 中: '#c8d0e8', 差: '#e8c4c4' };
              return (
                <div key={q} className="flex-1 text-center">
                  <div className="text-sm font-semibold tabular-nums text-foreground">{count}</div>
                  <div
                    className="h-1 rounded-full mt-1"
                    style={{ backgroundColor: colors[q], opacity: count > 0 ? 1 : 0.2 }}
                  />
                   <div className="text-sm text-muted-foreground mt-0.5">{q}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-1 border-t border-border/50">
        <div className="flex items-center justify-between mb-1">
           <span className="text-base font-normal font-sans-hei text-foreground/80">目标达成率</span>
          <span className="font-medium text-primary">{meetRate}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-module-sleep rounded-full transition-all"
            style={{ width: `${meetRate}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SleepModule;
