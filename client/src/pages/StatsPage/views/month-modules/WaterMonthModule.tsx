import { Droplets } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { MonthlyDetailStats } from '@shared/api.interface';

interface WaterMonthModuleProps {
  data: MonthlyDetailStats['water'];
  daysInMonth: number;
  targetCups?: number;
}

const WaterMonthModule: React.FC<WaterMonthModuleProps> = ({
  data,
  daysInMonth,
  targetCups = 8,
}) => {
  const dailyCups = data.dailyCups ?? [];
  const avgCups = data.avgCups ?? 0;

  // 构建 1-31 日数据
  const cupMap = new Map<number, number>();
  for (const d of dailyCups) {
    const day = parseInt(d.date.split('-')[2] ?? '0', 10);
    if (day >= 1 && day <= 31) cupMap.set(day, d.cups);
  }

  const dayLabels: string[] = [];
  const cupValues: number[] = [];
  for (let i = 1; i <= daysInMonth; i += 1) {
    dayLabels.push(String(i));
    cupValues.push(cupMap.get(i) ?? 0);
  }

  // 达标天数
  const meetDays = cupValues.filter((c) => c >= targetCups).length;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const p = list[0] as { name: string; value: number };
        return `${p.name}日<br/>${p.value} 杯`;
      },
    },
    grid: { left: 38, right: 12, top: 25, bottom: 25, containLabel: false },
    xAxis: {
      type: 'category',
      data: dayLabels,
      axisLabel: { fontSize: 12, color: 'rgba(60,80,70,0.6)' },
      axisLine: { lineStyle: { color: 'rgba(60,80,70,0.1)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        width: 30,
        overflow: 'truncate',
        fontSize: 12,
        color: 'rgba(60,80,70,0.5)',
        margin: 4,
        formatter: (value: number) => {
          if (value >= 10000) return (value / 10000).toFixed(1) + 'w';
          if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
          return value.toString();
        },
      },
      splitLine: { lineStyle: { color: 'rgba(60,80,70,0.06)' } },
    },
    series: [
      {
        type: 'bar',
        data: cupValues,
        barMaxWidth: 10,
        itemStyle: {
          color: '#7cc0df',
          borderRadius: [2, 2, 0, 0],
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#ffa940', width: 1 },
          label: {
            formatter: `目标 ${targetCups}杯`,
            fontSize: 11,
            position: 'insideEndTop',
          },
          data: [{ yAxis: targetCups }],
        },
      },
    ],
  };

  return (
    <div className="paper-card p-3 flex flex-col gap-2 h-[290px]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-water-bg flex items-center justify-center">
          <Droplets className="w-3.5 h-3.5 text-module-water" strokeWidth={2} />
        </div>
        <div className="text-base font-sans-hei font-semibold">
          喝水·日均与达标
        </div>
      </div>

      {/* 两个大数字 */}
      <div className="flex items-end gap-4 px-1">
        <div>
          <div className="text-xl font-semibold tabular-nums text-foreground">
            {avgCups.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">日均杯数</div>
        </div>
        <div className="pb-0.5">
          <div className="text-lg font-semibold tabular-nums text-module-water">
            {meetDays} 天
          </div>
          <div className="text-sm text-muted-foreground">达标</div>
        </div>
      </div>

      {/* 柱状图 */}
      <div className="h-[180px] -mx-1">
        <ReactECharts option={option} theme="ud" autoResize={true} className="chart-container" style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default WaterMonthModule;
