import { Dumbbell } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { MonthlyDetailStats } from '@shared/api.interface';

interface ExerciseMonthModuleProps {
  data: MonthlyDetailStats['exercise'];
}

const EX_COLORS = [
  'hsl(95, 55%, 60%)',
  'hsl(45, 70%, 75%)',
  'hsl(15, 70%, 78%)',
  'hsl(195, 50%, 78%)',
  'hsl(270, 30%, 80%)',
  'hsl(170, 40%, 72%)',
];

const ExerciseMonthModule: React.FC<ExerciseMonthModuleProps> = ({ data }) => {
  const typeComp = data.typeComposition ?? [];
  const sortedTypes = typeComp.slice().sort((a, b) => b.minutes - a.minutes);
  const totalMinutes = sortedTypes.reduce((sum, t) => sum + t.minutes, 0);
  const hasData = sortedTypes.length > 0 && totalMinutes > 0;

  const barOption: EChartsOption = {
    tooltip: {
      trigger: 'item',
      confine: false,
      appendToBody: true,
      extraCssText: 'z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.08);',
      backgroundColor: '#ffffff',
      borderColor: 'hsl(95, 40%, 75%)',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: {
        color: 'hsl(160, 15%, 25%)',
        fontSize: 13,
        fontFamily: '"Source Han Sans CN", "思源黑体", "Noto Sans SC", sans-serif',
      },
      formatter: (params) => {
        const p = params as { name: string; value: number; seriesName?: string };
        const typeItem = sortedTypes.find((t) => t.type === p.name);
        const mins = typeItem?.minutes ?? 0;
        const pct = totalMinutes > 0 ? ((mins / totalMinutes) * 100).toFixed(1) : '0';
        return `<div style="font-weight: 500; margin-bottom: 2px;">${p.name}</div>
                <div style="color: hsl(160, 8%, 50%); font-size: 12px;">总时长：${mins} 分钟</div>
                <div style="color: hsl(160, 8%, 50%); font-size: 12px;">占比：${pct}%</div>`;
      },
    },
    grid: {
      left: 38,
      right: 12,
      top: 25,
      bottom: 25,
      containLabel: false,
    },
    xAxis: {
      type: 'value',
      max: 100,
      show: false,
    },
    yAxis: {
      type: 'category',
      data: sortedTypes.map((t) => t.type),
      inverse: true,
      axisLabel: {
        fontSize: 12,
        color: 'rgba(60,80,70,0.5)',
        fontFamily: '"Source Han Sans CN", "思源黑体", "Noto Sans SC", sans-serif',
        fontWeight: 500,
        width: 60,
        overflow: 'truncate',
        margin: 4,
      },
      axisLine: { show: false },
      axisTick: { show: false },
      axisPointer: { type: 'shadow' },
    },
    series: [
      {
        type: 'bar',
        data: sortedTypes.map((item, idx) => ({
          value: totalMinutes > 0 ? Number(((item.minutes / totalMinutes) * 100).toFixed(1)) : 0,
          itemStyle: {
            color: EX_COLORS[idx % EX_COLORS.length],
            borderRadius: [0, 10, 10, 0],
          },
        })),
        barWidth: 16,
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(180, 200, 190, 0.12)',
          borderRadius: [0, 10, 10, 0],
        },
        label: {
          show: true,
          position: 'right',
          fontSize: 12,
          color: 'rgba(60, 80, 70, 0.7)',
          fontFamily: '"Source Han Sans CN", "思源黑体", "Noto Sans SC", sans-serif',
          formatter: (params: any) => {
            const typeItem = sortedTypes.find((t) => t.type === params.name);
            return `${typeItem?.minutes ?? 0}分钟`;
          },
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            opacity: 0.85,
            shadowBlur: 6,
            shadowColor: 'rgba(90, 130, 100, 0.18)',
          },
        },
        animationDuration: 500,
        animationEasing: 'cubicOut',
      },
    ],
  };

  return (
    <div className="paper-card p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-exercise-bg flex items-center justify-center">
          <Dumbbell className="w-3.5 h-3.5 text-module-exercise" strokeWidth={2} />
        </div>
        <div className="text-base font-sans-hei font-semibold">
          运动·类型与时长
        </div>
      </div>

      <div className="px-1 md:px-0 md:w-full flex justify-center">
        {hasData ? (
          <ReactECharts
            option={barOption}
            theme="ud"
            autoResize={true}
            className="chart-container"
            style={{ width: '450px', height: '110px' }}
          />
        ) : (
          <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
            本月无运动记录
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseMonthModule;
