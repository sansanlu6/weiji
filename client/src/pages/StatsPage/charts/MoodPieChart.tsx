import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { MoodDistribution } from '@shared/api.interface';

interface MoodPieChartProps {
  data: MoodDistribution[];
}

const COLORS = [
  '#a3d977',
  '#f0b8a8',
  '#8fc9e0',
  '#e8c870',
  '#c9b3e0',
  '#f0b8d8',
  '#b5c5d6',
];

const MoodPieChart: React.FC<MoodPieChartProps> = ({ data }) => {
  // 最多显示前5种，其他合并（charts-skill 要求饼图≤5类别）
  const sorted = [...data].sort(
    (a: MoodDistribution, b: MoodDistribution) => b.count - a.count,
  );
  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const restCount = rest.reduce(
    (s: number, item: MoodDistribution) => s + item.count,
    0,
  );
  if (restCount > 0) {
    top.push({ mood: '其他', count: restCount });
  }

  const pieData = top.map((item: MoodDistribution, idx: number) => ({
    name: item.mood,
    value: item.count,
    itemStyle: { color: COLORS[idx % COLORS.length] },
  }));

  const total = top.reduce((s: number, item: MoodDistribution) => s + item.count, 0);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const p = params as { name: string; value: number; percent?: number };
        const percent =
          total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';
        return `${p.name}<br/>次数：${p.value} 次<br/>占比：${percent}%`;
      },
    },
    legend: { bottom: 0, type: 'scroll', itemGap: 12, textStyle: { fontSize: 12 } },
    series: [
      {
        name: '情绪分布',
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        data: pieData,
        label: { show: false },
        emphasis: { label: { show: false } },
      },
    ],
  };

  return <ReactECharts option={option} theme="ud" autoResize={true} className="h-[300px] w-full chart-container" />;
};

export default MoodPieChart;
