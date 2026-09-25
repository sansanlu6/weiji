import React from 'react';
import {
  Circle,
  Document,
  Font,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';
import reportBackground from '@client/src/assets/health-report-pdf-bg-v1.jpg';
import reportFont from '@client/src/assets/fonts/NotoSansSC-Report.ttf';

Font.register({
  family: 'NotoSansSCReport',
  fonts: [
    { src: reportFont, fontWeight: 400 },
    { src: reportFont, fontWeight: 600 },
    { src: reportFont, fontWeight: 700 },
  ],
});

export type PdfMetricIcon =
  | 'calendar'
  | 'sleep'
  | 'water'
  | 'exercise'
  | 'mood'
  | 'pain';

export interface HealthReportPdfMetric {
  label: string;
  value: string;
  unit: string;
  color: string;
  icon: PdfMetricIcon;
}

export interface HealthReportPdfProps {
  startDate: string;
  endDate: string;
  generatedAt: string;
  scores: {
    sleep: number;
    water: number;
    exercise: number;
    mood: number;
    overall: number;
  };
  metrics: HealthReportPdfMetric[];
  analysis: {
    sleep: string;
    water: string;
    exercise: string;
    mood: string;
  };
  advice: string[];
}

const colors = {
  ink: '#315447',
  muted: '#74887e',
  line: '#d7e2dc',
  sleep: '#7b68b2',
  water: '#5791b5',
  exercise: '#59977a',
  mood: '#c48c2f',
  pain: '#bd7892',
};

const styles = StyleSheet.create({
  page: {
    position: 'relative',
    paddingTop: 36,
    paddingRight: 42,
    paddingBottom: 34,
    paddingLeft: 42,
    fontFamily: 'NotoSansSCReport',
    color: colors.ink,
    backgroundColor: '#fffdf8',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.72,
  },
  readingLayer: {
    position: 'absolute',
    top: 0,
    left: 35,
    right: 35,
    bottom: 0,
    backgroundColor: 'rgba(255, 254, 250, 0.68)',
  },
  content: { position: 'relative' },
  eyebrow: {
    fontSize: 7.5,
    letterSpacing: 2.2,
    color: '#728a7e',
    marginBottom: 5,
  },
  title: { fontSize: 25, fontWeight: 700, letterSpacing: 2, lineHeight: 1.1 },
  period: { marginTop: 5, fontSize: 9, color: colors.muted, letterSpacing: 0.4 },
  headerLine: { marginTop: 13, height: 1, backgroundColor: colors.line },
  summary: {
    marginTop: 19,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 224,
  },
  scoreColumn: { width: 148, alignItems: 'center' },
  ring: { width: 112, height: 112, position: 'relative' },
  ringText: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: { fontSize: 25, fontWeight: 700, lineHeight: 1.05 },
  scoreCaption: { fontSize: 8.5, color: colors.muted, lineHeight: 1.25 },
  scoreLabel: { marginTop: 1, fontSize: 9.5, fontWeight: 600, lineHeight: 1.2 },
  chipList: { marginTop: 11, width: 112 },
  chip: {
    height: 21,
    borderRadius: 10.5,
    borderWidth: 0.7,
    marginBottom: 4,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipLabel: { marginLeft: 6, fontSize: 8.5, color: '#61766b' },
  chipScore: { marginLeft: 'auto', fontSize: 9, fontWeight: 600 },
  metrics: {
    flex: 1,
    marginLeft: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'center',
  },
  metric: {
    width: '31.5%',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValueRow: {
    marginTop: 5,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: { fontSize: 18, fontWeight: 600, lineHeight: 1 },
  metricUnit: { marginLeft: 3, fontSize: 8.5, color: colors.muted, lineHeight: 1 },
  metricLabel: { marginTop: 3, fontSize: 7.5, color: colors.muted, lineHeight: 1.2 },
  section: { marginTop: 17 },
  sectionHeading: {
    height: 27,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.8,
    borderBottomColor: colors.line,
    paddingBottom: 6,
  },
  sectionHeadingText: {
    marginLeft: 7,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1,
  },
  analysisGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analysisCard: {
    width: '49%',
    minHeight: 91,
    borderRadius: 13,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 10,
  },
  cardHeader: { height: 17, flexDirection: 'row', alignItems: 'center' },
  cardTitle: { marginLeft: 6, fontSize: 9.5, fontWeight: 600, lineHeight: 1 },
  cardScore: { marginLeft: 'auto', fontSize: 8, fontWeight: 600, lineHeight: 1 },
  cardBody: { marginTop: 7, fontSize: 8.1, color: '#5f766b', lineHeight: 1.55 },
  adviceBox: {
    marginTop: 10,
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(232, 239, 234, 0.78)',
  },
  adviceRow: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  adviceIndex: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d6e3da',
  },
  adviceIndexText: { fontSize: 7.8, fontWeight: 600, lineHeight: 1 },
  adviceText: { flex: 1, marginLeft: 9, fontSize: 8.2, lineHeight: 1.35 },
  footer: {
    position: 'absolute',
    left: 42,
    right: 42,
    bottom: 17,
    paddingTop: 6,
    borderTopWidth: 0.7,
    borderTopColor: '#d3dfd8',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 6.8, color: '#7e9087' },
});

function scoreColor(score: number): string {
  if (score >= 90) return '#5b9a76';
  if (score >= 70) return '#7db088';
  if (score >= 60) return '#a86e2a';
  if (score >= 40) return '#e08443';
  return '#d85e52';
}

function scoreLabel(score: number): string {
  if (score >= 90) return '优秀';
  if (score >= 70) return '良好';
  if (score >= 60) return '一般';
  if (score >= 40) return '待改善';
  return '较差';
}

function MiniIcon({ type, color, size = 13 }: { type: PdfMetricIcon; color: string; size?: number }) {
  if (type === 'water') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 2C9 7 5.5 10.2 5.5 15A6.5 6.5 0 0 0 18.5 15C18.5 10.2 15 7 12 2Z" fill="none" stroke={color} strokeWidth={1.8} />
      </Svg>
    );
  }
  if (type === 'sleep') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M18.5 16.5A8 8 0 0 1 8 5.5 8.5 8.5 0 1 0 18.5 16.5Z" fill="none" stroke={color} strokeWidth={1.8} />
      </Svg>
    );
  }
  if (type === 'calendar') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M5 5H19V20H5Z M8 2V7 M16 2V7 M5 9H19" fill="none" stroke={color} strokeWidth={1.7} />
      </Svg>
    );
  }
  if (type === 'mood') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth={1.7} />
        <Circle cx="9" cy="10" r="1" fill={color} />
        <Circle cx="15" cy="10" r="1" fill={color} />
        <Path d="M8.5 14C10.5 16.2 13.5 16.2 15.5 14" fill="none" stroke={color} strokeWidth={1.5} />
      </Svg>
    );
  }
  if (type === 'pain') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth={1.7} />
        <Path d="M12 7V13 M12 17V17.2" fill="none" stroke={color} strokeWidth={1.9} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 14L9 9L12 12L20 4 M5 18H19" fill="none" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function HeartIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M20.8 4.7C18.8 2.7 15.5 2.7 13.5 4.7L12 6.2L10.5 4.7C8.5 2.7 5.2 2.7 3.2 4.7C1.1 6.8 1.1 10.1 3.2 12.2L12 21L20.8 12.2C22.9 10.1 22.9 6.8 20.8 4.7Z" fill="none" stroke={colors.ink} strokeWidth={1.7} />
    </Svg>
  );
}

