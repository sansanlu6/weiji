import { Smile } from 'lucide-react';
import CompactPieChart from '../../charts/CompactPieChart';
import type { WeeklyDetailStats } from '@shared/api.interface';

interface MoodModuleProps {
  data: WeeklyDetailStats['mood'];
}

const MOOD_COLORS = [
  '#f0d488',
  '#f0b8a8',
  '#a3d977',
  '#8fc9e0',
  '#c9b3e0',
  '#f0b8d8',
  '#b5c5d6',
];

const MoodModule: React.FC<MoodModuleProps> = ({ data }) => {
  const pieData = data.distribution.length > 0
    ? data.distribution.map((d) => ({ name: d.mood, value: d.count }))
    : [{ name: '暂无数据', value: 1 }];

  return (
    <div className="paper-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-mood-bg flex items-center justify-center">
          <Smile className="w-3.5 h-3.5 text-module-mood" strokeWidth={2} />
        </div>
        <div className="text-base font-semibold font-sans-hei">情绪统计</div>
        {data.topMood && (
          <div className="ml-auto text-sm bg-module-mood-bg/80 text-foreground/70 px-2 py-0.5 rounded-full">
            本周最多 · {data.topMood}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <CompactPieChart data={pieData} colors={MOOD_COLORS} size={100} />
        <div className="flex-1 space-y-1 min-w-0 max-h-[100px] overflow-y-auto">
          {data.distribution.length === 0 ? (
            <div className="text-sm text-muted-foreground">暂无记录</div>
          ) : (
             data.distribution.slice(0, 6).map((item, idx) => (
               <div key={item.mood} className="flex items-center gap-1.5 text-sm text-foreground/70">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: MOOD_COLORS[idx % MOOD_COLORS.length] }}
                />
                <span className="truncate">{item.mood}</span>
                <span className="ml-auto tabular-nums">{item.count}次</span>
              </div>
            ))
          )}
        </div>
      </div>

      {data.dailyTrend.length > 0 && (
        <div className="pt-1 border-t border-border/50">
          <div className="text-base font-semibold text-foreground/80 mb-1.5">情绪变化</div>
          <div className="flex gap-1">
            {data.dailyTrend.slice(0, 7).map((d) => {
              const isPositive = ['开心', '平静', '幸福', '充实', '感动'].includes(d.mood);
              const isNegative = ['焦虑', '低落', '烦躁', '疲惫', '失落', '愤怒'].includes(d.mood);
              let bg = 'bg-muted';
              if (isPositive) bg = 'bg-module-mood';
              else if (isNegative) bg = 'bg-accent';
              return (
                <div
                  key={d.date}
                  className={`flex-1 h-6 rounded-md ${bg} flex items-center justify-center`}
                  title={`${d.date}: ${d.mood}`}
                >
                   <span className="text-xs text-white/90 truncate px-0.5">{d.mood || '-'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodModule;
