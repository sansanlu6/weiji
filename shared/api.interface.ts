export type RecordType = 'sleep' | 'mood' | 'pain' | 'diet' | 'exercise' | 'water' | 'medication' | 'poop';

export interface SleepRecord {
  id: string;
  sleepTime: string;
  wakeTime: string;
  durationMinutes: number;
  note: string;
  createdAt: string;
}

export interface MoodRecord {
  id: string;
  moods: string[];
  recordTime: string;
  imageUrl: string;
  note: string;
  createdAt: string;
}

export interface PainRecord {
  id: string;
  symptoms: string[];
  painLevel: 'mild' | 'moderate' | 'severe';
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  description: string;
  note: string;
  medicationIds: string[];
  painMarkers: PainMarker[];
  createdAt: string;
}

export interface PainMarker {
  x: number;
  y: number;
  size: number;
  side: 'front' | 'back';
  painLevel?: 'mild' | 'moderate' | 'severe';
}

export interface DietRecord {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'supper' | 'snack';
  foodDescription: string;
  foodImageUrl: string;
  eatTime: string;
  tags: string[];
  note: string;
  createdAt: string;
}

export interface ExerciseRecord {
  id: string;
  exerciseType: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  imageUrl: string;
  note: string;
  createdAt: string;
}

export interface WaterRecord {
  id: string;
  drinkTime: string;
  amountMl: number;
  createdAt: string;
}

export interface MedicationRecord {
  id: string;
  medicineName: string;
  dosage: string;
  takeTime: string;
  relatedSymptom: string;
  painRecordId?: string;
  imageUrl: string;
  note: string;
  createdAt: string;
}

