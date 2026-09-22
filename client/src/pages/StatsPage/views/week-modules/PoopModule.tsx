import { Leaf } from 'lucide-react';
import CompactPieChart from '../../charts/CompactPieChart';
import type { WeeklyDetailStats } from '@shared/api.interface';

interface PoopModuleProps {
  data: WeeklyDetailStats['poop'];
}

const POOP_COLOR_MAP: Record<string, string> = {
  normal: '#7CAE7A',
  hard: '#A0522D',
  constipation: '#C4956A',
  diarrhea: '#E8B4B4',
  loose: '#B5C5D6',
  other: '#D0D0D0',
};

const TYPE_LABELS: Record<string, string> = {
  normal: '正常',
  constipation: '便秘',
  diarrhea: '腹泻',
  hard: '偏硬',
  loose: '偏稀',
};

const PoopModule: React.FC<PoopModuleProps> = ({ data }) => {
  const pieData = data.typeDistribution.length > 0
    ? data.typeDistribution.map((t) => ({
        name: TYPE_LABELS[t.type] ?? t.type,
        value: t.count,
        color: POOP_COLOR_MAP[t.type] ?? '#D0D0D0',
      }))
    : [{ name: '暂无数据', value: 1, color: '#E5E7EB' }];

  return (
    <div className="paper-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-poop-bg flex items-center justify-center">
          <Leaf className="w-3.5 h-3.5 text-module-poop" strokeWidth={2} />
        </div>
        <div className="text-base font-semibold font-sans-hei">排便统计</div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="bg-module-poop-bg/60 rounded-xl py-3 text-center">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.totalCount}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">本周总次数</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <CompactPieChart data={pieData} colors={pieData.map((d) => d.color)} size={96} />
      </div>

      {data.typeDistribution.length > 0 && (
        <div className="pt-1 border-t border-border/50">
          <div className="flex flex-wrap gap-2 justify-center">
              {data.typeDistribution.map((t) => (
               <div key={t.type} className="flex items-center gap-1 text-sm text-foreground/70">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: POOP_COLOR_MAP[t.type] ?? '#D0D0D0' }}
                />
                <span>{TYPE_LABELS[t.type] ?? t.type}</span>
                <span className="font-medium tabular-nums">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PoopModule;
