import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Textarea } from '@client/src/components/ui/textarea';
import { painApi } from '@client/src/api';
import { PAIN_SYMPTOMS, PAIN_LEVELS } from '@client/src/utils/record-constants';
import type { PainRecord, PainMarker } from '@shared/api.interface';
import BodyMapPicker from './BodyMapPicker';
import DateTimeField from './DateTimeField';

interface PainDialogProps {
  open: boolean;
  onClose: () => void;
  record?: PainRecord | null;
  onSuccess?: () => void;
}

const PainDialog: React.FC<PainDialogProps> = ({ open, onClose, record, onSuccess }) => {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [painMarkers, setPainMarkers] = useState<PainMarker[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (record) {
        setSymptoms(record.symptoms || []);
        setPainLevel(record.painLevel);
        setStartTime(formatLocalDateTime(new Date(record.startTime)));
        setEndTime(record.endTime ? formatLocalDateTime(new Date(record.endTime)) : '');
        setDescription(record.description || '');
        setNote(record.note || '');
        setPainMarkers(record.painMarkers || []);
      } else {
        setSymptoms([]);
        setPainLevel('mild');
        setStartTime(formatLocalDateTime(new Date()));
        setEndTime('');
        setDescription('');
        setNote('');
        setPainMarkers([]);
      }
    }
  }, [open, record]);

  const toggleSymptom = (sym: string) => {
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (symptoms.length === 0) {
      toast.error('请至少选择一个症状');
      return;
    }
    setSubmitting(true);
    try {
      const body: Parameters<typeof painApi.createPain>[0] = {
        symptoms,
        painLevel,
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        description: description || undefined,
        note: note || undefined,
        painMarkers: painMarkers.length > 0 ? painMarkers : undefined,
      };
      if (record) {
        await painApi.updatePain(record.id, body);
        toast.success('病痛记录已更新');
      } else {
        await painApi.createPain(body);
        toast.success('病痛记录已添加');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(record ? '更新失败' : '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const labelStyle = {
    color: '#2A483A',
    fontSize: '15px',
    fontWeight: 500,
  };

  const textareaStyle = {
    borderColor: '#D8E6DE',
    backgroundColor: '#ffffff',
    color: '#2A483A',
    borderRadius: '20px',
    fontSize: '15px',
    outline: 'none',
    fontWeight: 500,
    padding: '12px 20px',
    minHeight: '80px',
    resize: 'none' as const,
  };

  const textareaFocusProps = {
    onFocus: (e: React.FocusEvent<HTMLTextAreaElement>) => {
      e.currentTarget.style.backgroundColor = '#ffffff';
      e.currentTarget.style.borderColor = '#2A483A';
      e.currentTarget.style.boxShadow = 'none';
    },
    onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => {
      e.currentTarget.style.backgroundColor = textareaStyle.backgroundColor;
      e.currentTarget.style.borderColor = textareaStyle.borderColor;
      e.currentTarget.style.boxShadow = 'none';
    },
  };

  const dtfTriggerStyle: React.CSSProperties = {
    height: '44px',
    borderRadius: '999px',
    backgroundColor: '#ffffff',
    border: '1px solid #D8E6DE',
    color: '#2A483A',
    fontSize: '15px',
    fontWeight: 500,
    paddingLeft: '20px',
    paddingRight: '20px',
    justifyContent: 'center',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
          onClick={onClose}
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
            {record ? '编辑病痛记录' : '记录病痛'}
          </DialogTitle>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: '16px 24px 0 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
               overflowY: 'auto',
               overflowX: 'hidden',
               maxHeight: '60vh',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="font-sans-hei block" style={labelStyle}>
                症状
              </label>
              <div className="flex flex-wrap" style={{ gap: '8px' }}>
                {PAIN_SYMPTOMS.map((sym) => {
                  const selected = symptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className="font-sans-hei transition-all"
                      style={{
                         padding: '8px 18px',
                         borderRadius: '999px',
                          color: '#2A483A',
                          fontWeight: selected ? 600 : 500,
                          fontSize: '13px',
                          boxShadow: selected
                            ? '0 4px 12px rgba(42, 72, 58, 0.12), 0 2px 4px rgba(42, 72, 58, 0.06)'
                            : 'none',
                          backgroundColor: selected ? '#ffffff' : '#e8f3ec',
                          border: 'none',
                          transform: selected ? 'scale(1.03)' : 'scale(1)',
                       }}
                     >
                       {sym}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="font-sans-hei block" style={labelStyle}>
                疼痛程度
              </label>
              <div
                 className="flex rounded-full"
                 style={{ backgroundColor: '#F0F5F2', padding: '4px', border: '1px solid #D8E6DE' }}
               >
                 {PAIN_LEVELS.map((level) => {
                   const isSelected = painLevel === level.value;
                   const colorMap: Record<string, { bg: string; text: string; activeBg: string; activeText: string }> = {
                     mild: {
                       bg: 'transparent',
                       text: '#86c67c',
                       activeBg: '#ffffff',
                       activeText: '#5A9E4E',
                     },
                     moderate: {
                       bg: 'transparent',
                       text: '#f5a65b',
                       activeBg: '#ffffff',
                       activeText: '#D6823A',
                     },
                     severe: {
                       bg: 'transparent',
                       text: '#ef6b6b',
                       activeBg: '#ffffff',
                       activeText: '#D64848',
                     },
                   };
                   const c = colorMap[level.value];
                   return (
                     <button
                       key={level.value}
                       type="button"
                       onClick={() => setPainLevel(level.value)}
                       className="flex-1 min-w-0 rounded-full font-sans-hei transition-all text-center overflow-hidden text-ellipsis whitespace-nowrap"
                       style={{
                         padding: '10px 0',
                         backgroundColor: isSelected ? c.activeBg : c.bg,
                         color: isSelected ? c.activeText : c.text,
                         fontWeight: isSelected ? 600 : 500,
                         boxShadow: 'none',
                         border: 'none',
                         transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                         fontSize: '13px',
                       }}
                     >
                      {level.label}
                    </button>
                  );
                })}
              </div>
            </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="font-sans-hei block" style={{ ...labelStyle, fontSize: '14px' }}>
                  开始时间
                </label>
                <DateTimeField
                  value={startTime ? new Date(startTime).toISOString() : new Date().toISOString()}
                  onChange={(iso) => setStartTime(iso)}
                  label=""
                  className="w-full"
                  triggerStyle={{
                    ...dtfTriggerStyle,
                    fontSize: '13px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="font-sans-hei block" style={{ ...labelStyle, fontSize: '14px' }}>
                  结束时间
                </label>
                <DateTimeField
                  value={endTime ? new Date(endTime).toISOString() : new Date().toISOString()}
                  onChange={(iso) => setEndTime(iso)}
                  label=""
                  className="w-full"
                  triggerStyle={{
                    ...dtfTriggerStyle,
                    fontSize: '13px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="font-sans-hei block" style={labelStyle}>
                疼痛位置（可选）
              </label>
              <BodyMapPicker value={painMarkers} onChange={setPainMarkers} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="pain-desc" className="font-sans-hei block" style={labelStyle}>
                症状描述（可选）
              </label>
              <Textarea
                id="pain-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
placeholder="描述一下具体症状..."
                 className="font-sans-hei placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all text-left"
                style={textareaStyle}
                {...textareaFocusProps}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="pain-note" className="font-sans-hei block" style={labelStyle}>
                备注（可选）
              </label>
              <Textarea
                id="pain-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
placeholder="其他想记录的信息..."
                 className="font-sans-hei placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all text-left"
                 style={textareaStyle}
                 {...textareaFocusProps}
               />
             </div>
           </div>

           <DialogFooter className="px-6 pb-6 pt-8 flex flex-col items-center gap-4">
            <Button
              type="submit"
              disabled={submitting}
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
              {submitting ? '提交中...' : '确认记录'}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="font-sans-hei text-base transition-colors hover:opacity-80"
              style={{ color: '#8E9891', fontWeight: 500 }}
            >
              取消
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

function formatLocalDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default PainDialog;
