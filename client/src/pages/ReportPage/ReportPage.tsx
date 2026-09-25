import { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ChevronLeft,
  ArrowLeft,
  FileText,
  Download,
  Loader2,
  Moon,
  MoonStar,
  Droplet,
  Droplets,
  Dumbbell,
  Heart,
  Smile,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import {
  getSleepStats,
  getWaterStats,
  getExerciseStats,
  getMoodDistribution,
  getPainFrequency,
} from '@client/src/api/stats';
import PageBackground from '@client/src/components/PageBackground';
import { Image } from '@client/src/components/ui/image';
import reportPdfBackground from '@client/src/assets/health-report-pdf-bg-v1.jpg';
import type {
  StatsItem,
  MoodDistribution,
  PainFrequency,
} from '@shared/api.interface';
import type { SleepStatsItem } from '@client/src/api/stats';

type ReportType = 'week' | 'month' | 'quarter';

interface ReportData {
  sleepData: SleepStatsItem[];
  waterData: StatsItem[];
  exerciseData: StatsItem[];
  moodData: MoodDistribution[];
  painData: PainFrequency[];
  startDate: string;
  endDate: string;
  rangeDays: number;
}

interface ScoreBreakdown {
  sleep: number;
  water: number;
  exercise: number;
  mood: number;
  overall: number;
}

interface PdfPreviewState {
  fileName: string;
  pdfUrl: string;
  pages: string[];
}

const PDF_PAGE_MARGIN_MM = 9;
const PDF_RENDER_WIDTH_PX = 794;
const PDF_SERIF_FONT =
  '"Noto Serif SC", "Source Han Serif CN", "思源宋体", "Songti SC", serif';
const PDF_SANS_FONT =
  '"Source Han Sans SC", "Noto Sans SC", "思源黑体", "PingFang SC", "Microsoft YaHei", sans-serif';

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

const PDF_COLOR_PROPERTIES = [
  'color',
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'text-decoration-color',
  'fill',
  'stroke',
] as const;
const UNSUPPORTED_PDF_COLOR_PATTERN =
  /(?:oklab|oklch|color-mix|\blab\(|\blch\()/i;

function waitForReportImages(element: HTMLElement): Promise<void> {
  const pendingImages = Array.from(element.querySelectorAll('img')).filter(
    (image) => !image.complete,
  );

  return Promise.all(
    pendingImages.map(
      (image) =>
        new Promise<void>((resolve) => {
          const timeout = window.setTimeout(resolve, 15000);
          const finish = () => {
            window.clearTimeout(timeout);
            resolve();
          };
          image.addEventListener('load', finish, { once: true });
          image.addEventListener('error', finish, { once: true });
        }),
    ),
  ).then(() => undefined);
}

function loadPdfBackground(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('健康报告背景加载失败'));
    image.src = src;
  });
}

/**
 * html2canvas 目前无法解析 Tailwind 生成的 oklab/oklch/color-mix 颜色。
 * 在它创建的副本中将这些颜色转换为普通 rgba，并移除截图不稳定的滤镜。
 */
