import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface CompactPieChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
  size?: number;
}

const CompactPieChart: React.FC<CompactPieChartProps> = ({ data, colors, size = 120 }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dataSignature = data.map((item) => `${item.name}:${item.value}`).join('|');

  const option: EChartsOption = useMemo(() => ({
    tooltip: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '50%'],
        data: data.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: colors?.[i % (colors.length || 1)] ?? '#a3d977' },
        })),
        label: { show: false },
        emphasis: { label: { show: false }, scale: false },
      },
    ],
  }), [colors, data]);

  const handleChartClick = useCallback((params: { dataIndex?: number }) => {
    if (typeof params.dataIndex !== 'number' || !data[params.dataIndex]) return;
    setActiveIndex(params.dataIndex);
  }, [data]);

  useEffect(() => {
    setActiveIndex(null);
  }, [dataSignature]);

  useEffect(() => {
    const handleOutsidePointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setActiveIndex(null);
      }
    };
    const handleScroll = () => setActiveIndex(null);

    document.addEventListener('pointerdown', handleOutsidePointer);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const activeItem = activeIndex === null ? null : data[activeIndex];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const activePercent = activeItem && total > 0
    ? Math.round((activeItem.value / total) * 100)
    : 0;

  return (
    <div
      ref={wrapperRef}
      className="relative shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      <ReactECharts
        option={option}
        theme="ud"
        autoResize={true}
        onEvents={{ click: handleChartClick }}
        className="chart-container"
        style={{ width: '100%', height: '100%', cursor: 'pointer' }}
      />
      {activeItem && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-x-1 top-1/2 z-20 -translate-y-1/2 rounded-lg border border-border/70 bg-background/95 px-1.5 py-1 text-center shadow-md backdrop-blur-sm"
        >
          <div className="truncate text-xs font-medium text-foreground">
            {activeItem.name}
          </div>
          <div className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
            {activeItem.value}（{activePercent}%）
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactPieChart;
