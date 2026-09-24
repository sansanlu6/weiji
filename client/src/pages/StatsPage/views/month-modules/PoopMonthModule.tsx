import { Leaf } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { MonthlyDetailStats } from '@shared/api.interface';

interface PoopMonthModuleProps {
  data: MonthlyDetailStats['poop'];
  daysInMonth: number;
}

const POOP_COLOR_MAP: Record<string, string> = {
  normal: '#7CAE7A',
  hard: '#A0522D',
  constipation: '#C4956A',
  diarrhea: '#E8B4B4',
  loose: '#B5C5D6',
  other: '#D0D0D0',
  正常: '#7CAE7A',
  干结: '#A0522D',
  偏硬: '#A0522D',
  便秘: '#C4956A',
  腹泻: '#E8B4B4',
  偏稀: '#B5C5D6',
  其他: '#D0D0D0',
};
const TYPE_LABELS: Record<string, string> = {
  normal: '正常',
  constipation: '便秘',
  diarrhea: '腹泻',
  hard: '偏硬',
  loose: '偏稀',
};

const PoopMonthModule: React.FC<PoopMonthModuleProps> = ({ data, daysInMonth }) => {
  const totalCount = data.totalCount ?? 0;
  const dailyAvg = daysInMonth > 0 ? (totalCount / daysInMonth).toFixed(1) : '0';

  const pieData =
    data.typeDistribution?.length ?? 0 > 0
      ? data.typeDistribution.map((t) => ({
          name: TYPE_LABELS[t.type] ?? t.type,
          value: t.count,
          color: POOP_COLOR_MAP[t.type] ?? '#D0D0D0',
        }))
      : [{ name: '暂无数据', value: 1, color: '#E5E7EB' }];

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      confine: true,
      position: (point, params, dom, rect, size) => {
        const x = point[0];
        const chartW = size.viewSize[0];
        const tipW = (dom as HTMLDivElement).offsetWidth || 120;
        let left: number;
        if (x < chartW / 2) {
          left = x + 15;
        } else {
          left = Math.max(0, x - tipW - 15);
        }
        const top = Math.max(0, point[1] - 20);
        return [left, top];
      },
      extraCssText: 'z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 8px;',
      formatter: (params) => {
        const p = params as { name: string; value: number; percent?: number };
        return `${p.name}<br/>${p.value} 次 (${p.percent?.toFixed(0) ?? 0}%)`;
      },
    },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['55%', '82%'],
        center: ['50%', '50%'],
        data: pieData.map((d) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color },
        })),
        label: { show: false },
        emphasis: { label: { show: false }, scale: false },
      },
    ],
  };

  return (
    <div className="paper-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-poop-bg flex items-center justify-center">
          <Leaf className="w-3.5 h-3.5 text-module-poop" strokeWidth={2} />
        </div>
        <div className="text-base font-sans-hei font-semibold">排便·状态占比</div>
      </div>

      <div className="flex items-center gap-3">
        {/* 左：环形图 */}
        <div className="w-[130px] h-[130px] flex-shrink-0">
          <ReactECharts option={option} theme="ud" autoResize={true} className="chart-container" style={{ width: '100%', height: '100%' }} />
        </div>
        {/* 右：两个数字卡 */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="bg-module-poop-bg/60 rounded-xl py-2 text-center">
            <div className="text-lg font-semibold tabular-nums text-foreground">
              {totalCount}
            </div>
              <div className="text-sm text-muted-foreground mt-0.5">本月总次数</div>
          </div>
          <div className="bg-module-poop-bg/60 rounded-xl py-2 text-center">
            <div className="text-lg font-semibold tabular-nums text-foreground">
              {dailyAvg}
            </div>
              <div className="text-sm text-muted-foreground mt-0.5">日均频次</div>
          </div>
        </div>
      </div>

      {/* 类型图例 */}
            {data.typeDistribution && data.typeDistribution.length > 0 && (
        <div className="flex flex-wrap gap-x-2 gap-y-1 justify-center pt-1">
          {data.typeDistribution.slice(0, 4).map((item) => (
            <div key={item.type} className="flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: POOP_COLOR_MAP[item.type] ?? '#D0D0D0' }}
              />
              <span className="text-sm text-muted-foreground">
                {TYPE_LABELS[item.type] ?? item.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PoopMonthModule;
