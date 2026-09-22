import { AlertCircle } from 'lucide-react';
import type { MonthlyDetailStats } from '@shared/api.interface';

interface PainMonthModuleProps {
  data: MonthlyDetailStats['pain'];
}

const PAIN_LEVEL_COLORS = { mild: '#b7eb8f', moderate: '#ffd666', severe: '#ff7875' };

const PainMonthModule: React.FC<PainMonthModuleProps> = ({ data }) => {
  const top5 = (data.topSymptoms ?? []).slice(0, 5);
  const maxCount = Math.max(...top5.map((s) => s.count), 1);

  const levelDist = data.levelDistribution ?? [];
  const levelTotal = levelDist.reduce((s, d) => s + d.count, 0) || 1;

  const levelOrder = ['轻度', '中度', '重度'];
  const levelColors: Record<string, string> = {
    轻度: PAIN_LEVEL_COLORS.mild,
    中度: PAIN_LEVEL_COLORS.moderate,
    重度: PAIN_LEVEL_COLORS.severe,
  };

  return (
    <div className="paper-card p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-pain-bg flex items-center justify-center">
          <AlertCircle className="w-3.5 h-3.5 text-module-pain" strokeWidth={2} />
        </div>
        <div className="text-base font-sans-hei font-semibold">
          病痛·部位频次与程度
        </div>
      </div>

      {/* TOP5 不适部位横向条形图 (div 实现) */}
      <div className="space-y-1.5 my-1">
        {top5.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-3">
            本月无痛痛记录
          </div>
        ) : (
          top5.map((item) => {
            const pct = (item.count / maxCount) * 100;
            return (
              <div key={item.symptom} className="flex items-center gap-2">
                <span className="text-sm text-foreground/80 w-16 truncate shrink-0 px-1">
                  {item.symptom}
                </span>
                <div className="flex-1 h-4 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: '#f0b8a8',
                    }}
                  />
                </div>
                <span className="text-sm text-muted-foreground tabular-nums w-8 text-right shrink-0">
                  {item.count}次
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* 程度分布堆叠条 */}
      {levelDist.length > 0 && (
        <div className="pt-2 border-t border-border/50">
          <div className="text-sm font-semibold font-sans-hei text-foreground/80 mb-1.5">程度分布</div>
          <div className="flex items-center h-5 rounded-full overflow-hidden bg-muted/40">
            {levelOrder.map((level) => {
              const item = levelDist.find((d) => d.level === level);
              const count = item?.count ?? 0;
              const pct = (count / levelTotal) * 100;
              if (count === 0) return null;
              return (
                <div
                  key={level}
                  className="h-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: levelColors[level],
                  }}
                  title={`${level}: ${count}次 (${pct.toFixed(0)}%)`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-around mt-1.5">
            {levelOrder.map((level) => {
              const item = levelDist.find((d) => d.level === level);
              const count = item?.count ?? 0;
              return (
                <div key={level} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: levelColors[level] }}
                  />
                  <span className="text-sm text-muted-foreground">{level}</span>
                  <span className="text-sm font-medium tabular-nums text-foreground/70">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PainMonthModule;
