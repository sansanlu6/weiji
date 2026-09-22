import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, gte, lt, desc, ilike, or, inArray, sql } from 'drizzle-orm';
import {
  healthSleep,
  healthMood,
  healthPain,
  healthDiet,
  healthExercise,
  healthWater,
  healthMedication,
  healthPoop,
  imageDedup,
} from '@server/database/schema';
import type { RecordType } from '@shared/api.interface';
import {
  TYPE_LABELS,
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
} from '../health-records/health-records.utils';

const ALL_TYPES: RecordType[] = [
  'sleep', 'mood', 'pain', 'diet',
  'exercise', 'water', 'medication', 'poop',
];

interface TableMeta {
  table: any;
  timeCol: any;
  mapper: (row: any) => any;
  summarizer: (row: any) => string;
  keywordCols: any[];
}

function getTableMeta(type: RecordType): TableMeta {
  switch (type) {
    case 'sleep':
      return {
        table: healthSleep,
        timeCol: healthSleep.sleepTime,
        mapper: mapSleep,
        summarizer: summarizeSleep,
        keywordCols: [
          healthSleep.note,
          sql`'睡眠'`,
          sql`'睡了'`,
        ],
      };
    case 'mood':
      return {
        table: healthMood,
        timeCol: healthMood.recordTime,
        mapper: mapMood,
        summarizer: summarizeMood,
        keywordCols: [
          healthMood.note,
          sql`array_to_string(${healthMood.moods}, ',')`,
          sql`'心情'`,
          sql`'情绪'`,
        ],
      };
    case 'pain':
      return {
        table: healthPain,
        timeCol: healthPain.startTime,
        mapper: mapPain,
        summarizer: summarizePain,
        keywordCols: [
          healthPain.description,
          healthPain.note,
          sql`array_to_string(${healthPain.symptoms}, ',')`,
          sql`'病痛'`,
        ],
      };
     case 'diet':
       return {
         table: healthDiet,
         timeCol: sql<Date>`COALESCE(${healthDiet.eatTime}, ${healthDiet.createdAt})`,
        mapper: mapDiet,
        summarizer: summarizeDiet,
        keywordCols: [
          healthDiet.foodDescription,
          healthDiet.note,
          sql`array_to_string(${healthDiet.tags}, ',')`,
          sql`'饮食'`,
          sql`CASE ${healthDiet.mealType}
            WHEN 'breakfast' THEN '早餐'
            WHEN 'lunch' THEN '午餐'
            WHEN 'dinner' THEN '晚餐'
            WHEN 'supper' THEN '宵夜'
            WHEN 'snack' THEN '加餐'
            ELSE ${healthDiet.mealType}
          END`,
        ],
      };
    case 'exercise':
      return {
        table: healthExercise,
        timeCol: healthExercise.startTime,
        mapper: mapExercise,
        summarizer: summarizeExercise,
        keywordCols: [
          healthExercise.note,
          sql`CASE ${healthExercise.exerciseType}
            WHEN 'walking' THEN '步行健走走路'
            WHEN 'running' THEN '跑步'
            WHEN 'cycling' THEN '骑行'
            WHEN 'swimming' THEN '游泳'
            WHEN 'yoga' THEN '瑜伽'
            WHEN 'strength' THEN '力量训练'
            ELSE ${healthExercise.exerciseType}
          END`,
          sql`'运动'`,
          sql`'分钟'`,
        ],
      };
    case 'water':
      return {
        table: healthWater,
        timeCol: healthWater.drinkTime,
        mapper: mapWater,
        summarizer: summarizeWater,
        keywordCols: [
          sql`'喝水'`,
          sql`'ml'`,
          sql`${healthWater.amountMl}::text`,
        ],
      };
    case 'medication':
      return {
        table: healthMedication,
        timeCol: healthMedication.takeTime,
        mapper: mapMedication,
        summarizer: summarizeMedication,
        keywordCols: [
          healthMedication.medicineName,
          healthMedication.relatedSymptom,
          healthMedication.dosage,
          healthMedication.note,
          sql`'用药'`,
        ],
      };
    case 'poop':
      return {
        table: healthPoop,
        timeCol: healthPoop.poopTime,
        mapper: mapPoop,
        summarizer: summarizePoop,
        keywordCols: [
          healthPoop.note,
          sql`CASE ${healthPoop.stoolType}
            WHEN 'normal' THEN '正常'
            WHEN 'hard' THEN '偏硬'
            WHEN 'soft' THEN '偏软'
            WHEN 'loose' THEN '稀便'
            WHEN 'constipated' THEN '便秘'
            WHEN 'diarrhea' THEN '腹泻'
            ELSE ${healthPoop.stoolType}
          END`,
          sql`'排便'`,
        ],
      };
  }
}

