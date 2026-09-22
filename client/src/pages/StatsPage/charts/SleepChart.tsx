import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { SleepStatsItem } from '@client/src/api/stats';

interface SleepChartProps {
  data: SleepStatsItem[];
}

const COLOR_PRIMARY = '#a3d977';
const COLOR_ACCENT = '#f0b8a8';
const COLOR_THIRD = '#8fc9e0';

const SleepChart: React.FC<SleepChartProps> = ({ data }) => {
  const dates = data.map((item: SleepStatsItem) => item.date.slice(5));

  const toHourMinute = (t?: string): number | null => {
    if (!t) return null;
    const match = t.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (h < 12) h += 24;
    return h + m / 60;
  };

  const sleepTimes = data.map((item: SleepStatsItem) =>
    toHourMinute(item.sleepTime),
  );
  const wakeTimes = data.map((item: SleepStatsItem) =>
    toHourMinute(item.wakeTime),
  );
  const durations = data.map(
    (item: SleepStatsItem) =>
      Math.round(((item.durationMinutes ?? 0) / 60) * 10) / 10,
  );

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const date = list[0]?.name ?? '';
        const parts: string[] = [`${date}`];
        for (const p of list) {
          const raw = p.value;
          if (raw == null || raw === '' || Number.isNaN(Number(raw))) continue;
          const v = Number(raw);
          if (p.seriesName === '睡眠时长') {
            parts.push(`睡眠时长：${v} 小时`);
          } else if (p.seriesName === '入睡时间') {
            const h = Math.floor(v) % 24;
            const m = Math.round((v - Math.floor(v)) * 60);
            parts.push(`入睡时间：${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
          } else if (p.seriesName === '起床时间') {
            const h = Math.floor(v) % 24;
            const m = Math.round((v - Math.floor(v)) * 60);
            parts.push(`起床时间：${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
          }
        }
        return parts.join('<br/>');
      },
    },
    legend: { bottom: 0, type: 'scroll', itemGap: 12, textStyle: { fontSize: 12 } },
    grid: { left: 38, right: 38, top: 25, bottom: 25, containLabel: false },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: dates,
      axisLabel: { fontSize: 12, color: 'rgba(60,80,70,0.6)' },
    },
    yAxis: [
      {
        type: 'value',
        name: '时长(小时)',
        min: 0,
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
        nameTextStyle: { fontSize: 12 },
      },
      {
        type: 'value',
        name: '时间(时)',
        nameGap: 8,
        min: 12,
        max: 36,
        interval: 6,
        axisLabel: {
          width: 30,
          overflow: 'truncate',
          fontSize: 12,
          color: 'rgba(60,80,70,0.5)',
          margin: 4,
          formatter: (value: number) => {
            const v = value % 24;
            return `${String(Math.floor(v)).padStart(2, '0')}:00`;
          },
        },
        nameTextStyle: { fontSize: 14 },
      },
    ],
    series: [
      {
        name: '睡眠时长',
        type: 'bar',
        data: durations,
        itemStyle: {
          color: COLOR_PRIMARY,
          borderRadius: [4, 4, 0, 0],
        },
        barMaxWidth: 20,
      },
      {
        name: '入睡时间',
        type: 'line',
        yAxisIndex: 1,
        data: sleepTimes,
        smooth: true,
        connectNulls: false,
        itemStyle: { color: COLOR_ACCENT },
        lineStyle: { width: 2 },
      },
      {
        name: '起床时间',
        type: 'line',
        yAxisIndex: 1,
        data: wakeTimes,
        smooth: true,
        connectNulls: false,
        itemStyle: { color: COLOR_THIRD },
        lineStyle: { width: 2 },
      },
    ],
  };

  return (
    <ReactECharts option={option} theme="ud" autoResize={true} className="h-[300px] w-full chart-container" />
  );
};

export default SleepChart;
