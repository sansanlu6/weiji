import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Textarea } from '@client/src/components/ui/textarea';
import { getDataloom } from '@lark-apaas/client-toolkit/dataloom';
import { getDefaultBucketId } from '@lark-apaas/client-toolkit/tools/storage';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { dietApi } from '@client/src/api';
import { DIET_MEAL_TYPES, DIET_TAGS } from '@client/src/utils/record-constants';
import type { DietRecord } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';
import ImageEditor from '@client/src/components/ui/image-editor';
import ImagePreview from '@client/src/components/ui/image-preview';
import DateTimeField from './DateTimeField';
import { useImageDedup } from '@client/src/hooks/useImageDedup';

interface DietDialogProps {
  open: boolean;
  onClose: () => void;
  record?: DietRecord | null;
  onSuccess?: () => void;
}

const DietDialog: React.FC<DietDialogProps> = ({ open, onClose, record, onSuccess }) => {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'supper' | 'snack'>('lunch');
  const [eatTime, setEatTime] = useState<string>(new Date().toISOString());
  const [foodDescription, setFoodDescription] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState<string>('');
  const [foodImageUrl, setFoodImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { checkAndReuse, registerUploadedImage } = useImageDedup();

  useEffect(() => {
    if (open) {
      if (record) {
        setMealType(record.mealType);
        const et = record.eatTime || record.createdAt;
        setEatTime(et);
        setFoodDescription(record.foodDescription || '');
        setTags(record.tags || []);
        setNote(record.note || '');
        setFoodImageUrl(record.foodImageUrl || '');
      } else {
        const now = new Date();
        const hour = now.getHours();
        let defaultMeal: 'breakfast' | 'lunch' | 'dinner' | 'supper' | 'snack' = 'lunch';
        if (hour < 10) defaultMeal = 'breakfast';
        else if (hour < 14) defaultMeal = 'lunch';
        else if (hour < 20) defaultMeal = 'dinner';
        else if (hour < 23) defaultMeal = 'supper';
        else defaultMeal = 'snack';
        setMealType(defaultMeal);
        setEatTime(now.toISOString());
        setFoodDescription('');
        setTags([]);
        setNote('');
        setFoodImageUrl('');
      }
    }
  }, [open, record]);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const uploadImageFile = async (file: File | Blob, fileName: string): Promise<void> => {
    const existingUrl = await checkAndReuse(file);
    if (existingUrl) {
      setFoodImageUrl(existingUrl);
      toast.success('图片上传成功');
      return;
    }

    const dataloom = await getDataloom();
    const uploadFile = file instanceof File
      ? file
      : new File([file], fileName, { type: 'image/jpeg' });
    const { data, error } = await dataloom
      .storage
      .from(getDefaultBucketId())
      .uploadFile(uploadFile);
    if (error || !data) {
      const err = error as { message?: string; error_msg?: string } | null;
      throw new Error(err?.message || err?.error_msg || '上传失败');
    }
    setFoodImageUrl(data.download_url);
    registerUploadedImage(file, fileName, data.download_url);
    toast.success('图片上传成功');
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    if (!file.size || file.size <= 0) {
      toast.error('请选择有效的图片文件');
      return;
    }
    const isValidImage = file.type?.startsWith('image/')
      || /\.(jpg|jpeg|png|gif|webp|bmp|heic|heif)$/i.test(file.name || '');
    if (!isValidImage) {
      toast.error('请选择图片文件');
      return;
    }
    setEditorFile(file);
    setEditorOpen(true);
  };

  const handleEditorConfirm = async (blob: Blob, fileName: string) => {
    setEditorOpen(false);
    setUploading(true);
    try {
      await uploadImageFile(blob, fileName);
    } catch (err) {
      logger.error('饮食图片上传失败', err as Error);
      toast.error('图片上传失败');
    } finally {
      setUploading(false);
      setEditorFile(null);
    }
  };

  const handleEditorCancel = () => {
    setEditorOpen(false);
    setEditorFile(null);
  };

  const handleRemoveImage = (): void => {
    setFoodImageUrl('');
  };

  const handlePreviewOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (foodImageUrl) setPreviewOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodDescription.trim()) {
      toast.error('请填写食物描述');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        mealType,
        eatTime,
        foodDescription,
        foodImageUrl: foodImageUrl || undefined,
        tags: tags.length > 0 ? tags : undefined,
        note: note || undefined,
      };
      if (record) {
        await dietApi.updateDiet(record.id, body);
        toast.success('饮食记录已更新');
      } else {
        await dietApi.createDiet(body);
        toast.success('饮食记录已添加');
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
    <>
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
              {record ? '编辑饮食记录' : '记录饮食'}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="font-sans-hei block" style={labelStyle}>
                  餐次
                </label>
                <div className="flex flex-wrap" style={{ gap: '8px' }}>
                  {DIET_MEAL_TYPES.map((mt) => {
                    const selected = mealType === mt.value;
                    return (
                      <button
                        key={mt.value}
                        type="button"
                        onClick={() => setMealType(mt.value)}
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
                         {mt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="font-sans-hei block" style={labelStyle}>
                  日期与时间
                </label>
                <DateTimeField
                  value={eatTime}
                  onChange={setEatTime}
                  label=""
                  className="w-full"
                  triggerStyle={dtfTriggerStyle}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="diet-food" className="font-sans-hei block" style={labelStyle}>
                  食物描述
                </label>
                <Textarea
                  id="diet-food"
                  value={foodDescription}
                  onChange={(e) => setFoodDescription(e.target.value)}
placeholder="例如：米饭、炒青菜、番茄炒蛋..."
                   className="font-sans-hei placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all text-left"
                  style={textareaStyle}
                  {...textareaFocusProps}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="font-sans-hei block" style={labelStyle}>
                  食物图片（可选）
                </label>
                {foodImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: '#dcebe1' }}>
                    <Image
                      src={foodImageUrl}
                      alt="食物图片"
                      className="w-full h-48 object-cover cursor-zoom-in"
                      onClick={handlePreviewOpen}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                      aria-label="移除图片"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full rounded-xl border-dashed bg-transparent flex flex-col items-center justify-center font-sans-hei transition-colors disabled:opacity-50 cursor-pointer"
                    style={{
                      height: '120px',
                      gap: '8px',
                      border: '1px dashed #dcebe1',
                      color: '#8c9e94',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2A483A';
                      e.currentTarget.style.color = '#2A483A';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#dcebe1';
                      e.currentTarget.style.color = '#8c9e94';
                    }}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span style={{ fontSize: '14px' }}>上传中...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6" />
                        <span style={{ fontSize: '14px' }}>点击上传食物图片</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="font-sans-hei block" style={labelStyle}>
                  标签（可选）
                </label>
                <div className="flex flex-wrap" style={{ gap: '8px' }}>
                  {DIET_TAGS.map((tag) => {
                    const selected = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
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
                         {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="diet-note" className="font-sans-hei block" style={labelStyle}>
                  备注（可选）
                </label>
                <Textarea
                  id="diet-note"
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

      <ImageEditor
        open={editorOpen}
        file={editorFile}
        onConfirm={handleEditorConfirm}
        onCancel={handleEditorCancel}
      />

       <ImagePreview
         open={previewOpen}
         src={foodImageUrl}
         alt="食物图片"
         onClose={() => setPreviewOpen(false)}
      />
    </>
  );
};

export default DietDialog;
