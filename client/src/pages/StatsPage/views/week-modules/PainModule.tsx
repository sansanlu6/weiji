import { AlertCircle } from 'lucide-react';
import CompactHorizontalBar from '../../charts/CompactHorizontalBar';
import type { WeeklyDetailStats } from '@shared/api.interface';

interface PainModuleProps {
  data: WeeklyDetailStats['pain'];
}

const PainModule: React.FC<PainModuleProps> = ({ data }) => {
  const barData = data.topSymptoms.map((s) => ({ name: s.symptom, value: s.count }));
  const hasData = data.topSymptoms.length > 0;

  const levelColors: Record<string, string> = { 轻度: '#f5d6d6', 中度: '#f0b8a8', 重度: '#e89b9b' };

  return (
    <div className="paper-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-pain-bg flex items-center justify-center">
          <AlertCircle className="w-3.5 h-3.5 text-module-pain" strokeWidth={2} />
        </div>
        <div className="text-base font-semibold font-sans-hei">病痛统计</div>
        <div className="ml-auto text-sm text-muted-foreground">
          {data.daysWithPain}天有不适
        </div>
      </div>

      <div className="h-[100px] -mx-1">
        {hasData ? (
          <CompactHorizontalBar data={barData} color="#f0b8a8" unit="次" />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            本周无痛痛记录
          </div>
        )}
      </div>

      {data.levelDistribution.length > 0 && (
        <div className="pt-1 border-t border-border/50">
          <div className="text-base font-semibold text-foreground/80 mb-1.5">程度分布</div>
          <div className="flex items-center gap-3">
            {data.levelDistribution.map((d) => (
               <div key={d.level} className="flex items-center gap-1.5 text-sm text-foreground/70">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: levelColors[d.level] ?? '#f0b8a8' }}
                />
                <span>{d.level}</span>
                <span className="font-medium tabular-nums">{d.count}次</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PainModule;
