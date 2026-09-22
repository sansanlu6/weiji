import {
  MoonStar,
  Smile,
  HeartPulse,
  Utensils,
  Dumbbell,
  Droplet,
  Pill,
  FileText,
  Trash2,
  RotateCcw,
  Square,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Trash2 as TrashBinIcon,
} from 'lucide-react';
import dayjs from 'dayjs';
import type { UnifiedRecord, RecycleRecord } from '@shared/api.interface';
import ToiletIcon from '@client/src/components/icons/ToiletIcon';

const TYPE_LABELS: Record<string, string> = {
  sleep: '睡眠',
  mood: '情绪',
  pain: '病痛',
  diet: '饮食',
  exercise: '运动',
  water: '喝水',
  medication: '用药',
  poop: '排便',
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  sleep: MoonStar,
  mood: Smile,
  pain: HeartPulse,
  diet: Utensils,
  exercise: Dumbbell,
  water: Droplet,
  medication: Pill,
  poop: ToiletIcon,
};

const TYPE_ICON_BG: Record<string, string> = {
  sleep: '#EDE8F5',
  mood: '#F7F3E3',
  pain: '#F7EBEB',
  diet: '#F5F0E8',
  exercise: '#E8F0EC',
  water: '#E3EDF7',
  medication: '#F3ECEB',
  poop: '#EEF3EE',
};

const TYPE_TAG_BG: Record<string, string> = {
  sleep: '#F2EFF8',
  mood: '#FAF6E8',
  pain: '#FAEFEF',
  diet: '#F8F4EE',
  exercise: '#EEF3F0',
  water: '#EAF2F9',
  medication: '#F6EFEE',
  poop: '#F2F6F2',
};

const TYPE_TAG_COLOR: Record<string, string> = {
  sleep: '#8B7FB0',
  mood: '#C9A66B',
  pain: '#C994A0',
  diet: '#B8956A',
  exercise: '#7DA895',
  water: '#7A9FB5',
  medication: '#C49A94',
  poop: '#8AA88A',
};

const TYPE_ICON_COLOR: Record<string, string> = {
  sleep: '#8B7FB8',
  mood: '#D4A359',
  pain: '#D97776',
  diet: '#B8956A',
  exercise: '#7BA89A',
  water: '#6B8FC9',
  medication: '#D97776',
  poop: '#7A9E7A',
};

export function getTypeIconBg(type: string): string {
  return TYPE_ICON_BG[type] || '#E8F5E9';
}

export function getTypeTagBg(type: string): string {
  return TYPE_TAG_BG[type] || '#E8F5E9';
}

export function getTypeTagColor(type: string): string {
  return TYPE_TAG_COLOR[type] || '#66BB6A';
}

export function getTypeIconColor(type: string): string {
  return TYPE_ICON_COLOR[type] || '#66BB6A';
}

export function getTypeIcon(
  type: string,
  className = 'w-5 h-5',
): React.ReactNode {
  const Icon = TYPE_ICONS[type] || FileText;
  return <Icon className={className} strokeWidth={2} />;
}

export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] || type;
}

interface RecordItemProps {
  record: UnifiedRecord;
  batchMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (record: UnifiedRecord) => void;
  onClick?: (record: UnifiedRecord) => void;
}

