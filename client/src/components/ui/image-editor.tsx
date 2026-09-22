import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import {
  RotateCcw, RotateCw, Crop, Check, X, Square, RectangleHorizontal, Slice,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';

interface ImageEditorProps {
  open: boolean;
  file: File | null;
  initialAspect?: AspectRatio;
  onConfirm: (blob: Blob, fileName: string) => void;
  onCancel: () => void;
}

type AspectRatio = 'free' | '1:1' | '4:3' | '3:4';

const ImageEditor: React.FC<ImageEditorProps> = ({ open, file, initialAspect, onConfirm, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [rotation, setRotation] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
   const [aspect, setAspect] = useState<AspectRatio>(initialAspect ?? 'free');
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });
  const hasModifiedRef = useRef(false);

   const dragRef = useRef<{
     mode: 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'resize-t' | 'resize-b' | 'resize-l' | 'resize-r' | 'pan' | null;
    startX: number;
    startY: number;
    startCrop: typeof crop;
  }>({ mode: null, startX: 0, startY: 0, startCrop: { x: 0, y: 0, w: 0, h: 0 } });

  useEffect(() => {
     if (!open || !file) {
       setRotation(0);
       setImgLoaded(false);
       setAspect(initialAspect ?? 'free');
       hasModifiedRef.current = false;
       return;
     }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.onerror = () => {
      logger.error('[ImageEditor] 图片加载失败');
    };
    img.src = url;
    return () => {
      URL.revokeObjectURL(url);
      imgRef.current = null;
    };
  }, [open, file]);

  const getCanvasSize = useCallback((): { w: number; h: number } => {
    const img = imgRef.current;
    if (!img) return { w: 300, h: 300 };
    const isRot90 = rotation % 180 !== 0;
    const w = isRot90 ? img.height : img.width;
    const h = isRot90 ? img.width : img.height;
    const maxSize = 560;
    const scale = Math.min(1, maxSize / Math.max(w, h));
    return { w: w * scale, h: h * scale };
  }, [rotation]);

  const initCrop = useCallback(() => {
    const { w, h } = getCanvasSize();
    const size = Math.min(w, h) * 0.7;
    setCrop({
      x: (w - size) / 2,
      y: (h - size) / 2,
      w: size,
      h: size,
    });
  }, [getCanvasSize]);

  useEffect(() => {
    if (imgLoaded) initCrop();
  }, [imgLoaded, rotation, initCrop]);

  const applyAspect = (ratio: AspectRatio) => {
    hasModifiedRef.current = true;
    setAspect(ratio);
    if (ratio === 'free') return;
    const { w: canvasW, h: canvasH } = getCanvasSize();
    let r = 1;
    if (ratio === '1:1') r = 1;
    else if (ratio === '4:3') r = 4 / 3;
    else if (ratio === '3:4') r = 3 / 4;
    let newW = Math.min(canvasW * 0.7, canvasH * 0.7 * r);
    let newH = newW / r;
    if (newH > canvasH * 0.8) {
      newH = canvasH * 0.8;
      newW = newH * r;
    }
    setCrop({
      x: (canvasW - newW) / 2,
      y: (canvasH - newH) / 2,
      w: newW,
      h: newH,
    });
  };

  const handleRotate = (direction: 'left' | 'right') => {
    hasModifiedRef.current = true;
    setRotation((r) => (r + (direction === 'right' ? 90 : -90) + 360) % 360);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded) return;
    const { w, h } = getCanvasSize();
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = imgRef.current!;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    const isRot90 = rotation % 180 !== 0;
    const drawW = isRot90 ? h : w;
    const drawH = isRot90 ? w : h;
    const s = drawW / img.width;
    ctx.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s);
    ctx.restore();

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, w, crop.y);
    ctx.fillRect(0, crop.y + crop.h, w, h - crop.y - crop.h);
    ctx.fillRect(0, crop.y, crop.x, crop.h);
    ctx.fillRect(crop.x + crop.w, crop.y, w - crop.x - crop.w, crop.h);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(crop.x + 0.5, crop.y + 0.5, crop.w - 1, crop.h - 1);

     const handleSize = 10;
     ctx.fillStyle = '#ffffff';
     const handles: Array<[number, number]> = [
       [crop.x, crop.y],
       [crop.x + crop.w / 2, crop.y],
       [crop.x + crop.w, crop.y],
       [crop.x + crop.w, crop.y + crop.h / 2],
       [crop.x + crop.w, crop.y + crop.h],
       [crop.x + crop.w / 2, crop.y + crop.h],
       [crop.x, crop.y + crop.h],
       [crop.x, crop.y + crop.h / 2],
     ];
     handles.forEach(([hx, hy]) => {
       ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
     });
  }, [imgLoaded, crop, rotation, getCanvasSize]);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const hitTest = (x: number, y: number): string => {
    const handle = 16;
    const edgeHandle = 14;
    const { x: cx, y: cy, w, h } = crop;
    const cornerHandles: Array<[string, number, number]> = [
      ['resize-tl', cx, cy],
      ['resize-tr', cx + w, cy],
      ['resize-bl', cx, cy + h],
      ['resize-br', cx + w, cy + h],
    ];
    for (const [mode, hx, hy] of cornerHandles) {
      if (Math.abs(x - hx) < handle && Math.abs(y - hy) < handle) return mode;
    }
    const edgeHandles: Array<[string, number, number]> = [
      ['resize-t', cx + w / 2, cy],
      ['resize-r', cx + w, cy + h / 2],
      ['resize-b', cx + w / 2, cy + h],
      ['resize-l', cx, cy + h / 2],
    ];
    for (const [mode, hx, hy] of edgeHandles) {
      if (Math.abs(x - hx) < edgeHandle && Math.abs(y - hy) < edgeHandle) return mode;
    }
    if (x >= cx && x <= cx + w && y >= cy && y <= cy + h) return 'move';
    return 'pan';
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getEventPos(e);
    const mode = hitTest(x, y);
    if (mode === 'pan') return;
    hasModifiedRef.current = true;
    dragRef.current = { mode: mode as any, startX: x, startY: y, startCrop: { ...crop } };

    if ('touches' in e) {
      document.addEventListener('touchmove', onDocTouchMove, { passive: false });
      document.addEventListener('touchend', onDocTouchEnd, { passive: false });
    } else {
      document.addEventListener('mousemove', onDocMouseMove);
      document.addEventListener('mouseup', onDocMouseUp);
    }
  };

  const getDocEventPos = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const getAspectRatio = (): number | null => {
    if (aspect === '1:1') return 1;
    if (aspect === '4:3') return 4 / 3;
    if (aspect === '3:4') return 3 / 4;
    return null;
  };

  const updateCropFromPos = (x: number, y: number) => {
    const dx = x - dragRef.current.startX;
    const dy = y - dragRef.current.startY;
    const { startCrop, mode } = dragRef.current;
    const { w: canvasW, h: canvasH } = getCanvasSize();
    const minSize = 30;
    const ratio = getAspectRatio();

    if (mode === 'move') {
      const newX = Math.max(0, Math.min(canvasW - startCrop.w, startCrop.x + dx));
      const newY = Math.max(0, Math.min(canvasH - startCrop.h, startCrop.y + dy));
      setCrop({ ...startCrop, x: newX, y: newY });
      return;
    }

    let nx = startCrop.x;
    let ny = startCrop.y;
    let nw = startCrop.w;
    let nh = startCrop.h;

    const clampToBounds = (anchorX: 'left' | 'right' | 'center', anchorY: 'top' | 'bottom' | 'middle') => {
      if (ratio) {
        if (nw / nh > ratio) nw = nh * ratio;
        else nh = nw / ratio;
      }

      if (anchorX === 'right') nx = startCrop.x + startCrop.w - nw;
      else if (anchorX === 'center') nx = startCrop.x + startCrop.w / 2 - nw / 2;
      if (anchorY === 'bottom') ny = startCrop.y + startCrop.h - nh;
      else if (anchorY === 'middle') ny = startCrop.y + startCrop.h / 2 - nh / 2;

      if (ratio) {
        let scale = 1;
        if (nx < 0) {
          const availableW = anchorX === 'left' ? canvasW : startCrop.x + startCrop.w;
          if (anchorX === 'center') {
            scale = Math.min(scale, (nw + 2 * nx) / nw);
          } else {
            scale = Math.min(scale, availableW / nw);
          }
        }
        if (nx + nw > canvasW) {
          const overflow = nx + nw - canvasW;
          if (anchorX === 'left') {
            scale = Math.min(scale, (nw - overflow) / nw);
          } else if (anchorX === 'right') {
            const availableW = canvasW - (startCrop.x + startCrop.w - nw);
            scale = Math.min(scale, availableW / nw);
          } else {
            scale = Math.min(scale, (nw - overflow * 2) / nw);
          }
        }
        if (ny < 0) {
          const availableH = anchorY === 'top' ? canvasH : startCrop.y + startCrop.h;
          if (anchorY === 'middle') {
            scale = Math.min(scale, (nh + 2 * ny) / nh);
          } else {
            scale = Math.min(scale, availableH / nh);
          }
        }
        if (ny + nh > canvasH) {
          const overflow = ny + nh - canvasH;
          if (anchorY === 'top') {
            scale = Math.min(scale, (nh - overflow) / nh);
          } else if (anchorY === 'bottom') {
            const availableH = canvasH - (startCrop.y + startCrop.h - nh);
            scale = Math.min(scale, availableH / nh);
          } else {
            scale = Math.min(scale, (nh - overflow * 2) / nh);
          }
        }
        if (scale < 1) {
          nw = nw * scale;
          nh = nh * scale;
          if (anchorX === 'left') nx = startCrop.x;
          else if (anchorX === 'right') nx = startCrop.x + startCrop.w - nw;
          else nx = startCrop.x + startCrop.w / 2 - nw / 2;
          if (anchorY === 'top') ny = startCrop.y;
          else if (anchorY === 'bottom') ny = startCrop.y + startCrop.h - nh;
          else ny = startCrop.y + startCrop.h / 2 - nh / 2;
        }
      } else {
        if (nx < 0) {
          if (anchorX === 'left') {
            nw += nx;
          } else if (anchorX === 'right') {
            nw = startCrop.x + startCrop.w;
          } else {
            const extra = -nx;
            nw -= extra * 2;
          }
          nx = 0;
        }
        if (nx + nw > canvasW) {
          const overflow = nx + nw - canvasW;
          if (anchorX === 'left') {
            nw -= overflow;
          } else if (anchorX === 'right') {
            nw = canvasW - (startCrop.x + startCrop.w - nw);
            nx = canvasW - nw;
          } else {
            nw -= overflow * 2;
            nx += overflow;
          }
        }
        if (ny < 0) {
          if (anchorY === 'top') {
            nh += ny;
          } else if (anchorY === 'bottom') {
            nh = startCrop.y + startCrop.h;
          } else {
            const extra = -ny;
            nh -= extra * 2;
          }
          ny = 0;
        }
        if (ny + nh > canvasH) {
          const overflow = ny + nh - canvasH;
          if (anchorY === 'top') {
            nh -= overflow;
          } else if (anchorY === 'bottom') {
            nh = canvasH - (startCrop.y + startCrop.h - nh);
            ny = canvasH - nh;
          } else {
            nh -= overflow * 2;
            ny += overflow;
          }
        }
      }

      if (nw < minSize) {
        const delta = minSize - nw;
        nw = minSize;
        if (ratio) {
          nh = nw / ratio;
          if (anchorY === 'bottom') ny = startCrop.y + startCrop.h - nh;
          else if (anchorY === 'middle') ny = startCrop.y + startCrop.h / 2 - nh / 2;
        }
        if (anchorX === 'right') nx = startCrop.x + startCrop.w - nw;
        else if (anchorX === 'center') nx = startCrop.x + startCrop.w / 2 - nw / 2;
      }
      if (nh < minSize) {
        const delta = minSize - nh;
        nh = minSize;
        if (ratio) {
          nw = nh * ratio;
          if (anchorX === 'right') nx = startCrop.x + startCrop.w - nw;
          else if (anchorX === 'center') nx = startCrop.x + startCrop.w / 2 - nw / 2;
        }
        if (anchorY === 'bottom') ny = startCrop.y + startCrop.h - nh;
        else if (anchorY === 'middle') ny = startCrop.y + startCrop.h / 2 - nh / 2;
      }
    };

    switch (mode) {
      case 'resize-br': {
        nw = startCrop.w + dx;
        nh = startCrop.h + dy;
        clampToBounds('left', 'top');
        break;
      }
      case 'resize-tr': {
        nw = startCrop.w + dx;
        nh = startCrop.h - dy;
        ny = startCrop.y + dy;
        clampToBounds('left', 'bottom');
        break;
      }
      case 'resize-bl': {
        nw = startCrop.w - dx;
        nx = startCrop.x + dx;
        nh = startCrop.h + dy;
        clampToBounds('right', 'top');
        break;
      }
      case 'resize-tl': {
        nw = startCrop.w - dx;
        nx = startCrop.x + dx;
        nh = startCrop.h - dy;
        ny = startCrop.y + dy;
        clampToBounds('right', 'bottom');
        break;
      }
      case 'resize-t': {
        nh = startCrop.h - dy;
        ny = startCrop.y + dy;
        clampToBounds('center', 'bottom');
        break;
      }
      case 'resize-b': {
        nh = startCrop.h + dy;
        clampToBounds('center', 'top');
        break;
      }
      case 'resize-l': {
        nw = startCrop.w - dx;
        nx = startCrop.x + dx;
        clampToBounds('right', 'middle');
        break;
      }
      case 'resize-r': {
        nw = startCrop.w + dx;
        clampToBounds('left', 'middle');
        break;
      }
    }

    setCrop({ x: nx, y: ny, w: nw, h: nh });
  };

  const onDocMouseMove = (e: MouseEvent) => {
    if (!dragRef.current.mode) return;
    const { x, y } = getDocEventPos(e);
    updateCropFromPos(x, y);
  };

  const onDocMouseUp = () => {
    dragRef.current.mode = null;
    document.removeEventListener('mousemove', onDocMouseMove);
    document.removeEventListener('mouseup', onDocMouseUp);
  };

  const onDocTouchMove = (e: TouchEvent) => {
    if (!dragRef.current.mode) return;
    e.preventDefault();
    const { x, y } = getDocEventPos(e);
    updateCropFromPos(x, y);
  };

  const onDocTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    dragRef.current.mode = null;
    document.removeEventListener('touchmove', onDocTouchMove);
    document.removeEventListener('touchend', onDocTouchEnd);
  };

  const handleConfirm = async () => {
    const img = imgRef.current;
    if (!img) return;
    try {
      if (!hasModifiedRef.current && file) {
        onConfirm(file, file.name);
        return;
      }

      const { w: canvasW, h: canvasH } = getCanvasSize();
      const isRot90 = rotation % 180 !== 0;
      const fullW = isRot90 ? img.height : img.width;
      const fullH = isRot90 ? img.width : img.height;
      const scale = fullW / canvasW;

      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = fullW;
      fullCanvas.height = fullH;
      const fullCtx = fullCanvas.getContext('2d');
      if (!fullCtx) return;

      fullCtx.save();
      fullCtx.translate(fullW / 2, fullH / 2);
      fullCtx.rotate((rotation * Math.PI) / 180);
      fullCtx.drawImage(img, -img.width / 2, -img.height / 2);
      fullCtx.restore();

      const sx = crop.x * scale;
      const sy = crop.y * scale;
      const sw = Math.round(crop.w * scale);
      const sh = Math.round(crop.h * scale);

      const outCanvas = document.createElement('canvas');
      outCanvas.width = sw;
      outCanvas.height = sh;
      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) return;

      outCtx.drawImage(fullCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

      const blob: Blob = await new Promise((resolve, reject) => {
        outCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('导出失败'))),
          'image/jpeg',
          0.9
        );
      });

      const baseName = (file?.name || 'edited').replace(/\.[^.]+$/, '');
      onConfirm(blob, `${baseName}_edited.jpg`);
    } catch (err) {
      logger.error('[ImageEditor] 导出失败', err as Error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent
        className="max-w-[90%] sm:max-w-[420px] p-0 rounded-[24px] overflow-hidden max-h-[92vh] flex flex-col items-stretch"
        style={{
          background: 'linear-gradient(135deg, #EDF5EE 0%, #FAF8F2 60%, #FDF8E8 100%)',
          boxShadow: '0 16px 40px rgba(42, 72, 58, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
        }}
        showCloseButton={false}
      >
        <button
          type="button"
          onClick={onCancel}
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
            编辑图片
          </DialogTitle>
        </div>

        <div
          ref={containerRef}
          style={{
            padding: '16px 24px 0 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            className="relative flex items-center justify-center w-full overflow-hidden rounded-2xl p-3"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)' }}
          >
             <canvas
               ref={canvasRef}
               onMouseDown={onPointerDown}
               onTouchStart={onPointerDown}
               className="block max-w-full mx-auto touch-none cursor-move select-none rounded-xl"
               style={{ maxHeight: '50vh' }}
             />
          </div>

          <div className="flex items-center justify-center w-full gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10 border-0"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#ffffff' }}
                onClick={() => handleRotate('left')}
                title="向左旋转"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full w-10 h-10 border-0"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#ffffff' }}
                onClick={() => handleRotate('right')}
                title="向右旋转"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="rounded-full text-xs h-9 font-sans-hei border-0"
                style={{
                  background: aspect === 'free' ? '#89C273' : 'rgba(0,0,0,0.5)',
                  color: '#ffffff',
                  boxShadow: aspect === 'free' ? '0 2px 8px rgba(137, 194, 115, 0.4)' : 'none',
                  backdropFilter: 'blur(8px)',
                }}
                onClick={() => applyAspect('free')}
              >
                <Slice className="w-3.5 h-3.5 mr-1" />
                自由
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full text-xs h-9 font-sans-hei border-0"
                style={{
                  background: aspect === '1:1' ? '#89C273' : 'rgba(0,0,0,0.5)',
                  color: '#ffffff',
                  boxShadow: aspect === '1:1' ? '0 2px 8px rgba(137, 194, 115, 0.4)' : 'none',
                  backdropFilter: 'blur(8px)',
                }}
                onClick={() => applyAspect('1:1')}
              >
                <Square className="w-3.5 h-3.5 mr-1" />
                1:1
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full text-xs h-9 font-sans-hei border-0"
                style={{
                  background: aspect === '4:3' ? '#89C273' : 'rgba(0,0,0,0.5)',
                  color: '#ffffff',
                  boxShadow: aspect === '4:3' ? '0 2px 8px rgba(137, 194, 115, 0.4)' : 'none',
                  backdropFilter: 'blur(8px)',
                }}
                onClick={() => applyAspect('4:3')}
              >
                <RectangleHorizontal className="w-3.5 h-3.5 mr-1" />
                4:3
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-8 flex flex-col items-center gap-4 w-full sm:justify-center sm:flex-col">
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!imgLoaded}
            className="w-full max-w-[280px] rounded-full font-sans-hei font-semibold"
            style={{
              height: '52px',
              backgroundColor: '#fef3c7',
              color: '#6b5a3e',
              boxShadow: '0 4px 14px rgba(214, 178, 76, 0.18)',
              fontSize: '16px',
              border: '1px solid rgba(245, 215, 110, 0.4)',
            }}
          >
            <Check className="w-4 h-4 mr-1" />
            确认使用
          </Button>
          <button
            type="button"
            onClick={onCancel}
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

export default ImageEditor;