function preparePdfClone(
  clonedDocument: Document,
  clonedReport: HTMLElement,
): void {
  clonedReport.querySelectorAll('[data-pdf-exclude]').forEach((element) => {
    element.remove();
  });

  clonedReport.style.width = `${PDF_RENDER_WIDTH_PX}px`;
  clonedReport.style.maxWidth = 'none';
  clonedReport.style.height = 'auto';
  clonedReport.style.padding = '32px 42px 24px';
  clonedReport.style.border = 'none';
  clonedReport.style.borderRadius = '0';
  clonedReport.style.backgroundColor = 'transparent';
  clonedReport.style.color = '#385348';
  clonedReport.style.fontFamily = PDF_SANS_FONT;
  clonedReport.style.backdropFilter = 'none';
  clonedReport.style.setProperty('-webkit-backdrop-filter', 'none');
  clonedReport.style.boxShadow = 'none';

  Array.from(clonedReport.children).forEach((child, index) => {
    if (index === 0 || !(child instanceof HTMLElement)) return;
    child.style.setProperty('margin-block-start', '20px', 'important');
  });

  const pdfOnly = clonedReport.querySelector<HTMLElement>('[data-pdf-only]');
  if (pdfOnly) {
    pdfOnly.style.setProperty('display', 'block', 'important');
    pdfOnly.style.fontFamily = PDF_SANS_FONT;
    pdfOnly.style.fontSize = '11px';
    pdfOnly.style.fontWeight = '500';
    pdfOnly.style.letterSpacing = '0.18em';
    pdfOnly.style.color = '#8a9d92';
    pdfOnly.style.marginBottom = '7px';
  }

  const reportHeader = clonedReport.querySelector<HTMLElement>(
    '[data-pdf-section="header"]',
  );
  if (reportHeader) {
    reportHeader.style.minHeight = '86px';
    reportHeader.style.padding = '2px 0 16px';
    reportHeader.style.borderBottom = '1px solid rgba(67, 104, 85, 0.18)';
  }

  const reportTitle = clonedReport.querySelector<HTMLElement>('[data-pdf-title]');
  if (reportTitle) {
    reportTitle.style.fontFamily = PDF_SERIF_FONT;
    reportTitle.style.fontSize = '30px';
    reportTitle.style.fontWeight = '600';
    reportTitle.style.lineHeight = '1.25';
    reportTitle.style.letterSpacing = '0.08em';
    reportTitle.style.color = '#214d3c';
  }

  const reportPeriod = clonedReport.querySelector<HTMLElement>('[data-pdf-period]');
  if (reportPeriod) {
    reportPeriod.style.width = 'auto';
    reportPeriod.style.marginTop = '6px';
    reportPeriod.style.fontSize = '12px';
    reportPeriod.style.letterSpacing = '0.04em';
    reportPeriod.style.color = '#71877b';
  }

  const scoreSection = clonedReport.querySelector<HTMLElement>(
    '[data-pdf-section="score"]',
  );
  if (scoreSection) {
    scoreSection.style.display = 'grid';
    scoreSection.style.gridTemplateColumns = '210px minmax(0, 1fr)';
    scoreSection.style.alignItems = 'center';
    scoreSection.style.gap = '30px';
    scoreSection.style.padding = '6px 8px';
    scoreSection.style.border = 'none';
    scoreSection.style.borderRadius = '0';
    scoreSection.style.backgroundColor = 'transparent';
  }

  clonedReport
    .querySelectorAll<HTMLElement>('[data-pdf-metric-grid]')
    .forEach((grid) => {
      grid.style.gridColumn = '2 / 3';
      grid.style.alignSelf = 'center';
      grid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
      grid.style.columnGap = '14px';
      grid.style.rowGap = '18px';

      Array.from(grid.children).forEach((card) => {
        if (!(card instanceof HTMLElement)) return;
        card.style.padding = '12px 8px';
        card.style.minHeight = '88px';
        card.style.justifyContent = 'center';
        card.style.gap = '0';
        const icon = card.querySelector<SVGElement>('svg');
        if (icon) icon.style.marginBottom = '6px';
        Array.from(card.querySelectorAll<HTMLElement>('div')).forEach((text) => {
          text.style.lineHeight = '1.2';
        });
      });
    });

  const scoreRing = clonedReport.querySelector<HTMLElement>('[data-pdf-score-ring]');
  if (scoreRing) {
    scoreRing.style.width = '150px';
    scoreRing.style.height = '150px';
  }

  const scoreCenter = clonedReport.querySelector<HTMLElement>(
    '[data-pdf-score-center]',
  );
  if (scoreCenter) {
    scoreCenter.style.setProperty('position', 'absolute', 'important');
    scoreCenter.style.setProperty('inset', '0', 'important');
    scoreCenter.style.setProperty('display', 'flex', 'important');
    scoreCenter.style.setProperty('align-items', 'center', 'important');
    scoreCenter.style.setProperty('justify-content', 'center', 'important');
    scoreCenter.style.setProperty('height', '150px', 'important');
    scoreCenter.style.setProperty('padding', '0', 'important');
    scoreCenter.style.setProperty('transform', 'translateY(-1px)', 'important');
    scoreCenter.querySelectorAll<HTMLElement>('span').forEach((line) => {
      line.style.display = 'block';
      line.style.marginTop = '0';
      line.style.lineHeight = '1.25';
    });
  }

  const scoreList = clonedReport.querySelector<HTMLElement>('[data-pdf-score-list]');
  if (scoreList) {
    scoreList.style.flexDirection = 'column';
    scoreList.style.flexWrap = 'nowrap';
    scoreList.style.alignItems = 'center';
    scoreList.style.gap = '5px';
    scoreList.style.marginTop = '14px';
  }

  clonedReport
    .querySelectorAll<HTMLElement>('[data-pdf-score-chip]')
    .forEach((chip) => {
      chip.style.minWidth = '126px';
      chip.style.height = '28px';
      chip.style.padding = '5px 11px';
      chip.style.gap = '6px';
      chip.style.alignItems = 'center';
      chip.style.lineHeight = '1';
      chip.querySelectorAll<HTMLElement>('span').forEach((label) => {
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.height = '18px';
        label.style.lineHeight = '18px';
      });
      const icon = chip.querySelector<SVGElement>('svg');
      if (icon) {
        icon.style.display = 'block';
        icon.style.flexShrink = '0';
      }
    });

  clonedReport
    .querySelectorAll<HTMLElement>('[data-pdf-section="analysis"], [data-pdf-section="advice"]')
    .forEach((section) => {
      section.style.padding = '0';
      section.style.border = 'none';
      section.style.borderRadius = '0';
      section.style.backgroundColor = 'transparent';
    });

  clonedReport.querySelectorAll<HTMLElement>('[data-pdf-heading]').forEach((heading) => {
    heading.style.fontFamily = PDF_SERIF_FONT;
    heading.style.setProperty('display', 'flex', 'important');
    heading.style.setProperty('align-items', 'center', 'important');
    heading.style.fontSize = '18px';
    heading.style.fontWeight = '600';
    heading.style.letterSpacing = '0.04em';
    heading.style.color = '#2b5745';
    heading.style.height = '30px';
    heading.style.paddingBottom = '6px';
    heading.style.marginBottom = '12px';
    heading.style.lineHeight = '24px';
    heading.style.borderBottom = '1px solid rgba(67, 104, 85, 0.2)';
    const headingIcon = heading.querySelector<SVGElement>('svg');
    if (headingIcon) {
      headingIcon.style.display = 'block';
      headingIcon.style.flexShrink = '0';
      headingIcon.style.margin = '0';
    }
    const headingLabel = heading.querySelector<HTMLElement>(
      '[data-pdf-heading-label]',
    );
    if (headingLabel) {
      headingLabel.style.display = 'flex';
      headingLabel.style.alignItems = 'center';
      headingLabel.style.height = '20px';
      headingLabel.style.lineHeight = '20px';
    }
  });

  const analysisGrid = clonedReport.querySelector<HTMLElement>('[data-pdf-analysis-grid]');
  if (analysisGrid) {
    analysisGrid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
    analysisGrid.style.gap = '14px';
    analysisGrid.style.setProperty('margin-top', '0', 'important');
    Array.from(analysisGrid.children).forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      card.style.padding = '14px 16px';
      const cardHeader = card.firstElementChild;
      if (cardHeader instanceof HTMLElement) {
        cardHeader.style.display = 'flex';
        cardHeader.style.alignItems = 'center';
        cardHeader.style.minHeight = '20px';
        cardHeader.style.marginBottom = '4px';
        cardHeader.style.lineHeight = '20px';
        cardHeader.querySelectorAll<HTMLElement>('span').forEach((label) => {
          label.style.display = 'flex';
          label.style.alignItems = 'center';
          label.style.height = '20px';
          label.style.lineHeight = '20px';
        });
        const icon = cardHeader.querySelector<SVGElement>('svg');
        if (icon) {
          icon.style.display = 'block';
          icon.style.flexShrink = '0';
        }
      }
      const paragraph = card.querySelector<HTMLElement>('p');
      if (paragraph) {
        paragraph.style.fontSize = '13.5px';
        paragraph.style.lineHeight = '1.55';
      }
    });
  }

  const adviceList = clonedReport.querySelector<HTMLElement>(
    '[data-pdf-advice-list]',
  );
  if (adviceList) {
    adviceList.style.display = 'flex';
    adviceList.style.flexDirection = 'column';
    adviceList.style.padding = '14px 18px';
    adviceList.style.gap = '7px';
    adviceList.style.setProperty('margin-top', '0', 'important');
  }

  clonedReport
    .querySelectorAll<HTMLElement>('[data-pdf-advice-item]')
    .forEach((item) => {
      item.style.alignItems = 'center';
      item.style.gap = '10px';
      item.style.setProperty('margin-top', '0', 'important');
      const paragraph = item.querySelector<HTMLElement>('p');
      if (paragraph) {
        paragraph.style.fontSize = '13.5px';
        paragraph.style.lineHeight = '21px';
      }
    });

  clonedReport
    .querySelectorAll<HTMLElement>('[data-pdf-advice-index]')
    .forEach((index) => {
      index.style.setProperty('display', 'flex', 'important');
      index.style.setProperty('align-items', 'center', 'important');
      index.style.setProperty('justify-content', 'center', 'important');
      index.style.width = '22px';
      index.style.height = '22px';
      index.style.padding = '0';
      index.style.marginTop = '0';
      index.style.lineHeight = '1';
      index.style.textAlign = 'center';
      const label = index.querySelector<HTMLElement>('span');
      if (label) {
        label.style.display = 'block';
        label.style.width = '22px';
        label.style.height = '22px';
        label.style.lineHeight = '22px';
        label.style.textAlign = 'center';
      }
    });

  const reportFooter = clonedReport.querySelector<HTMLElement>(
    '[data-pdf-section="footer"]',
  );
  if (reportFooter) {
    // 每张 PDF 页面已经绘制统一页脚，不再让网页页脚占用正文高度。
    reportFooter.style.display = 'none';
  }

  const colorCanvas = clonedDocument.createElement('canvas');
  colorCanvas.width = 1;
  colorCanvas.height = 1;
  const colorContext = colorCanvas.getContext('2d', {
    willReadFrequently: true,
  });
  const view = clonedDocument.defaultView;

  if (!colorContext || !view) return;

  const toRgba = (value: string): string => {
    colorContext.clearRect(0, 0, 1, 1);
    colorContext.fillStyle = 'rgba(0, 0, 0, 0)';
    colorContext.fillStyle = value;
    colorContext.fillRect(0, 0, 1, 1);
    const [red, green, blue, alpha] = colorContext.getImageData(0, 0, 1, 1).data;
    return `rgba(${red}, ${green}, ${blue}, ${(alpha / 255).toFixed(3)})`;
  };

  const elements = [
    clonedReport,
    ...Array.from(clonedReport.querySelectorAll<HTMLElement>('*')),
  ];
  elements.forEach((element) => {
    const computedStyle = view.getComputedStyle(element);

    PDF_COLOR_PROPERTIES.forEach((property) => {
      const value = computedStyle.getPropertyValue(property);
      if (value && value !== 'none') {
        element.style.setProperty(property, toRgba(value), 'important');
      }
    });

    if (UNSUPPORTED_PDF_COLOR_PATTERN.test(computedStyle.backgroundImage)) {
      element.style.setProperty('background-image', 'none', 'important');
    }
    element.style.setProperty('box-shadow', 'none', 'important');
    element.style.setProperty('text-shadow', 'none', 'important');
    element.style.setProperty('filter', 'none', 'important');
    element.style.setProperty('backdrop-filter', 'none', 'important');
    element.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
    element.style.setProperty('animation', 'none', 'important');
    element.style.setProperty('transition', 'none', 'important');
  });
}

