import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface CompactHorizontalBarProps {
  data: { name: string; value: number }[];
  color?: string;
  unit?: string;
}

const CompactHorizontalBar: React.FC<CompactHorizontalBarProps> = ({
  data,
  color = '#f0b8a8',
  unit = '次',
}) => {
  const sorted = [...data].sort((a, b) => a.value - b.value).slice(-8);
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const p = list[0] as { name: string; value: number };
        return `${p.name}<br/>${p.value} ${unit}`;
      },
    },
    grid: { left: 38, right: 12, top: 25, bottom: 25, containLabel: false },
    xAxis: {
      type: 'value',
      axisLabel: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((d) => d.name),
      axisLabel: { fontSize: 12, color: 'rgba(60,80,70,0.5)', margin: 4 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((d) => d.value),
        barMaxWidth: 14,
        itemStyle: { color, borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          fontSize: 12,
          color: 'rgba(60,80,70,0.8)',
        },
      },
    ],
  };

  return <ReactECharts option={option} theme="ud" autoResize={true} className="chart-container" style={{ width: '100%', height: '100%' }} />;
};

export default CompactHorizontalBar;
