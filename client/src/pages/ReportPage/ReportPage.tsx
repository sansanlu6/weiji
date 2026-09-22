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
    <div className="relative w-40 h-40">
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
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
}> = ({ icon: Icon, label, score, color }) => {
  const { bg, border } = getScoreLevelBg(score);
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm"
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
      }}
    >
      <Icon size={18} style={{ color }} />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className="text-base font-semibold tabular-nums"
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
    if (!reportRef.current || !reportData) return;

    try {
      setExporting(true);
      logger.info('[report] exporting PDF');

      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      const fileName = `健康报告_${reportData.startDate}_${reportData.endDate}.pdf`;
      pdf.save(fileName);

      toast.success('PDF 导出成功');
    } catch (err) {
      logger.error('[report] export PDF failed', { error: err });
      toast.error('导出失败，请稍后重试');
    } finally {
      setExporting(false);
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
          onClick={() => navigate(-1)}
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
           <div ref={reportRef} className="rounded-3xl shadow-sm p-6 md:p-8 space-y-8" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
             {/* 报告标题 + 右上角导出按钮 */}
              <div className="flex items-start justify-between border-b border-border pb-6">
                <div>
                  <h2 className="text-2xl font-bold font-sans-hei">
                    {currentPeriod.label.includes('本') ? '' : periodLabel.replace('报', '')}健康报告
                  </h2>
                  <p className="text-muted-foreground text-sm mt-2 w-[175px]">
                    {reportData.startDate} 至 {reportData.endDate}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
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
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
               {/* 圆形进度条 */}
               <div className="flex flex-col items-center">
                 <ScoreRing score={scores.overall} />
                 <div className="flex flex-wrap justify-center gap-2 mt-5">
                    <SubScoreChip icon={MoonStar} label="睡眠" score={scores.sleep} color="#8b7fb0" />
                    <SubScoreChip icon={Droplet} label="喝水" score={scores.water} color="#7a9fb5" />
                    <SubScoreChip icon={Dumbbell} label="运动" score={scores.exercise} color="#7da895" />
                    <SubScoreChip icon={Smile} label="情绪" score={scores.mood} color="#c9a66b" />
                 </div>
               </div>

              {/* 核心指标 */}
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {metrics?.map((m, idx) => {
                  const Icon = m.icon;
                  return (
                      <div
                        key={idx}
                        className="rounded-xl p-4 flex flex-col items-center text-center transition-all shadow-[0_6px_16px_rgba(0_0_0_0.18)]"
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
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground font-sans-hei flex items-center gap-2">
                <Heart size={20} className="text-primary" />
                维度分析
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground font-sans-hei flex items-center gap-2">
                <Heart size={20} className="text-primary" />
                健康建议
              </h3>
              <div className="bg-primary/5 rounded-xl p-6 space-y-3">
                {advice.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">{idx + 1}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 页脚 */}
            <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
              由 微迹 自动生成 · {dayjs().format('YYYY-MM-DD')}
            </div>
          </div>
        </>
      )}
       </div>
       </div>
     </div>
   );
 };
 
 export default ReportPage;