function addCanvasPagesToPdf(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  sectionBreaks: number[],
  background: HTMLImageElement,
  jpegQuality = 0.88,
): string[] {
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pdfWidth - PDF_PAGE_MARGIN_MM * 2;
  const contentHeight = pdfHeight - PDF_PAGE_MARGIN_MM * 2;
  const millimetersPerPixel = contentWidth / canvas.width;
  const pageHeightInPixels = Math.max(
    1,
    Math.floor(contentHeight / millimetersPerPixel),
  );
  // 周报通常只比一页略高。此时小幅等比缩放比把健康建议单独推到第二页更易读。
  const fitOnSinglePage = canvas.height <= pageHeightInPixels * 1.32;

  const pageRanges: { start: number; end: number }[] = [];
  if (fitOnSinglePage) {
    pageRanges.push({ start: 0, end: canvas.height });
  } else {
    let sourceY = 0;
    while (sourceY < canvas.height) {
      const maximumEnd = Math.min(sourceY + pageHeightInPixels, canvas.height);
      const minimumUsefulEnd = sourceY + pageHeightInPixels * 0.55;
      const preferredEnd =
        maximumEnd < canvas.height
          ? sectionBreaks
              .filter(
                (position) =>
                  position >= minimumUsefulEnd && position <= maximumEnd,
              )
              .at(-1)
          : undefined;
      const sliceEnd = preferredEnd ?? maximumEnd;
      pageRanges.push({ start: sourceY, end: sliceEnd });
      sourceY = sliceEnd;
    }
  }

  const pixelsPerMillimeter = canvas.width / contentWidth;
  const pageCanvasWidth = Math.round(pdfWidth * pixelsPerMillimeter);
  const pageCanvasHeight = Math.round(pdfHeight * pixelsPerMillimeter);
  const marginPixels = Math.round(PDF_PAGE_MARGIN_MM * pixelsPerMillimeter);

  const previewPages: string[] = [];

  pageRanges.forEach(({ start, end }, pageIndex) => {
    const sliceHeight = end - start;
    const contentScale =
      pageRanges.length === 1
        ? Math.min(1, pageHeightInPixels / sliceHeight)
        : 1;
    const renderedWidth = Math.round(canvas.width * contentScale);
    const renderedHeight = Math.round(sliceHeight * contentScale);
    const renderedX = marginPixels + Math.round((canvas.width - renderedWidth) / 2);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = pageCanvasWidth;
    pageCanvas.height = pageCanvasHeight;
    const pageContext = pageCanvas.getContext('2d');
    if (!pageContext) {
      throw new Error('无法创建 PDF 分页画布');
    }

    const backgroundScale = Math.max(
      pageCanvas.width / background.naturalWidth,
      pageCanvas.height / background.naturalHeight,
    );
    const backgroundWidth = background.naturalWidth * backgroundScale;
    const backgroundHeight = background.naturalHeight * backgroundScale;
    pageContext.drawImage(
      background,
      (pageCanvas.width - backgroundWidth) / 2,
      (pageCanvas.height - backgroundHeight) / 2,
      backgroundWidth,
      backgroundHeight,
    );

    // 中央轻薄的暖白阅读层保留水彩边缘，同时确保文字和图表清晰。
    const readingLayer = pageContext.createLinearGradient(
      0,
      0,
      pageCanvas.width,
      0,
    );
    readingLayer.addColorStop(0, 'rgba(255, 254, 250, 0.28)');
    readingLayer.addColorStop(0.1, 'rgba(255, 254, 250, 0.7)');
    readingLayer.addColorStop(0.9, 'rgba(255, 254, 250, 0.7)');
    readingLayer.addColorStop(1, 'rgba(255, 254, 250, 0.28)');
    pageContext.fillStyle = readingLayer;
    pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    pageContext.drawImage(
      canvas,
      0,
      start,
      canvas.width,
      sliceHeight,
      renderedX,
      marginPixels,
      renderedWidth,
      renderedHeight,
    );

    if (pageIndex > 0) pdf.addPage();

    const footerFontSize = Math.max(14, Math.round(pageCanvas.width * 0.009));
    pageContext.font = `500 ${footerFontSize}px ${PDF_SANS_FONT}`;
    pageContext.fillStyle = 'rgba(49, 82, 66, 0.62)';
    pageContext.textBaseline = 'middle';
    pageContext.textAlign = 'left';
    pageContext.fillText(
      '微迹 · 健康报告',
      marginPixels,
      pageCanvas.height - Math.round(marginPixels * 0.42),
    );
    pageContext.textAlign = 'right';
    pageContext.fillText(
      `${pageIndex + 1} / ${pageRanges.length}`,
      pageCanvas.width - marginPixels,
      pageCanvas.height - Math.round(marginPixels * 0.42),
    );

    const pageImage = pageCanvas.toDataURL('image/jpeg', jpegQuality);
    previewPages.push(pageImage);
    pdf.addImage(
      pageImage,
      'JPEG',
      0,
      0,
      pdfWidth,
      pdfHeight,
      undefined,
      'FAST',
    );
  });

  return previewPages;
}

const REPORT_TYPES: { value: ReportType; label: string; days: number }[] = [
  { value: 'week', label: '周报', days: 7 },
  { value: 'month', label: '月报', days: 30 },
  { value: 'quarter', label: '季报', days: 90 },
];

const POSITIVE_MOODS = new Set([
  '开心', '快乐', '平静', '满足', '幸福', '兴奋', '愉悦', '放松',
  'happy', 'calm', 'peaceful', 'joyful', 'relaxed', 'content',
]);

// 计算 ISO 周数
function getIsoWeek(date: dayjs.Dayjs): number {
  const target = dayjs(date.toDate());
  const dayNum = target.day() || 7; // 周日=7
  const thursday = target.add(4 - dayNum, 'day');
  const firstThursday = dayjs(thursday.year() + '-01-01');
  const firstThursdayDay = firstThursday.day() || 7;
  const firstThursdayDate = firstThursday.add(4 - firstThursdayDay, 'day');
  return Math.ceil(thursday.diff(firstThursdayDate, 'day') / 7) + 1;
}

