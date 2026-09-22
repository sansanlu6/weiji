import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface CompactBarChartProps {
  xData: string[];
  yData: number[];
  color?: string;
  unit?: string;
  barMaxWidth?: number;
  rotateLabel?: boolean;
}

const CompactBarChart: React.FC<CompactBarChartProps> = ({
  xData,
  yData,
  color = '#a3d977',
  unit = '',
  barMaxWidth = 24,
  rotateLabel = false,
}) => {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const p = list[0] as { name: string; value: number };
        return `${p.name}<br/>${p.value}${unit}`;
      },
    },
    grid: { left: 38, right: 12, top: 25, bottom: 25, containLabel: false },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: {
        fontSize: 12,
        color: 'rgba(60,80,70,0.6)',
        rotate: rotateLabel ? 30 : 0,
      },
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
        data: yData,
        barMaxWidth,
        itemStyle: { color, borderRadius: [3, 3, 0, 0] },
      },
    ],
  };

  return <ReactECharts option={option} theme="ud" autoResize={true} className="chart-container" style={{ height: '100%', width: '100%' }} />;
};

export default CompactBarChart;
