import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import DateTimeField from '@client/src/components/record-dialogs/DateTimeField';
import TimePicker from '@client/src/components/TimePicker';
import EnableToggleCard from '@client/src/components/EnableToggleCard';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { remindersApi } from '@client/src/api';
import type { ReminderItem } from '@shared/api.interface';

type ReminderType = 'water' | 'medication' | 'activity';
type RepeatType = 'daily' | 'weekly' | 'interval';

const WEEK_DAYS = [
  { key: 'mon', label: '一' },
  { key: 'tue', label: '二' },
  { key: 'wed', label: '三' },
  { key: 'thu', label: '四' },
  { key: 'fri', label: '五' },
  { key: 'sat', label: '六' },
  { key: 'sun', label: '日' },
];

const DEFAULT_WATER_TIMES = [
  '08:00',
  '10:00',
  '12:30',
  '15:00',
  '17:00',
  '19:00',
];

const TYPE_LABELS: Record<ReminderType, string> = {
  water: '喝水提醒',
  medication: '吃药提醒',
  activity: '活动提醒',
};

const REPEAT_OPTIONS: { key: RepeatType; label: string }[] = [
  { key: 'daily', label: '每日' },
  { key: 'weekly', label: '每周指定天' },
  { key: 'interval', label: '间隔天数' },
];

interface ReminderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder: ReminderItem | null;
  defaultType: ReminderType;
  onSaved: () => void;
}

