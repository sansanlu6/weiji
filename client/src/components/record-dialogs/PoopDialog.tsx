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
import ToiletIcon from '@client/src/components/icons/ToiletIcon';
import { poopApi } from '@client/src/api';
import { STOOL_TYPES } from '@client/src/utils/record-constants';
import type { PoopRecord } from '@shared/api.interface';
import DateTimeField from './DateTimeField';

interface PoopDialogProps {
  open: boolean;
  onClose: () => void;
  record?: PoopRecord | null;
  onSuccess?: () => void;
}

const PoopDialog: React.FC<PoopDialogProps> = ({ open, onClose, record, onSuccess }) => {
  const [poopTime, setPoopTime] = useState<string>('');
  const [stoolType, setStoolType] = useState<string>('正常');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (record) {
        setPoopTime(formatLocalDateTime(new Date(record.poopTime)));
        setStoolType(record.stoolType || '正常');
        setNote(record.note || '');
      } else {
        setPoopTime(formatLocalDateTime(new Date()));
        setStoolType('正常');
        setNote('');
      }
    }
  }, [open, record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        poopTime: new Date(poopTime).toISOString(),
        stoolType,
        note: note || undefined,
      };
      if (record) {
        await poopApi.updatePoop(record.id, body);
        toast.success('排便记录已更新');
      } else {
        await poopApi.createPoop(body);
        toast.success('排便记录已添加');
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
            {record ? '编辑排便记录' : '记录排便'}
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
              maxHeight: '60vh',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="font-sans-hei block" style={labelStyle}>
                时间
              </label>
              <DateTimeField
                value={poopTime ? new Date(poopTime).toISOString() : new Date().toISOString()}
                onChange={(iso) => setPoopTime(iso)}
                label=""
                className="w-full"
                triggerStyle={dtfTriggerStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="font-sans-hei block" style={labelStyle}>
                性状
              </label>
              <div className="flex flex-wrap" style={{ gap: '8px' }}>
                {STOOL_TYPES.map((type) => {
                  const selected = stoolType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setStoolType(type)}
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
                         backgroundColor: selected ? '#ffffff' : '#e8f3ec', border: 'none',
                         transform: selected ? 'scale(1.03)' : 'scale(1)',
                       }}
                     >
                       {type}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="poop-note" className="font-sans-hei block" style={labelStyle}>
                备注（可选）
              </label>
              <Textarea
                id="poop-note"
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

export default PoopDialog;
