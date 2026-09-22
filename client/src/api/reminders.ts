import { apiClient } from '@client/src/utils/api-client';
import type { ReminderItem } from '@shared/api.interface';

const BASE = 'api/health/reminders';

export async function getReminders(): Promise<ReminderItem[]> {
  const { data } = await apiClient.get(BASE);
  return data as ReminderItem[];
}

export async function createReminder(body: {
  reminderType: string;
  title: string;
  timePoints: string[];
  repeatType: string;
  repeatDays: string[];
  repeatInterval: number;
  endDate?: string;
  isEnabled: boolean;
}): Promise<ReminderItem> {
  const { data } = await apiClient.post(BASE, body);
  return data as ReminderItem;
}

export async function updateReminder(
  id: string,
  body: Partial<Omit<ReminderItem, 'id'>>,
): Promise<ReminderItem> {
  const { data } = await apiClient.patch(`${BASE}/${id}`, body);
  return data as ReminderItem;
}

export async function deleteReminder(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}

export async function toggleReminder(id: string): Promise<ReminderItem> {
  const { data } = await apiClient.patch(`${BASE}/${id}/toggle`);
  return data as ReminderItem;
}
