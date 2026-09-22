import React from 'react';
import dayjs from 'dayjs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogOverlay,
} from '@client/src/components/ui/dialog';
import { Image } from '@client/src/components/ui/image';
import type { UnifiedRecord } from '@shared/api.interface';
import {
  getTypeIcon,
  getTypeIconBg,
  getTypeIconColor,
  getTypeLabel,
  getTypeTagBg,
  getTypeTagColor,
} from './DataRecordItems';
import { X, MessageSquare, Leaf } from 'lucide-react';

interface RecordDetailDialogProps {
  open: boolean;
  record: UnifiedRecord | null;
  onClose: () => void;
}

const MEAL_TYPE_MAP: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  supper: '晚餐',
  snack: '加餐',
};

const EXERCISE_TYPE_MAP: Record<string, string> = {
  walking: '步行',
  running: '跑步',
  cycling: '骑行',
  swimming: '游泳',
  yoga: '瑜伽',
  strength: '力量训练',
  other: '其他',
};

const PAIN_LEVEL_MAP: Record<string, string> = {
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
};

const STOOL_TYPE_MAP: Record<string, string> = {
  normal: '正常',
  hard: '偏硬',
  soft: '偏软',
  loose: '稀便',
  constipated: '便秘',
  diarrhea: '腹泻',
};