const ReminderEditDialog: React.FC<ReminderEditDialogProps> = ({
  open,
  onOpenChange,
  reminder,
  defaultType,
  onSaved,
}) => {
  const isEdit = !!reminder;
  const [reminderType, setReminderType] = useState<ReminderType>(defaultType);
  const [title, setTitle] = useState('');
  const [timePoints, setTimePoints] = useState<string[]>([]);
  const [newTime, setNewTime] = useState('09:00');
  const [repeatType, setRepeatType] = useState<RepeatType>('daily');
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [repeatInterval, setRepeatInterval] = useState<number>(1);
  const [endDate, setEndDate] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (reminder) {
      setReminderType(reminder.reminderType as ReminderType);
      setTitle(reminder.title);
      setTimePoints([...reminder.timePoints].sort());
      setRepeatType(reminder.repeatType as RepeatType);
      setRepeatDays(reminder.repeatDays);
      setRepeatInterval(reminder.repeatInterval || 1);
      setEndDate(reminder.endDate ?? '');
      setIsEnabled(reminder.isEnabled);
    } else {
      setReminderType(defaultType);
      setTitle(TYPE_LABELS[defaultType] ?? '');
      setTimePoints(defaultType === 'water' ? [...DEFAULT_WATER_TIMES] : []);
      setRepeatType('daily');
      setRepeatDays([]);
      setRepeatInterval(1);
      setEndDate('');
      setIsEnabled(true);
      setNewTime('09:00');
    }
  }, [open, reminder, defaultType]);

  const handleAddTime = (): void => {
    if (!newTime) return;
    if (timePoints.includes(newTime)) {
      toast.error('该时间点已存在');
      return;
    }
    setTimePoints([...timePoints, newTime].sort());
  };

  const handleRemoveTime = (t: string): void => {
    setTimePoints(timePoints.filter((x: string) => x !== t));
  };

  const toggleDay = (day: string): void => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d: string) => d !== day) : [...prev, day],
    );
  };

  const handleSave = async (): Promise<void> => {
    if (!title.trim()) {
      toast.error('请输入提醒标题');
      return;
    }
    if (timePoints.length === 0) {
      toast.error('请至少添加一个时间点');
      return;
    }
    if (repeatType === 'weekly' && repeatDays.length === 0) {
      toast.error('请至少选择一天');
      return;
    }
    if (repeatType === 'interval' && repeatInterval < 1) {
      toast.error('间隔天数至少为 1');
      return;
    }

    const body = {
      reminderType,
      title: title.trim(),
      timePoints: [...timePoints].sort(),
      repeatType,
      repeatDays,
      repeatInterval,
      endDate: endDate || undefined,
      isEnabled,
    };

    try {
      setSaving(true);
      if (isEdit && reminder) {
        await remindersApi.updateReminder(reminder.id, body);
        toast.success('提醒已更新');
      } else {
        await remindersApi.createReminder(body);
        toast.success('提醒已创建');
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      logger.error('保存提醒失败', err as Error);
      toast.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    borderColor: '#D8E6DE',
    backgroundColor: '#F2F7F4',
    color: '#2A483A',
    borderRadius: '999px',
    height: '44px',
    fontSize: '15px',
    outline: 'none',
    fontWeight: 500,
  };

  const labelStyle = {
    color: '#2A483A',
    fontSize: '15px',
    fontWeight: 500,
  };

  const inputFocusProps = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.backgroundColor = '#ffffff';
      e.currentTarget.style.borderColor = '#2A483A';
      e.currentTarget.style.boxShadow = 'none';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.backgroundColor = inputStyle.backgroundColor;
      e.currentTarget.style.borderColor = inputStyle.borderColor;
      e.currentTarget.style.boxShadow = 'none';
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay
        className=""
        style={{
          backgroundColor: 'rgba(30, 45, 38, 0.22)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />
      <DialogContent
        className="max-w-[90%] sm:max-w-[380px] p-0 rounded-[24px] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #EDF5EE 0%, #FAF8F2 60%, #FDF8E8 100%)',
          boxShadow: '0 16px 40px rgba(42, 72, 58, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
        }}
        showCloseButton={false}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 hover:bg-white/60 active:scale-95"
          style={{ color: '#2A483A' }}
          aria-label="关闭"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>

        <div style={{ padding: '28px 24px 12px 24px' }}>
          <DialogTitle
            className="text-xl font-semibold font-sans-hei text-center"
            style={{ color: '#2A483A', letterSpacing: '0.5px' }}
          >
            {isEdit ? '编辑提醒' : '新增提醒'}
          </DialogTitle>
        </div>

        <div
          style={{
            padding: '16px 24px 0 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            overflowY: 'auto',
            maxHeight: '60vh',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* 标题 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="font-sans-hei block" style={labelStyle}>
              标题
            </label>
             <Input
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="例如：喝水提醒"
               className="font-sans-hei placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all text-center"
               style={{
                 ...inputStyle,
                 paddingLeft: '20px',
                 paddingRight: '20px',
               }}
               {...inputFocusProps}
             />
          </div>

          {/* 提醒时间 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label className="font-sans-hei block" style={labelStyle}>
              提醒时间
            </label>
            {timePoints.length > 0 && (
              <div className="flex flex-wrap" style={{ gap: '8px' }}>
                {timePoints.map((t: string) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 font-sans-hei"
                    style={{
                      backgroundColor: '#E8F0EB',
                      borderRadius: '999px',
                      color: '#2A483A',
                      fontWeight: 500,
                      fontSize: '13px',
                      padding: '8px 16px',
                      border: '1px solid #d4e4da',
                    }}
                  >
                    {t}
                    <button
                      onClick={() => handleRemoveTime(t)}
                      className="rounded p-0.5 transition-colors hover:text-destructive"
                      style={{ color: '#7b9687' }}
                    >
                      <X className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
               <TimePicker
                 value={newTime}
                 onChange={(t: string) => setNewTime(t)}
                 className="flex-1"
                 triggerStyle={{
                   height: '44px',
                   borderRadius: '999px',
                   backgroundColor: '#F2F7F4',
                   border: '1px solid transparent',
                   color: '#2A483A',
                   fontSize: '15px',
                   fontWeight: 500,
                   paddingLeft: '20px',
                   justifyContent: 'center',
                 }}
               />
               <button
                 type="button"
                 onClick={handleAddTime}
                 className="px-4 rounded-full font-sans-hei flex items-center gap-1.5 transition-colors shrink-0 font-semibold hover:opacity-90"
                 style={{
                   height: '44px',
                   border: '1.5px dashed #a3c2b0',
                   color: '#2A483A',
                   backgroundColor: '#F2F7F4',
                   fontSize: '14px',
                 }}
               >
                <Plus className="w-4 h-4" strokeWidth={2} />
                添加
              </button>
            </div>
          </div>

          {/* 重复方式 - 分段选择器 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="font-sans-hei block" style={labelStyle}>
              重复方式
            </label>
             <div
               className="flex rounded-full"
               style={{ backgroundColor: '#E8F0EB', padding: '4px' }}
             >
               {REPEAT_OPTIONS.map((opt) => {
                 const active = repeatType === opt.key;
                 return (
                   <button
                     key={opt.key}
                     type="button"
                     onClick={() => setRepeatType(opt.key)}
                     className="flex-1 rounded-full font-sans-hei transition-all text-center"
                     style={{
                       padding: '10px 0',
                       backgroundColor: active ? '#ffffff' : 'transparent',
                       color: active ? '#2A483A' : '#617a6d',
                       fontWeight: active ? 600 : 500,
                       boxShadow: active
                         ? '0 2px 6px rgba(42, 72, 58, 0.08), 0 1px 2px rgba(42, 72, 58, 0.04)'
                         : 'none',
                       fontSize: '13px',
                     }}
                   >
                     {opt.label}
                   </button>
                 );
               })}
             </div>

            {repeatType === 'weekly' && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {WEEK_DAYS.map((day) => {
                  const active = repeatDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      onClick={() => toggleDay(day.key)}
                      className="w-7 h-7 rounded-full text-xs font-sans-hei transition-colors"
                      style={{
                        backgroundColor: active ? '#eaf3ed' : '#f2f7f4',
                        color: active ? '#2a483a' : '#617a6d',
                        fontWeight: active ? 600 : 500,
                        border: active ? '1px solid #a3c2b0' : '1px solid transparent',
                        fontSize: '12px',
                      }}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            )}

            {repeatType === 'interval' && (
              <div className="flex items-center gap-2 pt-1">
                <span className="font-sans-hei" style={{ color: '#617a6d', fontSize: '12.5px' }}>
                  每
                </span>
                <Input
                  type="number"
                  min={1}
                  value={repeatInterval}
                  onChange={(e) => setRepeatInterval(Number(e.target.value))}
                  className="w-16 font-sans-hei text-center focus-visible:ring-0 focus-visible:ring-offset-0 transition-all"
                  style={inputStyle}
                  {...inputFocusProps}
                />
                <span className="font-sans-hei" style={{ color: '#617a6d', fontSize: '12.5px' }}>
                  天
                </span>
              </div>
            )}
          </div>

          {/* 截止日期 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="font-sans-hei block" style={labelStyle}>
              截止日期（可选）
            </label>
             <DateTimeField
               value={endDate ? `${endDate}T00:00:00` : ''}
               onChange={(iso: string) => {
                 if (iso) {
                   const d = new Date(iso);
                   const y = d.getFullYear();
                   const m = String(d.getMonth() + 1).padStart(2, '0');
                   const day = String(d.getDate()).padStart(2, '0');
                   setEndDate(`${y}-${m}-${day}`);
                 } else {
                   setEndDate('');
                 }
               }}
               label=""
               className="w-full"
               triggerStyle={{
                 height: '44px',
                 borderRadius: '999px',
                 backgroundColor: '#F2F7F4',
                 border: '1px solid transparent',
                 color: '#2A483A',
                 fontSize: '15px',
                 fontWeight: 500,
                 paddingLeft: '20px',
                 justifyContent: 'center',
               }}
             />
          </div>

          {/* 启用提醒 - 卡片式开关 */}
          <EnableToggleCard
            enabled={isEnabled}
            onChange={setIsEnabled}
          />
        </div>

        <DialogFooter className="px-6 pb-6 pt-8 flex flex-col items-center gap-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-full font-sans-hei font-semibold"
            style={{
              height: '52px',
              backgroundColor: '#fef3c7',
              color: '#6b5a3e',
              boxShadow: '0 4px 14px rgba(214, 178, 76, 0.18)',
              fontSize: '16px',
              border: '1px solid rgba(245, 215, 110, 0.4)',
            }}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="font-sans-hei text-base transition-colors hover:opacity-80"
            style={{ color: '#8E9891', fontWeight: 500 }}
          >
            取消
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderEditDialog;
