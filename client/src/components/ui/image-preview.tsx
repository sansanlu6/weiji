import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogTitle,
} from '@client/src/components/ui/dialog';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { resolveImageUrl } from '@client/src/utils/image-url';

interface ImagePreviewProps {
  open: boolean;
  src: string;
  alt?: string;
  onClose: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ open, src, alt = '图片', onClose }) => {
  const resolvedSrc = resolveImageUrl(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const [pinchStartDist, setPinchStartDist] = useState<number | null>(null);
  const [pinchStartScale, setPinchStartScale] = useState(1);

  useEffect(() => {
    if (open) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  }, [open, src]);

  const handleZoom = useCallback((delta: number, cx?: number, cy?: number) => {
    setScale((prev) => {
      const next = Math.max(1, Math.min(5, prev + delta));
      if (cx !== undefined && cy !== undefined && imgRef.current) {
        const rect = imgRef.current.getBoundingClientRect();
        const imgCx = rect.left + rect.width / 2;
        const imgCy = rect.top + rect.height / 2;
        const ratio = next / prev;
        setTranslate((t) => ({
          x: t.x - (cx - imgCx) * (ratio - 1),
          y: t.y - (cy - imgCy) * (ratio - 1),
        }));
      }
      return next;
    });
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    handleZoom(delta, e.clientX, e.clientY);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragStart({ x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragStart) return;
    setTranslate({
      x: dragStart.tx + (e.clientX - dragStart.x),
      y: dragStart.ty + (e.clientY - dragStart.y),
    });
  };

  const onMouseUp = () => setDragStart(null);

  const getTouchDist = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setPinchStartDist(getTouchDist(e.touches));
      setPinchStartScale(scale);
      return;
    }
    if (scale > 1 && e.touches.length === 1) {
      setDragStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        tx: translate.x,
        ty: translate.y,
      });
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist) {
      const dist = getTouchDist(e.touches);
      const ratio = dist / pinchStartDist;
      const next = Math.max(1, Math.min(5, pinchStartScale * ratio));
      setScale(next);
      return;
    }
    if (dragStart && e.touches.length === 1) {
      setTranslate({
        x: dragStart.tx + (e.touches[0].clientX - dragStart.x),
        y: dragStart.ty + (e.touches[0].clientY - dragStart.y),
      });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) setPinchStartDist(null);
    if (e.touches.length === 0) setDragStart(null);
  };

  const handleImgLoad = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const handleImgError = () => {
    logger.error('[ImagePreview] 图片加载失败', { src });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] !p-0 !rounded-2xl bg-transparent border-0 shadow-none overflow-hidden" showCloseButton={false}>
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div
          className="relative flex items-center justify-center w-full h-[85vh] bg-black/90 select-none"
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ cursor: scale > 1 ? (dragStart ? 'grabbing' : 'grab') : 'zoom-in' }}
        >
          <img
            ref={imgRef}
            src={resolvedSrc}
            alt={alt}
            onLoad={handleImgLoad}
            onError={handleImgError}
            draggable={false}
            className="max-w-full max-h-full object-contain transition-transform"
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transition: dragStart || pinchStartDist ? 'none' : 'transform 0.2s ease-out',
            }}
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-sm"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
            <button
              type="button"
              onClick={() => handleZoom(-0.5)}
              disabled={scale <= 1}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-40"
              aria-label="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-white/80 text-xs tabular-nums min-w-[48px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.5)}
              disabled={scale >= 5}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-40"
              aria-label="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreview;
