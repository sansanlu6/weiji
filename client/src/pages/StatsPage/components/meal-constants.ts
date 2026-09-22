// 餐次配色与标签常量（hex 格式，适配 ECharts 与 Tailwind）
export const MEAL_COLORS: Record<string, string> = {
  breakfast: '#E8B93A', // 暖黄（早餐）加深
  lunch: '#7CB342',     // 青柠绿（午餐，主色）加深
  dinner: '#EF7A3C',    // 暖橙红（晚餐）加深
  snack: '#8FC9E0',     // 浅蓝（加餐）
  supper: '#C9B3E0',    // 浅紫（夜宵）
};

export const MEAL_LABELS: Record<string, string> = {
  breakfast: '早',
  lunch: '午',
  dinner: '晚',
  snack: '加',
  supper: '夜',
};

// 主三餐顺序（用于周历/月历格子展示）
export const MAIN_MEALS = ['breakfast', 'lunch', 'dinner'] as const;

// 图表配色（hex）
export const CHART_COLORS = {
  primary: '#9CCC65',   // 青柠绿
  accent: '#F0B8A8',    // 杏粉
  warning: '#E6C98A',   // 杏黄
  info: '#8FC9E0',      // 天空蓝
  purple: '#C9B3E0',    // 浅紫
  teal: '#A8D8D0',      // 浅青
};
