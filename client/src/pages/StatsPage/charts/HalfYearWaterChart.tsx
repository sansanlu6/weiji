import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface HalfYearWaterChartProps {
  months: string[];
  totalCups: number[];
  targetCups: number;
  bestIdx: number;
}

const HalfYearWaterChart: React.FC<HalfYearWaterChartProps> = ({
  months,
  totalCups,
  targetCups,
}) => {
  const maxVal = Math.max(...totalCups, targetCups * 2, 10);
  const yMax = Math.ceil(maxVal / 10) * 10;

  const barData = totalCups.map((v, i) => ({
    value: v,
    itemStyle: {
      color: v >= targetCups ? '#9CCC65' : '#8FC9E0',
      borderRadius: [4, 4, 0, 0],
    },
  }));

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const p = list[0] as { name: string; value: number };
        return `${p.name}<br/>总喝水: ${p.value} 杯`;
      },
    },
    grid: { left: 8, right: 8, top: '15%', bottom: 10, containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { fontSize: 12, color: '#94A3B8' },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '杯',
      nameTextStyle: { fontSize: 12, color: '#94A3B8' },
      axisLabel: { fontSize: 12, color: '#94A3B8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
      min: 0,
      max: yMax,
      minInterval: 1,
    },
    series: [
      {
        type: 'bar',
        data: barData,
        barMaxWidth: 28,
        label: {
          show: true,
          position: 'top',
          fontSize: 11,
          color: '#64748B',
          formatter: (params: any) =>
            params.value > 0 ? `${params.value}` : '',
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%' }}
    />
  );
};

export default HalfYearWaterChart;
