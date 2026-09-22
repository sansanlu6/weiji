import { Pill } from 'lucide-react';
import type { MonthlyDetailStats } from '@shared/api.interface';

interface MedicationMonthModuleProps {
  data: MonthlyDetailStats['medication'];
}

const MedicationMonthModule: React.FC<MedicationMonthModuleProps> = ({ data }) => {
  const medicines = (data.medicines ?? []).slice().sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...medicines.map((m) => m.count), 1);
  const onTimeRate = data.onTimeRate ?? 0;

  return (
    <div className="paper-card p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-medication-bg flex items-center justify-center">
          <Pill className="w-3.5 h-3.5 text-module-medication" strokeWidth={2} />
        </div>
        <div className="text-base font-sans-hei font-semibold">
          用药·种类与按时率
        </div>
      </div>

      {/* 上：药物种类横向条形图 (div 实现) */}
      <div className="space-y-1.5 min-h-[100px] my-1">
        {medicines.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            本月无用药记录
          </div>
        ) : (
          medicines.slice(0, 5).map((item) => {
            const pct = (item.count / maxCount) * 100;
            return (
              <div key={item.name} className="flex items-center gap-2">
                <span className="text-sm text-foreground/80 w-20 truncate shrink-0">
                  {item.name}
                </span>
                <div className="flex-1 h-3 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: '#c9b3e0',
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

      {/* 下：按时率环形进度条 (CSS conic-gradient) */}
      <div className="pt-2 border-t border-border/50">
        <div className="flex items-center gap-4">
             <div className="text-base font-sans-hei font-semibold text-foreground/80">按时率</div>
          <div className="flex-1 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: `conic-gradient(#c9b3e0 ${onTimeRate * 3.6}deg, #f0f0f0 0deg)`,
              }}
            >
              <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {onTimeRate}%
                </span>
              </div>
            </div>
            <div className="flex-1 text-sm text-muted-foreground">
              <div>
                总服药 <span className="font-medium text-foreground/80">{data.totalDoses}</span> 次
              </div>
              <div className="mt-0.5">
                按时 <span className="font-medium text-module-medication">
                  {Math.round(((data.totalDoses ?? 0) * onTimeRate) / 100)}
                </span> 次
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationMonthModule;