function pointOnCircle(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function progressArc(score: number): string {
  const safeScore = Math.max(0.01, Math.min(99.99, score));
  const start = pointOnCircle(56, 56, 45, 0);
  const end = pointOnCircle(56, 56, 45, safeScore * 3.6);
  const largeArc = safeScore > 50 ? 1 : 0;
  return `M ${start.x} ${start.y} A 45 45 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function ScoreRing({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <View style={styles.ring}>
      <Svg width={112} height={112} viewBox="0 0 112 112">
        <Circle cx="56" cy="56" r="45" fill="none" stroke="#dfeae4" strokeWidth={9} />
        <Path
          d={progressArc(score)}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.ringText}>
        <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
        <Text style={styles.scoreCaption}>健康评分</Text>
        <Text style={[styles.scoreLabel, { color }]}>{scoreLabel(score)}</Text>
      </View>
    </View>
  );
}

const analysisCards = [
  { key: 'sleep' as const, title: '睡眠', icon: 'sleep' as const, color: colors.sleep, backgroundColor: '#f1eef8' },
  { key: 'water' as const, title: '喝水', icon: 'water' as const, color: colors.water, backgroundColor: '#eaf3f8' },
  { key: 'exercise' as const, title: '运动', icon: 'exercise' as const, color: colors.exercise, backgroundColor: '#eaf3ed' },
  { key: 'mood' as const, title: '情绪', icon: 'mood' as const, color: colors.mood, backgroundColor: '#faf4e7' },
];

export function createHealthReportPdfDocument(props: HealthReportPdfProps): React.ReactElement {
  const scoreItems = [
    { label: '睡眠', score: props.scores.sleep, type: 'sleep' as const, color: colors.sleep, border: '#d8cee9', bg: '#f8f5fb' },
    { label: '喝水', score: props.scores.water, type: 'water' as const, color: colors.water, border: '#cae0ec', bg: '#f4f9fc' },
    { label: '运动', score: props.scores.exercise, type: 'exercise' as const, color: colors.exercise, border: '#cde2d6', bg: '#f3f8f5' },
    { label: '情绪', score: props.scores.mood, type: 'mood' as const, color: colors.mood, border: '#ead9ba', bg: '#fcf8f0' },
  ];

  return (
    <Document title={`健康报告_${props.startDate}_${props.endDate}`} author="微迹" subject="微迹健康报告">
      <Page size="A4" style={styles.page} wrap>
        <Image src={reportBackground} style={styles.background} fixed />
        <View style={styles.readingLayer} fixed />
        <View style={styles.content}>
          <View wrap={false}>
            <Text style={styles.eyebrow}>微迹 · 健康周期总结</Text>
            <Text style={styles.title}>健康报告</Text>
            <Text style={styles.period}>{props.startDate} 至 {props.endDate}</Text>
            <View style={styles.headerLine} />
          </View>

          <View style={styles.summary} wrap={false}>
            <View style={styles.scoreColumn}>
              <ScoreRing score={props.scores.overall} />
              <View style={styles.chipList}>
                {scoreItems.map((item) => (
                  <View key={item.label} style={[styles.chip, { borderColor: item.border, backgroundColor: item.bg }]}>
                    <MiniIcon type={item.type} color={item.color} size={11} />
                    <Text style={styles.chipLabel}>{item.label}</Text>
                    <Text style={[styles.chipScore, { color: item.color }]}>{item.score}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.metrics}>
              {props.metrics.map((metric) => (
                <View key={metric.label} style={styles.metric}>
                  <MiniIcon type={metric.icon} color={metric.color} size={15} />
                  <View style={styles.metricValueRow}>
                    <Text style={[styles.metricValue, { color: metric.color }]}>{metric.value}</Text>
                    {metric.unit ? <Text style={styles.metricUnit}>{metric.unit}</Text> : null}
                  </View>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section} wrap={false}>
            <View style={styles.sectionHeading}>
              <HeartIcon />
              <Text style={styles.sectionHeadingText}>维度分析</Text>
            </View>
            <View style={styles.analysisGrid}>
              {analysisCards.map((card) => (
                <View key={card.key} style={[styles.analysisCard, { backgroundColor: card.backgroundColor }]}>
                  <View style={styles.cardHeader}>
                    <MiniIcon type={card.icon} color={card.color} size={12} />
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={[styles.cardScore, { color: card.color }]}>{props.scores[card.key]} 分</Text>
                  </View>
                  <Text style={styles.cardBody}>{props.analysis[card.key]}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section} wrap={false}>
            <View style={styles.sectionHeading}>
              <HeartIcon />
              <Text style={styles.sectionHeadingText}>健康建议</Text>
            </View>
            <View style={styles.adviceBox}>
              {props.advice.map((item, index) => (
                <View key={`${index}-${item}`} style={styles.adviceRow}>
                  <View style={styles.adviceIndex}>
                    <Text style={styles.adviceIndexText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.adviceText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>由 微迹 自动生成 · {props.generatedAt}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
