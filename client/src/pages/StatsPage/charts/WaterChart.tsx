import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { StatsItem } from '@shared/api.interface';

interface WaterChartProps {
  data: StatsItem[];
  targetCups?: number;
}

const COLOR_PRIMARY = '#a3d977';
const COLOR_ACCENT = '#f0b8a8';

const WaterChart: React.FC<WaterChartProps> = ({ data, targetCups = 8 }) => {
  const dates = data.map((item: StatsItem) => item.date.slice(5));
  const values = data.map((item: StatsItem) => item.value);

  const avg =
    data.length > 0
      ? values.reduce((s: number, v: number) => s + v, 0) / data.length
      : 0;
  const achieveDays = values.filter((v: number) => v >= targetCups).length;
  const rate = data.length > 0 ? Math.round((achieveDays / data.length) * 100) : 0;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const date = list[0]?.name ?? '';
        const v = Number(list[0]?.value ?? 0);
        return `${date}<br/>喝水量：${v} 杯`;
      },
    },
    legend: { bottom: 0, type: 'scroll', itemGap: 12, textStyle: { fontSize: 12 } },
    grid: { left: 38, right: 12, top: 25, bottom: 25, containLabel: false },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: dates,
      axisLabel: { fontSize: 12, color: 'rgba(60,80,70,0.6)' },
    },
    yAxis: {
      type: 'value',
      name: '杯数',
      min: 0,
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
      nameTextStyle: { fontSize: 12 },
    },
    series: [
      {
        name: '喝水量',
        type: 'bar',
        data: values,
        itemStyle: {
          color: COLOR_PRIMARY,
          borderRadius: [4, 4, 0, 0],
        },
        barMaxWidth: 20,
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: COLOR_ACCENT, type: 'dashed' },
          data: [{ yAxis: targetCups, name: '目标' }],
          label: { formatter: () => `目标 ${targetCups} 杯`, fontSize: 12 },
        },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-4">
      <ReactECharts option={option} theme="ud" autoResize={true} className="h-[300px] w-full chart-container" />
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-primary-light/50 rounded-xl py-3">
          <div className="text-xl font-medium text-foreground tabular-nums">
             {avg.toFixed(1)}
           </div>
           <div className="text-sm text-muted-foreground">平均(杯/天)</div>
        </div>
        <div className="bg-accent-light/50 rounded-xl py-3">
          <div className="text-xl font-medium text-foreground tabular-nums">
             {achieveDays}
           </div>
           <div className="text-sm text-muted-foreground">达标天数</div>
        </div>
        <div className="rounded-xl py-3" style={{ background: '#e6f0f9' }}>
          <div className="text-xl font-medium text-foreground tabular-nums">
             {rate}%
           </div>
           <div className="text-sm text-muted-foreground">达成率</div>
        </div>
      </div>
    </div>
  );
};

export default WaterChart;
