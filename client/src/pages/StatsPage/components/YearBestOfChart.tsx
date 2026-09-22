import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface YearBestOfChartProps {
  months: string[];
  sleep: number[];
  mood: number[];
  exercise: number[];
  pain: number[];
  takeout: number[];
}

interface MiniChartConfig {
  label: string;
  data: number[];
  color: string;
  isInverted: boolean;
  formatValue: (value: number) => string;
}

function buildMiniOption(
  months: string[],
  data: number[],
  color: string,
  peakColor: string,
  valleyColor: string,
  isInverted: boolean,
): EChartsOption {
  const validData = data.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (validData.length === 0) {
    return {
      xAxis: { type: 'category', show: false, data: months },
      yAxis: { type: 'value', show: false },
      series: [{ type: 'line', data: [], showSymbol: false }],
    };
  }

  const maxVal = Math.max(...validData);
  const minVal = Math.min(...validData);
  const peakIdx = data.indexOf(maxVal);
  const valleyIdx = data.indexOf(minVal);

  // Good point (green): for normal, peak is good; for inverted, valley is good
  // Bad point (red): for normal, valley is bad; for inverted, peak is bad
  const goodIdx = isInverted ? valleyIdx : peakIdx;
  const badIdx = isInverted ? peakIdx : valleyIdx;

  const seriesData = data.map((value: number, index: number) => {
    if (index === goodIdx) {
      return {
        value,
        symbol: 'circle',
        symbolSize: 9,
        itemStyle: { color: peakColor, borderColor: '#fff', borderWidth: 1.5 },
      };
    }
    if (index === badIdx) {
      return {
        value,
        symbol: 'circle',
        symbolSize: 9,
        itemStyle: { color: valleyColor, borderColor: '#fff', borderWidth: 1.5 },
      };
    }
    return value;
  });

  return {
    tooltip: {
      trigger: 'axis',
      show: false,
    },
    grid: {
      left: 8,
      right: 8,
      top: 22,
      bottom: 22,
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      show: false,
      data: months,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      show: false,
      min: (value: { min: number; max: number }) => value.min - (value.max - value.min) * 0.3,
      max: (value: { min: number; max: number }) => value.max + (value.max - value.min) * 0.3,
    },
    series: [
      {
        type: 'line',
        data: seriesData,
        smooth: true,
        showSymbol: false,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${color}30` },
              { offset: 1, color: `${color}05` },
            ],
          },
        },
      },
    ],
     graphic: [
       {
         type: 'text',
         left: 0,
         top: 2,
        style: {
          text: `▲ ${months[goodIdx]}`,
          fill: peakColor,
          fontSize: 10,
          fontWeight: 500,
        },
      },
    ],
  };
}

const YearBestOfChart: React.FC<YearBestOfChartProps> = ({
  months,
  sleep,
  mood,
  exercise,
  pain,
  takeout,
}) => {
  const PEAK_GREEN = '#2F9E6E';
  const VALLEY_RED = '#EA6668';

  const configs: MiniChartConfig[] = [
    {
      label: '睡眠',
      data: sleep,
      color: '#A9A1F0',
      isInverted: false,
      formatValue: (v: number) => `${v.toFixed(1)}h`,
    },
    {
      label: '情绪',
      data: mood.map((score: number) => 1 + (score / 2) * 4),
      color: '#F4B393',
      isInverted: false,
      formatValue: (v: number) => `${v.toFixed(1)}分`,
    },
    {
      label: '运动',
      data: exercise,
      color: '#6FD0A5',
      isInverted: false,
      formatValue: (v: number) => `${Math.round(v)}次`,
    },
    {
      label: '疼痛',
      data: pain,
      color: '#F28E90',
      isInverted: true,
      formatValue: (v: number) => `${Math.round(v)}次`,
    },
    {
      label: '外卖',
      data: takeout,
      color: '#E8C878',
      isInverted: true,
      formatValue: (v: number) => `${Math.round(v)}次`,
    },
  ];

  return (
    <div className="paper-card p-3">
      <div className="mb-4">
        <h3 className="text-lg font-sans-hei font-semibold text-foreground">年度之最</h3>
        <p className="text-sm text-muted-foreground mt-0.5">全年5个维度的走势一览</p>
      </div>
      <div className="space-y-1 px-2">
        {configs.map((config: MiniChartConfig) => {
          const validData = config.data.filter(
            (v: number) => typeof v === 'number' && !Number.isNaN(v),
          );
          const maxVal = validData.length > 0 ? Math.max(...validData) : 0;
          const minVal = validData.length > 0 ? Math.min(...validData) : 0;
          const peakIdx = config.data.indexOf(maxVal);
          const valleyIdx = config.data.indexOf(minVal);
          const goodIdx = config.isInverted ? valleyIdx : peakIdx;
          const badIdx = config.isInverted ? peakIdx : valleyIdx;
          const goodVal = config.data[goodIdx];
          const badVal = config.data[badIdx];

          const option = buildMiniOption(
            months,
            config.data,
            config.color,
            PEAK_GREEN,
            VALLEY_RED,
            config.isInverted,
          );

          return (
            <div key={config.label} className="flex items-center gap-2">
              <div className="w-14 flex-shrink-0">
                <span className="text-sm font-medium text-foreground">
                  {config.label}
                </span>
              </div>
              <div className="flex-1 min-w-0 relative">
                <div className="absolute top-0 right-1 text-[10px] space-x-2 z-10">
                  {validData.length > 0 && (
                    <>
                      <span style={{ color: PEAK_GREEN }}>
                        ▲ {months[goodIdx]} {config.formatValue(goodVal)}
                      </span>
                      <span style={{ color: VALLEY_RED }}>
                        ▼ {months[badIdx]} {config.formatValue(badVal)}
                      </span>
                    </>
                  )}
                </div>
                <ReactECharts
                  option={option}
                  theme="ud"
                  autoResize={true}
                  className="chart-container"
                  style={{ height: 52, width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default YearBestOfChart;