function formatTime(value: string | undefined | null): string {
  if (!value) return '';
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

function formatDuration(minutes: number | undefined): string {
  if (minutes === undefined || minutes === null) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} 分钟`;
  if (m === 0) return `${h} 小时`;
  return `${h} 小时 ${m} 分钟`;
}

interface FieldItem {
  label: string;
  value: React.ReactNode;
  isTag?: boolean;
  isImage?: boolean;
  isNote?: boolean;
  tagType?: string;
  imageSrc?: string;
}

function getDescriptionFields(
  record: UnifiedRecord,
): FieldItem[] {
  const d = record.detail || {};
  const items: FieldItem[] = [];

  switch (record.type) {
    case 'sleep':
      items.push({ label: '睡眠时长', value: formatDuration(d.durationMinutes) });
      items.push({ label: '入睡时间', value: formatTime(d.sleepTime) });
      items.push({ label: '起床时间', value: formatTime(d.wakeTime) });
      break;
    case 'diet':
      items.push({ label: '餐次', value: MEAL_TYPE_MAP[d.mealType] || d.mealType });
      if (d.foodDescription) {
        items.push({ label: '食物描述', value: d.foodDescription });
      }
      break;
    case 'exercise':
      items.push({ label: '运动类型', value: EXERCISE_TYPE_MAP[d.exerciseType] || d.exerciseType });
      items.push({ label: '运动时长', value: formatDuration(d.durationMinutes) });
      items.push({ label: '开始时间', value: formatTime(d.startTime) });
      items.push({ label: '结束时间', value: formatTime(d.endTime) });
      break;
    case 'water':
      items.push({
        label: '喝水量',
        value:
          d.amountMl !== undefined && d.amountMl !== null
            ? `${d.amountMl} ml`
            : '',
      });
      items.push({ label: '时间', value: formatTime(d.drinkTime || record.time) });
      break;
    case 'mood':
      if (d.moods && d.moods.length > 0) {
        items.push({
          label: '情绪',
          value: d.moods,
          isTag: true,
          tagType: record.type,
        });
      }
      break;
    case 'pain':
      if (d.symptoms && d.symptoms.length > 0) {
        items.push({
          label: '症状',
          value: d.symptoms,
          isTag: true,
          tagType: record.type,
        });
      }
      items.push({ label: '疼痛程度', value: PAIN_LEVEL_MAP[d.painLevel] || d.painLevel });
      if (d.durationMinutes) {
        items.push({ label: '持续时间', value: formatDuration(d.durationMinutes) });
      }
      if (d.description) {
        items.push({ label: '症状描述', value: d.description });
      }
      if (
        d.painMarkers &&
        Array.isArray(d.painMarkers) &&
        d.painMarkers.length > 0
      ) {
        items.push({ label: '疼痛位置', value: '已标记疼痛位置' });
      }
      break;
    case 'medication':
      items.push({ label: '药品名称', value: d.medicineName });
      if (d.dosage) {
        items.push({ label: '服用剂量', value: d.dosage });
      }
      if (d.relatedSymptom) {
        items.push({ label: '对应病症', value: d.relatedSymptom });
      }
      items.push({ label: '服用时间', value: formatTime(d.takeTime) });
      break;
    case 'poop':
      items.push({ label: '性状', value: STOOL_TYPE_MAP[d.stoolType] || d.stoolType });
      items.push({ label: '时间', value: formatTime(d.poopTime || record.time) });
      break;
  }

  return items.filter(
    (item) =>
      item.value !== undefined &&
      item.value !== null &&
      item.value !== '' &&
      !(Array.isArray(item.value) && item.value.length === 0),
  );
}

function getTagFields(
  record: UnifiedRecord,
): { label: string; items: string[] } | null {
  const d = record.detail || {};
  switch (record.type) {
    case 'diet':
      if (d.tags && d.tags.length > 0) {
        return { label: '标签', items: d.tags };
      }
      return null;
    default:
      return null;
  }
}

function getImageUrl(record: UnifiedRecord): string | null {
  const d = record.detail || {};
  switch (record.type) {
    case 'diet':
      return d.foodImageUrl || null;
    case 'exercise':
    case 'mood':
    case 'medication':
      return d.imageUrl || null;
    default:
      return null;
  }
}

function getNote(record: UnifiedRecord): string | null {
  const d = record.detail || {};
  return d.note || null;
}

const ChipGroup: React.FC<{ items: string[]; type: string }> = ({ items, type }) => {
  if (!items || items.length === 0) return null;
  const bg = getTypeTagBg(type);
  const color = getTypeTagColor(type);
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item: string, idx: number) => (
        <span
          key={`${item}-${idx}`}
          className="text-sm font-medium px-3 py-1 rounded-full font-sans-hei"
          style={{ backgroundColor: bg, color }}
        >
          {item}
        </span>
      ))}
    </div>
  );
};

const FieldRow: React.FC<{
  label: string;
  children: React.ReactNode;
  noDivider?: boolean;
}> = ({ label, children, noDivider = false }) => {
  return (
    <div className={`py-3.5 ${noDivider ? '' : 'border-b border-[#E8EEE4]'}`}>
      <div
        className="text-sm mb-1.5 font-sans-hei"
        style={{ color: '#93A398' }}
      >
        {label}
      </div>
      <div
        className="text-base leading-relaxed break-words font-sans-hei"
        style={{ color: '#2A483A' }}
      >
        {children}
      </div>
    </div>
  );
};

const ImageSection: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  return (
    <div className="w-full overflow-hidden rounded-2xl">
      <Image
        src={src}
        alt={alt}
        className="w-full object-cover"
        style={{ maxHeight: '280px' }}
      />
    </div>
  );
};

const NoteBlock: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div
      className="flex gap-3 rounded-2xl"
      style={{
        padding: '16px 18px',
        backgroundColor: '#FFF7E0',
      }}
    >
      <div
        className="flex-shrink-0 flex items-start justify-center rounded-full"
        style={{
          width: '32px',
          height: '32px',
          backgroundColor: '#FCEBBF',
          color: '#C89A3A',
        }}
      >
        <MessageSquare size={16} strokeWidth={1.8} style={{ marginTop: '8px' }} />
      </div>
      <div
        className="flex-1 min-w-0 text-base leading-relaxed break-words font-sans-hei"
        style={{ color: '#6B5A2E' }}
      >
        {content}
      </div>
    </div>
  );
};

const DetailBody: React.FC<{ record: UnifiedRecord }> = ({ record }) => {
  const descriptionItems = getDescriptionFields(record);
  const tagField = getTagFields(record);
  const imageUrl = getImageUrl(record);
  const note = getNote(record);

  const hasContent =
    descriptionItems.length > 0 || tagField || imageUrl || note;

  if (!hasContent) {
    return (
      <div
        className="text-sm text-center py-8 font-sans-hei"
        style={{ color: '#93A398' }}
      >
        暂无详细信息
      </div>
    );
  }

  const nonTagItems = descriptionItems.filter((item) => !item.isTag);
  const tagItemsInDesc = descriptionItems.filter((item) => item.isTag);

  return (
    <div className="flex flex-col">
      {nonTagItems.map((item, idx) => {
        const isLast =
          idx === nonTagItems.length - 1 && !tagField && !imageUrl && !note;
        return (
          <FieldRow key={`field-${idx}`} label={item.label} noDivider={isLast}>
            {item.value}
          </FieldRow>
        );
      })}

      {tagItemsInDesc.map((item, idx) => {
        const isLast = !tagField && !imageUrl && !note && idx === tagItemsInDesc.length - 1;
        return (
          <FieldRow
            key={`tag-field-${idx}`}
            label={item.label}
            noDivider={isLast}
          >
            <ChipGroup items={item.value as string[]} type={item.tagType || record.type} />
          </FieldRow>
        );
      })}

      {tagField && (
        <FieldRow
          label={tagField.label}
          noDivider={!imageUrl && !note}
        >
          <ChipGroup items={tagField.items} type={record.type} />
        </FieldRow>
      )}

      {imageUrl && (
        <FieldRow label="图片" noDivider={!note}>
          <ImageSection src={imageUrl} alt="记录图片" />
        </FieldRow>
      )}

      {note && (
        <div className="pt-3.5">
          <div
            className="text-sm mb-2 font-sans-hei"
            style={{ color: '#93A398' }}
          >
            备注
          </div>
          <NoteBlock content={note} />
        </div>
      )}

      <div
        className="flex flex-col items-center"
        style={{ marginTop: '26px', marginBottom: '20px' }}
      >
        <Leaf
          className="mb-2"
          style={{
            width: '12px',
            height: '12px',
            color: 'hsl(95, 40%, 72%)',
          }}
          strokeWidth={2}
        />
        <div className="flex items-center gap-3 w-full justify-center">
          <span
            style={{
              width: '24px',
              height: '1px',
              background: 'hsl(90, 15%, 90%)',
            }}
          />
          <span
            className="font-sans-hei"
            style={{
              fontSize: '12px',
              color: '#A0AC9F',
              letterSpacing: '0.5px',
            }}
          >
            微迹・记录微小，留下痕迹
          </span>
          <span
            style={{
              width: '24px',
              height: '1px',
              background: 'hsl(90, 15%, 90%)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

function getTitleFontSize(_text: string): string {
  return '24px';
}

const RecordDetailDialog: React.FC<RecordDetailDialogProps> = ({
  open,
  record,
  onClose,
}) => {
  if (!record) return null;

  const typeLabel = getTypeLabel(record.type);
  const iconBg = getTypeIconBg(record.type);
  const iconColor = getTypeIconColor(record.type);
  const tagBg = getTypeTagBg(record.type);
  const tagColor = getTypeTagColor(record.type);
  const summary = record.summary || '记录详情';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogOverlay
        className=""
        style={{
          backgroundColor: 'rgba(30, 45, 38, 0.18)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />
      <DialogContent
        className="max-w-[90%] sm:max-w-[420px] p-0 rounded-[32px] overflow-hidden"
        style={{
          background: '#FFFDF7',
          boxShadow: '0 12px 40px rgba(42, 72, 58, 0.12)',
          border: '1px solid rgba(255, 250, 235, 0.8)',
        }}
        showCloseButton={false}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 hover:bg-[#F5F0E3] active:scale-95"
          style={{ color: '#2A483A', background: 'rgba(245, 240, 227, 0.6)' }}
          aria-label="关闭"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>

        <div style={{ padding: '36px 28px 24px 28px' }}>
          <div className="flex flex-col items-center">
            <div
              className="flex items-center justify-center mb-4"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '24px',
                backgroundColor: iconBg,
              }}
            >
              <div style={{ color: iconColor }}>
                {getTypeIcon(record.type, 'w-9 h-9')}
              </div>
            </div>
            <span
              className="text-sm font-medium px-4 py-1 rounded-full mb-3 font-sans-hei"
              style={{ backgroundColor: tagBg, color: tagColor }}
            >
              {typeLabel}记录
            </span>
            <DialogTitle
              className="text-center font-semibold"
              style={{
                color: '#2A483A',
                fontSize: getTitleFontSize(summary),
                lineHeight: 1.35,
                letterSpacing: '0.5px',
                maxWidth: '100%',
                wordBreak: 'break-word',
              }}
            >
              {summary}
            </DialogTitle>
            <p
              className="text-sm mt-2 tabular-nums font-sans-hei"
              style={{ color: '#A0AC9F' }}
            >
              {formatTime(record.time)}
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '0 28px 28px 28px',
            overflowY: 'auto',
            maxHeight: '58vh',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <DetailBody record={record} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordDetailDialog;
