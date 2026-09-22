import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, gte, lt, desc, asc, count, sql } from 'drizzle-orm';
import {
  healthSleep,
  healthMood,
  healthPain,
  healthDiet,
  healthExercise,
  healthWater,
  healthMedication,
  healthPoop,
  healthGoals,
  healthAppUsers,
} from '@server/database/schema';
import type {
  SleepRecord,
  MoodRecord,
  PainRecord,
  DietRecord,
  ExerciseRecord,
  WaterRecord,
  MedicationRecord,
  PoopRecord,
  ListResponse,
  TodayOverview,
  RecentRecord,
  AchievementItem,
  AchievementsResponse,
  ProfileSummary,
  UpdateProfileRequest,
  UserProfileInfo,
} from '@shared/api.interface';
import {
  getTodayRange,
  getDayRange,
  getLastNDateStrings,
  calcDurationMinutes,
  mapSleep,
  mapMood,
  mapPain,
  mapDiet,
  mapExercise,
  mapWater,
  mapMedication,
  mapPoop,
  summarizeSleep,
  summarizeMood,
  summarizePain,
  summarizeDiet,
  summarizeExercise,
  summarizeWater,
  summarizeMedication,
  summarizePoop,
  TYPE_LABELS,
  type ListQuery,
} from './health-records.utils';

