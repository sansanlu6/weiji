import type {
  SleepRecord,
  MoodRecord,
  PainRecord,
  DietRecord,
  ExerciseRecord,
  WaterRecord,
  MedicationRecord,
  PoopRecord,
  RecordType,
} from '@shared/api.interface';

export const TYPE_LABELS: Record<RecordType, string> = {
  sleep: '睡眠',
  mood: '情绪',
  pain: '病痛',
  diet: '饮食',
  exercise: '运动',
  water: '喝水',
  medication: '用药',
  poop: '排便',
};

export interface ListQuery {
  page: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
}

/** 计算今日时间范围（Asia/Shanghai） */
export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  const cnOffsetMs = 8 * 60 * 60 * 1000;
  const cnNow = new Date(now.getTime() + cnOffsetMs);
  const cnDateStr = cnNow.toISOString().slice(0, 10);
  const start = new Date(`${cnDateStr}T00:00:00+08:00`);
  const end = new Date(`${cnDateStr}T23:59:59.999+08:00`);
  return { start, end };
}

/** 计算某一天的时间范围（Asia/Shanghai），dateStr 格式 YYYY-MM-DD */
export function getDayRange(dateStr: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00+08:00`);
  const end = new Date(`${dateStr}T23:59:59.999+08:00`);
  return { start, end };
}

/** 获取最近 N 天的日期字符串数组（含今天，Asia/Shanghai），从新到旧 */
export function getLastNDateStrings(n: number): string[] {
  const result: string[] = [];
  const cnOffsetMs = 8 * 60 * 60 * 1000;
  const now = new Date();
  for (let i = 0; i < n; i += 1) {
    const d = new Date(now.getTime() + cnOffsetMs - i * 86400000);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

/** 计算两段时间差（分钟） */
export function calcDurationMinutes(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

// ========== Record mappers (snake_case → camelCase + ISO strings) ==========

export function mapSleep(row: any): SleepRecord {
  return {
    id: row.id,
    sleepTime: row.sleepTime.toISOString(),
    wakeTime: row.wakeTime.toISOString(),
    durationMinutes: row.durationMinutes,
    note: row.note ?? '',
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapMood(row: any): MoodRecord {
  return {
    id: row.id,
    moods: row.moods ?? [],
    recordTime: row.recordTime.toISOString(),
    imageUrl: row.imageUrl ?? '',
    note: row.note ?? '',
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapPain(row: any): PainRecord {
  return {
    id: row.id,
    symptoms: row.symptoms ?? [],
    painLevel: row.painLevel,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime ? row.endTime.toISOString() : undefined,
    durationMinutes: row.durationMinutes,
    description: row.description ?? '',
    note: row.note ?? '',
    medicationIds: row.medicationIds ?? [],
    painMarkers: row.painMarkers ?? [],
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapDiet(row: any): DietRecord {
  return {
    id: row.id,
    mealType: row.mealType,
    foodDescription: row.foodDescription ?? '',
    foodImageUrl: row.foodImageUrl ?? '',
     eatTime: row.eatTime
       ? (row.eatTime instanceof Date ? row.eatTime.toISOString() : String(row.eatTime))
       : row.createdAt.toISOString(),
    tags: row.tags ?? [],
    note: row.note ?? '',
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapExercise(row: any): ExerciseRecord {
  return {
    id: row.id,
    exerciseType: row.exerciseType,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime.toISOString(),
    durationMinutes: row.durationMinutes,
    imageUrl: row.imageUrl ?? '',
    note: row.note ?? '',
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapWater(row: any): WaterRecord {
  return {
    id: row.id,
    drinkTime: row.drinkTime.toISOString(),
    amountMl: row.amountMl,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapMedication(row: any): MedicationRecord {
  return {
    id: row.id,
    medicineName: row.medicineName,
    dosage: row.dosage ?? '',
    takeTime: row.takeTime.toISOString(),
    relatedSymptom: row.relatedSymptom ?? '',
    painRecordId: row.painRecordId ?? undefined,
    imageUrl: row.imageUrl ?? '',
    note: row.note ?? '',
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapPoop(row: any): PoopRecord {
  return {
    id: row.id,
    poopTime: row.poopTime.toISOString(),
    stoolType: row.stoolType,
    note: row.note ?? '',
    createdAt: row.createdAt.toISOString(),
  };
}

// ========== Summary builders for recent records ==========

export function summarizeSleep(r: any): string {
  const hrs = Math.floor(r.durationMinutes / 60);
  const mins = r.durationMinutes % 60;
  return hrs > 0
    ? `${hrs} 小时${mins > 0 ? ` ${mins} 分钟` : ''}`
    : `${mins} 分钟`;
}

export function summarizeMood(r: any): string {
  const moodStr = (r.moods ?? []).join('、') || '未记录';
  return `心情：${moodStr}`;
}

export function summarizePain(r: any): string {
  const symptomStr = (r.symptoms ?? []).join('、') || '未指定';
  const levelMap: Record<string, string> = {
    mild: '轻微',
    moderate: '中等',
    severe: '严重',
  };
  return `${levelMap[r.painLevel] ?? r.painLevel} - ${symptomStr}`;
}

export function summarizeDiet(r: any): string {
  const mealMap: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    supper: '宵夜',
    snack: '加餐',
  };
  return `${mealMap[r.mealType] ?? r.mealType}：${r.foodDescription || '未记录'}`;
}

export function summarizeExercise(r: any): string {
  const typeMap: Record<string, string> = {
    walking: '步行',
    running: '跑步',
    cycling: '骑行',
    swimming: '游泳',
    yoga: '瑜伽',
    strength: '力量训练',
  };
  const typeLabel = typeMap[r.exerciseType] ?? r.exerciseType;
  return `${typeLabel} ${r.durationMinutes} 分钟`;
}

export function summarizeWater(r: any): string {
  return `喝水 ${r.amountMl}ml`;
}

export function summarizeMedication(r: any): string {
  return `${r.medicineName} ${r.dosage ?? ''}`.trim();
}

export function summarizePoop(r: any): string {
  const typeMap: Record<string, string> = {
    normal: '正常',
    hard: '偏硬',
    soft: '偏软',
    loose: '稀便',
    constipated: '便秘',
    diarrhea: '腹泻',
  };
  return typeMap[r.stoolType] ?? r.stoolType;
}
