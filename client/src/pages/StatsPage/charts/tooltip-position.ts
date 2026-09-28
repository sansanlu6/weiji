interface TooltipSize {
  viewSize: number[];
  contentSize: number[];
}

/**
 * 将挂载到 document.body 的 ECharts tooltip 限制在浏览器可视区域内。
 * 返回值仍使用图表自身坐标系，ECharts 会负责换算为 body 坐标。
 */
export function positionTooltipWithinViewport(
  chartElement: HTMLElement | null,
  point: number[],
  size: TooltipSize,
): [number, number] {
  const gap = 10;
  const viewportMargin = 8;
  const contentWidth = size.contentSize[0] ?? 0;
  const contentHeight = size.contentSize[1] ?? 0;

  if (!chartElement || typeof window === 'undefined') {
    return [gap, gap];
  }

  const chartRect = chartElement.getBoundingClientRect();
  const pointX = chartRect.left + (point[0] ?? 0);
  const pointY = chartRect.top + (point[1] ?? 0);

  let viewportLeft = pointX + gap;
  if (viewportLeft + contentWidth > window.innerWidth - viewportMargin) {
    viewportLeft = pointX - contentWidth - gap;
  }
  viewportLeft = Math.max(
    viewportMargin,
    Math.min(viewportLeft, window.innerWidth - contentWidth - viewportMargin),
  );

  let viewportTop = pointY + gap;
  if (viewportTop + contentHeight > window.innerHeight - viewportMargin) {
    viewportTop = pointY - contentHeight - gap;
  }
  viewportTop = Math.max(
    viewportMargin,
    Math.min(viewportTop, window.innerHeight - contentHeight - viewportMargin),
  );

  return [viewportLeft - chartRect.left, viewportTop - chartRect.top];
}

export const VIEWPORT_TOOLTIP_CSS =
  'z-index: 10000000; max-width: calc(100vw - 24px); white-space: normal; overflow-wrap: anywhere; box-shadow: 0 6px 24px rgba(0,0,0,0.12); border-radius: 8px;';