@Injectable()
export class HealthRecordsService {
  private readonly logger = new Logger(HealthRecordsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ==================== Shared Helpers ====================

  private baseFilter(table: any, userId: string) {
    return and(eq(table.userId, userId), eq(table.isDeleted, false));
  }

  private async paginatedQuery<T>(
    table: any,
    timeCol: any,
    userId: string,
    query: ListQuery,
    mapper: (row: any) => T,
  ): Promise<ListResponse<T>> {
    const { page, pageSize, startDate, endDate } = query;
    const conds: any[] = [];
    if (startDate) conds.push(gte(timeCol, new Date(startDate)));
    if (endDate) conds.push(lt(timeCol, new Date(endDate)));
    const where = conds.length > 0
      ? and(this.baseFilter(table, userId), ...conds)
      : this.baseFilter(table, userId);

    const [countRes, rows] = await Promise.all([
      this.db.select({ count: count() }).from(table).where(where),
      this.db
        .select()
        .from(table)
        .where(where)
        .orderBy(desc(timeCol))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countRes[0]?.count ?? 0);
    return { items: rows.map(mapper), total, page, pageSize };
  }

  private async findOne(table: any, userId: string, id: string): Promise<any> {
    const rows = await this.db
      .select()
      .from(table)
      .where(and(this.baseFilter(table, userId), eq(table.id, id)))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('记录不存在');
    return rows[0];
  }

  private async softDelete(
    table: any,
    userId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const updated = await this.db
      .update(table)
      .set({ isDeleted: true })
      .where(and(this.baseFilter(table, userId), eq(table.id, id)))
      .returning({ id: table.id });
    if (updated.length === 0) throw new NotFoundException('记录不存在');
    return { success: true };
  }

  /** Recompute duration when start/end times change during an update */
  private recomputeDuration(
    patch: any,
    current: any,
    startKey: string,
    endKey: string,
    nullableEnd = false,
  ) {
    const hasStart = patch[startKey] !== undefined;
    const hasEnd = patch[endKey] !== undefined;
    if (!hasStart && !hasEnd) return;
    const s: Date = hasStart ? patch[startKey] : current[startKey];
    const e: Date | null = hasEnd ? patch[endKey] : current[endKey];
    if (nullableEnd && !e) {
      patch.durationMinutes = 0;
    } else {
      patch.durationMinutes = calcDurationMinutes(s, e as Date);
    }
  }

  // ==================== Sleep ====================

  async listSleep(
    userId: string,
    query: ListQuery,
  ): Promise<ListResponse<SleepRecord>> {
    return this.paginatedQuery(
      healthSleep, healthSleep.sleepTime, userId, query, mapSleep,
    );
  }

  async createSleep(userId: string, dto: any): Promise<SleepRecord> {
    const sleepTime = new Date(dto.sleepTime);
    const wakeTime = new Date(dto.wakeTime);
    const durationMinutes = calcDurationMinutes(sleepTime, wakeTime);
    const rows = await this.db.insert(healthSleep).values({
      userId, sleepTime, wakeTime, durationMinutes,
      note: dto.note ?? null,
    }).returning();
    return mapSleep(rows[0]);
  }

  async getSleep(userId: string, id: string): Promise<SleepRecord> {
    return mapSleep(await this.findOne(healthSleep, userId, id));
  }

  async updateSleep(
    userId: string, id: string, dto: any,
  ): Promise<SleepRecord> {
    const patch: any = {};
    if (dto.sleepTime !== undefined) patch.sleepTime = new Date(dto.sleepTime);
    if (dto.wakeTime !== undefined) patch.wakeTime = new Date(dto.wakeTime);
    if (dto.note !== undefined) patch.note = dto.note ?? null;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    if (patch.sleepTime || patch.wakeTime) {
      const current = await this.findOne(healthSleep, userId, id);
      this.recomputeDuration(patch, current, 'sleepTime', 'wakeTime');
    }
    const updated = await this.db.update(healthSleep).set(patch)
      .where(and(this.baseFilter(healthSleep, userId), eq(healthSleep.id, id)))
      .returning();
    if (updated.length === 0) throw new NotFoundException('记录不存在');
    return mapSleep(updated[0]);
  }

  async deleteSleep(userId: string, id: string) {
    return this.softDelete(healthSleep, userId, id);
  }

  // ==================== Mood ====================

  async listMood(
    userId: string, query: ListQuery,
  ): Promise<ListResponse<MoodRecord>> {
    return this.paginatedQuery(
      healthMood, healthMood.recordTime, userId, query, mapMood,
    );
  }

  async createMood(userId: string, dto: any): Promise<MoodRecord> {
    const rows = await this.db.insert(healthMood).values({
      userId,
      moods: dto.moods ?? [],
      recordTime: new Date(dto.recordTime),
      imageUrl: dto.imageUrl ?? null,
      note: dto.note ?? null,
    }).returning();
    return mapMood(rows[0]);
  }

  async getMood(userId: string, id: string): Promise<MoodRecord> {
    return mapMood(await this.findOne(healthMood, userId, id));
  }

  async updateMood(
    userId: string, id: string, dto: any,
  ): Promise<MoodRecord> {
    const patch: any = {};
    if (dto.moods !== undefined) patch.moods = dto.moods;
    if (dto.recordTime !== undefined) patch.recordTime = new Date(dto.recordTime);
    if (dto.imageUrl !== undefined) patch.imageUrl = dto.imageUrl ?? null;
    if (dto.note !== undefined) patch.note = dto.note ?? null;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    const updated = await this.db.update(healthMood).set(patch)
      .where(and(this.baseFilter(healthMood, userId), eq(healthMood.id, id)))
      .returning();
    if (updated.length === 0) throw new NotFoundException('记录不存在');
    return mapMood(updated[0]);
  }

  async deleteMood(userId: string, id: string) {
    return this.softDelete(healthMood, userId, id);
  }

  // ==================== Pain ====================

  async listPain(
    userId: string, query: ListQuery,
  ): Promise<ListResponse<PainRecord>> {
    return this.paginatedQuery(
      healthPain, healthPain.startTime, userId, query, mapPain,
    );
  }

  async createPain(userId: string, dto: any): Promise<PainRecord> {
    const startTime = new Date(dto.startTime);
    const endTime = dto.endTime ? new Date(dto.endTime) : null;
    const durationMinutes = endTime
      ? calcDurationMinutes(startTime, endTime) : 0;
    const rows = await this.db.insert(healthPain).values({
      userId,
      symptoms: dto.symptoms ?? [],
      painLevel: dto.painLevel ?? 'mild',
      startTime, endTime, durationMinutes,
      description: dto.description ?? null,
      note: dto.note ?? null,
      medicationIds: dto.medicationIds ?? [],
      painMarkers: dto.painMarkers ?? [],
    }).returning();
    return mapPain(rows[0]);
  }

  async getPain(userId: string, id: string): Promise<PainRecord> {
    return mapPain(await this.findOne(healthPain, userId, id));
  }

  async updatePain(
    userId: string, id: string, dto: any,
  ): Promise<PainRecord> {
    const patch: any = {};
    if (dto.symptoms !== undefined) patch.symptoms = dto.symptoms;
    if (dto.painLevel !== undefined) patch.painLevel = dto.painLevel;
    if (dto.startTime !== undefined) patch.startTime = new Date(dto.startTime);
    if (dto.endTime !== undefined) {
      patch.endTime = dto.endTime ? new Date(dto.endTime) : null;
    }
    if (dto.description !== undefined)
      patch.description = dto.description ?? null;
    if (dto.note !== undefined) patch.note = dto.note ?? null;
    if (dto.medicationIds !== undefined)
      patch.medicationIds = dto.medicationIds;
    if (dto.painMarkers !== undefined)
      patch.painMarkers = dto.painMarkers;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    if (patch.startTime !== undefined || patch.endTime !== undefined) {
      const current = await this.findOne(healthPain, userId, id);
      this.recomputeDuration(patch, current, 'startTime', 'endTime', true);
    }
    const updated = await this.db.update(healthPain).set(patch)
      .where(and(this.baseFilter(healthPain, userId), eq(healthPain.id, id)))
      .returning();
    if (updated.length === 0) throw new NotFoundException('记录不存在');
    return mapPain(updated[0]);
  }

  async deletePain(userId: string, id: string) {
    return this.softDelete(healthPain, userId, id);
  }

  // ==================== Diet ====================

  async listDiet(
    userId: string, query: ListQuery,
  ): Promise<ListResponse<DietRecord>> {
    const { page, pageSize, startDate, endDate } = query;
    const conds: any[] = [
      eq(healthDiet.userId, userId),
      eq(healthDiet.isDeleted, false),
    ];
    const sortCol = sql<Date>`COALESCE(${healthDiet.eatTime}, ${healthDiet.createdAt})`;
    if (startDate) conds.push(gte(sortCol, new Date(startDate)));
    if (endDate) conds.push(lt(sortCol, new Date(endDate)));
    const where = and(...conds);

    const [countRes, rows] = await Promise.all([
      this.db.select({ count: count() }).from(healthDiet).where(where),
      this.db
        .select()
        .from(healthDiet)
        .where(where)
        .orderBy(desc(sortCol))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countRes[0]?.count ?? 0);
    return { items: rows.map(mapDiet), total, page, pageSize };
  }

  async createDiet(userId: string, dto: any): Promise<DietRecord> {
    const rows = await this.db.insert(healthDiet).values({
      userId,
      mealType: dto.mealType ?? 'lunch',
      foodDescription: dto.foodDescription ?? null,
      foodImageUrl: dto.foodImageUrl ?? null,
      eatTime: dto.eatTime ? new Date(dto.eatTime) : new Date(),
      tags: dto.tags ?? [],
      note: dto.note ?? null,
    }).returning();
    return mapDiet(rows[0]);
  }

  async getDiet(userId: string, id: string): Promise<DietRecord> {
    return mapDiet(await this.findOne(healthDiet, userId, id));
  }

  async updateDiet(
    userId: string, id: string, dto: any,
  ): Promise<DietRecord> {
    const patch: any = {};
    if (dto.mealType !== undefined) patch.mealType = dto.mealType;
    if (dto.foodDescription !== undefined)
      patch.foodDescription = dto.foodDescription ?? null;
    if (dto.foodImageUrl !== undefined)
      patch.foodImageUrl = dto.foodImageUrl ?? null;
    if (dto.eatTime !== undefined) patch.eatTime = new Date(dto.eatTime);
    if (dto.tags !== undefined) patch.tags = dto.tags;
    if (dto.note !== undefined) patch.note = dto.note ?? null;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    const updated = await this.db.update(healthDiet).set(patch)
      .where(and(this.baseFilter(healthDiet, userId), eq(healthDiet.id, id)))
      .returning();
    if (updated.length === 0) throw new NotFoundException('记录不存在');
    return mapDiet(updated[0]);
  }

  async deleteDiet(userId: string, id: string) {
    return this.softDelete(healthDiet, userId, id);
  }

  // ==================== Exercise ====================

  async listExercise(
    userId: string, query: ListQuery,
  ): Promise<ListResponse<ExerciseRecord>> {
    return this.paginatedQuery(
      healthExercise, healthExercise.startTime, userId, query, mapExercise,
    );
  }

  async createExercise(userId: string, dto: any): Promise<ExerciseRecord> {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const durationMinutes = calcDurationMinutes(startTime, endTime);
    const rows = await this.db.insert(healthExercise).values({
      userId,
      exerciseType: dto.exerciseType ?? 'walking',
      startTime, endTime, durationMinutes,
      imageUrl: dto.imageUrl ?? null,
      note: dto.note ?? null,
    }).returning();
    return mapExercise(rows[0]);
  }

  async getExercise(userId: string, id: string): Promise<ExerciseRecord> {
    return mapExercise(await this.findOne(healthExercise, userId, id));
  }

  async updateExercise(
    userId: string, id: string, dto: any,
  ): Promise<ExerciseRecord> {
    const patch: any = {};
    if (dto.exerciseType !== undefined) patch.exerciseType = dto.exerciseType;
    if (dto.startTime !== undefined) patch.startTime = new Date(dto.startTime);
    if (dto.endTime !== undefined) patch.endTime = new Date(dto.endTime);
    if (dto.imageUrl !== undefined) patch.imageUrl = dto.imageUrl ?? null;
    if (dto.note !== undefined) patch.note = dto.note ?? null;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    if (patch.startTime || patch.endTime) {
      const current = await this.findOne(healthExercise, userId, id);
      this.recomputeDuration(patch, current, 'startTime', 'endTime');
    }
    const updated = await this.db.update(healthExercise).set(patch)
      .where(and(this.baseFilter(healthExercise, userId), eq(healthExercise.id, id)))
      .returning();
    if (updated.length === 0) throw new NotFoundException('记录不存在');
    return mapExercise(updated[0]);
  }

  async deleteExercise(userId: string, id: string) {
    return this.softDelete(healthExercise, userId, id);
  }

  // ==================== Water ====================

  async listWater(
    userId: string, query: ListQuery,
  ): Promise<ListResponse<WaterRecord>> {
    return this.paginatedQuery(
      healthWater, healthWater.drinkTime, userId, query, mapWater,
    );
  }

  async createWater(userId: string, dto: any): Promise<WaterRecord> {
    const rows = await this.db.insert(healthWater).values({
      userId,
      drinkTime: new Date(dto.drinkTime),
      amountMl: dto.amountMl ?? 250,
    }).returning();
    return mapWater(rows[0]);
  }

  async getWater(userId: string, id: string): Promise<WaterRecord> {
    return mapWater(await this.findOne(healthWater, userId, id));
  }

  async updateWater(
    userId: string, id: string, dto: any,
  ): Promise<WaterRecord> {
    const patch: any = {};
    if (dto.drinkTime !== undefined) patch.drinkTime = new Date(dto.drinkTime);
    if (dto.amountMl !== undefined) patch.amountMl = dto.amountMl;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    const updated = await this.db.update(healthWater).set(patch)
      .where(and(this.baseFilter(healthWater, userId), eq(healthWater.id, id)))
      .returning();
    if (updated.length === 0) throw new NotFoundException('记录不存在');
    return mapWater(updated[0]);
  }

  async deleteWater(userId: string, id: string) {
    return this.softDelete(healthWater, userId, id);
  }

  // ==================== Medication ====================

  async listMedication(
    userId: string, query: ListQuery,
  ): Promise<ListResponse<MedicationRecord>> {
    return this.paginatedQuery(
      healthMedication, healthMedication.takeTime, userId, query, mapMedication,
    );
  }

  async createMedication(
    userId: string, dto: any,
  ): Promise<MedicationRecord> {
    const rows = await this.db.insert(healthMedication).values({
      userId,
      medicineName: dto.medicineName,
      dosage: dto.dosage ?? null,
      takeTime: new Date(dto.takeTime),
      relatedSymptom: dto.relatedSymptom ?? null,
      painRecordId: dto.painRecordId ?? null,
      imageUrl: dto.imageUrl ?? null,
      note: dto.note ?? null,
    }).returning();
    return mapMedication(rows[0]);
  }

  async getMedication(userId: string, id: string): Promise<MedicationRecord> {
    return mapMedication(await this.findOne(healthMedication, userId, id));
  }

  async updateMedication(
    userId: string, id: string, dto: any,
  ): Promise<MedicationRecord> {
    const patch: any = {};
    if (dto.medicineName !== undefined) patch.medicineName = dto.medicineName;
    if (dto.dosage !== undefined) patch.dosage = dto.dosage ?? null;
    if (dto.takeTime !== undefined) patch.takeTime = new Date(dto.takeTime);
    if (dto.relatedSymptom !== undefined)
      patch.relatedSymptom = dto.relatedSymptom ?? null;
    if (dto.painRecordId !== undefined)
      patch.painRecordId = dto.painRecordId ?? null;
    if (dto.imageUrl !== undefined) patch.imageUrl = dto.imageUrl ?? null;
    if (dto.note !== undefined) patch.note = dto.note ?? null;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    const updated = await this.db.update(healthMedication).set(patch)
      .where(and(this.baseFilter(healthMedication, userId), eq(healthMedication.id, id)))
      .returning();
    if (updated.length === 0) throw new NotFoundException('记录不存在');
    return mapMedication(updated[0]);
  }

  async deleteMedication(userId: string, id: string) {
    return this.softDelete(healthMedication, userId, id);
  }

  // ==================== Poop ====================

  async listPoop(
    userId: string, query: ListQuery,
  ): Promise<ListResponse<PoopRecord>> {
    return this.paginatedQuery(
      healthPoop, healthPoop.poopTime, userId, query, mapPoop,
    );
  }

  async createPoop(userId: string, dto: any): Promise<PoopRecord> {
    const rows = await this.db.insert(healthPoop).values({
      userId,
      poopTime: new Date(dto.poopTime),
      stoolType: dto.stoolType ?? 'normal',
      note: dto.note ?? null,
    }).returning();
    return mapPoop(rows[0]);
  }

  async getPoop(userId: string, id: string): Promise<PoopRecord> {
    return mapPoop(await this.findOne(healthPoop, userId, id));
  }

  async updatePoop(
    userId: string, id: string, dto: any,
  ): Promise<PoopRecord> {
    const patch: any = {};
    if (dto.poopTime !== undefined) patch.poopTime = new Date(dto.poopTime);
    if (dto.stoolType !== undefined) patch.stoolType = dto.stoolType;
    if (dto.note !== undefined) patch.note = dto.note ?? null;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    const updated = await this.db.update(healthPoop).set(patch)
      .where(and(this.baseFilter(healthPoop, userId), eq(healthPoop.id, id)))
      .returning();
    if (updated.length === 0) throw new NotFoundException('记录不存在');
    return mapPoop(updated[0]);
  }

  async deletePoop(userId: string, id: string) {
    return this.softDelete(healthPoop, userId, id);
  }

  // ==================== Today Overview ====================

  async getTodayOverview(userId: string): Promise<TodayOverview> {
    const { start, end } = getTodayRange();

    const [
      waterCount, sleepRows, exerciseRows, medicationCount,
      moodCount, painCount, dietCount, poopCount, goalRows,
    ] = await Promise.all([
      this.countToday(healthWater, healthWater.drinkTime, userId, start, end),
      this.db.select().from(healthSleep)
        .where(and(
          this.baseFilter(healthSleep, userId),
          gte(healthSleep.wakeTime, start),
          lt(healthSleep.wakeTime, end),
        ))
        .orderBy(desc(healthSleep.wakeTime)),
      this.db.select().from(healthExercise).where(and(
        this.baseFilter(healthExercise, userId),
        gte(healthExercise.startTime, start),
        lt(healthExercise.startTime, end),
      )),
      this.countToday(healthMedication, healthMedication.takeTime, userId, start, end),
      this.countToday(healthMood, healthMood.recordTime, userId, start, end),
      this.countToday(healthPain, healthPain.startTime, userId, start, end),
      this.countToday(healthDiet, healthDiet.eatTime, userId, start, end),
      this.countToday(healthPoop, healthPoop.poopTime, userId, start, end),
      this.db.select().from(healthGoals).where(and(
        this.baseFilter(healthGoals, userId),
        sql`${healthGoals.goalType} IN ('water_daily', 'sleep_daily')`,
      )),
    ]);

    const waterCups = waterCount;
    const medicationTaken = medicationCount;
    const recordCount =
      waterCups + medicationTaken + moodCount + painCount +
      dietCount + poopCount + exerciseRows.length +
      (sleepRows.length > 0 ? 1 : 0);

    const exerciseMinutes = exerciseRows.reduce(
      (sum: number, r: any) => sum + (r.durationMinutes ?? 0), 0,
    );
    const sleepMinutes = sleepRows.reduce(
      (sum: number, r: any) => sum + (r.durationMinutes ?? 0), 0,
    );

    let waterTarget = 8;
    let sleepTarget = 480;
    for (const g of goalRows) {
      if (g.goalType === 'water_daily') waterTarget = Number(g.targetValue);
      else if (g.goalType === 'sleep_daily')
        sleepTarget = Number(g.targetValue) * 60;
    }

    const [streakDays, weekWaterGoalRate, totalExerciseMinutes, exerciseTotalCount] = await Promise.all([
      this.computeStreakDays(userId),
      this.computeWeekWaterGoalRate(userId, waterTarget),
      this.computeTotalExerciseMinutes(userId),
      this.countAll(userId, healthExercise),
    ]);

    return {
      waterCups, waterTarget, recordCount, exerciseMinutes,
      medicationTaken, medicationTotal: 0,
      sleepMinutes, sleepTarget,
      streakDays,
      weekWaterGoalRate,
      totalExerciseMinutes,
      exerciseCount: exerciseTotalCount,
    };
  }

  private async computeStreakDays(userId: string): Promise<number> {
    const dateStrs = getLastNDateStrings(30);
    const { start: rangeStart } = getDayRange(dateStrs[dateStrs.length - 1]);
    const { end: rangeEnd } = getDayRange(dateStrs[0]);
    const rangeStartIso = rangeStart.toISOString();
    const rangeEndIso = rangeEnd.toISOString();

     const tables = [
       { table: healthWater, timeCol: healthWater.drinkTime },
       { table: healthSleep, timeCol: healthSleep.wakeTime },
       { table: healthMood, timeCol: healthMood.recordTime },
       { table: healthPain, timeCol: healthPain.startTime },
       { table: healthExercise, timeCol: healthExercise.startTime },
       { table: healthMedication, timeCol: healthMedication.takeTime },
       { table: healthPoop, timeCol: healthPoop.poopTime },
     ];

     const dateCounts = new Map<string, number>();

     await Promise.all([
       ...tables.map(async ({ table, timeCol }) => {
         const rows = await this.db
           .select({
             dateStr: sql<string>`DATE(${timeCol} AT TIME ZONE 'Asia/Shanghai')`,
             cnt: count(),
           })
           .from(table)
           .where(and(
             this.baseFilter(table, userId),
             gte(timeCol, rangeStartIso as unknown as Date),
             lt(timeCol, rangeEndIso as unknown as Date),
           ))
           .groupBy(sql`DATE(${timeCol} AT TIME ZONE 'Asia/Shanghai')`);
         for (const row of rows) {
           const key = String(row.dateStr);
           dateCounts.set(key, (dateCounts.get(key) ?? 0) + Number(row.cnt));
         }
       }),
       (async () => {
         const dietTime = sql<Date>`COALESCE(${healthDiet.eatTime}, ${healthDiet.createdAt})`;
         const rows = await this.db
           .select({
             dateStr: sql<string>`DATE(${dietTime} AT TIME ZONE 'Asia/Shanghai')`,
             cnt: count(),
           })
           .from(healthDiet)
           .where(and(
             this.baseFilter(healthDiet, userId),
             sql`${dietTime} >= ${rangeStartIso}::timestamptz`,
             sql`${dietTime} < ${rangeEndIso}::timestamptz`,
           ))
           .groupBy(sql`DATE(${dietTime} AT TIME ZONE 'Asia/Shanghai')`);
         for (const row of rows) {
           const key = String(row.dateStr);
           dateCounts.set(key, (dateCounts.get(key) ?? 0) + Number(row.cnt));
         }
       })(),
     ]);

    let streak = 0;
    for (const dateStr of dateStrs) {
      const count = dateCounts.get(dateStr) ?? 0;
      if (count > 0) {
        streak += 1;
      } else if (streak > 0) {
        break;
      }
    }
    return streak;
  }

  private async computeWeekWaterGoalRate(
    userId: string, waterTarget: number,
  ): Promise<number> {
    const dateStrs = getLastNDateStrings(7);
    const { start: weekStart, end: weekEnd } = getDayRange(dateStrs[6]);
    const weekStartIso = weekStart.toISOString();
    const weekEndIso = weekEnd.toISOString();

    const rows = await this.db
      .select({
        dateStr: sql<string>`DATE(${healthWater.drinkTime} AT TIME ZONE 'Asia/Shanghai')`,
        cnt: count(),
      })
      .from(healthWater)
      .where(and(
        this.baseFilter(healthWater, userId),
        gte(healthWater.drinkTime, weekStartIso as unknown as Date),
        lt(healthWater.drinkTime, weekEndIso as unknown as Date),
      ))
      .groupBy(sql`DATE(${healthWater.drinkTime} AT TIME ZONE 'Asia/Shanghai')`);

    const countMap = new Map<string, number>();
    for (const row of rows) {
      countMap.set(String(row.dateStr), Number(row.cnt));
    }

    const achievedDays = dateStrs.filter(
      (d: string) => (countMap.get(d) ?? 0) >= waterTarget,
    ).length;
    return Math.round((achievedDays / 7) * 100);
  }

  private async computeTotalExerciseMinutes(userId: string): Promise<number> {
    const rows = await this.db
      .select({ durationMinutes: healthExercise.durationMinutes })
      .from(healthExercise)
      .where(this.baseFilter(healthExercise, userId));
    return rows.reduce((sum: number, r: any) => sum + (r.durationMinutes ?? 0), 0);
  }

  private async computeEarlySleepDays(userId: string): Promise<number> {
    const rows = await this.db
      .select({
        sleepTime: healthSleep.sleepTime,
        wakeTime: healthSleep.wakeTime,
        dateStr: sql<string>`DATE(${healthSleep.wakeTime} AT TIME ZONE 'Asia/Shanghai')`,
        sleepHour: sql<number>`EXTRACT(HOUR FROM ${healthSleep.sleepTime} AT TIME ZONE 'Asia/Shanghai')`,
        sleepMinute: sql<number>`EXTRACT(MINUTE FROM ${healthSleep.sleepTime} AT TIME ZONE 'Asia/Shanghai')`,
        wakeHour: sql<number>`EXTRACT(HOUR FROM ${healthSleep.wakeTime} AT TIME ZONE 'Asia/Shanghai')`,
        wakeMinute: sql<number>`EXTRACT(MINUTE FROM ${healthSleep.wakeTime} AT TIME ZONE 'Asia/Shanghai')`,
      })
      .from(healthSleep)
      .where(this.baseFilter(healthSleep, userId));

    const validDays = new Set<string>();
    for (const row of rows as any[]) {
      const sleepH = Number(row.sleepHour);
      const sleepM = Number(row.sleepMinute);
      const wakeH = Number(row.wakeHour);
      const wakeM = Number(row.wakeMinute);
      const sleepMinutes = sleepH * 60 + sleepM;
      const wakeMinutes = wakeH * 60 + wakeM;
      const isEarlySleep = sleepMinutes >= 12 * 60 && sleepMinutes <= 23 * 60 + 30;
      const isEarlyWake = wakeMinutes <= 9 * 60;
      if (isEarlySleep && isEarlyWake) {
        validDays.add(String(row.dateStr));
      }
    }
    return validDays.size;
  }

  private async countToday(
    table: any, timeCol: any, userId: string,
    start: Date, end: Date,
  ): Promise<number> {
    const res = await this.db.select({ count: count() }).from(table)
      .where(and(
        this.baseFilter(table, userId),
        gte(timeCol, start),
        lt(timeCol, end),
      ));
    return Number(res[0]?.count ?? 0);
  }

  private countAll(userId: string, table: any): Promise<number> {
    return this.db
      .select({ count: count() })
      .from(table)
      .where(this.baseFilter(table, userId))
      .then((rows) => Number(rows[0]?.count ?? 0));
  }

   private async earliestRecord(
     userId: string, table: any, timeCol: any,
   ): Promise<Date | null> {
     const rows = await this.db
       .select().from(table)
       .where(this.baseFilter(table, userId))
       .orderBy(asc(timeCol))
       .limit(1);
     return rows[0]?.[timeCol] ?? null;
   }

   private async earliestDietRecord(userId: string): Promise<Date | null> {
     const dietTime = sql<string>`COALESCE(${healthDiet.eatTime}, ${healthDiet.createdAt})`;
     const rows = await this.db
       .select({ t: dietTime.as('t') })
       .from(healthDiet)
       .where(this.baseFilter(healthDiet, userId))
       .orderBy(sql`${dietTime} ASC`)
       .limit(1);
     return rows[0]?.t ? new Date(rows[0].t) : null;
   }

  async getProfileSummary(userId: string): Promise<ProfileSummary> {
    const [
      sleepCount, moodCount, painCount, dietCount,
      exerciseCount, waterCount, medicationCount, poopCount,
      streakDays,
      firstSleep, firstMood, firstPain, firstDiet,
      firstExercise, firstWater, firstMedication, firstPoop,
    ] = await Promise.all([
      this.countAll(userId, healthSleep),
      this.countAll(userId, healthMood),
      this.countAll(userId, healthPain),
      this.countAll(userId, healthDiet),
      this.countAll(userId, healthExercise),
      this.countAll(userId, healthWater),
      this.countAll(userId, healthMedication),
      this.countAll(userId, healthPoop),
      this.computeStreakDays(userId),
      this.earliestRecord(userId, healthSleep, healthSleep.wakeTime),
      this.earliestRecord(userId, healthMood, healthMood.recordTime),
      this.earliestRecord(userId, healthPain, healthPain.startTime),
      this.earliestDietRecord(userId),
      this.earliestRecord(userId, healthExercise, healthExercise.startTime),
      this.earliestRecord(userId, healthWater, healthWater.drinkTime),
      this.earliestRecord(userId, healthMedication, healthMedication.takeTime),
      this.earliestRecord(userId, healthPoop, healthPoop.poopTime),
    ]);

    const totalRecords = sleepCount + moodCount + painCount + dietCount +
      exerciseCount + waterCount + medicationCount + poopCount;

    const allFirstDates = [
      firstSleep, firstMood, firstPain, firstDiet,
      firstExercise, firstWater, firstMedication, firstPoop,
    ].filter((d: Date | null): d is Date => d !== null);
    const firstDate = allFirstDates.length > 0
      ? new Date(Math.min(...allFirstDates.map((d: Date) => d.getTime())))
      : null;

    const companionDays = firstDate
      ? Math.max(1, Math.floor((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
      : 1;

    return {
      streakDays,
      totalRecords,
      companionDays,
    };
  }

  async getProfile(userId: string): Promise<UserProfileInfo> {
    const rows = await this.db
      .select({
        id: healthAppUsers.id,
        username: healthAppUsers.username,
        signature: healthAppUsers.signature,
        avatarUrl: healthAppUsers.avatarUrl,
        createdAt: healthAppUsers.createdAt,
      })
      .from(healthAppUsers)
      .where(eq(healthAppUsers.id, userId))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      username: row.username,
      signature: row.signature ?? '',
      avatarUrl: row.avatarUrl ?? '',
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileRequest,
  ): Promise<UserProfileInfo> {
    const patch: Partial<typeof healthAppUsers.$inferInsert> = {};
    if (dto.username !== undefined) {
      const trimmed = dto.username.trim();
      if (!trimmed) {
        throw new BadRequestException('昵称不能为空');
      }
      if (trimmed.length > 64) {
        throw new BadRequestException('昵称不能超过64个字符');
      }
      const existing = await this.db
        .select({ id: healthAppUsers.id })
        .from(healthAppUsers)
        .where(eq(healthAppUsers.username, trimmed))
        .limit(1);
      if (existing.length > 0 && existing[0].id !== userId) {
        throw new ConflictException('昵称已被使用');
      }
      patch.username = trimmed;
    }
    if (dto.signature !== undefined) {
      if (dto.signature.length > 200) {
        throw new BadRequestException('签名不能超过200个字符');
      }
      patch.signature = dto.signature;
    }
    if (dto.avatarUrl !== undefined) {
      if (dto.avatarUrl.length > 2048) {
        throw new BadRequestException('头像地址过长');
      }
      patch.avatarUrl = dto.avatarUrl;
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    let updated: { id: string; username: string | null; signature: string | null; avatarUrl: string | null; createdAt: Date }[];
    try {
      updated = await this.db
        .update(healthAppUsers)
        .set(patch)
        .where(eq(healthAppUsers.id, userId))
        .returning({
          id: healthAppUsers.id,
          username: healthAppUsers.username,
          signature: healthAppUsers.signature,
          avatarUrl: healthAppUsers.avatarUrl,
          createdAt: healthAppUsers.createdAt,
        });
    } catch (err) {
      this.logger.error(`updateProfile db error: ${JSON.stringify(err)}`);
      throw err;
    }

    if (updated.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    const row = updated[0];
    return {
      id: row.id,
      username: row.username,
      signature: row.signature ?? '',
      avatarUrl: row.avatarUrl ?? '',
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getAchievements(
    userId: string,
  ): Promise<AchievementsResponse> {
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        return await this.computeAchievements(userId);
      } catch (err: unknown) {
        const code = this.extractPgErrorCode(err);
        const isTransient = code === '57P01' || code === '08006' || code === '08001' ||
          code === '57P02' || code === 'XX000' ||
          (typeof (err as any).message === 'string' &&
            /draining|connection|terminat|retry/i.test((err as any).message));
        if (!isTransient || attempt >= maxRetries) {
          if (!isTransient) throw err;
          this.logger.warn(`achievements DB error after ${maxRetries + 1} attempts, returning empty fallback`);
          return {
            items: [
              {
                id: 'first-record',
                name: '初次相遇',
                description: '完成第一条健康记录',
                criterion: '完成任意一条记录',
                icon: 'sparkles',
                category: 'milestone',
                isAchieved: false,
                progress: 0,
                target: 1,
                unit: '条',
              },
              { id: 'streak-3', name: '三日坚持', description: '连续 3 天都有健康记录', criterion: '连续记录 3 天', icon: 'flame', category: 'streak', isAchieved: false, progress: 0, target: 3, unit: '天' },
              { id: 'streak-7', name: '一周坚持', description: '连续 7 天都有健康记录', criterion: '连续记录 7 天', icon: 'flame', category: 'streak', isAchieved: false, progress: 0, target: 7, unit: '天' },
              { id: 'streak-30', name: '月度习惯', description: '连续 30 天坚持记录健康', criterion: '连续记录 30 天', icon: 'trophy', category: 'streak', isAchieved: false, progress: 0, target: 30, unit: '天' },
              { id: 'water-daily', name: '喝水达人', description: '本周喝水达标的天数', criterion: '本周 7 天中 ≥ 5 天达成喝水目标', icon: 'droplets', category: 'water', isAchieved: false, progress: 0, target: 5, unit: '天' },
              { id: 'exercise-5', name: '运动达人', description: '累计完成 5 次运动记录', criterion: '累计运动 5 次', icon: 'activity', category: 'exercise', isAchieved: false, progress: 0, target: 5, unit: '次' },
              { id: 'exercise-100min', name: '活力满满', description: '累计运动超过 100 分钟', criterion: '累计运动 100 分钟', icon: 'zap', category: 'exercise', isAchieved: false, progress: 0, target: 100, unit: '分钟' },
              { id: 'mood-10', name: '心情记录家', description: '累计记录 10 次情绪', criterion: '累计情绪记录 10 条', icon: 'smile', category: 'mood', isAchieved: false, progress: 0, target: 10, unit: '条' },
              { id: 'sleep-7', name: '早睡早起', description: '在 23:30 前入睡且 9:00 前起床', criterion: '累计 7 天在 23:30 前入睡且 9:00 前起床', icon: 'moon', category: 'sleep', isAchieved: false, progress: 0, target: 7, unit: '天' },
              { id: 'medication-adhere', name: '按时服药', description: '累计记录 10 次用药', criterion: '累计用药记录 10 条', icon: 'pill', category: 'medication', isAchieved: false, progress: 0, target: 10, unit: '次' },
            ],
            total: 10,
            achievedCount: 0,
          };
        }
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
    return { items: [], total: 0, achievedCount: 0 };
  }

  private extractPgErrorCode(err: unknown): string | undefined {
    let current: unknown = err;
    for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
      const { code, cause } = current as { code?: unknown; cause?: unknown };
      if (typeof code === 'string') return code;
      current = cause;
    }
    return undefined;
  }

  private async computeAchievements(
    userId: string,
  ): Promise<AchievementsResponse> {
    const [
      sleepCount, moodCount, painCount, dietCount,
      exerciseCount, waterCount, medicationCount, poopCount,
      totalExerciseMinutes, streakDays, earlySleepDays,
      firstSleep, firstMood, firstPain, firstDiet,
      firstExercise, firstWater, firstMedication, firstPoop,
    ] = await Promise.all([
      this.countAll(userId, healthSleep),
      this.countAll(userId, healthMood),
      this.countAll(userId, healthPain),
      this.countAll(userId, healthDiet),
      this.countAll(userId, healthExercise),
      this.countAll(userId, healthWater),
      this.countAll(userId, healthMedication),
      this.countAll(userId, healthPoop),
      this.computeTotalExerciseMinutes(userId),
      this.computeStreakDays(userId),
      this.computeEarlySleepDays(userId),
      this.earliestRecord(userId, healthSleep, healthSleep.wakeTime),
      this.earliestRecord(userId, healthMood, healthMood.recordTime),
      this.earliestRecord(userId, healthPain, healthPain.startTime),
       this.earliestDietRecord(userId),
      this.earliestRecord(userId, healthExercise, healthExercise.startTime),
      this.earliestRecord(userId, healthWater, healthWater.drinkTime),
      this.earliestRecord(userId, healthMedication, healthMedication.takeTime),
      this.earliestRecord(userId, healthPoop, healthPoop.poopTime),
    ]);

    const totalRecords = sleepCount + moodCount + painCount + dietCount +
      exerciseCount + waterCount + medicationCount + poopCount;

    const allFirstDates = [
      firstSleep, firstMood, firstPain, firstDiet,
      firstExercise, firstWater, firstMedication, firstPoop,
    ].filter((d: Date | null): d is Date => d !== null);
    const firstDate = allFirstDates.length > 0
      ? new Date(Math.min(...allFirstDates.map((d: Date) => d.getTime())))
      : null;

    const weekWaterRate = await this.computeWeekWaterGoalRate(userId, 8);

    const items: AchievementItem[] = [
      {
        id: 'first-record',
        name: '初次相遇',
        description: '完成第一条健康记录',
        criterion: '完成任意一条记录',
        icon: 'sparkles',
        category: 'milestone',
        isAchieved: totalRecords >= 1,
        progress: Math.min(1, totalRecords),
        target: 1,
        unit: '条',
        achievedAt: firstDate?.toISOString(),
      },
      {
        id: 'streak-3',
        name: '三日坚持',
        description: '连续 3 天都有健康记录',
        criterion: '连续记录 3 天',
        icon: 'flame',
        category: 'streak',
        isAchieved: streakDays >= 3,
        progress: Math.min(3, streakDays),
        target: 3,
        unit: '天',
      },
      {
        id: 'streak-7',
        name: '一周坚持',
        description: '连续 7 天都有健康记录',
        criterion: '连续记录 7 天',
        icon: 'flame',
        category: 'streak',
        isAchieved: streakDays >= 7,
        progress: Math.min(7, streakDays),
        target: 7,
        unit: '天',
      },
      {
        id: 'streak-30',
        name: '月度习惯',
        description: '连续 30 天坚持记录健康',
        criterion: '连续记录 30 天',
        icon: 'trophy',
        category: 'streak',
        isAchieved: streakDays >= 30,
        progress: Math.min(30, streakDays),
        target: 30,
        unit: '天',
      },
      {
        id: 'water-daily',
        name: '喝水达人',
        description: '本周喝水达标的天数',
        criterion: '本周 7 天中 ≥ 5 天达成喝水目标',
        icon: 'droplets',
        category: 'water',
        isAchieved: weekWaterRate >= 71,
        progress: Math.round((weekWaterRate / 100) * 7),
        target: 5,
        unit: '天',
      },
      {
        id: 'exercise-5',
        name: '运动达人',
        description: '累计完成 5 次运动记录',
        criterion: '累计运动 5 次',
        icon: 'activity',
        category: 'exercise',
        isAchieved: exerciseCount >= 5,
        progress: Math.min(5, exerciseCount),
        target: 5,
        unit: '次',
      },
      {
        id: 'exercise-100min',
        name: '活力满满',
        description: '累计运动超过 100 分钟',
        criterion: '累计运动 100 分钟',
        icon: 'zap',
        category: 'exercise',
        isAchieved: totalExerciseMinutes >= 100,
        progress: Math.min(100, totalExerciseMinutes),
        target: 100,
        unit: '分钟',
      },
      {
        id: 'mood-10',
        name: '心情记录家',
        description: '累计记录 10 次情绪',
        criterion: '累计情绪记录 10 条',
        icon: 'smile',
        category: 'mood',
        isAchieved: moodCount >= 10,
        progress: Math.min(10, moodCount),
        target: 10,
        unit: '条',
      },
      {
        id: 'sleep-7',
        name: '早睡早起',
        description: '在 23:30 前入睡且 9:00 前起床',
        criterion: '累计 7 天在 23:30 前入睡且 9:00 前起床',
        icon: 'moon',
        category: 'sleep',
        isAchieved: earlySleepDays >= 7,
        progress: Math.min(7, earlySleepDays),
        target: 7,
        unit: '天',
      },
      {
        id: 'medication-adhere',
        name: '按时服药',
        description: '累计记录 10 次用药',
        criterion: '累计用药记录 10 条',
        icon: 'pill',
        category: 'medication',
        isAchieved: medicationCount >= 10,
        progress: Math.min(10, medicationCount),
        target: 10,
        unit: '次',
      },
    ];

    return {
      items,
      total: items.length,
      achievedCount: items.filter((i) => i.isAchieved).length,
    };
  }

  // ==================== Recent Records ====================

  async getRecentRecords(
    userId: string, limit: number,
  ): Promise<RecentRecord[]> {
    const { start, end } = getTodayRange();

    const fetchToday = (table: any, timeCol: any) =>
      this.db.select().from(table)
        .where(and(this.baseFilter(table, userId), gte(timeCol, start), lt(timeCol, end)))
        .orderBy(desc(timeCol))
        .limit(limit);

     const [
       sleepRows, moodRows, painRows, dietRows,
       exerciseRows, waterRows, medicationRows, poopRows,
     ] = await Promise.all([
       fetchToday(healthSleep, healthSleep.wakeTime),
       fetchToday(healthMood, healthMood.recordTime),
       fetchToday(healthPain, healthPain.startTime),
       (async () => {
         const dietTime = sql<Date>`COALESCE(${healthDiet.eatTime}, ${healthDiet.createdAt})`;
         return this.db.select({
           id: healthDiet.id,
           mealType: healthDiet.mealType,
           foodDescription: healthDiet.foodDescription,
           foodImageUrl: healthDiet.foodImageUrl,
           tags: healthDiet.tags,
           note: healthDiet.note,
           eatTime: dietTime.as('eat_time'),
           createdAt: healthDiet.createdAt,
         })
           .from(healthDiet)
           .where(and(
             this.baseFilter(healthDiet, userId),
             sql`${dietTime} >= ${start.toISOString()}::timestamptz`,
             sql`${dietTime} < ${end.toISOString()}::timestamptz`,
           ))
           .orderBy(sql`${dietTime} DESC`)
           .limit(limit);
       })(),
       fetchToday(healthExercise, healthExercise.startTime),
       fetchToday(healthWater, healthWater.drinkTime),
       fetchToday(healthMedication, healthMedication.takeTime),
       fetchToday(healthPoop, healthPoop.poopTime),
     ]);

    const all: RecentRecord[] = [];
    const toIso = (v: unknown): string => {
      if (v instanceof Date) return v.toISOString();
      if (typeof v === 'string') return new Date(v).toISOString();
      return new Date(String(v)).toISOString();
    };
    const push = (rows: any[], type: keyof typeof TYPE_LABELS, timeKey: string, summarizer: (r: any) => string) => {
      for (const r of rows) {
        all.push({
          id: r.id, type, typeLabel: TYPE_LABELS[type],
          time: toIso(r[timeKey]),
          summary: summarizer(r),
        });
      }
    };

    push(sleepRows, 'sleep', 'wakeTime', summarizeSleep);
    push(moodRows, 'mood', 'recordTime', summarizeMood);
    push(painRows, 'pain', 'startTime', summarizePain);
     push(dietRows as any[], 'diet', 'eatTime', summarizeDiet);
    push(exerciseRows, 'exercise', 'startTime', summarizeExercise);
    push(waterRows, 'water', 'drinkTime', summarizeWater);
    push(medicationRows, 'medication', 'takeTime', summarizeMedication);
    push(poopRows, 'poop', 'poopTime', summarizePoop);

    all.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return all.slice(0, limit);
  }
}