export const RecordItem: React.FC<RecordItemProps> = ({
  record,
  batchMode,
  selected,
  onToggleSelect,
  onDelete,
  onClick,
}) => {
  const iconBg = getTypeIconBg(record.type);
  const iconColor = getTypeIconColor(record.type);
  const tagBg = getTypeTagBg(record.type);
  const tagColor = getTypeTagColor(record.type);

  const handleCardClick = (): void => {
    if (batchMode) return;
    onClick?.(record);
  };

  const handleDeleteClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onDelete(record);
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
        !batchMode && onClick ? 'cursor-pointer hover:bg-muted/60' : ''
      }`}
      onClick={handleCardClick}
    >
      {batchMode && (
        <button
          type="button"
          onClick={() => onToggleSelect(record.id)}
          className="shrink-0"
        >
          {selected ? (
            <CheckSquare className="w-5 h-5 text-primary" strokeWidth={1.8} />
          ) : (
            <Square className="w-5 h-5 text-muted-foreground" strokeWidth={1.8} />
          )}
        </button>
      )}

      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          backgroundColor: iconBg,
        }}
      >
        <div style={{ color: iconColor }}>
          {getTypeIcon(record.type, 'w-6 h-6')}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-md"
            style={{ backgroundColor: tagBg, color: tagColor }}
          >
            {getTypeLabel(record.type)}
          </span>
          <span className="text-xs text-muted-foreground/70 tabular-nums">
            {dayjs(record.time).format('HH:mm')}
          </span>
        </div>
        <p className="text-base font-semibold text-foreground truncate leading-tight">
          {record.summary || '无摘要'}
        </p>
      </div>

      {!batchMode && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="shrink-0 transition-colors hover:opacity-70"
          title="删除到回收站"
        >
          <Trash2
            className="w-5 h-5"
            strokeWidth={1.5}
            style={{ color: '#E57373' }}
          />
        </button>
      )}
    </div>
  );
};

interface RecycleItemProps {
  record: RecycleRecord;
  batchMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onRestore: (record: RecycleRecord) => void;
  onPermanentDelete: (type: string, id: string) => void;
}

 export const RecycleItem: React.FC<RecycleItemProps> = ({
    record,
    batchMode = false,
    selected = false,
    onToggleSelect,
    onRestore,
    onPermanentDelete,
  }) => {
    const iconBg = getTypeIconBg(record.type);
    const iconColor = getTypeIconColor(record.type);
    const tagBg = getTypeTagBg(record.type);
    const tagColor = getTypeTagColor(record.type);

    const recordDay = dayjs(record.time).format('YYYY-MM-DD');
    const deleteDay = dayjs(record.deletedAt).format('YYYY-MM-DD');
    const sameDay = recordDay === deleteDay;

     const recordTimeStr = dayjs(record.time).format('YYYY-MM-DD HH:mm');
     const deleteTimeStr = dayjs(record.deletedAt).format('YYYY-MM-DD HH:mm');

     return (
       <div className="flex flex-col px-5 py-4">
         <div className="flex items-start gap-3">
           {batchMode && onToggleSelect && (
             <button
               type="button"
               onClick={() => onToggleSelect(record.id)}
               className="shrink-0 mt-3"
             >
               {selected ? (
                 <CheckSquare className="w-5 h-5" strokeWidth={1.8} style={{ color: '#438865' }} />
               ) : (
                 <Square className="w-5 h-5" strokeWidth={1.8} style={{ color: '#9AA29C' }} />
               )}
             </button>
           )}

           <div
             className="shrink-0 flex items-center justify-center"
             style={{
               width: '52px',
               height: '52px',
               borderRadius: '14px',
               backgroundColor: iconBg,
             }}
           >
             <div style={{ color: iconColor }}>
               {getTypeIcon(record.type, 'w-6 h-6')}
             </div>
           </div>

           <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-2">
               <span
                 className="text-xs font-medium px-2 py-0.5 rounded-md shrink-0"
                 style={{ backgroundColor: tagBg, color: tagColor }}
               >
                 {getTypeLabel(record.type)}
               </span>
               <p className="text-sm font-semibold truncate leading-tight flex-1 min-w-0" style={{ color: '#2C3A33' }}>
                 {record.summary || '无摘要'}
               </p>
             </div>
             <div className="m-[0px_4px_0px_4px] text-xs tabular-nums" style={{ color: '#9AA29C' }}>
               创建于 {recordTimeStr} · 删除于 {deleteTimeStr}
             </div>
           </div>
         </div>

         <div className="flex items-center gap-2 mt-3 pl-[64px]">
          <button
            type="button"
            onClick={() => onRestore(record)}
            className="flex items-center gap-1.5 transition-colors hover:opacity-80"
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: '#EBF5EF',
              color: '#438865',
              fontSize: '12px',
              fontWeight: 500,
            }}
            title="恢复"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.8} />
            恢复
          </button>
          <button
            type="button"
            onClick={() => onPermanentDelete(record.type, record.id)}
            className="flex items-center gap-1.5 transition-colors hover:opacity-80"
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: '#FDEEEF',
              color: '#C85458',
              fontSize: '12px',
              fontWeight: 500,
            }}
            title="永久删除"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
            彻底删除
          </button>
        </div>
      </div>
    );
 };

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PaginationControl: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.8} />
      </button>
      <span className="text-sm text-muted-foreground px-2 tabular-nums">
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
      >
        <ChevronRight className="w-4 h-4" strokeWidth={1.8} />
      </button>
    </div>
  );
};

interface EmptyStateProps {
  isRecycle?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ isRecycle = false }) => {
  return (
    <div className="flex flex-col items-center text-center py-6">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        {isRecycle ? (
          <TrashBinIcon className="w-10 h-10 text-muted-foreground/60" strokeWidth={1.3} />
        ) : (
          <FileText className="w-10 h-10 text-muted-foreground/60" strokeWidth={1.3} />
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {isRecycle ? '回收站为空' : '暂无记录'}
      </p>
    </div>
  );
};

const TYPE_OPTIONS_INTERNAL: { value: string; label: string }[] = [
  { value: '', label: '全部类型' },
  { value: 'sleep', label: '睡眠' },
  { value: 'mood', label: '情绪' },
  { value: 'pain', label: '病痛' },
  { value: 'diet', label: '饮食' },
  { value: 'exercise', label: '运动' },
  { value: 'water', label: '喝水' },
  { value: 'medication', label: '用药' },
  { value: 'poop', label: '排便' },
];

export const TYPE_OPTIONS = TYPE_OPTIONS_INTERNAL;

export interface DateGroup {
  dateKey: string;
  label: string;
  records: UnifiedRecord[];
}

export function groupRecordsByDate(records: UnifiedRecord[]): DateGroup[] {
  const groups = new Map<string, UnifiedRecord[]>();
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  for (const record of records) {
    const dateKey = dayjs(record.time).format('YYYY-MM-DD');
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(record);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, groupRecords]) => {
      let label = dateKey;
      if (dateKey === today) {
        label = '今天';
      } else if (dateKey === yesterday) {
        label = '昨天';
      } else {
        const d = dayjs(dateKey);
        label = `${d.month() + 1}月${d.date()}日`;
      }
      return { dateKey, label, records: groupRecords };
    });
}
