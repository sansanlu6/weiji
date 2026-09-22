import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface HalfYearExerciseChartProps {
  months: string[];
  sessionCount: number[];
}

const HalfYearExerciseChart: React.FC<HalfYearExerciseChartProps> = ({
  months,
  sessionCount,
}) => {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const p = list[0] as { name: string; value: number };
        return `${p.name}<br/>运动: ${p.value} 次`;
      },
    },
    grid: { left: 8, right: 8, top: '15%', bottom: 10, containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisLabel: { fontSize: 12, color: '#94A3B8' },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '次数',
      nameTextStyle: { fontSize: 12, color: '#94A3B8' },
      axisLabel: { fontSize: 12, color: '#94A3B8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
      minInterval: 1,
    },
    series: [
      {
        type: 'line',
        data: sessionCount,
        step: 'middle',
        symbol: 'circle',
        symbolSize: 10,
        lineStyle: { color: '#9CCC65', width: 2 },
        itemStyle: { color: '#9CCC65' },
        areaStyle: {
          color: 'rgba(156,204,101,0.15)',
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

export default HalfYearExerciseChart;
