import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportRecords } from '@/api/data';

const TYPE_OPTIONS: { value: string; label: string }[] = [
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

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  defaultType = '',
  defaultStartDate = '',
  defaultEndDate = '',
}) => {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [type, setType] = useState<string>(defaultType);
  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [exporting, setExporting] = useState<boolean>(false);

  const triggerDownload = (content: string, filename: string, mime: string): void => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (): Promise<void> => {
    if (startDate && endDate && startDate > endDate) {
      toast.error('开始日期不能晚于结束日期');
      return;
    }

    setExporting(true);
    try {
      const params: {
        type?: string;
        startDate?: string;
        endDate?: string;
        format?: string;
      } = { format };
      if (type) params.type = type;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await exportRecords(params);
      const timestamp = new Date().toISOString().slice(0, 10);

      if (format === 'json') {
        const jsonStr = JSON.stringify(result, null, 2);
        triggerDownload(jsonStr, `health-records-${timestamp}.json`, 'application/json');
      } else {
        const csvStr = typeof result === 'string' ? result : '';
        triggerDownload(csvStr, `health-records-${timestamp}.csv`, 'text/csv;charset=utf-8');
      }

      toast.success('导出成功');
      onOpenChange(false);
    } catch (err) {
      logger.error('export failed', err instanceof Error ? err.message : String(err));
      toast.error('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">导出数据</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* 格式选择 */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">导出格式</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  format === 'json'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <FileJson
                  className={`w-6 h-6 ${format === 'json' ? 'text-primary' : 'text-muted-foreground'}`}
                  strokeWidth={1.8}
                />
                <div className="text-left">
                  <div className={`text-sm font-medium ${format === 'json' ? 'text-primary' : 'text-foreground'}`}>
                    JSON
                  </div>
                  <div className="text-xs text-muted-foreground">结构化数据</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  format === 'csv'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <FileSpreadsheet
                  className={`w-6 h-6 ${format === 'csv' ? 'text-primary' : 'text-muted-foreground'}`}
                  strokeWidth={1.8}
                />
                <div className="text-left">
                  <div className={`text-sm font-medium ${format === 'csv' ? 'text-primary' : 'text-foreground'}`}>
                    CSV
                  </div>
                  <div className="text-xs text-muted-foreground">表格格式</div>
                </div>
              </button>
            </div>
          </div>

          {/* 时间范围 */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">时间范围</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">开始日期</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">结束日期</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
            </div>
          </div>

          {/* 类型选择 */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">记录类型</label>
            <Select value={type} onValueChange={(val: string) => setType(val)}>
              <SelectTrigger className="w-full rounded-xl h-10">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            取消
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-full bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4" strokeWidth={1.8} />
            {exporting ? '导出中...' : '开始导出'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
