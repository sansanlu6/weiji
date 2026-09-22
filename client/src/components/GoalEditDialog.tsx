import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { goalsApi } from '@client/src/api';

interface GoalEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalType: string;
  goalTitle: string;
  unit: string;
  currentValue: number;
  period: string;
  onSaved: () => void;
}

const GoalEditDialog: React.FC<GoalEditDialogProps> = ({
  open,
  onOpenChange,
  goalType,
  goalTitle,
  unit,
  currentValue,
  period,
  onSaved,
}) => {
  const [value, setValue] = useState<string>(String(currentValue));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(String(currentValue));
    }
  }, [open, currentValue]);

  const handleSave = async (): Promise<void> => {
    const num = Number(value);
    if (!num || num <= 0) {
      toast.error('请输入有效的目标值');
      return;
    }
    try {
      setSaving(true);
      await goalsApi.updateGoal(goalType, num, period);
      toast.success('目标已更新');
      onOpenChange(false);
      onSaved();
    } catch (err) {
      logger.error('更新目标失败', err as Error);
      toast.error('更新失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const hintText = goalType === 'water'
    ? '设定你的喝水目标，坚持就能达成'
    : goalType === 'sleep'
    ? '设定你的睡眠目标，坚持就能达成'
    : '设定你的运动目标，坚持就能达成';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay
        style={{
          backgroundColor: 'rgba(30, 45, 38, 0.22)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />
      <DialogContent
        className="max-w-[90%] sm:max-w-[360px] p-0 rounded-[24px] overflow-hidden"
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
            编辑{goalTitle}
          </DialogTitle>
        </div>

        <div style={{ padding: '16px 24px 0 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label
              className="font-sans-hei block text-base font-medium"
              style={{ color: '#2A483A' }}
            >
              目标值
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  type="number"
                  min={1}
                  className="w-full font-sans-hei text-center focus-visible:ring-0 focus-visible:ring-offset-0 transition-all border-transparent"
                  style={{
                    height: '48px',
                    backgroundColor: '#F2F7F4',
                    color: '#2A483A',
                    borderRadius: '999px',
                    fontSize: '18px',
                    fontWeight: 600,
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    boxShadow: 'inset 0 1px 3px rgba(42, 72, 58, 0.04)',
                  }}
                />
              </div>
              <span
                className="font-sans-hei whitespace-nowrap text-base"
                style={{ color: '#2A483A', fontWeight: 500 }}
              >
                {unit}
              </span>
            </div>
            <p
              className="text-sm font-sans-hei"
              style={{ color: '#8E9891', marginTop: '2px', textAlign: 'left' }}
            >
              {hintText}
            </p>
          </div>
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

export default GoalEditDialog;