interface SearchQuery {
  keyword?: string;
  type?: RecordType;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}

interface RecycleQuery {
  keyword?: string;
  type?: RecordType;
  page: number;
  pageSize: number;
}

interface ExportQuery {
  type?: RecordType;
  startDate?: string;
  endDate?: string;
}

interface UnifiedRecord {
  id: string;
  type: RecordType;
  typeLabel: string;
  time: string;
  summary: string;
  detail: any;
}

interface RecycleRecord extends UnifiedRecord {
  deletedAt: string;
}

@Injectable()
export class HealthDataService {
  private readonly logger = new Logger(HealthDataService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ==================== 搜索记录 ====================

  async searchRecords(
    userId: string,
    query: SearchQuery,
  ): Promise<{ items: UnifiedRecord[]; total: number; page: number; pageSize: number }> {
    const { page, pageSize } = query;
    const types = query.type ? [query.type] : ALL_TYPES;

    // 并行查询各表，每页最多 pageSize 条各取 pageSize，合并后再切分
    const results = await Promise.all(
      types.map((t) => this.searchOneType(userId, t, query)),
    );

    const allItems: UnifiedRecord[] = [];
    let total = 0;
    for (const r of results) {
      allItems.push(...r.items);
      total += r.total;
    }

    // 按时间倒序排序
    allItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // 分页截取
    const start = (page - 1) * pageSize;
    const pagedItems = allItems.slice(start, start + pageSize);

    return { items: pagedItems, total, page, pageSize };
  }

  private async searchOneType(
    userId: string,
    type: RecordType,
    query: SearchQuery,
  ): Promise<{ items: UnifiedRecord[]; total: number }> {
    const { table, timeCol, mapper, summarizer, keywordCols } = getTableMeta(type);
    const { keyword, startDate, endDate, pageSize } = query;

    const conds: any[] = [
      eq(table.userId, userId),
      eq(table.isDeleted, false),
    ];
    if (startDate) conds.push(gte(timeCol, new Date(startDate).toISOString()));
    if (endDate) conds.push(lt(timeCol, new Date(endDate).toISOString()));
    if (keyword && keywordCols.length > 0) {
      const likePattern = `%${keyword}%`;
      const keywordConds = keywordCols.map((col) => ilike(col, likePattern));
      conds.push(or(...keywordConds));
    }
    // 如果有 keyword 但该表无文本列，返回空
    if (keyword && keywordCols.length === 0) {
      return { items: [], total: 0 };
    }

    const where = and(...conds);

    const [countRes, rows] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(table).where(where),
      this.db
        .select()
        .from(table)
        .where(where)
        .orderBy(desc(timeCol))
        .limit(pageSize),
    ]);

    const total = Number(countRes[0]?.count ?? 0);
    const items: UnifiedRecord[] = rows.map((row: any) => {
      const detail = mapper(row);
      return {
        id: row.id,
        type,
        typeLabel: TYPE_LABELS[type],
        time: detail[Object.keys(detail).find(
          (k) => k.toLowerCase().includes('time') && k !== 'createdAt',
        ) || 'createdAt'],
        summary: summarizer(row),
        detail,
      };
    });