// 生成时间选项（最近 N 个周期）
function generatePeriodOptions(type: ReportType): { label: string; start: string; end: string }[] {
  const options: { label: string; start: string; end: string }[] = [];
  const count = type === 'week' ? 12 : type === 'month' ? 12 : 8;
  const now = dayjs();

  for (let i = 0; i < count; i++) {
    let start: dayjs.Dayjs;
    let end: dayjs.Dayjs;
    let label = '';

    if (type === 'week') {
      const base = now.subtract(i * 7, 'day');
      const dayOfWeek = base.day() || 7; // 周日=7
      start = base.subtract(dayOfWeek - 1, 'day').startOf('day'); // 周一
      end = start.add(6, 'day').endOf('day');
      const weekNum = getIsoWeek(start);
      label = `第${weekNum}周 (${start.format('MM/DD')}-${end.format('MM/DD')})`;
      if (i === 0) label = '本周 ' + label;
    } else if (type === 'month') {
      const base = now.subtract(i, 'month');
      start = base.startOf('month');
      end = base.endOf('month');
      label = `${start.format('YYYY年M月')}`;
      if (i === 0) label = '本月 ' + label;
    } else {
      // quarter: 用 month 计算
      const currentQuarter = Math.floor(now.month() / 3);
      const targetQuarterIdx = currentQuarter - i;
      const year = now.year() + Math.floor(targetQuarterIdx / 4);
      const q = ((targetQuarterIdx % 4) + 4) % 4; // 0,1,2,3
      const startMonth = q * 3;
      start = dayjs(`${year}-${String(startMonth + 1).padStart(2, '0')}-01`);
      end = start.add(2, 'month').endOf('month');
      label = `${year}年 Q${q + 1}`;
      if (i === 0) label = '本季度 ' + label;
    }

    options.push({
      label,
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD'),
    });
  }
  return options;
}

// 计算健康评分
function calculateScores(data: ReportData): ScoreBreakdown {
  const { sleepData, waterData, exerciseData, moodData, rangeDays } = data;

  // 睡眠得分：平均7-9小时满分，每差1小时扣10分
  let sleepScore = 0;
  if (sleepData.length > 0) {
    const avgMinutes = sleepData.reduce((sum: number, d: SleepStatsItem) => sum + (d.value || 0), 0) / sleepData.length;
    const avgHours = avgMinutes / 60;
    const diff = Math.abs(avgHours - 8); // 以8小时为最优
    sleepScore = Math.max(0, 100 - diff * 10);
  }

  // 喝水得分：达成率×100（目标8杯=2000ml）
  let waterScore = 0;
  if (waterData.length > 0) {
    const totalMl = waterData.reduce((sum: number, d: StatsItem) => sum + (d.value || 0), 0);
    const avgMl = totalMl / rangeDays;
    const targetMl = 2000;
    waterScore = Math.min(100, (avgMl / targetMl) * 100);
  }

  // 运动得分：(运动次数/目标次数)×100，最高100（目标每周3次）
  const targetExercise = (rangeDays / 7) * 3;
  const exerciseCount = exerciseData.filter((d: StatsItem) => d.value > 0).length;
  const exerciseScore = Math.min(100, (exerciseCount / targetExercise) * 100);

  // 情绪得分：积极情绪占比×100
  let moodScore = 0;
  if (moodData.length > 0) {
    const total = moodData.reduce((sum: number, d: MoodDistribution) => sum + d.count, 0);
    const positive = moodData
      .filter((d: MoodDistribution) => POSITIVE_MOODS.has(d.mood))
      .reduce((sum: number, d: MoodDistribution) => sum + d.count, 0);
    moodScore = total > 0 ? (positive / total) * 100 : 0;
  }

  // 综合评分：睡眠30% + 喝水20% + 运动25% + 情绪25%
  const overall = sleepScore * 0.3 + waterScore * 0.2 + exerciseScore * 0.25 + moodScore * 0.25;

  return {
    sleep: Math.round(sleepScore),
    water: Math.round(waterScore),
    exercise: Math.round(exerciseScore),
    mood: Math.round(moodScore),
    overall: Math.round(overall),
  };
}

// 生成健康建议
function generateAdvice(scores: ScoreBreakdown, data: ReportData): string[] {
  const advice: string[] = [];

  if (scores.sleep < 60) {
    advice.push('睡眠质量有待提升，建议调整作息，尽量保证每晚7-9小时的充足睡眠。');
  } else if (scores.sleep < 80) {
    advice.push('睡眠基本达标，可以尝试固定入睡和起床时间，进一步提升睡眠质量。');
  } else {
    advice.push('睡眠状态良好，继续保持规律作息哦！');
  }

  if (scores.water < 60) {
    advice.push('喝水量未达标，建议每天多喝几杯水，可以设置定时喝水提醒。');
  } else if (scores.water < 80) {
    advice.push('喝水量还不错，再加把劲达到每天8杯水的目标！');
  } else {
    advice.push('喝水习惯很棒，继续保持充足水分摄入。');
  }

  if (scores.exercise < 60) {
    advice.push('运动频率偏低，建议每周至少运动3次，每次30分钟以上。');
  } else if (scores.exercise < 80) {
    advice.push('运动习惯不错，可以尝试增加运动强度或尝试新的运动方式。');
  } else {
    advice.push('运动表现优秀，保持规律运动的同时注意劳逸结合。');
  }

  if (scores.mood < 60) {
    advice.push('近期情绪状态需要关注，建议适当放松，多做让自己开心的事。');
  } else if (scores.mood < 80) {
    advice.push('情绪整体平稳，可以尝试冥想或户外活动来改善心情。');
  } else {
    advice.push('情绪状态很好，保持积极乐观的心态！');
  }

  const painCount = data.painData.reduce((sum: number, d: PainFrequency) => sum + d.count, 0);
  if (painCount > 5) {
    advice.push('近期身体不适较为频繁，建议关注身体信号，必要时及时就医。');
  }

  return advice.slice(0, 5);
}

// 生成各维度分析文字
function generateAnalysis(data: ReportData, scores: ScoreBreakdown): {
  sleep: string;
  water: string;
  exercise: string;
  mood: string;
} {
  const { sleepData, waterData, exerciseData, moodData, rangeDays } = data;

  const avgSleepHours = sleepData.length > 0
    ? (sleepData.reduce((s: number, d: SleepStatsItem) => s + (d.value || 0), 0) / sleepData.length / 60).toFixed(1)
    : '0';

    const avgWaterMl = waterData.length > 0
      ? Math.round(waterData.reduce((s: number, d: StatsItem) => s + (d.value || 0), 0) / rangeDays)
      : 0;

  const exerciseDays = exerciseData.filter((d: StatsItem) => d.value > 0).length;
  const totalExerciseMin = exerciseData.reduce((s: number, d: StatsItem) => s + (d.value || 0), 0);

  const topMood = moodData.length > 0 ? moodData[0].mood : '暂无数据';
  const topMoodCount = moodData.length > 0 ? moodData[0].count : 0;

  return {
    sleep: `本周期内平均睡眠时长约 ${avgSleepHours} 小时，睡眠得分为 ${scores.sleep} 分。${
      scores.sleep >= 80 ? '睡眠质量较好，作息规律，继续保持。' :
      scores.sleep >= 60 ? '睡眠基本满足需求，但仍有提升空间。' :
      '睡眠明显不足，长期会影响免疫力和情绪状态，建议优先调整。'
    }`,
    water: `本周期内平均每日饮水量约 ${avgWaterMl} 毫升，喝水得分为 ${scores.water} 分。${
      scores.water >= 80 ? '饮水习惯良好，身体水分充足。' :
      scores.water >= 60 ? '饮水量基本达标，可以再增加一些。' :
      '饮水量不足，容易导致疲劳和注意力下降，建议分次定时饮水。'
    }`,
    exercise: `本周期内共运动 ${exerciseDays} 天，累计约 ${Math.round(totalExerciseMin)} 分钟，运动得分为 ${scores.exercise} 分。${
      scores.exercise >= 80 ? '运动习惯非常棒，身体素质持续提升中。' :
      scores.exercise >= 60 ? '有一定运动基础，可以逐步增加频率和强度。' :
      '运动偏少，建议从每天15分钟的轻度运动开始培养习惯。'
    }`,
    mood: `本周期内最常出现的情绪是「${topMood}」（共 ${topMoodCount} 次），情绪得分为 ${scores.mood} 分。${
      scores.mood >= 80 ? '整体情绪积极，心态健康。' :
      scores.mood >= 60 ? '情绪整体平稳，偶尔有波动属正常现象。' :
      '近期消极情绪偏多，建议多与朋友交流或尝试放松练习。'
    }`,
  };
}

