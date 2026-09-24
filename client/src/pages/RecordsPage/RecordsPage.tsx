import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Link, useNavigate, useParams, useSearchParams, Routes, Route } from 'react-router-dom';
import {
  Moon, MoonStar, Smile, HeartPulse, Utensils, Dumbbell, Droplet,
  Plus, ArrowLeft, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import dayjs from 'dayjs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import type { RecordType } from '@shared/api.interface';
import { RECORD_META, MOOD_EMOJI } from '@client/src/utils/record-constants';
import ToiletIcon from '@client/src/components/icons/ToiletIcon';
import { Image } from '@client/src/components/ui/image';
import Twemoji from '@client/src/components/ui/twemoji';
import PageBackground from '@client/src/components/PageBackground';

import {
  sleepApi, moodApi, painApi, dietApi, exerciseApi, waterApi, medicationApi, poopApi,
} from '@client/src/api';

import WaterDialog from '@client/src/components/record-dialogs/WaterDialog';
import MoodDialog from '@client/src/components/record-dialogs/MoodDialog';
import PainDialog from '@client/src/components/record-dialogs/PainDialog';
import DietDialog from '@client/src/components/record-dialogs/DietDialog';
import ExerciseDialog from '@client/src/components/record-dialogs/ExerciseDialog';
import SleepDialog from '@client/src/components/record-dialogs/SleepDialog';
import MedicationDialog from '@client/src/components/record-dialogs/MedicationDialog';
import MedicationIcon from '@client/src/components/icons/MedicationIcon';
import PoopDialog from '@client/src/components/record-dialogs/PoopDialog';
import osmanthusBranch from '@client/src/assets/osmanthus-branch.png';

import type {
  SleepRecord, MoodRecord, PainRecord, DietRecord,
  ExerciseRecord, WaterRecord, MedicationRecord, PoopRecord,
  ListResponse,
} from '@shared/api.interface';

interface RecordModule {
  key: RecordType;
  name: string;
  description: string;
  icon: ComponentType<any>;
  bgColor: string;
  iconColor: string;
}

const modules: RecordModule[] = [
  { key: 'sleep', name: '睡眠', description: '记录每日睡眠质量', icon: MoonStar, bgColor: 'bg-module-sleep-bg', iconColor: 'text-module-sleep' },
  { key: 'mood', name: '情绪', description: '记录心情变化', icon: Smile, bgColor: 'bg-module-mood-bg', iconColor: 'text-module-mood' },
  { key: 'pain', name: '病痛', description: '记录身体不适', icon: HeartPulse, bgColor: 'bg-module-pain-bg', iconColor: 'text-module-pain' },
  { key: 'diet', name: '饮食', description: '记录每日饮食', icon: Utensils, bgColor: 'bg-module-diet-bg', iconColor: 'text-module-diet' },
  { key: 'exercise', name: '运动', description: '记录运动情况', icon: Dumbbell, bgColor: 'bg-module-exercise-bg', iconColor: 'text-module-exercise' },
  { key: 'water', name: '喝水', description: '记录每日饮水', icon: Droplet, bgColor: 'bg-module-water-bg', iconColor: 'text-module-water' },
  { key: 'medication', name: '用药', description: '记录服药情况', icon: MedicationIcon, bgColor: 'bg-module-medication-bg', iconColor: 'text-module-medication' },
  { key: 'poop', name: '排便', description: '记录排便情况', icon: ToiletIcon, bgColor: 'bg-module-poop-bg', iconColor: 'text-module-poop' },
];

const MOOD_BG: Record<string, string> = {
  '开心': '#FEF3C7', '平静': '#E0E7FF', '焦虑': '#FEE2E2', '低落': '#E0E7FF',
  '烦躁': '#FECACA', '疲惫': '#F3E8FF', '幸福': '#FCE7F3', '失落': '#DBEAFE',
  '惊恐': '#FED7AA', '愤怒': '#FECACA', '充实': '#D1FAE5', '无聊': '#E5E7EB',
  '感动': '#FCE7F3', '紧张': '#FED7AA', '期待': '#FEF3C7', '尴尬': '#FECDD3',
  '裂开': '#FDE68A', '难过': '#DBEAFE', '破防': '#FECDD3', '麻了': '#E5E7EB',
  '无语': '#D1D5DB', '惊讶': '#FEF3C7',
};

const RecordsIndex: React.FC = () => {
  const navigate = useNavigate();

  const handleModuleClick = (key: RecordType): void => {
    navigate(`/records/${key}`);
  };

  return (
    <div className="space-y-4 relative overflow-visible min-h-[200px]">
      <style>{`
        .record-module-card {
          box-shadow: 0 8px 18px rgba(31,97,72,.045);
          cursor: pointer;
          transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
          background: rgba(255,255,255,.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .record-module-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 13px 23px rgba(26,106,75,.14);
          border-color: hsl(95 55% 75%);
        }
        .record-module-card:active {
          transform: translateY(-1px);
          box-shadow: 0 7px 13px rgba(26,106,75,.1);
        }
        .record-module-card:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px hsla(95, 55%, 60%, .4) inset, 0 13px 23px rgba(26,106,75,.14);
        }
      `}</style>
      <header>
        <h1 className="text-2xl font-bold tracking-tight font-title">记录中心</h1>
        <p className="text-sm text-muted-foreground mt-1">选择要记录的项目</p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 pt-2">
        {modules.map(({ key, name, description, icon: Icon, bgColor, iconColor }) => (
          <button
            key={key}
            onClick={() => handleModuleClick(key)}
            className={`record-module-card paper-card flex flex-col items-start justify-end gap-2 p-5 h-36 relative overflow-hidden`}
           >
             <div className={`absolute top-4 right-4 w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center`}>
               <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={1.5} />
             </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground font-sans-hei">{name}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-sans-hei">{description}</p>
              </div>
           </button>
        ))}
      </div>
    </div>
  );
};

function formatDateGroupLabel(dateStr: string): string {
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  if (dateStr === today) return '今天';
  if (dateStr === yesterday) return '昨天';
  const d = dayjs(dateStr);
  return `${d.month() + 1}月${d.date()}日`;
}

interface MoodGroup {
  date: string;
  label: string;
  items: MoodRecord[];
}

function groupMoodsByDate(records: MoodRecord[]): MoodGroup[] {
  const map = new Map<string, MoodRecord[]>();
  for (const r of records) {
    const d = dayjs(r.recordTime).format('YYYY-MM-DD');
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(r);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({
      date,
      label: formatDateGroupLabel(date),
      items,
    }));
}

const MoodRecordList: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MoodRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MoodRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [moodSearchParams, setMoodSearchParams] = useSearchParams();
  const moodFromHome = useRef(false);

  useEffect(() => {
    if (moodSearchParams.get('new') === '1') {
      moodFromHome.current = true;
      setEditRecord(null);
      setDialogOpen(true);
      setMoodSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchList = async (p: number = page): Promise<void> => {
    try {
      setLoading(true);
      const res: ListResponse<MoodRecord> = await moodApi.getMoodList({ page: p, pageSize });
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch (err) {
      logger.error('加载情绪记录失败', err as Error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = (): void => {
    moodFromHome.current = false;
    setEditRecord(null);
    setDialogOpen(true);
  };

  const handleEdit = (record: MoodRecord): void => {
    moodFromHome.current = false;
    setEditRecord(record);
    setDialogOpen(true);
  };

  const handleDelete = (id: string): void => {
    setDeleteConfirm({ open: true, id });
  };

  const confirmDelete = async (): Promise<void> => {
    try {
      await moodApi.deleteMood(deleteConfirm.id);
      toast.success('已删除');
      setDeleteConfirm({ open: false, id: '' });
      void fetchList(page);
    } catch (err) {
      toast.error('删除失败');
    }
  };

  const handleSuccess = (): void => {
    setDialogOpen(false);
    setEditRecord(null);
    if (moodFromHome.current) {
      navigate('/');
      return;
    }
    void fetchList(page);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const groups = groupMoodsByDate(items);

  const firstMood = (r: MoodRecord): string => r.moods?.[0] || '平静';
  const firstEmoji = (r: MoodRecord): string => MOOD_EMOJI[firstMood(r)] || '😊';
  const firstMoodBg = (r: MoodRecord): string => MOOD_BG[firstMood(r)] || '#FEF3C7';

  return (
    <div className="space-y-4 md:space-y-4 md:pt-0">
      <header
        className="flex items-center gap-3 md:static md:z-auto md:bg-transparent md:pt-0 md:pb-0 md:mt-0 md:w-full md:ml-0 md:px-0 records-header -mx-4 px-4 sticky top-0 z-30 w-auto mt-[-24px] pt-6 pb-6 relative"
        style={{
          isolation: 'auto' as const,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none md:hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(7px)',
          WebkitBackdropFilter: 'blur(7px)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 calc(100% - 16px), transparent 100%)',
            maskImage: 'linear-gradient(to bottom, #000 0%, #000 calc(100% - 16px), transparent 100%)',
            zIndex: 10,
          }}
        />
        <button
          onClick={() => navigate('/records')}
          className="relative z-30 w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center hover:bg-primary-light hover:text-primary transition-colors shadow-[0_2px_10px_rgba(26_59_42_0.12)]"
          style={{ color: '#2a483a' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="relative z-30 flex-1 min-w-0">
          <h1 className="text-xl font-medium truncate font-sans-hei">情绪记录</h1>
          <p className="text-sm text-muted-foreground">共 {total} 条记录</p>
        </div>
        <button
          onClick={handleAdd}
          className="relative z-30 px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 bg-white/70 backdrop-blur-md hover:bg-primary-light hover:text-primary transition-colors shadow-[0_2px_10px_rgba(26_59_42_0.12)]"
          style={{ color: '#2a483a' }}
        >
          <Plus className="w-4 h-4" />
          新增
        </button>
      </header>

      {loading ? (
        <div className="paper-card p-12 text-center text-sm text-muted-foreground" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div className="paper-card py-16 text-center" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="w-16 h-16 rounded-2xl bg-module-mood-bg flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Smile className="w-8 h-8 text-module-mood" />
          </div>
          <p className="text-sm text-muted-foreground">还没有情绪记录</p>
          <button
            onClick={handleAdd}
            className="text-primary text-sm font-medium mt-3"
          >
            立即添加第一条 →
          </button>
        </div>
      ) : (
        <div className="space-y-5 pt-0">
          {groups.map((group) => (
            <div key={group.date} className="space-y-2">
              <div className="px-1 flex items-center gap-2">
                <span className="text-sm font-medium text-foreground/70 font-sans-hei">
                  {group.label}
                </span>
              </div>
              <div
                className="paper-card overflow-hidden divide-y divide-border/40"
                style={{ background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
              >
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="px-5 py-4 flex items-start gap-3 group relative"
                  >
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-start gap-3 text-left min-w-0"
                    >
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: firstMoodBg(item) }}
                        >
                          <span style={{ fontSize: '24px', lineHeight: 1 }}>
                            <Twemoji emoji={firstEmoji(item)} size={24} />
                          </span>
                        </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            {item.moods.slice(0, 3).map((mood: string) => (
                              <span
                                key={mood}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium font-sans-hei"
                                style={{
                                  backgroundColor: '#FFF7E6',
                                  color: '#8B6914',
                                }}
                              >
                                {mood}
                              </span>
                            ))}
                            {item.moods.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs text-muted-foreground font-sans-hei">
                                +{item.moods.length - 3}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums -mt-0.5">
                            {dayjs(item.recordTime).format('HH:mm')}
                          </span>
                        </div>
                        {item.note && (
                          <p className="mt-2 text-sm text-foreground/70 leading-relaxed break-words font-sans-hei">
                            {item.note}
                          </p>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="absolute right-4 bottom-3 w-9 h-9 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-destructive/10"
                      style={{ color: '#E57373' }}
                      aria-label="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="px-5 py-4 flex items-center justify-center gap-3 paper-card" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
              <button
                onClick={() => void fetchList(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
                className="px-4 py-2 rounded-full text-sm bg-muted text-muted-foreground disabled:opacity-50 hover:bg-primary-light hover:text-primary transition-colors"
              >
                上一页
              </button>
              <span className="text-sm text-muted-foreground tabular-nums px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => void fetchList(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || loading}
                className="px-4 py-2 rounded-full text-sm bg-muted text-muted-foreground disabled:opacity-50 hover:bg-primary-light hover:text-primary transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}

        {dialogOpen && (
        <MoodDialog
          open={true}
          record={editRecord}
          onClose={() => {
            setDialogOpen(false);
            setEditRecord(null);
            if (moodFromHome.current) navigate('/');
          }}
          onSuccess={handleSuccess}
        />
      )}

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open: boolean) => !open && setDeleteConfirm({ open: false, id: '' })}>
        <AlertDialogContent className="rounded-3xl p-6 font-sans-hei">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-medium font-sans-hei">提示</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条记录吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const RecordListRouter: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const validTypes: RecordType[] = ['sleep', 'mood', 'pain', 'diet', 'exercise', 'water', 'medication', 'poop'];

  if (!type || !validTypes.includes(type as RecordType)) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">未知的记录类型</p>
        <Link to="/records" className="text-primary text-sm mt-2 inline-block">返回记录中心</Link>
      </div>
    );
  }

  if (type === 'mood') {
    return <MoodRecordList />;
  }

  return <GenericRecordList type={type as RecordType} />;
};

type AnyRecord = SleepRecord | MoodRecord | PainRecord | DietRecord | ExerciseRecord | WaterRecord | MedicationRecord | PoopRecord;

function getListFn(type: RecordType) {
  const fns: Record<RecordType, any> = {
    sleep: sleepApi.getSleepList,
    mood: moodApi.getMoodList,
    pain: painApi.getPainList,
    diet: dietApi.getDietList,
    exercise: exerciseApi.getExerciseList,
    water: waterApi.getWaterList,
    medication: medicationApi.getMedicationList,
    poop: poopApi.getPoopList,
  };
  return fns[type];
}

function getDeleteFn(type: RecordType) {
  const fns: Record<RecordType, any> = {
    sleep: sleepApi.deleteSleep,
    mood: moodApi.deleteMood,
    pain: painApi.deletePain,
    diet: dietApi.deleteDiet,
    exercise: exerciseApi.deleteExercise,
    water: waterApi.deleteWater,
    medication: medicationApi.deleteMedication,
    poop: poopApi.deletePoop,
  };
  return fns[type];
}

function getRecordSummary(type: RecordType, record: AnyRecord): string {
  switch (type) {
    case 'sleep': {
      const r = record as SleepRecord;
      const hours = (r.durationMinutes / 60).toFixed(1);
      return `睡眠 ${hours} 小时`;
    }
    case 'mood': {
      const r = record as MoodRecord;
      return r.moods?.join('、') || '无';
    }
    case 'pain': {
      const r = record as PainRecord;
      const levelMap = { mild: '轻度', moderate: '中度', severe: '重度' };
      return `${r.symptoms?.join('、') || '无'} · ${levelMap[r.painLevel] || r.painLevel}`;
    }
    case 'diet': {
      const r = record as DietRecord;
      const mealMap: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', supper: '宵夜', snack: '加餐' };
      return `${mealMap[r.mealType] || r.mealType} · ${r.foodDescription || '无描述'}`;
    }
    case 'exercise': {
      const r = record as ExerciseRecord;
      return `${r.exerciseType} · ${r.durationMinutes} 分钟`;
    }
    case 'water': {
      const r = record as WaterRecord;
      return `${r.amountMl} ml`;
    }
    case 'medication': {
      const r = record as MedicationRecord;
      return `${r.medicineName} ${r.dosage || ''}`;
    }
    case 'poop': {
      const r = record as PoopRecord;
      return r.stoolType;
    }
  }
}

function getRecordTime(type: RecordType, record: AnyRecord): string {
  switch (type) {
    case 'sleep': return (record as SleepRecord).sleepTime;
    case 'mood': return (record as MoodRecord).recordTime;
    case 'pain': return (record as PainRecord).startTime;
    case 'diet': return (record as DietRecord).eatTime || (record as DietRecord).createdAt;
    case 'exercise': return (record as ExerciseRecord).startTime;
    case 'water': return (record as WaterRecord).drinkTime;
    case 'medication': return (record as MedicationRecord).takeTime;
    case 'poop': return (record as PoopRecord).poopTime;
  }
}

const painLevelMap: Record<string, string> = { mild: '轻度', moderate: '中度', severe: '重度' };
const mealTypeMap: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', supper: '宵夜', snack: '加餐' };

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分` : `${h}小时`;
}

function getCardTopLine(type: RecordType, record: AnyRecord): { label: string; sub?: string; tags?: string[]; painLevel?: string; dosage?: string; symptom?: string; imageUrl?: string } {
  switch (type) {
    case 'sleep': {
      const r = record as SleepRecord;
      return {
        label: formatDuration(r.durationMinutes),
        sub: `${dayjs(r.sleepTime).format('HH:mm')} - ${dayjs(r.wakeTime).format('HH:mm')}`,
      };
    }
    case 'mood': {
      const r = record as MoodRecord;
      const moodStr = (r.moods || []).slice(0, 3).join('、');
      return { label: moodStr || '心情记录', imageUrl: r.imageUrl || '' };
    }
    case 'pain': {
      const r = record as PainRecord;
      const sym = r.symptoms?.[0] || '不适';
      const sub = r.durationMinutes > 0 ? `持续 ${formatDuration(r.durationMinutes)}` : '';
      return { label: sym, painLevel: r.painLevel, sub: sub || undefined };
    }
    case 'diet': {
      const r = record as DietRecord;
      return { label: mealTypeMap[r.mealType] || r.mealType, tags: r.tags || [] };
    }
    case 'exercise': {
      const r = record as ExerciseRecord;
      return { label: `${r.exerciseType} · ${formatDuration(r.durationMinutes)}`, imageUrl: r.imageUrl || '' };
    }
    case 'water': {
      const r = record as WaterRecord;
      return { label: `${r.amountMl}ml` };
    }
    case 'medication': {
      const r = record as MedicationRecord;
      return { label: r.medicineName, dosage: r.dosage || '', symptom: r.relatedSymptom || '', imageUrl: r.imageUrl || '' };
    }
    case 'poop': {
      const r = record as PoopRecord;
      return { label: r.stoolType };
    }
    default:
      return { label: '' };
  }
}

function getCardNote(type: RecordType, record: AnyRecord): string {
  switch (type) {
    case 'pain': {
      const r = record as PainRecord;
      const desc = r.description || '';
      const note = r.note || '';
      if (desc && note) return `${desc}${note ? '｜' + note : ''}`;
      return desc || note || '';
    }
    case 'diet': {
      const r = record as DietRecord;
      return r.foodDescription || '';
    }
    case 'water':
      return '';
    default:
      return (record as any).note || '';
  }
}

function showCardTime(type: RecordType): boolean {
  return type !== 'sleep';
}

function groupRecordsByDate(type: RecordType, records: AnyRecord[]): { date: string; label: string; items: AnyRecord[] }[] {
  const map = new Map<string, AnyRecord[]>();
  for (const r of records) {
    const d = dayjs(getRecordTime(type, r)).format('YYYY-MM-DD');
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(r);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({
      date,
      label: formatDateGroupLabel(date),
      items,
    }));
}

const GenericRecordList: React.FC<{ type: RecordType }> = ({ type }) => {
  const navigate = useNavigate();
  const meta = RECORD_META[type];
  const Icon = meta.icon;

  const [items, setItems] = useState<AnyRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AnyRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [searchParams, setSearchParams] = useSearchParams();
  const fromHome = useRef(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      fromHome.current = true;
      setEditRecord(null);
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const fetchList = async (p: number = page): Promise<void> => {
    try {
      setLoading(true);
      const res = await getListFn(type)({ page: p, pageSize });
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
    } catch (err) {
      logger.error(`加载${meta.name}记录失败`, err as Error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleAdd = (): void => {
    fromHome.current = false;
    setEditRecord(null);
    setDialogOpen(true);
  };

  const handleEdit = (record: AnyRecord): void => {
    fromHome.current = false;
    setEditRecord(record);
    setDialogOpen(true);
  };

  const handleDelete = (id: string): void => {
    setDeleteConfirm({ open: true, id });
  };

  const confirmDelete = async (): Promise<void> => {
    try {
      await getDeleteFn(type)(deleteConfirm.id);
      toast.success('已删除');
      setDeleteConfirm({ open: false, id: '' });
      void fetchList(page);
    } catch (err) {
      toast.error('删除失败');
    }
  };

  const handleSuccess = (): void => {
    setDialogOpen(false);
    setEditRecord(null);
    if (fromHome.current) {
      navigate('/');
      return;
    }
    void fetchList(page);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const groups = groupRecordsByDate(type, items);

  const renderDialog = (): React.ReactElement | null => {
      if (!dialogOpen) return null;
    const closeDialog = (): void => {
      setDialogOpen(false);
      setEditRecord(null);
      if (fromHome.current) navigate('/');
    };
    const commonProps = {
      open: true,
      onClose: closeDialog,
      onSuccess: handleSuccess,
    };
    switch (type) {
      case 'sleep':
        return <SleepDialog {...commonProps} record={editRecord as SleepRecord | null} />;
      case 'pain':
        return <PainDialog {...commonProps} record={editRecord as PainRecord | null} />;
      case 'diet':
        return <DietDialog {...commonProps} record={editRecord as DietRecord | null} />;
      case 'exercise':
        return <ExerciseDialog {...commonProps} record={editRecord as ExerciseRecord | null} />;
      case 'water':
        return <WaterDialog {...commonProps} record={editRecord as WaterRecord | null} />;
      case 'medication':
        return <MedicationDialog {...commonProps} record={editRecord as MedicationRecord | null} />;
      case 'poop':
        return <PoopDialog {...commonProps} record={editRecord as PoopRecord | null} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 md:space-y-4 md:pt-0">
      <header
        className="flex items-center gap-3 md:static md:z-auto md:bg-transparent md:pt-0 md:pb-0 md:mt-0 md:px-0 md:mx-0 md:w-full records-header -mx-4 px-4 sticky top-0 z-30 w-auto mt-[-24px] pt-6 pb-6 relative"
        style={{
          isolation: 'auto' as const,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none md:hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(7px)',
          WebkitBackdropFilter: 'blur(7px)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 calc(100% - 16px), transparent 100%)',
            maskImage: 'linear-gradient(to bottom, #000 0%, #000 calc(100% - 16px), transparent 100%)',
            zIndex: 10,
          }}
        />
        <button
          onClick={() => navigate('/records')}
          className="relative z-30 w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center hover:bg-primary-light hover:text-primary transition-colors shadow-[0_2px_10px_rgba(26_59_42_0.12)]"
          style={{ color: '#2a483a' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="relative z-30 flex-1 min-w-0">
          <h1 className="text-xl font-medium truncate font-sans-hei">{meta.name}记录</h1>
          <p className="text-sm text-muted-foreground">共 {total} 条记录</p>
        </div>
        <button
          onClick={handleAdd}
          className="relative z-30 px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 bg-white/70 backdrop-blur-md hover:bg-primary-light hover:text-primary transition-colors shadow-[0_2px_10px_rgba(26_59_42_0.12)]"
          style={{ color: '#2a483a' }}
        >
          <Plus className="w-4 h-4" />
          新增
        </button>
      </header>

      {loading ? (
        <div className="paper-card p-12 text-center text-sm text-muted-foreground" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div className="paper-card py-16 text-center" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className={`w-16 h-16 rounded-2xl ${meta.bgColor} flex items-center justify-center mx-auto mb-4 shadow-sm`}>
            <Icon className={`w-8 h-8 ${meta.iconColor}`} />
          </div>
          <p className="text-sm text-muted-foreground">还没有{meta.name}记录</p>
          <button
            onClick={handleAdd}
            className="text-primary text-sm font-medium mt-3"
          >
            立即添加第一条 →
          </button>
        </div>
      ) : (
        <div className="space-y-5 pt-0">
          {groups.map((group) => (
            <div key={group.date} className="space-y-2">
              <div className="px-1 flex items-center gap-2">
                <span className="text-sm font-medium text-foreground/70 font-sans-hei">
                  {group.label}
                </span>
              </div>
              <div
                className="paper-card overflow-hidden divide-y divide-border/40"
                style={{ background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
              >
                {group.items.map((item) => {
                  const top = getCardTopLine(type, item);
                  const note = getCardNote(type, item);
                  const showTime = showCardTime(type);
                  const isDiet = type === 'diet';
                  const isPain = type === 'pain';
                  const isMedication = type === 'medication';
                  return (
                    <div
                      key={item.id}
                      className="px-5 py-4 flex items-start gap-3 group relative"
                    >
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 flex items-start gap-3 text-left min-w-0"
                      >
                        <div className={`w-12 h-12 rounded-2xl ${meta.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${meta.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-start justify-between gap-2">
                            {isDiet && top.tags ? (
                              <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                                <span className="text-sm font-medium text-foreground font-sans-hei flex-shrink-0">
                                  {top.label}
                                </span>
                                {top.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {top.tags.slice(0, 3).map((tag: string) => (
                                      <span
                                        key={tag}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-sans-hei"
                                        style={{
                                          backgroundColor: '#FFF7E6',
                                          color: '#8B6914',
                                        }}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {top.tags.length > 3 && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans-hei" style={{ color: '#8B6914' }}>
                                        +{top.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : isPain && top.painLevel ? (
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-sm font-medium text-foreground font-sans-hei flex-shrink-0 truncate">
                                  {top.label}
                                </span>
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-sans-hei flex-shrink-0"
                                  style={{
                                    backgroundColor: top.painLevel === 'mild' ? '#E0F0DD' : top.painLevel === 'moderate' ? '#FDE4CB' : '#FBD4D4',
                                    color: top.painLevel === 'mild' ? '#5A8A4A' : top.painLevel === 'moderate' ? '#B6672A' : '#C94A4A',
                                  }}
                                >
                                  {painLevelMap[top.painLevel] || top.painLevel}
                                </span>
                              </div>
                            ) : isMedication ? (
                              <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                                <span className="text-sm font-medium text-foreground font-sans-hei flex-shrink-0 truncate">
                                  {top.label}
                                </span>
                                {top.dosage && (
                                  <span
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-sans-hei flex-shrink-0"
                                    style={{
                                      backgroundColor: '#FFF7E6',
                                      color: '#8B6914',
                                    }}
                                  >
                                    {top.dosage}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-foreground font-sans-hei truncate">
                                {top.label}
                              </span>
                            )}
                            {showTime && (
                              <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums -mt-0.5">
                                {dayjs(getRecordTime(type, item)).format('HH:mm')}
                              </span>
                            )}
                          </div>
                          {top.sub && (
                            <p className="mt-1 text-xs text-muted-foreground font-sans-hei">
                              {top.sub}
                            </p>
                          )}
                          {isMedication && top.symptom && (
                            <p className="mt-1.5 text-sm text-foreground/70 font-sans-hei break-words">
                              {top.symptom}
                            </p>
                          )}
                          {note && (
                            <p className="mt-2 text-sm text-foreground/70 leading-relaxed break-words font-sans-hei">
                              {note}
                            </p>
                          )}
                        </div>
                        {top.imageUrl && (
                          <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden mt-0.5">
                            <Image
                              src={top.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className={`absolute right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-destructive/10 ${type === 'sleep' ? 'top-1/2 -translate-y-1/2' : 'bottom-3'}`}
                        style={{ color: '#E57373' }}
                        aria-label="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="px-5 py-4 flex items-center justify-center gap-3 paper-card" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
              <button
                onClick={() => void fetchList(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
                className="px-4 py-2 rounded-full text-sm bg-muted text-muted-foreground disabled:opacity-50 hover:bg-primary-light hover:text-primary transition-colors"
              >
                上一页
              </button>
              <span className="text-sm text-muted-foreground tabular-nums px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => void fetchList(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || loading}
                className="px-4 py-2 rounded-full text-sm bg-muted text-muted-foreground disabled:opacity-50 hover:bg-primary-light hover:text-primary transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}

      {renderDialog()}

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open: boolean) => !open && setDeleteConfirm({ open: false, id: '' })}>
        <AlertDialogContent className="rounded-3xl p-6 font-sans-hei">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-medium font-sans-hei">提示</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条记录吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const RecordsPage: React.FC = () => {
  return (
    <div id="records-page-root" className="relative min-h-screen">
      <PageBackground />
      <div
        className="osmanthus-corner pointer-events-none z-0 md:z-[20]"
        style={{
          position: 'absolute',
          top: '-45px',
          right: '-55px',
          width: '320px',
          maxWidth: '78vw',
          opacity: 0.9,
          pointerEvents: 'none',
          transformOrigin: 'top right',
          transform: 'translateX(-100%) scaleX(-1) rotate(15deg)',
        }}
        aria-hidden="true"
      >
        <Image
          src={osmanthusBranch}
          alt=""
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
          }}
        />
      </div>

      <div className="page-content-wrap relative z-[1]">
        <Routes>
          <Route index element={<RecordsIndex />} />
          <Route path=":type" element={<RecordListRouter />} />
        </Routes>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .records-header {
            position: static !important;
            z-index: auto !important;
            margin-top: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            background: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            -webkit-mask-image: none !important;
            mask-image: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RecordsPage;
