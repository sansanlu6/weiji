import type { RecordType } from '@shared/api.interface';
import {
  Moon, Smile, HeartPulse, UtensilsCrossed, Dumbbell, Droplets,
  type LucideIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';
import ToiletIcon from '@client/src/components/icons/ToiletIcon';
import MedicationIcon from '@client/src/components/icons/MedicationIcon';

export const MOOD_TAGS = [
  '开心', '平静', '焦虑', '低落', '烦躁', '疲惫',
  '幸福', '失落', '惊恐', '愤怒', '充实', '无聊',
  '感动', '紧张', '期待', '尴尬', '裂开', '难过',
  '破防', '麻了', '无语', '惊讶',
];

export const MOOD_EMOJI: Record<string, string> = {
  '开心': '😀', '平静': '😌', '焦虑': '😰', '低落': '😔',
  '烦躁': '😤', '疲惫': '😩', '幸福': '🥰', '失落': '😢',
  '惊恐': '😱', '愤怒': '😠', '充实': '😊', '无聊': '😐',
  '感动': '🥹', '紧张': '😬', '期待': '🤩', '尴尬': '🫣',
  '裂开': '😫', '难过': '😭', '破防': '🥺', '麻了': '😵‍💫',
  '无语': '🤦', '惊讶': '😲',
};

export const PAIN_SYMPTOMS = [
  '头痛', '颈椎痛', '肩颈痛', '腰痛', '肠胃不适', '腹痛',
  '感冒发烧', '咽喉痛', '肌肉酸痛', '失眠', '疲劳乏力', '头晕',
  '痛经', '其他',
];

export const PAIN_LEVELS: { value: 'mild' | 'moderate' | 'severe'; label: string }[] = [
  { value: 'mild', label: '轻度' },
  { value: 'moderate', label: '中度' },
  { value: 'severe', label: '重度' },
];

export const EXERCISE_TYPES = [
  '散步', '健走', '跑步', '瑜伽', '力量训练', '游泳', '骑行',
  '羽毛球', '篮球', '拉伸', 'HIIT', '其他',
];

export const DIET_MEAL_TYPES: { value: 'breakfast' | 'lunch' | 'dinner' | 'supper' | 'snack'; label: string }[] = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'supper', label: '宵夜' },
  { value: 'snack', label: '加餐' },
];

export const DIET_TAGS = [
  '外卖', '外带', '堂食', '自制', '速食', '清淡', '油腻', '辛辣', '重盐',
];

export const STOOL_TYPES = [
  '正常', '便秘', '腹泻', '干结', '其他',
];

export const RECORD_META: Record<RecordType, { name: string; icon: LucideIcon | ComponentType<any>; bgColor: string; iconColor: string }> = {
  sleep: { name: '睡眠', icon: Moon, bgColor: 'bg-module-sleep-bg', iconColor: 'text-module-sleep' },
  mood: { name: '情绪', icon: Smile, bgColor: 'bg-module-mood-bg', iconColor: 'text-module-mood' },
  pain: { name: '病痛', icon: HeartPulse, bgColor: 'bg-module-pain-bg', iconColor: 'text-module-pain' },
  diet: { name: '饮食', icon: UtensilsCrossed, bgColor: 'bg-module-diet-bg', iconColor: 'text-module-diet' },
  exercise: { name: '运动', icon: Dumbbell, bgColor: 'bg-module-exercise-bg', iconColor: 'text-module-exercise' },
  water: { name: '喝水', icon: Droplets, bgColor: 'bg-module-water-bg', iconColor: 'text-module-water' },
  medication: { name: '用药', icon: MedicationIcon, bgColor: 'bg-module-medication-bg', iconColor: 'text-module-medication' },
  poop: { name: '排便', icon: ToiletIcon, bgColor: 'bg-module-poop-bg', iconColor: 'text-module-poop' },
};
