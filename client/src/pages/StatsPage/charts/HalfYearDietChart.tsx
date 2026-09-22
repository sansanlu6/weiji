import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface HalfYearDietChartProps {
  months: string[];
  takeoutCount: number[];
  takeoutTrend: number[];
}

const HalfYearDietChart: React.FC<HalfYearDietChartProps> = ({
  months,
  takeoutCount,
  takeoutTrend,
}) => {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    grid: { left: 8, right: 32, top: '15%', bottom: 10, containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { fontSize: 12, color: '#94A3B8' },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: '次数',
        nameTextStyle: { fontSize: 12, color: '#94A3B8' },
        axisLabel: { fontSize: 12, color: '#94A3B8' },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
      },
      {
        type: 'value',
        name: '占比%',
        nameTextStyle: { fontSize: 12, color: '#94A3B8' },
        axisLabel: { fontSize: 12, color: '#94A3B8', formatter: '{value}%' },
        splitLine: { show: false },
        min: 0,
        max: 100,
      },
    ],
    series: [
      {
        name: '次数',
        type: 'bar',
        data: takeoutCount,
        barMaxWidth: 28,
        itemStyle: {
          color: '#FFB085',
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: '占比%',
        type: 'line',
        yAxisIndex: 1,
        data: takeoutTrend,
        lineStyle: { type: 'dashed', color: '#F0B8A8', width: 2 },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#F0B8A8' },
      },
    ],
  };

  return (
    <div className="w-[328px] md:w-full mx-auto" style={{ height: '100%' }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};

export default HalfYearDietChart;