const getScoreColor = (score: number): string => {
  if (score >= 90) return '#5B9A76';
  if (score >= 70) return '#7DB088';
  if (score >= 60) return '#A86E2A';
  if (score >= 40) return '#E08443';
  return '#D85E52';
};

const getScoreLabel = (score: number): string => {
  if (score >= 90) return '优秀';
  if (score >= 70) return '良好';
  if (score >= 60) return '一般';
  if (score >= 40) return '待改善';
  return '较差';
};

const getScoreLevel = (score: number): { color: string; bg: string; text: string } => {
  if (score >= 90) return { color: '#4caf50', bg: '#e8f5e9', text: '#2e7d32' };
  if (score >= 70) return { color: '#9ccc65', bg: '#f1f8e9', text: '#558b2f' };
  if (score >= 60) return { color: '#A86E2A', bg: '#f5efe5', text: '#8b5a20' };
  if (score >= 40) return { color: '#ff9800', bg: '#fff3e0', text: '#ef6c00' };
  return { color: '#ef5350', bg: '#ffebee', text: '#c62828' };
};

const getScoreLevelBg = (score: number): { bg: string; border: string } => {
  if (score >= 90) return { bg: '#f5fbf6', border: '#c8e6c9' };
  if (score >= 70) return { bg: '#f9fcf5', border: '#dcedc8' };
  if (score >= 60) return { bg: '#faf6ef', border: '#e8d9be' };
  if (score >= 40) return { bg: '#fffaf5', border: '#ffe0b2' };
  return { bg: '#fff8f8', border: '#ffcdd2' };
};

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const color = getScoreColor(score);
  const trackColor = 'rgba(200, 220, 210, 0.4)';
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div data-pdf-score-ring className="relative w-40 h-40">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={trackColor}
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
        />
      </svg>
      <div data-pdf-score-center className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-bold tabular-nums font-sans-hei"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-sm text-muted-foreground mt-1">健康评分</span>
        <span
          className="text-sm font-medium mt-0.5"
          style={{ color }}
        >
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
};

const SubScoreChip: React.FC<{
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  score: number;
  color: string;
  className?: string;
}> = ({ icon: Icon, label, score, color, className = '' }) => {
  const { bg, border } = getScoreLevelBg(score);
  return (
    <div
      data-pdf-score-chip
      className={`flex min-w-0 w-full items-center justify-center gap-1.5 rounded-full px-2 py-2 shadow-sm sm:gap-2 sm:px-4 ${className}`}
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
      }}
    >
      <Icon size={18} style={{ color }} />
      <span className="whitespace-nowrap text-xs text-muted-foreground sm:text-sm">{label}</span>
      <span
        className="whitespace-nowrap text-sm font-semibold tabular-nums sm:text-base"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
};

const ReportPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('week');
  const [periodIdx, setPeriodIdx] = useState(0);
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodDropdownRef = useRef<HTMLDivElement>(null);
  const periodMenuRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [pdfPreview, setPdfPreview] = useState<PdfPreviewState | null>(null);
  const pdfPreviewUrlRef = useRef<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const periodOptions = useMemo(() => generatePeriodOptions(reportType), [reportType]);

  const METRIC_BG_MAP: Record<string, string> = {
    'text-primary': '#f0efe9',
    'text-module-sleep': '#f0edf5',
    'text-module-water': '#e5eef2',
    'text-module-exercise': '#e6efe8',
    'text-module-mood': '#f7f0e0',
    'text-module-pain': '#f5e9ed',
  };
  const METRIC_ICON_COLOR_MAP: Record<string, string> = {
    'text-primary': '#6b8a78',
    'text-module-sleep': '#8b7fb0',
    'text-module-water': '#7a9fb5',
    'text-module-exercise': '#7da895',
    'text-module-mood': '#c9a66b',
    'text-module-pain': '#c994a6',
  };
  const METRIC_NUM_COLOR_MAP: Record<string, string> = {
    'text-primary': '#3a5a4a',
    'text-module-sleep': '#6b5e9a',
    'text-module-water': '#5a8ba8',
    'text-module-exercise': '#5a9475',
    'text-module-mood': '#b08a4a',
    'text-module-pain': '#b0758a',
  };
  const currentPeriod = periodOptions[periodIdx];

  const rangeDays = useMemo(() => {
    return dayjs(currentPeriod.end).diff(dayjs(currentPeriod.start), 'day') + 1;
  }, [currentPeriod]);

  const scores = useMemo(() => (reportData ? calculateScores(reportData) : null), [reportData]);
  const analysis = useMemo(() => (reportData && scores ? generateAnalysis(reportData, scores) : null), [reportData, scores]);
  const advice = useMemo(() => (reportData && scores ? generateAdvice(scores, reportData) : []), [reportData, scores]);

  // 核心指标
  const metrics = useMemo(() => {
    if (!reportData || !scores) return null;
    const { sleepData, waterData, exerciseData, moodData, painData, rangeDays: rd } = reportData;

    const totalRecordDays = new Set([
      ...sleepData.map((d) => d.date),
      ...waterData.map((d) => d.date),
      ...exerciseData.map((d) => d.date),
      ...moodData.length > 0 ? [moodData[0].mood] : [],
    ]).size;

    const avgSleepHours = sleepData.length > 0
      ? (sleepData.reduce((s: number, d: SleepStatsItem) => s + (d.value || 0), 0) / sleepData.length / 60).toFixed(1)
      : '0';

    const avgWaterCups = waterData.length > 0
      ? (waterData.reduce((s: number, d: StatsItem) => s + (d.value || 0), 0) / rd / 250).toFixed(1)
      : '0';

    const exerciseCount = exerciseData.filter((d: StatsItem) => d.value > 0).length;

    const topMood = moodData.length > 0 ? moodData[0].mood : '—';

    const painCount = painData.reduce((s: number, d: PainFrequency) => s + d.count, 0);

    return [
      { label: '总记录天数', value: `${Math.max(totalRecordDays, sleepData.length + waterData.length)}`, unit: '天', icon: Calendar, color: 'text-primary' },
      { label: '平均睡眠时长', value: avgSleepHours, unit: '小时', icon: MoonStar, color: 'text-module-sleep' },
      { label: '平均喝水', value: avgWaterCups, unit: '杯', icon: Droplet, color: 'text-module-water' },
      { label: '运动总次数', value: `${exerciseCount}`, unit: '次', icon: Dumbbell, color: 'text-module-exercise' },
      { label: '最常见情绪', value: topMood, unit: '', icon: Smile, color: 'text-module-mood' },
      { label: '病痛发作', value: `${painCount}`, unit: '次', icon: AlertCircle, color: 'text-module-pain' },
    ];
  }, [reportData, scores]);

  const handleTypeChange = (type: ReportType): void => {
    setReportType(type);
    setPeriodIdx(0);
    setPeriodOpen(false);
    setReportData(null);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const triggerOutside =
        periodDropdownRef.current &&
        !periodDropdownRef.current.contains(target);
      const menuOutside =
        periodMenuRef.current &&
        !periodMenuRef.current.contains(target);
      if (triggerOutside && menuOutside) {
        setPeriodOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (periodOpen && periodDropdownRef.current) {
      const rect = periodDropdownRef.current.getBoundingClientRect();
      setDropdownRect({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    } else {
      setDropdownRect(null);
    }
  }, [periodOpen]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrlRef.current) {
        URL.revokeObjectURL(pdfPreviewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pdfPreview) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [pdfPreview]);

  const closePdfPreview = (): void => {
    setPdfPreview(null);
    if (pdfPreviewUrlRef.current) {
      URL.revokeObjectURL(pdfPreviewUrlRef.current);
      pdfPreviewUrlRef.current = null;
    }
  };

  const downloadPreviewPdf = (): void => {
    if (!pdfPreview) return;
    const link = document.createElement('a');
    link.href = pdfPreview.pdfUrl;
    link.download = pdfPreview.fileName;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleGenerate = async (): Promise<void> => {
    try {
      setLoading(true);
      const start = currentPeriod.start;
      const end = currentPeriod.end;
      const rd = rangeDays;

      logger.info(`[report] generating report, type=${reportType}, start=${start}, end=${end}`);

      const results = await Promise.allSettled([
        getSleepStats(rd),
        getWaterStats(rd),
        getExerciseStats(rd),
        getMoodDistribution(start, end),
        getPainFrequency(start, end),
      ]);

      const [sleepRes, waterRes, exerciseRes, moodRes, painRes] = results;

      const sleepData: SleepStatsItem[] = sleepRes.status === 'fulfilled' ? sleepRes.value : [];
      const waterData: StatsItem[] = waterRes.status === 'fulfilled' ? waterRes.value : [];
      const exerciseData: StatsItem[] = exerciseRes.status === 'fulfilled' ? exerciseRes.value : [];
      const moodData: MoodDistribution[] = moodRes.status === 'fulfilled' ? moodRes.value : [];
      const painData: PainFrequency[] = painRes.status === 'fulfilled' ? painRes.value : [];

      setReportData({
        sleepData,
        waterData,
        exerciseData,
        moodData,
        painData,
        startDate: start,
        endDate: end,
        rangeDays: rd,
      });

      toast.success('报告生成成功');
    } catch (err) {
      logger.error('[report] generate failed', { error: err });
      toast.error('报告生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (): Promise<void> => {
    if (!reportData || !scores || !analysis || !metrics) return;

    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(
      navigator.userAgent,
    );

    try {
      setExporting(true);
      setExportProgress('正在加载原生 PDF 排版引擎…');
      await waitForNextPaint();
      logger.info('[report] exporting PDF');

      // React-PDF 的字体与图片解析依赖 Node Buffer；Vite 浏览器环境需显式注入。
      const { Buffer: BrowserBuffer } = await import('buffer');
      const browserGlobal = globalThis as typeof globalThis & {
        Buffer?: typeof BrowserBuffer;
      };
      browserGlobal.Buffer ??= BrowserBuffer;

      const [{ pdf }, { createHealthReportPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./HealthReportPdfDocument'),
      ]);

      setExportProgress('正在排版文字、图表和分页…');
      await waitForNextPaint();
      const metricIcons = [
        'calendar',
        'sleep',
        'water',
        'exercise',
        'mood',
        'pain',
      ] as const;
      const metricColors = [
        '#4f8068',
        '#7b68b2',
        '#5791b5',
        '#59977a',
        '#c48c2f',
        '#bd7892',
      ];
      const pdfDocument = createHealthReportPdfDocument({
        startDate: reportData.startDate,
        endDate: reportData.endDate,
        generatedAt: dayjs().format('YYYY-MM-DD'),
        scores,
        metrics: metrics.map((metric, index) => ({
          label: metric.label,
          value: metric.value,
          unit: metric.unit,
          icon: metricIcons[index],
          color: metricColors[index],
        })),
        analysis,
        advice,
      });
      const pdfBlob = await pdf(pdfDocument).toBlob();
      const fileName = `健康报告_${reportData.startDate}_${reportData.endDate}.pdf`;
      const pdfUrl = URL.createObjectURL(pdfBlob);

      if (isMobile) {
        if (pdfPreviewUrlRef.current) {
          URL.revokeObjectURL(pdfPreviewUrlRef.current);
        }
        pdfPreviewUrlRef.current = pdfUrl;
        setPdfPreview({ fileName, pdfUrl, pages: [] });
        toast.success('PDF 已生成，可预览后选择保存');
      } else {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 30_000);
        toast.success('PDF 导出成功');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? `${err.name}: ${err.message}`
          : typeof err === 'string'
            ? err
            : JSON.stringify(err);
      logger.error('[report] export PDF failed', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
      });
      toast.error(`导出失败：${errorMessage || '未知错误'}`);
    } finally {
      setExporting(false);
      setExportProgress('');
    }
  };

  const periodLabel = REPORT_TYPES.find((t) => t.value === reportType)?.label || '';

   return (
      <div className={`relative font-sans-hei ${reportData ? 'min-h-full' : 'h-full overflow-hidden'}`}>
         <PageBackground />
        <div className={`page-content-wrap relative ${reportData ? '' : 'h-full flex flex-col'}`}>
       <div className={`relative z-10 ${reportData ? 'space-y-6' : 'flex-1 flex flex-col gap-6'}`}>
      {/* 标题 */}
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate('/profile', { replace: true })}
          className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-secondary/60 transition-colors"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={1.8} />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight font-sans-hei">
            健康报告
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            周期性健康总结
          </p>
        </div>
      </header>

        {/* 控制区 */}
        <div
          className="space-y-4"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.55)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(42, 72, 58, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            padding: '20px',
          }}
        >
         {/* 类型切换 */}
         <div>
            <span
              className="text-sm block mb-2 font-medium"
              style={{ color: '#637a6d' }}
            >
              报告类型
            </span>
            <div
              className="flex p-1"
              style={{
                backgroundColor: '#fef9e7',
                borderRadius: '14px',
                boxShadow: '0 2px 8px rgba(214, 178, 76, 0.08)',
              }}
            >
              {REPORT_TYPES.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleTypeChange(item.value)}
                  className="flex-1 py-2.5 text-sm font-sans-hei transition-all duration-300"
                  style={{
                    borderRadius: '12px',
                    fontWeight: reportType === item.value ? 600 : 500,
                    color: reportType === item.value ? '#6b5a3e' : '#9e8f6e',
                    backgroundColor:
                      reportType === item.value
                        ? '#fef3c7'
                        : 'transparent',
                    boxShadow:
                      reportType === item.value
                        ? '0 2px 6px rgba(214, 178, 76, 0.12)'
                        : 'none',
                  }}
                >
                 {item.label}
                </button>
              ))}
            </div>
         </div>
 
          {/* 时间选择 */}
          <div>
             <span
               className="text-sm block mb-2 font-medium"
               style={{ color: '#637a6d' }}
             >
               选择{periodLabel.replace('报', '')}
             </span>
             <div className="relative" ref={periodDropdownRef}>
               <div
                 onClick={() => setPeriodOpen((o) => !o)}
                 className="w-full py-3 px-4 text-sm cursor-pointer transition-all flex items-center justify-between"
                 style={{
                    backgroundColor: 'rgba(234, 243, 237, 0.4)',
                   border: periodOpen
                     ? '1px solid rgba(42, 72, 58, 0.25)'
                     : '1px solid rgba(200, 220, 208, 0.5)',
                   borderRadius: '14px',
                   color: '#2a483a',
                   boxShadow: periodOpen
                     ? '0 0 0 3px rgba(42, 72, 58, 0.08)'
                     : 'none',
                 }}
               >
                 <span className="font-medium">{periodOptions[periodIdx]?.label}</span>
                 <svg
                   className="transition-transform flex-shrink-0"
                   style={{
                     color: '#637a6d',
                     transform: periodOpen ? 'rotate(180deg)' : 'rotate(0)',
                   }}
                   width="16"
                   height="16"
                   viewBox="0 0 24 24"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="2"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                 >
                  <polyline points="6 9 12 15 18 9" />
                 </svg>
               </div>
                {periodOpen && dropdownRect && createPortal(
                  <div
                    className="overflow-y-auto"
                    ref={periodMenuRef}
                    style={{
                      position: 'absolute',
                      top: `${dropdownRect.top}px`,
                      left: `${dropdownRect.left}px`,
                      width: `${dropdownRect.width}px`,
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(42, 72, 58, 0.12)',
                      padding: '8px',
                      maxHeight: '280px',
                      zIndex: 99999,
                    }}
                  >
                   {periodOptions.map((opt, idx) => {
                     const selected = idx === periodIdx;
                     return (
                       <div
                         key={idx}
                         onClick={() => {
                           setPeriodIdx(idx);
                           setPeriodOpen(false);
                         }}
                         className="text-sm cursor-pointer transition-colors rounded-lg"
                         style={{
                           padding: '10px 14px',
                           backgroundColor: selected ? '#eaf3ed' : 'transparent',
                           color: '#2a483a',
                           fontWeight: selected ? 600 : 400,
                         }}
                         onMouseEnter={(e) => {
                           if (!selected) {
                             e.currentTarget.style.backgroundColor = '#f2f7f4';
                           }
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.backgroundColor = selected
                             ? '#eaf3ed'
                             : 'transparent';
                         }}
                       >
                         {opt.label}
                       </div>
                     );
                   })}
                 </div>,
                 document.body
               )}
             </div>
           </div>
 
          {/* 生成按钮 */}
           <button
             onClick={handleGenerate}
             disabled={loading}
             className="w-full py-3.5 rounded-full font-sans-hei font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] shadow-sm hover:shadow-md"
             style={{
                backgroundColor: '#5bb979',
               color: '#ffffff',
               border: 'none',
               borderRadius: '999px',
             }}
           >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              生成中...
            </>
          ) : (
            <>
              <FileText size={18} />
              生成{periodLabel}
            </>
          )}
        </button>
      </div>

      {/* 报告预览区 */}
       {loading && !reportData && (
          <div
            className="flex-1 flex flex-col items-center justify-center min-h-0"
          >
            <div
             className="flex flex-col items-center justify-center w-full"
             style={{
               backgroundColor: 'rgba(255, 255, 255, 0.72)',
               backdropFilter: 'blur(20px)',
               WebkitBackdropFilter: 'blur(20px)',
               borderRadius: '24px',
               boxShadow: '0 8px 32px rgba(42, 72, 58, 0.06)',
               border: '1px solid rgba(255, 255, 255, 0.6)',
               padding: '48px 24px',
               color: '#637a6d',
             }}
           >
           <Loader2
             className="animate-spin mb-4"
             size={36}
             style={{ color: '#2a483a' }}
           />
           <p>正在生成报告...</p>
         </div>
          </div>
        )}

       {!loading && !reportData && (
          <div
            className="flex-1 flex flex-col items-center justify-center min-h-0"
          >
            <div
              className="flex flex-col items-center justify-center w-full"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.55)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(42, 72, 58, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                padding: '48px 24px',
              }}
            >
            <div
              className="flex items-center justify-center mb-4"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                 backgroundColor: 'rgba(91, 185, 121, 0.12)',
              }}
            >
             <FileText
               size={36}
               style={{ color: '#5bb979' }}
               strokeWidth={1.3}
             />
           </div>
           <p
             className="text-base font-semibold mb-1"
             style={{ color: '#2a483a' }}
           >
             选择周期后点击生成报告
           </p>
           <p className="text-sm" style={{ color: '#637a6d' }}>
             将为您展示健康数据概览与分析建议
            </p>
            </div>
          </div>
        )}

      {reportData && scores && analysis && (
        <>
          {/* 报告内容（用于 PDF 导出截取） */}
           <div ref={reportRef} data-pdf-report className="rounded-3xl shadow-sm p-6 md:p-8 space-y-8" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
             {/* 报告标题 + 右上角导出按钮 */}
              <div data-pdf-section="header" className="flex items-start justify-between border-b border-border pb-6">
                <div>
                  <p data-pdf-only className="hidden">
                    微迹 · 健康周期总结
                  </p>
                  <h2 data-pdf-title className="text-2xl font-bold font-sans-hei">
                    {currentPeriod.label.includes('本') ? '' : periodLabel.replace('报', '')}健康报告
                  </h2>
                  <p data-pdf-period className="text-muted-foreground text-sm mt-2 w-[175px]">
                    {reportData.startDate} 至 {reportData.endDate}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2" data-pdf-exclude>
                  <button
                    onClick={handleExportPDF}
                    disabled={exporting}
                    className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex-shrink-0 shadow-sm"
                    style={{
                      backgroundColor: '#eaf3ed',
                      color: '#2a483a',
                      border: '1px solid #d4e8db',
                    }}
                  >
                    {exporting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Download size={16} />
                    )}
                    <span className="text-sm">导出 PDF</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={exporting}
                    className="md:hidden w-[90px] h-[35px] rounded-xl text-sm font-medium shadow-sm hover:shadow-md hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center"
                    style={{ backgroundColor: '#eaf3ed', color: '#2a483a', border: '1px solid #d4e8db' }}
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                      </>
                    ) : (
                      '导出 PDF'
                    )}
                  </button>
                </div>
              </div>

             {/* 健康评分 + 核心指标 */}
             <div data-pdf-section="score" className="flex flex-col items-center gap-8">
               {/* 圆形进度条 */}
               <div className="flex w-full flex-col items-center">
                 <ScoreRing score={scores.overall} />
                 <div data-pdf-score-list className="mt-5 grid w-full max-w-[440px] grid-cols-3 gap-2">
                    <SubScoreChip icon={MoonStar} label="睡眠" score={scores.sleep} color="#8b7fb0" />
                    <SubScoreChip icon={Droplet} label="喝水" score={scores.water} color="#7a9fb5" />
                    <SubScoreChip icon={Dumbbell} label="运动" score={scores.exercise} color="#7da895" />
                    <SubScoreChip className="col-start-2" icon={Smile} label="情绪" score={scores.mood} color="#c9a66b" />
                 </div>
               </div>

              {/* 核心指标 */}
              <div data-pdf-metric-grid className="grid w-full grid-cols-3 gap-3">
                {metrics?.map((m, idx) => {
                  const Icon = m.icon;
                  return (
                      <div
                        key={idx}
                        className="flex min-h-[138px] flex-col items-center justify-center rounded-xl p-2 text-center transition-all shadow-[0_6px_16px_rgba(0_0_0_0.12)] sm:p-4"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          borderRadius: '16px',
                        }}
                      >
                       <Icon size={20} className="mb-2" style={{ color: METRIC_ICON_COLOR_MAP[m.color] || '#6b8a78' }} />
                       <div
                         className="text-2xl font-medium tabular-nums"
                         style={{ color: METRIC_NUM_COLOR_MAP[m.color] || '#3a5a4a' }}
                       >
                        {m.value}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {m.unit}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 各维度分析 */}
            <div data-pdf-section="analysis" className="space-y-4">
              <h3 data-pdf-heading className="text-lg font-medium text-foreground font-sans-hei flex items-center gap-2">
                <Heart size={20} className="text-primary" />
                <span data-pdf-heading-label>维度分析</span>
              </h3>
              <div data-pdf-analysis-grid className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-module-sleep-bg rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <MoonStar size={18} className="text-module-sleep" />
                    <span className="font-medium text-foreground text-sm">睡眠</span>
                    <span className="ml-auto text-xs text-module-sleep font-medium">
                      {scores.sleep} 分
                    </span>
                  </div>
                  <p className="text-sm text-foreground/75 leading-relaxed">
                    {analysis.sleep}
                  </p>
                </div>
                <div className="bg-module-water-bg rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplet size={18} className="text-module-water" />
                    <span className="font-medium text-foreground text-sm">喝水</span>
                    <span className="ml-auto text-xs text-module-water font-medium">
                      {scores.water} 分
                    </span>
                  </div>
                  <p className="text-sm text-foreground/75 leading-relaxed">
                    {analysis.water}
                  </p>
                </div>
                <div className="bg-module-exercise-bg rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell size={18} className="text-module-exercise" />
                    <span className="font-medium text-foreground text-sm">运动</span>
                    <span className="ml-auto text-xs text-module-exercise font-medium">
                      {scores.exercise} 分
                    </span>
                  </div>
                  <p className="text-sm text-foreground/75 leading-relaxed">
                    {analysis.exercise}
                  </p>
                </div>
                <div className="bg-module-mood-bg rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Smile size={18} className="text-module-mood" />
                    <span className="font-medium text-foreground text-sm">情绪</span>
                    <span className="ml-auto text-xs text-module-mood font-medium">
                      {scores.mood} 分
                    </span>
                  </div>
                  <p className="text-sm text-foreground/75 leading-relaxed">
                    {analysis.mood}
                  </p>
                </div>
              </div>
            </div>

            {/* 健康建议 */}
            <div data-pdf-section="advice" className="space-y-4">
              <h3 data-pdf-heading className="text-lg font-medium text-foreground font-sans-hei flex items-center gap-2">
                <Heart size={20} className="text-primary" />
                <span data-pdf-heading-label>健康建议</span>
              </h3>
              <div data-pdf-advice-list className="bg-primary/5 rounded-xl p-6 space-y-3">
                {advice.map((item, idx) => (
                  <div key={idx} data-pdf-advice-item className="flex gap-3">
                    <div data-pdf-advice-index className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">{idx + 1}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 页脚 */}
            <div data-pdf-section="footer" className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
              由 微迹 自动生成 · {dayjs().format('YYYY-MM-DD')}
            </div>
          </div>
        </>
      )}
       </div>
       </div>
       {exporting &&
         typeof document !== 'undefined' &&
         createPortal(
           <div
             className="fixed inset-0 flex items-center justify-center px-6"
             style={{
               zIndex: 10000,
               backgroundColor: 'rgba(25, 45, 36, 0.48)',
               backdropFilter: 'blur(5px)',
               WebkitBackdropFilter: 'blur(5px)',
             }}
             role="status"
             aria-live="polite"
           >
             <div
               className="w-full max-w-xs rounded-3xl px-6 py-7 text-center shadow-2xl"
               style={{ backgroundColor: '#fffdf7', color: '#2a483a' }}
             >
               <Loader2 className="mx-auto mb-4 animate-spin" size={30} />
               <p className="text-base font-medium">
                 {exportProgress || '正在生成健康报告…'}
               </p>
               <p className="mt-2 text-xs leading-relaxed" style={{ color: '#718278' }}>
                 请保持页面打开，完成后会自动显示预览
               </p>
             </div>
           </div>,
           document.body,
         )}

       {pdfPreview &&
         typeof document !== 'undefined' &&
         createPortal(
           <div
             className="fixed inset-0 flex flex-col"
             style={{ zIndex: 9999, backgroundColor: '#edf1ed' }}
             role="dialog"
             aria-modal="true"
             aria-label="PDF 预览"
           >
             <div
               className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 shadow-sm"
               style={{
                 paddingTop: 'max(12px, env(safe-area-inset-top))',
                 backgroundColor: '#fffdf8',
                 borderColor: '#dce5df',
               }}
             >
               <button
                 type="button"
                 onClick={closePdfPreview}
                 className="flex h-10 w-10 items-center justify-center rounded-full text-2xl"
                 style={{ color: '#315242', backgroundColor: '#edf4ef' }}
                 aria-label="关闭 PDF 预览"
               >
                 ×
               </button>
               <div className="min-w-0 flex-1 text-center">
                 <p className="truncate text-base font-medium" style={{ color: '#254739' }}>
                   PDF 预览
                 </p>
                 <p className="text-xs" style={{ color: '#72857a' }}>
                   {pdfPreview.pages.length > 0
                     ? `共 ${pdfPreview.pages.length} 页`
                     : '原生 PDF 文档'}
                 </p>
               </div>
               <button
                 type="button"
                 onClick={downloadPreviewPdf}
                 className="flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium shadow-sm"
                 style={{ color: '#fff', backgroundColor: '#315f49' }}
               >
                 <Download size={15} />
                 保存
               </button>
             </div>

             <div
               className="flex-1 overflow-y-auto px-3 py-4"
               style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
             >
               <div className="mx-auto flex max-w-3xl flex-col gap-4">
                 {pdfPreview.pages.length > 0 ? (
                   pdfPreview.pages.map((page, index) => (
                     <figure key={index} className="m-0">
                       <img
                         src={page}
                         alt={`健康报告第 ${index + 1} 页`}
                         className="block h-auto w-full bg-white shadow-lg"
                       />
                       <figcaption
                         className="pt-2 text-center text-xs"
                         style={{ color: '#6f7f76' }}
                       >
                         第 {index + 1} 页
                       </figcaption>
                     </figure>
                   ))
                 ) : (
                   <iframe
                     src={`${pdfPreview.pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
                     title="健康报告 PDF 预览"
                     className="h-[calc(100dvh-132px)] min-h-[520px] w-full border-0 bg-white shadow-lg"
                   />
                 )}
                 <p className="px-4 text-center text-xs leading-relaxed" style={{ color: '#6f7f76' }}>
                   微信内如无法直接保存 PDF，可点击右上角菜单选择“在浏览器打开”。
                 </p>
               </div>
             </div>
           </div>,
           document.body,
         )}
     </div>
   );
 };
 
 export default ReportPage;
