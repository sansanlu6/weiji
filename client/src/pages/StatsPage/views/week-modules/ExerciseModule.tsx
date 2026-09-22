import { Dumbbell } from 'lucide-react';
import CompactPieChart from '../../charts/CompactPieChart';
import CompactStackedBar from '../../charts/CompactStackedBar';
import type { WeeklyDetailStats } from '@shared/api.interface';

interface ExerciseModuleProps {
  data: WeeklyDetailStats['exercise'];
}

const EX_COLORS = ['#8bc45a', '#a3d977', '#c5e8a0', '#dff0c5'];

const ExerciseModule: React.FC<ExerciseModuleProps> = ({ data }) => {
  const pieData = data.typeComposition.length > 0
    ? data.typeComposition.map((t) => ({ name: t.type, value: t.minutes }))
    : [{ name: '暂无数据', value: 1 }];

  const intensityColors: Record<string, string> = {
    轻度: '#c5e8a0',
    中度: '#a3d977',
    高强度: '#6ba83a',
  };

  return (
    <div className="paper-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-exercise-bg flex items-center justify-center">
          <Dumbbell className="w-3.5 h-3.5 text-module-exercise" strokeWidth={2} />
        </div>
        <div className="text-base font-semibold font-sans-hei">运动统计</div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-module-exercise-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.totalMinutes}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">总分钟</div>
        </div>
        <div className="bg-module-exercise-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.sessionCount}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">运动次数</div>
        </div>
        <div className="bg-module-exercise-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.avgMinutes}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">单次均长</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <CompactPieChart data={pieData} colors={EX_COLORS} size={96} />
        <div className="flex-1 space-y-1 min-w-0">
          <div className="text-base font-medium text-foreground/80 mb-1">运动类型</div>
          {data.typeComposition.length === 0 ? (
            <div className="text-sm text-muted-foreground">暂无记录</div>
          ) : (
data.typeComposition.slice(0, 3).map((item, idx) => (
               <div key={item.type} className="flex items-center gap-1.5 text-sm text-foreground/70">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: EX_COLORS[idx % EX_COLORS.length] }}
                />
                <span className="truncate">{item.type}</span>
                <span className="ml-auto tabular-nums">{item.minutes}分</span>
              </div>
            ))
          )}
        </div>
      </div>

      {data.intensityDistribution.length > 0 && (
        <div className="pt-1 border-t border-border/50">
          <div className="text-base font-semibold text-foreground/80 mb-1.5">强度分布</div>
          <CompactStackedBar
            categories={['强度']}
            data={data.intensityDistribution.map((d) => ({
              name: d.level,
              value: d.minutes,
              color: intensityColors[d.level] ?? '#8bc45a',
            }))}
          />
          <div className="flex items-center justify-around mt-1.5">
            {data.intensityDistribution.map((d) => (
              <div key={d.level} className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: intensityColors[d.level] }} />
                {d.level}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseModule;
