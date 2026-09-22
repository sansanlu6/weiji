import { Smile } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import type { MonthlyDetailStats } from '@shared/api.interface';

interface MoodMonthModuleProps {
  data: MonthlyDetailStats['mood'];
  currentMonth: dayjs.Dayjs;
}

const POSITIVE_MOODS = ['开心', '平静', '幸福', '充实', '感动', '满足', '兴奋', '轻松'];
const NEGATIVE_MOODS = ['焦虑', '低落', '烦躁', '疲惫', '失落', '愤怒', '难过', '压力'];

const MOOD_COLORS = [
  'hsl(45, 65%, 72%)',
  'hsl(15, 60%, 75%)',
  'hsl(180, 32%, 75%)',
  'hsl(270, 25%, 78%)',
  'hsl(95, 45%, 72%)',
  'hsl(200, 45%, 78%)',
  'hsl(30, 60%, 75%)',
  'hsl(300, 25%, 78%)',
  'hsl(160, 35%, 76%)',
  'hsl(210, 35%, 78%)',
];

const MoodMonthModule: React.FC<MoodMonthModuleProps> = ({ data, currentMonth }) => {
  const distribution = data.distribution ?? [];
  const sortedMoods = distribution.slice().sort((a, b) => b.count - a.count);
  const totalCount = sortedMoods.reduce((sum, m) => sum + m.count, 0);
  const hasData = sortedMoods.length > 0 && totalCount > 0;

  const series = sortedMoods.map((mood, idx) => ({
    type: 'bar' as const,
    name: mood.mood,
    stack: 'total',
    barWidth: 28,
    data: [Number(((mood.count / totalCount) * 100).toFixed(1))],
    itemStyle: {
      color: MOOD_COLORS[idx % MOOD_COLORS.length],
      borderRadius: 0,
    },
    emphasis: {
      itemStyle: {
        opacity: 0.85,
        shadowBlur: 6,
        shadowColor: 'rgba(120, 110, 90, 0.18)',
      },
    },
  }));

  if (series.length > 0) {
    (series[0].itemStyle as any).borderRadius = [14, 0, 0, 14];
    (series[series.length - 1].itemStyle as any).borderRadius = [0, 14, 14, 0];
  }

  const stackedOption: EChartsOption = {
    tooltip: {
      trigger: 'item',
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
        const p = params as { name: string; value: number; seriesName?: string; dataIndex?: number };
        const moodItem = sortedMoods.find((m) => m.mood === p.seriesName);
        const count = moodItem?.count ?? 0;
        const name = p.seriesName ?? p.name;
        return `<div style="font-weight: 500; margin-bottom: 2px;">${name}</div>
                <div style="color: hsl(160, 8%, 50%); font-size: 12px;">出现次数：${count} 次</div>
                <div style="color: hsl(160, 8%, 50%); font-size: 12px;">占比：${Number(p.value).toFixed(1)}%</div>`;
      },
    },
    grid: {
      left: 12,
      right: 12,
      top: 0,
      bottom: 0,
      containLabel: false,
    },
    xAxis: {
      type: 'value',
      max: 100,
      show: false,
    },
    yAxis: {
      type: 'category',
      data: [''],
      show: false,
    },
    series,
    animationDuration: 500,
    animationEasingUpdate: 'cubicOut',
  };

  // 情绪日历热力图 - CSS grid 实现
  const daysInMonth = currentMonth.daysInMonth();
  const firstDay = currentMonth.startOf('month');
  const firstWeekday = firstDay.day();
  const mondayOffset = firstWeekday === 0 ? -6 : 1 - firstWeekday;
  const gridStart = firstDay.add(mondayOffset, 'day');

  const dailyMap = new Map<string, string>();
  for (const d of data.dailyTrend ?? []) {
    dailyMap.set(d.date, d.mood);
  }

  const cells: { date: dayjs.Dayjs; inMonth: boolean; mood: string }[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = gridStart.add(i, 'day');
    const dateStr = d.format('YYYY-MM-DD');
    cells.push({
      date: d,
      inMonth: d.month() === firstDay.month(),
      mood: dailyMap.get(dateStr) ?? '',
    });
  }

  const getMoodColor = (mood: string, inMonth: boolean): string => {
    if (!inMonth) return '#fafafa';
    if (!mood) return '#f5f5f5';
    if (POSITIVE_MOODS.includes(mood)) return '#d9f7be';
    if (NEGATIVE_MOODS.includes(mood)) return '#ffccc7';
    return '#fff1b8';
  };

  const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="paper-card p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-mood-bg flex items-center justify-center">
          <Smile className="w-3.5 h-3.5 text-module-mood" strokeWidth={2} />
        </div>
        <div className="text-base font-sans-hei font-semibold">情绪·类型占比</div>
      </div>

      {/* 堆叠条形图 */}
      <div className="px-1">
        {hasData ? (
          <div className="h-7 w-full">
            <ReactECharts
              option={stackedOption}
              theme="ud"
              autoResize={true}
              className="chart-container"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        ) : (
          <div className="h-7 flex items-center justify-center text-sm text-muted-foreground">
            本月无情绪记录
          </div>
        )}
      </div>

      {/* 情绪图例 */}
      {hasData && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center px-1">
          {sortedMoods.map((mood, idx) => (
            <div key={mood.mood} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: MOOD_COLORS[idx % MOOD_COLORS.length] }}
              />
              <span className="text-sm text-muted-foreground font-sans-hei">
                {mood.mood}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 情绪日历热力图 */}
      <div className="pt-2 border-t border-border/50">
        <div className="text-base font-sans-hei font-semibold text-foreground/80 mb-1.5 text-center">情绪日历</div>
        <div className="grid grid-cols-7 gap-0.5">
          {weekLabels.map((w) => (
             <div key={w} className="text-center text-sm text-muted-foreground py-0.5">
              {w}
            </div>
          ))}
          {cells.map(({ date, inMonth, mood }) => (
            <div
              key={date.format('YYYY-MM-DD')}
               className="aspect-square rounded flex items-center justify-center text-sm tabular-nums"
              style={{
                backgroundColor: getMoodColor(mood, inMonth),
                color: inMonth ? 'rgba(60,80,70,0.8)' : 'rgba(60,80,70,0.2)',
              }}
              title={inMonth && mood ? `${date.format('M-D')}: ${mood}` : ''}
            >
              {date.date()}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 mt-2">
          {[
            { label: '积极', color: '#d9f7be' },
            { label: '中性', color: '#fff1b8' },
            { label: '消极', color: '#ffccc7' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoodMonthModule;
