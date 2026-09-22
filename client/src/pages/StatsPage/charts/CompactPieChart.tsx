import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface CompactPieChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
  size?: number;
}

const CompactPieChart: React.FC<CompactPieChartProps> = ({ data, colors, size = 120 }) => {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const p = params as { name: string; value: number; percent?: number };
        return `${p.name}<br/>${p.value} (${p.percent?.toFixed(0) ?? 0}%)`;
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '50%'],
        data: data.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: colors?.[i % colors.length] ?? '#a3d977' },
        })),
        label: { show: false },
        emphasis: { label: { show: false }, scale: false },
      },
    ],
  };

  return (
    <div style={{ width: size, height: size }}>
      <ReactECharts option={option} theme="ud" autoResize={true} className="chart-container" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default CompactPieChart;
