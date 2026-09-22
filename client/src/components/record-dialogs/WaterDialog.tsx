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
import { Input } from '@client/src/components/ui/input';
import { waterApi } from '@client/src/api';
import type { WaterRecord } from '@shared/api.interface';
import DateTimeField from './DateTimeField';

interface WaterDialogProps {
  open: boolean;
  onClose: () => void;
  record?: WaterRecord | null;
  onSuccess?: () => void;
}

const WaterDialog: React.FC<WaterDialogProps> = ({ open, onClose, record, onSuccess }) => {
  const [drinkTime, setDrinkTime] = useState<string>('');
  const [amountMl, setAmountMl] = useState<number>(250);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (record) {
        const dt = new Date(record.drinkTime);
        setDrinkTime(formatLocalDateTime(dt));
        setAmountMl(record.amountMl);
      } else {
        setDrinkTime(formatLocalDateTime(new Date()));
        setAmountMl(250);
      }
    }
  }, [open, record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = { drinkTime: new Date(drinkTime).toISOString(), amountMl: Number(amountMl) };
      if (record) {
        await waterApi.updateWater(record.id, body);
        toast.success('喝水记录已更新');
      } else {
        await waterApi.createWater(body);
        toast.success('喝水记录已添加');
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

  const inputStyle = {
    borderColor: '#D8E6DE',
    backgroundColor: '#ffffff',
    color: '#2A483A',
    borderRadius: '999px',
    height: '44px',
    fontSize: '15px',
    outline: 'none',
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
            {record ? '编辑喝水记录' : '记录喝水'}
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
                value={drinkTime ? new Date(drinkTime).toISOString() : new Date().toISOString()}
                onChange={(iso) => setDrinkTime(iso)}
                label=""
                className="w-full"
                triggerStyle={dtfTriggerStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label htmlFor="water-amount" className="font-sans-hei block" style={labelStyle}>
                容量 (ml)
              </label>
              <Input
                id="water-amount"
                type="number"
                min={50}
                step={50}
                value={amountMl}
                onChange={(e) => setAmountMl(Number(e.target.value))}
                className="font-sans-hei placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all text-left"
                style={{
                  ...inputStyle,
                  paddingLeft: '20px',
                  paddingRight: '20px',
                }}
                {...inputFocusProps}
                required
              />
              <div
                 className="flex rounded-full"
                 style={{ backgroundColor: '#e5f0e9', padding: '4px', border: '1px solid #d1e2d6' }}
               >
                 {[150, 250, 350, 500].map((ml) => {
                   const selected = amountMl === ml;
                   return (
                     <button
                       key={ml}
                       type="button"
                       onClick={() => setAmountMl(ml)}
                       className="flex-1 rounded-full font-sans-hei transition-all text-center"
                       style={{
                         padding: '10px 0',
                          backgroundColor: selected ? '#ffffff' : '#e8f3ec',
                          color: '#2A483A',
                          fontWeight: selected ? 600 : 500,
                          boxShadow: selected
                            ? '0 4px 12px rgba(42, 72, 58, 0.12), 0 2px 4px rgba(42, 72, 58, 0.06)'
                            : 'none',
                          border: 'none',
                         transform: selected ? 'scale(1.03)' : 'scale(1)',
                         fontSize: '13px',
                       }}
                     >
                      {ml}ml
                    </button>
                  );
                })}
              </div>
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

export default WaterDialog;
