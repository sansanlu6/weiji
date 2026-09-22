import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface HalfYearPoopChartProps {
  months: string[];
  totalCount: number[];
  abnormalCount: number[];
}

const ABNORMAL_TYPES = ['便秘', '腹泻', '干结', '其他'];

const HalfYearPoopChart: React.FC<HalfYearPoopChartProps> = ({
  months,
  totalCount,
  abnormalCount,
}) => {
  const maxTotal = Math.max(...totalCount, 1);
  const maxAbnormal = Math.max(...abnormalCount, 1);
  const minSize = 12;
  const maxSize = 48;

  const scatterData = months.map((_, i) => {
    const ratio = totalCount[i] > 0
      ? abnormalCount[i] / maxAbnormal
      : 0;
    const size = totalCount[i] > 0
      ? minSize + ratio * (maxSize - minSize)
      : 0;
    const hasAbnormal = abnormalCount[i] > 0;
    return {
      value: [i, totalCount[i]],
      symbolSize: size,
      itemStyle: {
        color: hasAbnormal ? '#E8A090' : '#9CCC65',
        opacity: 0.75,
      },
    };
  });

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const p = params as {
          dataIndex: number;
          value: number[];
        };
        const total = p.value[1];
        const abnormal = abnormalCount[p.dataIndex];
        const normal = total - abnormal;
        return `${months[p.dataIndex]}<br/>总次数: ${total}<br/>正常: ${normal}<br/>异常: ${abnormal}`;
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
      name: '次数',
      nameTextStyle: { fontSize: 12, color: '#94A3B8' },
      axisLabel: { fontSize: 12, color: '#94A3B8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
      minInterval: 1,
      min: 0,
    },
    series: [
      {
        type: 'scatter',
        data: scatterData,
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

export default HalfYearPoopChart;
