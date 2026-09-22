import { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@client/src/components/ui/dialog';
import { Input } from '@client/src/components/ui/input';
import { Switch } from '@client/src/components/ui/switch';
import { Button } from '@client/src/components/ui/button';
import { Label } from '@client/src/components/ui/label';
import { getAlertConfig, updateAlertConfig } from '@client/src/api/stats';
import type { AlertConfig } from '@shared/api.interface';

interface AlertConfigDialogProps {
  onSaved?: () => void;
}

interface AlertTypeMeta {
  type: string;
  label: string;
  description: string;
  unit: string;
}

const ALERT_TYPES: AlertTypeMeta[] = [
  {
    type: 'sleep_insufficient',
    label: '睡眠不足预警',
    description: '每日睡眠时长低于阈值时提醒',
    unit: '小时',
  },
  {
    type: 'water_insufficient',
    label: '喝水不足预警',
    description: '每日喝水杯数低于阈值时提醒',
    unit: '杯',
  },
  {
    type: 'pain_high_frequency',
    label: '疼痛高频预警',
    description: '每周疼痛发作次数超过阈值时提醒',
    unit: '次/周',
  },
];

const AlertConfigDialog: React.FC<AlertConfigDialogProps> = ({ onSaved }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<Record<string, AlertConfig>>({});
  const [localConfigs, setLocalConfigs] = useState<
    Record<string, { threshold: number; isEnabled: boolean }>
  >({});

  useEffect(() => {
    if (!open) return;
    const fetchConfig = async (): Promise<void> => {
      try {
        setLoading(true);
        const list = await getAlertConfig();
        const map: Record<string, AlertConfig> = {};
        const local: Record<string, { threshold: number; isEnabled: boolean }> =
          {};
        for (const item of list) {
          map[item.alertType] = item;
          local[item.alertType] = {
            threshold: item.threshold,
            isEnabled: item.isEnabled,
          };
        }
        setConfigs(map);
        setLocalConfigs(local);
      } catch (err) {
        logger.error('[stats] getAlertConfig failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [open]);

  const handleThresholdChange = (type: string, val: string): void => {
    const num = Number(val);
    if (Number.isNaN(num)) return;
    setLocalConfigs((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        threshold: num,
      },
    }));
  };

  const handleToggle = (type: string, checked: boolean): void => {
    setLocalConfigs((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        isEnabled: checked,
      },
    }));
  };

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);
      for (const meta of ALERT_TYPES) {
        const local = localConfigs[meta.type];
        const remote = configs[meta.type];
        if (!local || !remote) continue;
        if (
          local.threshold !== remote.threshold ||
          local.isEnabled !== remote.isEnabled
        ) {
          await updateAlertConfig(meta.type, {
            threshold: local.threshold,
            isEnabled: local.isEnabled,
          });
        }
      }
      onSaved?.();
      setOpen(false);
    } catch (err) {
      logger.error('[stats] updateAlertConfig failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            预警阈值设置
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            加载中...
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {ALERT_TYPES.map((meta) => {
              const cfg = localConfigs[meta.type];
              return (
                <div
                  key={meta.type}
                  className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {meta.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {meta.description}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Label
                        htmlFor={`threshold-${meta.type}`}
                        className="text-xs text-muted-foreground shrink-0"
                      >
                        阈值
                      </Label>
                      <Input
                        id={`threshold-${meta.type}`}
                        type="number"
                        value={cfg?.threshold ?? 0}
                        onChange={(e) =>
                          handleThresholdChange(meta.type, e.target.value)
                        }
                        className="h-8 w-24 rounded-lg text-sm"
                      />
                      <span className="text-xs text-muted-foreground">
                        {meta.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 pt-0.5">
                    <Switch
                      checked={cfg?.isEnabled ?? false}
                      onCheckedChange={(checked) =>
                        handleToggle(meta.type, checked)
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {cfg?.isEnabled ? '已启用' : '已关闭'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <DialogClose asChild>
            <Button variant="ghost" size="sm" className="rounded-full">
              取消
            </Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            size="sm"
            className="rounded-full"
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlertConfigDialog;
