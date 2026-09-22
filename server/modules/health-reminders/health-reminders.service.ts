import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc } from 'drizzle-orm';
import { healthReminders } from '@server/database/schema';
import type { ReminderItem } from '@shared/api.interface';

const VALID_REMINDER_TYPES = ['water', 'medication', 'activity'] as const;
const VALID_REPEAT_TYPES = ['daily', 'weekly', 'interval'] as const;

const DEFAULT_WATER_REMINDER = {
  reminderType: 'water',
  title: '喝水提醒',
  timePoints: ['08:00', '10:00', '12:30', '15:00', '17:00', '19:00'],
  repeatType: 'daily',
  repeatDays: [] as string[],
  repeatInterval: 1,
  isEnabled: true,
};

@Injectable()
export class HealthRemindersService {
  private readonly logger = new Logger(HealthRemindersService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private mapReminder(row: typeof healthReminders.$inferSelect): ReminderItem {
    return {
      id: row.id,
      reminderType: row.reminderType,
      title: row.title,
      timePoints: row.timePoints ?? [],
      repeatType: row.repeatType,
      repeatDays: row.repeatDays ?? [],
      repeatInterval: row.repeatInterval ?? 1,
      endDate: row.endDate ?? undefined,
      isEnabled: row.isEnabled,
    };
  }

  private validateCreateBody(body: {
    reminderType: string;
    title: string;
    repeatType: string;
  }): void {
    if (!VALID_REMINDER_TYPES.includes(body.reminderType as typeof VALID_REMINDER_TYPES[number])) {
      throw new BadRequestException(`无效的提醒类型: ${body.reminderType}`);
    }
    if (!body.title) {
      throw new BadRequestException('title 必填');
    }
    if (!VALID_REPEAT_TYPES.includes(body.repeatType as typeof VALID_REPEAT_TYPES[number])) {
      throw new BadRequestException(`无效的重复类型: ${body.repeatType}`);
    }
  }

  async getReminders(userId: string): Promise<ReminderItem[]> {
    const rows = await this.db
      .select()
      .from(healthReminders)
      .where(and(eq(healthReminders.userId, userId), eq(healthReminders.isDeleted, false)))
      .orderBy(desc(healthReminders.createdAt));

    // Check if user has any water reminder
    const hasWater = rows.some((r: typeof healthReminders.$inferSelect) => r.reminderType === 'water');

    if (!hasWater) {
      // Create default water reminder
      const now = new Date();
      const inserted = await this.db
        .insert(healthReminders)
        .values({
          userId,
          ...DEFAULT_WATER_REMINDER,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return [this.mapReminder(inserted[0]), ...rows.map((r: typeof healthReminders.$inferSelect) => this.mapReminder(r))];
    }

    return rows.map((r: typeof healthReminders.$inferSelect) => this.mapReminder(r));
  }

  async createReminder(
    userId: string,
    body: {
      reminderType: string;
      title: string;
      timePoints: string[];
      repeatType: string;
      repeatDays?: string[];
      repeatInterval?: number;
      endDate?: string;
      isEnabled?: boolean;
    },
  ): Promise<ReminderItem> {
    this.validateCreateBody(body);

    const now = new Date();
    const inserted = await this.db
      .insert(healthReminders)
      .values({
        userId,
        reminderType: body.reminderType,
        title: body.title,
        timePoints: body.timePoints ?? [],
        repeatType: body.repeatType,
        repeatDays: body.repeatDays ?? [],
        repeatInterval: body.repeatInterval ?? 1,
        endDate: body.endDate ?? null,
        isEnabled: body.isEnabled !== undefined ? body.isEnabled : true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return this.mapReminder(inserted[0]);
  }

  async updateReminder(
    userId: string,
    id: string,
    body: {
      title?: string;
      timePoints?: string[];
      repeatType?: string;
      repeatDays?: string[];
      repeatInterval?: number;
      endDate?: string;
      isEnabled?: boolean;
    },
  ): Promise<ReminderItem> {
    const patch: Partial<typeof healthReminders.$inferInsert> = {};

    if (body.title !== undefined) patch.title = body.title;
    if (body.timePoints !== undefined) patch.timePoints = body.timePoints;
    if (body.repeatType !== undefined) {
      if (!VALID_REPEAT_TYPES.includes(body.repeatType as typeof VALID_REPEAT_TYPES[number])) {
        throw new BadRequestException(`无效的重复类型: ${body.repeatType}`);
      }
      patch.repeatType = body.repeatType;
    }
    if (body.repeatDays !== undefined) patch.repeatDays = body.repeatDays;
    if (body.repeatInterval !== undefined) patch.repeatInterval = body.repeatInterval;
    if (body.endDate !== undefined) patch.endDate = body.endDate || null;
    if (body.isEnabled !== undefined) patch.isEnabled = body.isEnabled;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    patch.updatedAt = new Date();

    const updated = await this.db
      .update(healthReminders)
      .set(patch)
      .where(and(eq(healthReminders.id, id), eq(healthReminders.userId, userId), eq(healthReminders.isDeleted, false)))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('提醒不存在');
    }

    return this.mapReminder(updated[0]);
  }

  async deleteReminder(userId: string, id: string): Promise<{ success: boolean }> {
    const updated = await this.db
      .update(healthReminders)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(and(eq(healthReminders.id, id), eq(healthReminders.userId, userId), eq(healthReminders.isDeleted, false)))
      .returning({ id: healthReminders.id });

    if (updated.length === 0) {
      throw new NotFoundException('提醒不存在');
    }

    return { success: true };
  }

  async toggleReminder(userId: string, id: string): Promise<ReminderItem> {
    const existing = await this.db
      .select()
      .from(healthReminders)
      .where(and(eq(healthReminders.id, id), eq(healthReminders.userId, userId), eq(healthReminders.isDeleted, false)));

    if (existing.length === 0) {
      throw new NotFoundException('提醒不存在');
    }

    const now = new Date();
    const newEnabled = !existing[0].isEnabled;

    const updated = await this.db
      .update(healthReminders)
      .set({
        isEnabled: newEnabled,
        updatedAt: now,
      })
      .where(eq(healthReminders.id, id))
      .returning();

    return this.mapReminder(updated[0]);
  }
}
