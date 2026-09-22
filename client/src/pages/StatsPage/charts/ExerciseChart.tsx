import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { StatsItem } from '@shared/api.interface';

interface ExerciseChartProps {
  data: StatsItem[];
}

const COLOR_PRIMARY = '#a3d977';
const COLOR_FOURTH = '#e8c870';

const ExerciseChart: React.FC<ExerciseChartProps> = ({ data }) => {
  const dates = data.map((item: StatsItem) => item.date.slice(5));
  const values = data.map((item: StatsItem) => item.value);

  // 按周统计（简单按日期分周）
  const weeks: { label: string; total: number; days: number }[] = [];
  data.forEach((item: StatsItem, idx: number) => {
    const weekIdx = Math.floor(idx / 7);
    if (!weeks[weekIdx]) {
      const start = item.date.slice(5);
      const end = data[Math.min(idx + 6, data.length - 1)].date.slice(5);
      weeks[weekIdx] = { label: `${start}~${end}`, total: 0, days: 0 };
    }
    if (item.value > 0) {
      weeks[weekIdx].total += item.value;
      weeks[weekIdx].days += 1;
    }
  });
  const activeWeeks = weeks.filter((w) => w.days >= 3).length;
  const weekRate =
    weeks.length > 0 ? Math.round((activeWeeks / weeks.length) * 100) : 0;

  const total = values.reduce((s: number, v: number) => s + v, 0);
  const avg = data.length > 0 ? total / data.length : 0;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const date = list[0]?.name ?? '';
        const v = Number(list[0]?.value ?? 0);
        return `${date}<br/>运动时长：${v} 分钟`;
      },
    },
    legend: { bottom: 0, type: 'scroll', itemGap: 12, textStyle: { fontSize: 12 } },
    grid: { left: 38, right: 12, top: 25, bottom: 25, containLabel: false },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: dates,
      axisLabel: { fontSize: 12, color: 'rgba(60,80,70,0.6)' },
    },
    yAxis: {
      type: 'value',
      name: '分钟',
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
    series: [
      {
        name: '运动时长',
        type: 'bar',
        data: values,
        itemStyle: {
          color: COLOR_FOURTH,
          borderRadius: [4, 4, 0, 0],
        },
        barMaxWidth: 20,
      },
    ],
  };

  return (
    <div className="flex flex-col gap-4">
      <ReactECharts option={option} theme="ud" autoResize={true} className="h-[300px] w-full chart-container" />
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-primary-light/50 rounded-xl py-3">
          <div className="text-xl font-medium text-foreground tabular-nums">
             {total}
           </div>
           <div className="text-sm text-muted-foreground">总运动(分钟)</div>
        </div>
        <div className="bg-accent-light/50 rounded-xl py-3">
          <div className="text-xl font-medium text-foreground tabular-nums">
             {avg.toFixed(0)}
           </div>
           <div className="text-sm text-muted-foreground">日均(分钟)</div>
        </div>
        <div
          className="rounded-xl py-3"
          style={{ background: '#fef6e0' }}
        >
          <div className="text-xl font-medium text-foreground tabular-nums">
             {weekRate}%
           </div>
           <div className="text-sm text-muted-foreground">每周达成率</div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseChart;
