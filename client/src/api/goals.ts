import { apiClient } from '@client/src/utils/api-client';
import type { GoalItem } from '@shared/api.interface';

const BASE = 'api/health/goals';

export async function getGoals(): Promise<GoalItem[]> {
  const { data } = await apiClient.get(BASE);
  return data as GoalItem[];
}

export async function updateGoal(
  goalType: string,
  targetValue: number,
  period: string = 'daily',
): Promise<GoalItem> {
  const { data } = await apiClient.put(`${BASE}/${goalType}`, {
    targetValue,
    period,
  });
  return data as GoalItem;
}