    return { items, total };
  }

  // ==================== 回收站 ====================

  async getRecycleBin(
    userId: string,
    query: RecycleQuery,
  ): Promise<{ items: RecycleRecord[]; total: number; page: number; pageSize: number }> {
    const { page, pageSize } = query;
    const types = query.type ? [query.type] : ALL_TYPES;

    const results = await Promise.all(
      types.map((t) => this.getRecycleOneType(userId, t, query)),
    );

    const allItems: RecycleRecord[] = [];
    let total = 0;
    for (const r of results) {
      allItems.push(...r.items);
      total += r.total;
    }

    allItems.sort(
      (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
    );

    const start = (page - 1) * pageSize;
    const pagedItems = allItems.slice(start, start + pageSize);

    return { items: pagedItems, total, page, pageSize };
  }

  private async getRecycleOneType(
    userId: string,
    type: RecordType,
    query: RecycleQuery,
  ): Promise<{ items: RecycleRecord[]; total: number }> {
    const { table, timeCol, mapper, summarizer, keywordCols } = getTableMeta(type);
    const { keyword, pageSize } = query;

    const conds: any[] = [
      eq(table.userId, userId),
      eq(table.isDeleted, true),
    ];
    if (keyword && keywordCols.length > 0) {
      const likePattern = `%${keyword}%`;
      const keywordConds = keywordCols.map((col) => ilike(col, likePattern));
      conds.push(or(...keywordConds));
    }
    if (keyword && keywordCols.length === 0) {
      return { items: [], total: 0 };
    }

    const where = and(...conds);

    const [countRes, rows] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(table).where(where),
      this.db
        .select()
        .from(table)
        .where(where)
        .orderBy(desc(table.updatedAt))
        .limit(pageSize),
    ]);

    const total = Number(countRes[0]?.count ?? 0);
    const items: RecycleRecord[] = rows.map((row: any) => {
      const detail = mapper(row);
      const timeKey = Object.keys(detail).find(
        (k) => k.toLowerCase().includes('time') && k !== 'createdAt',
      ) || 'createdAt';
      return {
        id: row.id,
        type,
        typeLabel: TYPE_LABELS[type],
        time: detail[timeKey],
        summary: summarizer(row),
        detail,
        deletedAt: row.updatedAt.toISOString(),
      };
    });

    return { items, total };
  }

  async restoreRecord(
    userId: string,
    type: RecordType,
    id: string,
  ): Promise<{ success: boolean }> {
    const { table } = getTableMeta(type);
    const updated = await this.db
      .update(table)
      .set({ isDeleted: false })
      .where(
        and(
          eq(table.userId, userId),
          eq(table.id, id),
          eq(table.isDeleted, true),
        ),
      )
      .returning({ id: table.id });
    if (updated.length === 0) throw new NotFoundException('记录不存在或未在回收站中');
    return { success: true };
  }

  async permanentDelete(
    userId: string,
    type: RecordType,
    id: string,
  ): Promise<{ success: boolean }> {
    const { table } = getTableMeta(type);
    const deleted = await this.db
      .delete(table)
      .where(
        and(
          eq(table.userId, userId),
          eq(table.id, id),
          eq(table.isDeleted, true),
        ),
      )
      .returning({ id: table.id });
    if (deleted.length === 0) throw new NotFoundException('记录不存在或未在回收站中');
    return { success: true };
  }

  async batchRestore(
    userId: string,
    type: RecordType,
    ids: string[],
  ): Promise<{ success: boolean; restoredCount: number }> {
    const { table } = getTableMeta(type);

    const updated = await this.db
      .update(table)
      .set({ isDeleted: false })
      .where(
        and(
          eq(table.userId, userId),
          inArray(table.id, ids),
          eq(table.isDeleted, true),
        ),
      )
      .returning({ id: table.id });

    return { success: true, restoredCount: updated.length };
  }

  async batchPermanentDelete(
    userId: string,
    type: RecordType,
    ids: string[],
  ): Promise<{ success: boolean; deletedCount: number }> {
    const { table } = getTableMeta(type);

    const deleted = await this.db
      .delete(table)
      .where(
        and(
          eq(table.userId, userId),
          inArray(table.id, ids),
          eq(table.isDeleted, true),
        ),
      )
      .returning({ id: table.id });

    return { success: true, deletedCount: deleted.length };
  }

  // ==================== 批量导出 ====================

  async exportJson(
    userId: string,
    query: ExportQuery,
  ): Promise<{ records: UnifiedRecord[]; exportTime: string; total: number }> {
    const types = query.type ? [query.type] : ALL_TYPES;

    const results = await Promise.all(
      types.map((t) => this.exportOneType(userId, t, query)),
    );

    const allItems: UnifiedRecord[] = [];
    for (const r of results) {
      allItems.push(...r);
    }

    allItems.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

    return {
      records: allItems,
      exportTime: new Date().toISOString(),
      total: allItems.length,
    };
  }

  private async exportOneType(
    userId: string,
    type: RecordType,
    query: ExportQuery,
  ): Promise<UnifiedRecord[]> {
    const { table, timeCol, mapper, summarizer } = getTableMeta(type);
    const { startDate, endDate } = query;

    const conds: any[] = [
      eq(table.userId, userId),
      eq(table.isDeleted, false),
    ];
    if (startDate) conds.push(gte(timeCol, new Date(startDate).toISOString()));
    if (endDate) conds.push(lt(timeCol, new Date(endDate).toISOString()));

    const rows = await this.db
      .select()
      .from(table)
      .where(and(...conds))
      .orderBy(desc(timeCol));

    return rows.map((row: any) => {
      const detail = mapper(row);
      const timeKey = Object.keys(detail).find(
        (k) => k.toLowerCase().includes('time') && k !== 'createdAt',
      ) || 'createdAt';
      return {
        id: row.id,
        type,
        typeLabel: TYPE_LABELS[type],
        time: detail[timeKey],
        summary: summarizer(row),
        detail,
      };
    });
  }

  async exportCsv(
    userId: string,
    query: ExportQuery,
  ): Promise<string> {
    const { records } = await this.exportJson(userId, query);
    if (records.length === 0) {
      return 'id,type,typeLabel,time,summary\n';
    }

    const headers = ['id', 'type', 'typeLabel', 'time', 'summary'];
    const lines: string[] = [headers.join(',')];

    for (const r of records) {
      const row = [
        r.id,
        r.type,
        r.typeLabel,
        r.time,
        this.escapeCsv(r.summary),
      ];
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }

  private escapeCsv(value: string): string {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  // ==================== 批量删除 ====================

  async batchDelete(
    userId: string,
    type: RecordType,
    ids: string[],
  ): Promise<{ success: boolean; deletedCount: number }> {
    const { table } = getTableMeta(type);

    const updated = await this.db
      .update(table)
      .set({ isDeleted: true })
      .where(
        and(
          eq(table.userId, userId),
          inArray(table.id, ids),
          eq(table.isDeleted, false),
        ),
      )
      .returning({ id: table.id });

    return { success: true, deletedCount: updated.length };
  }

  async queryImageByHash(fileHash: string): Promise<{
    exists: boolean;
    downloadUrl?: string;
    fileName?: string;
    fileSize?: number;
  }> {
    const rows = await this.db
      .select({
        downloadUrl: imageDedup.downloadUrl,
        fileName: imageDedup.fileName,
        fileSize: imageDedup.fileSize,
      })
      .from(imageDedup)
      .where(eq(imageDedup.fileHash, fileHash))
      .limit(1);

    if (rows.length === 0) {
      return { exists: false };
    }

    const row = rows[0];
    return {
      exists: true,
      downloadUrl: row.downloadUrl,
      fileName: row.fileName,
      fileSize: row.fileSize ?? 0,
    };
  }

  async registerImage(
    fileHash: string,
    fileName: string,
    downloadUrl: string,
    fileSize: number,
  ): Promise<{ success: boolean; downloadUrl: string }> {
    const existing = await this.db
      .select({ downloadUrl: imageDedup.downloadUrl })
      .from(imageDedup)
      .where(eq(imageDedup.fileHash, fileHash))
      .limit(1);

    if (existing.length > 0) {
      await this.db
        .update(imageDedup)
        .set({
          refCount: sql`${imageDedup.refCount} + 1`,
        })
        .where(eq(imageDedup.fileHash, fileHash));
      return { success: true, downloadUrl: existing[0].downloadUrl };
    }

    await this.db.insert(imageDedup).values({
      fileHash,
      fileName,
      downloadUrl,
      fileSize,
    });

    return { success: true, downloadUrl };
  }
}
