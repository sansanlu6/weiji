import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { CorrelationResult } from '@shared/api.interface';

interface CorrelationChartProps {
  data: CorrelationResult;
  primaryLabel?: string;
  secondaryLabel?: string;
}

const COLOR_PRIMARY = '#a3d977';
const COLOR_ACCENT = '#f0b8a8';

const CorrelationChart: React.FC<CorrelationChartProps> = ({
  data,
  primaryLabel = '睡眠时长(小时)',
  secondaryLabel = '情绪得分',
}) => {
  const dates = data.chartData.map((item) => item.date.slice(5));
  const primary = data.chartData.map((item) => item.primary);
  const secondary = data.chartData.map((item) => item.secondary);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params];
        const date = list[0]?.name ?? '';
        const parts: string[] = [`${date}`];
        for (const p of list) {
          parts.push(`${p.seriesName}：${p.value}`);
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
        name: primaryLabel,
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
      },
      {
        type: 'value',
        name: secondaryLabel,
        nameGap: 8,
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
      },
    ],
    series: [
      {
        name: primaryLabel,
        type: 'line',
        data: primary,
        smooth: true,
        itemStyle: { color: COLOR_PRIMARY },
        lineStyle: { width: 2 },
        areaStyle: {
          opacity: 0.15,
          color: COLOR_PRIMARY,
        },
      },
      {
        name: secondaryLabel,
        type: 'line',
        yAxisIndex: 1,
        data: secondary,
        smooth: true,
        itemStyle: { color: COLOR_ACCENT },
        lineStyle: { width: 2 },
        areaStyle: {
          opacity: 0.15,
          color: COLOR_ACCENT,
        },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-xl p-4 text-sm text-foreground"
        style={{ background: 'linear-gradient(135deg, #e8f5d8 0%, #fdeae6 100%)' }}
      >
        <div className="font-medium mb-1">💡 分析结论</div>
        <div className="text-muted-foreground leading-relaxed">
          {data.description}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          相关系数：
          <span className="font-medium text-foreground tabular-nums">
            {data.correlation.toFixed(2)}
          </span>
        </div>
      </div>
      <ReactECharts option={option} theme="ud" autoResize={true} className="h-[300px] w-full chart-container" />
    </div>
  );
};

export default CorrelationChart;
