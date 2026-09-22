import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface HalfYearSleepChartProps {
  months: string[];
  good: number[];
  medium: number[];
  poor: number[];
  avgHours: number[];
  targetHours: number;
}

const HalfYearSleepChart: React.FC<HalfYearSleepChartProps> = ({
  months,
  good,
  medium,
  poor,
  avgHours,
  targetHours,
}) => {
  const maxDays = Math.max(
    ...good.map((_, i) => good[i] + medium[i] + poor[i]),
    1,
  );
  const yMaxDays = Math.max(Math.ceil(maxDays / 5) * 5, 10);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        if (list.length === 0) return '';
        const month = list[0].name as string;
        let goodDays = 0;
        let mediumDays = 0;
        let poorDays = 0;
        let avgH = 0;
        for (const item of list as { seriesName: string; value: number }[]) {
          if (item.seriesName === '良好') goodDays = item.value;
          else if (item.seriesName === '一般') mediumDays = item.value;
          else if (item.seriesName === '较差') poorDays = item.value;
          else if (item.seriesName === '平均时长') avgH = item.value;
        }
        return `${month}<br/>良好: ${goodDays}天<br/>一般: ${mediumDays}天<br/>较差: ${poorDays}天<br/>平均时长: ${avgH}h`;
      },
    },
    legend: {
      bottom: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { fontSize: 12, color: '#334155' },
    },
    grid: { left: 8, right: 28, top: '15%', bottom: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { fontSize: 12, color: '#94A3B8' },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: '天数',
        nameTextStyle: { fontSize: 12, color: '#94A3B8' },
        axisLabel: { fontSize: 12, color: '#94A3B8' },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } },
        min: 0,
        max: yMaxDays,
        minInterval: 1,
      },
      {
        type: 'value',
        name: '小时',
        nameTextStyle: { fontSize: 12, color: '#94A3B8' },
        axisLabel: { fontSize: 12, color: '#94A3B8' },
        splitLine: { show: false },
        min: 0,
        max: Math.max(targetHours * 1.2, 10),
      },
    ],
    series: [
      {
        name: '良好',
        type: 'bar',
        stack: 'quality',
        barMaxWidth: 28,
        itemStyle: { color: '#9CCC65' },
        data: good,
        label: {
          show: true,
          position: 'inside',
          fontSize: 10,
          color: '#fff',
          formatter: (params: any) =>
            params.value > 0 ? `${params.value}` : '',
        },
      },
      {
        name: '一般',
        type: 'bar',
        stack: 'quality',
        barMaxWidth: 28,
        itemStyle: { color: '#E6C98A' },
        data: medium,
      },
      {
        name: '较差',
        type: 'bar',
        stack: 'quality',
        barMaxWidth: 28,
        itemStyle: { color: '#F0B8A8' },
        data: poor,
      },
      {
        name: '平均时长',
        type: 'line',
        yAxisIndex: 1,
        lineStyle: { color: '#A8B5DB', width: 2 },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#A8B5DB' },
        data: avgHours,
      },
    ],
  };

  return (
    <div className="w-[325px] md:w-full mx-auto" style={{ height: '100%' }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};

export default HalfYearSleepChart;
