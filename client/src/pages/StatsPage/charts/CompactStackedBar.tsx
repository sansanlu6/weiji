import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface CompactStackedBarProps {
  categories: string[];
  data: { name: string; value: number; color: string }[];
}

const CompactStackedBar: React.FC<CompactStackedBarProps> = ({ categories, data }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const p = params as { name: string; value: number; percent?: number };
        return `${p.name}<br/>${p.value} (${p.percent?.toFixed(0) ?? 0}%)`;
      },
    },
    grid: { left: 38, right: 12, top: 25, bottom: 25, containLabel: false },
    xAxis: { type: 'value', show: false, max: total || 1 },
    yAxis: { type: 'category', data: [''], show: false },
    series: [
      {
        type: 'bar',
        stack: 'total',
        barWidth: 12,
        data: data.map((d) => ({
          name: d.name,
          value: d.value,
          itemStyle: {
            color: d.color,
            borderRadius: d === data[0] ? [4, 0, 0, 4] : d === data[data.length - 1] ? [0, 4, 4, 0] : 0,
          },
        })),
      },
    ],
  };

  return <ReactECharts option={option} theme="ud" autoResize={true} className="chart-container" style={{ width: '100%', height: 20 }} />;
};

export default CompactStackedBar;