export interface PoopRecord {
  id: string;
  poopTime: string;
  stoolType: string;
  note: string;
  createdAt: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TodayOverview {
  waterCups: number;
  waterTarget: number;
  recordCount: number;
  exerciseMinutes: number;
  medicationTaken: number;
  medicationTotal: number;
  sleepMinutes: number;
  sleepTarget: number;
  streakDays: number;
  weekWaterGoalRate: number;
  totalExerciseMinutes: number;
  exerciseCount: number;
}

export interface RecentRecord {
  id: string;
  type: RecordType;
  typeLabel: string;
  time: string;
  summary: string;
}

export interface GoalItem {
  id: string;
  goalType: string;
  targetValue: number;
  period: string;
}

export interface ReminderItem {
  id: string;
  reminderType: string;
  title: string;
  timePoints: string[];
  repeatType: string;
  repeatDays: string[];
  repeatInterval: number;
  endDate?: string;
  isEnabled: boolean;
}

export interface ProfileSummary {
  streakDays: number;
  totalRecords: number;
  companionDays: number;
}

export interface UpdateProfileRequest {
  username?: string;
  signature?: string;
  avatarUrl?: string;
}

export interface UserProfileInfo {
  id: string;
  username: string;
  signature: string;
  avatarUrl: string;
  createdAt: string;
}

export interface AchievementItem {
  id: string;
  name: string;
  description: string;
  criterion: string;
  icon: string;
  category: string;
  isAchieved: boolean;
  progress: number;
  target: number;
  unit: string;
  achievedAt?: string;
}

export interface AchievementsResponse {
  items: AchievementItem[];
  total: number;
  achievedCount: number;
}

export interface AlertConfig {
  id: string;
  alertType: string;
  threshold: number;
  isEnabled: boolean;
}

export interface StatsItem {
  date: string;
  value: number;
}

export interface MoodDistribution {
  mood: string;
  count: number;
}

export interface PainFrequency {
  symptom: string;
  count: number;
}

export interface CorrelationResult {
  description: string;
  correlation: number;
  chartData: { date: string; primary: number; secondary: number }[];
}

export interface AlertRecord {
  id: string;
  alertType: string;
  alertTypeLabel: string;
  date: string;
  value: number;
  threshold: number;
  unit: string;
}

export interface UnifiedRecord {
  id: string;
  type: RecordType;
  typeLabel: string;
  time: string;
  summary: string;
  detail: Record<string, any>;
}

export interface DataSearchResponse {
  items: UnifiedRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RecycleRecord extends UnifiedRecord {
  deletedAt: string;
}

export interface ExportJsonResult {
  records: UnifiedRecord[];
  exportTime: string;
  total: number;
}

export interface BatchDeleteResult {
  success: boolean;
  deletedCount: number;
}

export interface MonthlyDetailStats
  extends Omit<WeeklyDetailStats, 'sleep' | 'mood' | 'pain' | 'exercise' | 'water' | 'poop'>
{
  topKpis: {
    avgSleepHours: number;
    positiveMoodRate: number;
    topMoodLabel: string;
    exerciseTotalMinutes: number;
    avgWaterCups: number;
    waterMeetTargetDays: number;
  };
  sleep: WeeklyDetailStats['sleep'] & {
    weeklyQuality: { weekLabel: string; good: number; medium: number; poor: number }[];
    worstWeekLabel: string;
  };
  mood: WeeklyDetailStats['mood'] & {
    positiveRate: number;
    dailyMoods: { date: string; mood: string; isPositive: boolean }[];
  };
  pain: WeeklyDetailStats['pain'] & {
    top5Symptoms: { symptom: string; count: number }[];
  };
  exercise: WeeklyDetailStats['exercise'] & {
    weeklyTrend: { weekLabel: string; minutes: number }[];
  };
  water: WeeklyDetailStats['water'] & {
    targetCups: number;
    meetTargetDays: number;
  };
  poop: WeeklyDetailStats['poop'] & {
    avgDaily: number;
  };
}

export interface WeeklyDetailStats {
  diet: {
    fullMealDays: number;
    takeoutCount: number;
    takeoutRate: number;
    takeoutByMeal: { meal: string; count: number }[];
    mealTypeComposition: { type: string; count: number }[];
    mostMissedMeal: string;
    missedCount: number;
  };
  sleep: {
    dailyHours: { date: string; hours: number }[];
    qualityDistribution: { quality: string; count: number }[];
    bestDay: { date: string; hours: number } | null;
    worstDay: { date: string; hours: number } | null;
    avgHours: number;
    targetHours: number;
    meetTargetDays: number;
  };
  water: {
    dailyCups: { date: string; cups: number }[];
    avgCups: number;
    maxCups: number;
    totalCups: number;
  };
  exercise: {
    typeComposition: { type: string; minutes: number }[];
    totalMinutes: number;
    avgMinutes: number;
    sessionCount: number;
    intensityDistribution: { level: string; minutes: number }[];
  };
  mood: {
    distribution: { mood: string; count: number }[];
    topMood: string;
    topMoodDays: number;
    dailyTrend: { date: string; mood: string }[];
  };
  pain: {
    topSymptoms: { symptom: string; count: number }[];
    levelDistribution: { level: string; count: number }[];
    daysWithPain: number;
  };
  medication: {
    totalDoses: number;
    onTimeRate: number;
    medicines: { name: string; count: number }[];
  };
  poop: {
    totalCount: number;
    typeDistribution: { type: string; count: number }[];
  };
}

export interface HalfYearMonthlyStats {
  months: string[];
  sleep: {
    avgHours: number[];
    good: number[];
    medium: number[];
    poor: number[];
    bestMonthIdx: number;
    bestHours: number;
    targetHours: number;
    meetRate: number[];
  };
  mood: {
    score: number[];
    positiveRate: number[];
    peakMonthIdx: number;
    valleyMonthIdx: number;
    peakScore: number;
    valleyScore: number;
  };
  diet: {
    takeoutCount: number[];
    takeoutTrend: number[];
    peakMonthIdx: number;
    peakCount: number;
    totalMeals: number[];
  };
  medication: {
    medicines: { name: string; count: number }[];
    totalDoses: number;
    onTimeRate: number;
  };
  poop: {
    totalCount: number[];
    abnormalCount: number[];
    avgDaily: number[];
    maxMonthIdx: number;
    maxCount: number;
  };
  exercise: {
    sessionCount: number[];
    totalMinutes: number[];
    peakMonthIdx: number;
    peakCount: number;
  };
  pain: {
    episodeDays: number[];
    severeDays: number[];
    peakMonthIdx: number;
    peakDays: number;
    topSymptoms: { symptom: string; count: number }[];
  };
  water: {
    totalCups: number[];
    avgCups: number[];
    targetCups: number;
    meetDays: number[];
    bestMonthIdx: number;
    bestAvg: number;
  };
}

export interface YearlyDetailStats {
  months: string[];
  totalRecords: number;
  recordDays: number;
  dimensionCount: number;
  sleep: {
    avgHours: number[];
    bestMonthIdx: number;
    bestHours: number;
    worstMonthIdx: number;
    worstHours: number;
  };
  mood: {
    score: number[];
    positiveRate: number[];
    peakMonthIdx: number;
    valleyMonthIdx: number;
    topMood: string;
    topMoodCount: number;
    negativePeakMonthIdx: number;
    negativePeakCount: number;
  };
  diet: {
    takeoutCount: number[];
    totalMeals: number[];
    takeoutPeakMonthIdx: number;
    takeoutPeakCount: number;
    yearTotalMeals: number;
    yearTakeoutCount: number;
    mostCommonMealType: string;
    mostCommonMealTypeCount: number;
  };
  exercise: {
    sessionCount: number[];
    totalMinutes: number[];
    peakMonthIdx: number;
    peakCount: number;
    yearTotalMinutes: number;
  };
  pain: {
    episodeCount: number[];
    peakMonthIdx: number;
    peakCount: number;
    topSymptoms: { symptom: string; count: number }[];
  };
  water: {
    avgMl: number[];
    avgCups: number[];
    yearTotalMl: number;
    bestMonthIdx: number;
    bestAvgMl: number;
  };
  keywords: { word: string; count: number; category: string }[];
}

export interface ImageDedupQueryRequest {
  fileHash: string;
}

export interface ImageDedupQueryResponse {
  exists: boolean;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface ImageDedupRegisterRequest {
  fileHash: string;
  fileName: string;
  downloadUrl: string;
  fileSize: number;
}

export interface ImageDedupRegisterResponse {
  success: boolean;
  downloadUrl: string;
}
