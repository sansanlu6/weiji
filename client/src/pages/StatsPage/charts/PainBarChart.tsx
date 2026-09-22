import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { PainFrequency } from '@shared/api.interface';

interface PainBarChartProps {
  data: PainFrequency[];
}

const COLOR_ACCENT = '#f0b8a8';

const PainBarChart: React.FC<PainBarChartProps> = ({ data }) => {
  const sorted = [...data]
    .sort((a: PainFrequency, b: PainFrequency) => a.count - b.count)
    .slice(-10);

  const symptoms = sorted.map((item: PainFrequency) => item.symptom);
  const counts = sorted.map((item: PainFrequency) => item.count);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const name = list[0]?.name ?? '';
        const v = Number(list[0]?.value ?? 0);
        return `${name}<br/>发作次数：${v} 次`;
      },
    },
    legend: { bottom: 0, type: 'scroll', itemGap: 12, textStyle: { fontSize: 12 } },
    grid: { left: 38, right: 12, top: 25, bottom: 25, containLabel: false },
    xAxis: {
      type: 'value',
      name: '次数',
      axisLabel: {
        width: 30,
        overflow: 'truncate',
        fontSize: 12,
        color: 'rgba(60,80,70,0.5)',
        margin: 4,
      },
      nameTextStyle: { fontSize: 14 },
    },
    yAxis: {
      type: 'category',
      data: symptoms,
      axisLabel: { fontSize: 12, color: 'rgba(60,80,70,0.5)', margin: 4 },
    },
    series: [
      {
        name: '发作次数',
        type: 'bar',
        data: counts,
        itemStyle: {
          color: COLOR_ACCENT,
          borderRadius: [0, 4, 4, 0],
        },
        barMaxWidth: 16,
      },
    ],
  };

  return <ReactECharts option={option} theme="ud" autoResize={true} className="h-[300px] w-full chart-container" />;
};

export default PainBarChart;
