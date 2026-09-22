import { Moon } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { MonthlyDetailStats } from '@shared/api.interface';

interface SleepMonthModuleProps {
  data: MonthlyDetailStats['sleep'];
}

const QUALITY_COLORS = { good: '#73d13d', medium: '#ffc53d', poor: '#ff7875' };

const SleepMonthModule: React.FC<SleepMonthModuleProps> = ({ data }) => {
  // 按周分组的睡眠质量（后端扩展字段，用可选链防御）
  const weeklyQuality = data.weeklyQuality;

  const weeks = weeklyQuality?.map((w) => w.weekLabel) ?? ['第1周', '第2周', '第3周', '第4周'];
  const goodData = weeklyQuality?.map((w) => w.good) ?? [0, 0, 0, 0];
  const mediumData = weeklyQuality?.map((w) => w.medium) ?? [0, 0, 0, 0];
  const poorData = weeklyQuality?.map((w) => w.poor) ?? [0, 0, 0, 0];

  const avgHours = data.avgHours ?? 0;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        if (list.length === 0) return '';
        const header = `${list[0].name}<br/>`;
        const body = list
          .map((p) => {
            const item = p as { marker: string; seriesName: string; value: number };
            return `${item.marker}${item.seriesName}：${item.value}天`;
          })
          .join('<br/>');
        return header + body;
      },
    },
    legend: {
      data: ['好', '中', '差', '月均时长'],
      bottom: 2,
      itemGap: 12,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 12 },
    },
    grid: { left: 30, right: 28, top: 20, bottom: 48, containLabel: false },
    xAxis: {
      type: 'category',
      data: weeks,
      axisLabel: { fontSize: 12, color: 'rgba(60,80,70,0.6)' },
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
        name: '好',
        type: 'bar',
        stack: 'quality',
        barMaxWidth: 24,
        data: goodData,
        itemStyle: { color: QUALITY_COLORS.good },
      },
      {
        name: '中',
        type: 'bar',
        stack: 'quality',
        barMaxWidth: 24,
        data: mediumData,
        itemStyle: { color: QUALITY_COLORS.medium },
      },
      {
        name: '差',
        type: 'bar',
        stack: 'quality',
        barMaxWidth: 24,
        data: poorData,
        itemStyle: { color: QUALITY_COLORS.poor, borderRadius: [3, 3, 0, 0] },
      },
      {
        name: '月均时长',
        type: 'line',
        data: new Array(weeks.length).fill(avgHours),
        symbol: 'none',
        lineStyle: { type: 'dashed', color: '#9aaedb', width: 1 },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#9aaedb' },
          label: {
            formatter: `月均 ${avgHours}h`,
             fontSize: 12,
            position: 'insideEndTop',
          },
          data: [{ yAxis: avgHours }],
        },
      },
    ],
  };

  return (
    <div className="paper-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-sleep-bg flex items-center justify-center">
          <Moon className="w-3.5 h-3.5 text-module-sleep" strokeWidth={2} />
        </div>
        <div className="text-base font-sans-hei font-semibold">
          睡眠·每周质量构成
        </div>
      </div>
      <div className="h-[220px] mx-auto w-[308px] md:w-full">
        <ReactECharts option={option} theme="ud" autoResize={true} className="chart-container" style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default SleepMonthModule;
