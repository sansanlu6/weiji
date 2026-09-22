import { Utensils } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { MonthlyDetailStats } from '@shared/api.interface';

interface DietMonthModuleProps {
  data: MonthlyDetailStats['diet'];
  daysInMonth: number;
}

const DIET_TYPE_COLORS = { homemade: '#95de64', takeout: '#ffa940', dining: '#ff85c0' };

interface FoodSourceItem {
  type: string;
  count: number;
}

const DietMonthModule: React.FC<DietMonthModuleProps> = ({ data, daysInMonth }) => {
  // 后端扩展字段：饮食来源构成（家常/外卖/外食），用可选链防御
  const foodSource = (data as unknown as { foodSourceComposition?: FoodSourceItem[] })
    .foodSourceComposition;

  const getCount = (keyword: string): number => {
    const item = foodSource?.find(
      (c) => c.type === keyword || c.type.includes(keyword),
    );
    return item?.count ?? 0;
  };

  const homemade = getCount('家常');
  const takeout = getCount('外卖');
  const dining = getCount('外食');

  const total = homemade + takeout + dining || 1;

  const fullDays = data.fullMealDays ?? 0;
  const regularity = daysInMonth > 0 ? Math.round((fullDays / daysInMonth) * 100) : 0;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const p = params as { name: string; value: number; percent?: number };
        return `${p.name}<br/>${p.value} 次 (${p.percent?.toFixed(0) ?? 0}%)`;
      },
    },
    grid: { left: 38, right: 12, top: 25, bottom: 25, containLabel: false },
    xAxis: { type: 'value', show: false, max: total },
    yAxis: { type: 'category', data: [''], show: false },
    series: [
      {
        name: '饮食类型',
        type: 'bar',
        stack: 'total',
        barWidth: 28,
        data: [
          {
            name: '家常',
            value: homemade,
            itemStyle: { color: DIET_TYPE_COLORS.homemade, borderRadius: [6, 0, 0, 6] },
          },
          {
            name: '外卖',
            value: takeout,
            itemStyle: { color: DIET_TYPE_COLORS.takeout },
          },
          {
            name: '外食',
            value: dining,
            itemStyle: { color: DIET_TYPE_COLORS.dining, borderRadius: [0, 6, 6, 0] },
          },
        ],
        label: { show: false },
      },
    ],
  };

  return (
    <div className="paper-card p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-diet-bg flex items-center justify-center">
          <Utensils className="w-3.5 h-3.5 text-module-diet" strokeWidth={2} />
        </div>
        <div className="text-base font-sans-hei font-semibold">
          饮食·三餐类型构成
        </div>
      </div>

      {/* 单柱堆叠 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-7">
          {homemade + takeout + dining > 0 ? (
            <ReactECharts option={option} theme="ud" autoResize={true} className="chart-container" style={{ width: '100%', height: '100%' }} />
          ) : (
            <div className="h-full bg-muted/40 rounded-full" />
          )}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-around">
        {[
          { name: '家常', color: DIET_TYPE_COLORS.homemade, count: homemade },
          { name: '外卖', color: DIET_TYPE_COLORS.takeout, count: takeout },
          { name: '外食', color: DIET_TYPE_COLORS.dining, count: dining },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-muted-foreground">{item.name}</span>
            <span className="text-sm font-medium tabular-nums text-foreground/70">
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {/* 数字统计 */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
          <div className="bg-module-diet-bg/60 rounded-xl py-2 text-center">
            <div className="text-lg font-semibold tabular-nums text-foreground">{fullDays}</div>
            <div className="text-sm text-muted-foreground mt-0.5">三餐完整天数</div>
          </div>
          <div className="bg-module-diet-bg/60 rounded-xl py-2 text-center">
            <div className="text-lg font-semibold tabular-nums text-foreground">{regularity}%</div>
            <div className="text-sm text-muted-foreground mt-0.5">规律性</div>
          </div>
      </div>
    </div>
  );
};

export default DietMonthModule;
