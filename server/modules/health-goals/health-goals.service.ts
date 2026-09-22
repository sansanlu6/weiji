import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and } from 'drizzle-orm';
import { healthGoals } from '@server/database/schema';
import type { GoalItem } from '@shared/api.interface';

const VALID_GOAL_TYPES = ['water', 'sleep', 'exercise'] as const;
const DEFAULT_GOALS: Record<string, { targetValue: number; period: string }> = {
  water: { targetValue: 8, period: 'daily' },
  sleep: { targetValue: 8, period: 'daily' },
  exercise: { targetValue: 3, period: 'weekly' },
};

@Injectable()
export class HealthGoalsService {
  private readonly logger = new Logger(HealthGoalsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private mapGoal(row: typeof healthGoals.$inferSelect): GoalItem {
    return {
      id: row.id,
      goalType: row.goalType,
      targetValue: Number(row.targetValue),
      period: row.period,
    };
  }

  async getGoals(userId: string): Promise<GoalItem[]> {
    const rows = await this.db
      .select()
      .from(healthGoals)
      .where(and(eq(healthGoals.userId, userId), eq(healthGoals.isDeleted, false)));

    const existing = new Map(rows.map((r: typeof healthGoals.$inferSelect) => [r.goalType, r]));

    const result: GoalItem[] = VALID_GOAL_TYPES.map((type: string) => {
      const row = existing.get(type);
      if (row) return this.mapGoal(row);
      return {
        id: '',
        goalType: type,
        targetValue: DEFAULT_GOALS[type].targetValue,
        period: DEFAULT_GOALS[type].period,
      };
    });

    return result;
  }

  async upsertGoal(
    userId: string,
    goalType: string,
    body: { targetValue: number; period: string },
  ): Promise<GoalItem> {
    if (!VALID_GOAL_TYPES.includes(goalType as typeof VALID_GOAL_TYPES[number])) {
      throw new BadRequestException(`无效的目标类型: ${goalType}`);
    }

    const { targetValue, period } = body;
    if (targetValue === undefined || targetValue === null) {
      throw new BadRequestException('targetValue 必填');
    }

    const now = new Date();

    // Try update first
    const updated = await this.db
      .update(healthGoals)
      .set({
        targetValue: String(targetValue),
        period: period || 'daily',
        isDeleted: false,
        updatedAt: now,
      })
      .where(and(eq(healthGoals.userId, userId), eq(healthGoals.goalType, goalType)))
      .returning();

    if (updated.length > 0) {
      return this.mapGoal(updated[0]);
    }

    // Insert if not exists
    const inserted = await this.db
      .insert(healthGoals)
      .values({
        userId,
        goalType,
        targetValue: String(targetValue),
        period: period || 'daily',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return this.mapGoal(inserted[0]);
  }
}
