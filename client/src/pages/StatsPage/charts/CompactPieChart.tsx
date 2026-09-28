import { useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  positionTooltipWithinViewport,
  VIEWPORT_TOOLTIP_CSS,
} from './tooltip-position';

interface CompactPieChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
  size?: number;
}

const CompactPieChart: React.FC<CompactPieChartProps> = ({ data, colors, size = 120 }) => {
  const chartRef = useRef<ReactECharts | null>(null);
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      renderMode: 'html',
      appendToBody: true,
      confine: false,
      extraCssText: VIEWPORT_TOOLTIP_CSS,
      position: (point, _params, _dom, _rect, tooltipSize) =>
        positionTooltipWithinViewport(
          chartRef.current?.getEchartsInstance().getDom() ?? null,
          point,
          tooltipSize,
        ),
      formatter: (params) => {
        const p = params as { name: string; value: number; percent?: number };
        return `${p.name}<br/>${p.value} (${p.percent?.toFixed(0) ?? 0}%)`;
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '50%'],
        data: data.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: colors?.[i % colors.length] ?? '#a3d977' },
        })),
        label: { show: false },
        emphasis: { label: { show: false }, scale: false },
      },
    ],
  };

  return (
    <div style={{ width: size, height: size }}>
      <ReactECharts ref={chartRef} option={option} theme="ud" autoResize={true} className="chart-container" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default CompactPieChart;
