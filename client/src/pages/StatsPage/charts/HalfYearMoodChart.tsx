import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface HalfYearMoodChartProps {
  months: string[];
  score: number[];
  positiveRate: number[];
}

const HalfYearMoodChart: React.FC<HalfYearMoodChartProps> = ({
  months,
  score,
}) => {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const p = list[0] as { name: string; value: number };
        return `${p.name}<br/>情绪指数: ${p.value.toFixed(2)}`;
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
      min: 0,
      max: 2,
      show: false,
    },
    series: [
      {
        type: 'line',
        data: score,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#9CCC65', width: 2 },
        itemStyle: { color: '#9CCC65' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(156,204,101,0.5)' },
              { offset: 1, color: 'rgba(156,204,101,0.05)' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="w-[290px] md:w-full mx-auto" style={{ height: '100%' }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};

export default HalfYearMoodChart;
