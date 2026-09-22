import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface HalfYearPainChartProps {
  months: string[];
  episodeDays: number[];
  severeDays: number[];
  peakIdx: number;
}

const HalfYearPainChart: React.FC<HalfYearPainChartProps> = ({
  months,
  episodeDays,
  severeDays,
  peakIdx,
}) => {
  const maxDays = Math.max(...episodeDays, 1);
  const minSize = 15;
  const maxSize = 60;

  const scatterData = months.map((_, i) => {
    const ratio = episodeDays[i] / maxDays;
    const size = minSize + ratio * (maxSize - minSize);
    const hasSevere = severeDays[i] > 0;
    return {
      name: `${episodeDays[i]}天`,
      value: [i, 0],
      symbolSize: size,
      itemStyle: {
        color: hasSevere ? '#E8A090' : '#F0B8A8',
        opacity: 0.85,
        borderWidth: 0,
      },
    };
  });

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const p = params as { dataIndex: number };
        return `${months[p.dataIndex]}<br/>发作: ${episodeDays[p.dataIndex]} 天<br/>重症: ${severeDays[p.dataIndex]} 天`;
      },
    },
    grid: { left: 'center', right: 'center', top: '15%', bottom: 10, width: '85%', containLabel: false },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { fontSize: 12, color: '#94A3B8' },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      show: false,
      min: -1,
      max: 1,
    },
    series: [
      {
        type: 'scatter',
        data: scatterData,
        label: {
          show: true,
          position: 'inside',
          fontSize: 12,
          color: '#fff',
          fontWeight: 'bold',
          formatter: '{b}',
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 36,
          label: { fontSize: 10, color: '#fff' },
          data: [
            {
              name: '峰值',
              coord: [peakIdx, 0.5],
              value: '峰值',
              itemStyle: { color: '#E8A090' },
            },
          ],
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

export default HalfYearPainChart;
