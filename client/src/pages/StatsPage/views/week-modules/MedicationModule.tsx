import { Pill } from 'lucide-react';
import type { WeeklyDetailStats } from '@shared/api.interface';

interface MedicationModuleProps {
  data: WeeklyDetailStats['medication'];
}

const MedicationModule: React.FC<MedicationModuleProps> = ({ data }) => {
  return (
    <div className="paper-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-medication-bg flex items-center justify-center">
          <Pill className="w-3.5 h-3.5 text-module-medication" strokeWidth={2} />
        </div>
        <div className="text-base font-semibold font-sans-hei">用药统计</div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-module-medication-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.totalDoses}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">服药次数</div>
        </div>
        <div className="bg-module-medication-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.onTimeRate}%
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">按时率</div>
        </div>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-module-medication rounded-full transition-all"
          style={{ width: `${data.onTimeRate}%` }}
        />
      </div>

      <div className="pt-1 border-t border-border/50 flex-1 min-h-0">
        <div className="text-base font-semibold font-sans-hei text-foreground/80 mb-1.5">药物种类</div>
        {data.medicines.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无用药记录</div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {data.medicines.slice(0, 8).map((m) => (
              <span
                key={m.name}
                 className="text-sm bg-module-medication-bg/70 text-foreground/70 px-2 py-0.5 rounded-full"
              >
                {m.name} · {m.count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationModule;
