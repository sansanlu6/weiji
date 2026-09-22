import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface HalfYearMedicationChartProps {
  medicines: { name: string; count: number }[];
}

const HalfYearMedicationChart: React.FC<HalfYearMedicationChartProps> = ({
  medicines,
}) => {
  const names = medicines.map((m) => m.name);
  const counts = medicines.map((m) => m.count);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const p = list[0] as { name: string; value: number };
        return `${p.name}<br/>${p.value} 次`;
      },
    },
    grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      show: false,
    },
    yAxis: {
      type: 'category',
      data: names,
      inverse: true,
      axisLabel: {
        fontSize: 12,
        color: '#334155',
        align: 'right',
        margin: 8,
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: counts,
        barMaxWidth: 18,
        itemStyle: {
          color: '#C9B3E0',
          borderRadius: 20,
        },
        label: {
          show: true,
          position: 'right',
          fontSize: 12,
          color: '#334155',
          formatter: '{c} 次',
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

export default HalfYearMedicationChart;
