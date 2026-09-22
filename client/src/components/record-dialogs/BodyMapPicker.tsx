import { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import type { PainMarker } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';

const FRONT_IMG = '/spark/app/app_17dqp7xck1j/runtime/api/v1/storage/object/bucket_aadkt7iouqgbw_static/static%2Faadkuegiyhapu_ve_miaoda';
const BACK_IMG = '/spark/app/app_17dqp7xck1j/runtime/api/v1/storage/object/bucket_aadkt7iouqgbw_static/static%2Faadkueg2dvkgw_ve_miaoda';

const PAIN_LEVELS = [
  { key: 'mild' as const, label: '轻度', dot: '#86c67c', ring: '#6bb860' },
  { key: 'moderate' as const, label: '中度', dot: '#f5a65b', ring: '#e88a3a' },
  { key: 'severe' as const, label: '重度', dot: '#ef6b6b', ring: '#e04848' },
];

const getLevelColor = (level?: 'mild' | 'moderate' | 'severe') => {
  const found = PAIN_LEVELS.find((l) => l.key === level);
  return found ?? PAIN_LEVELS[1];
};

const BodyMapPicker: React.FC<{
  value: PainMarker[];
  onChange: (markers: PainMarker[]) => void;
}> = ({ value, onChange }) => {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMarkers = value.filter((m) => m.side === side);

  const getRelativePos = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
      container: HTMLDivElement,
    ): { x: number; y: number } | null => {
      const rect = container.getBoundingClientRect();
      const touchE = e as TouchEvent;
      const mouseE = e as MouseEvent;
      let clientX: number, clientY: number;
      if (touchE.touches && touchE.touches.length > 0) {
        clientX = touchE.touches[0].clientX;
        clientY = touchE.touches[0].clientY;
      } else if (touchE.changedTouches && touchE.changedTouches.length > 0) {
        clientX = touchE.changedTouches[0].clientX;
        clientY = touchE.changedTouches[0].clientY;
      } else {
        clientX = mouseE.clientX;
        clientY = mouseE.clientY;
      }
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      return {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
    },
    [],
  );

  const handleBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging) return;
    const container = containerRef.current;
    if (!container) return;
    const pos = getRelativePos(e, container);
    if (!pos) return;
    const newMarker: PainMarker = {
      x: pos.x,
      y: pos.y,
      size: 14,
      side,
      painLevel: 'mild',
    };
    onChange([...value, newMarker]);
    setSelectedIdx(value.length);
  };

  const handleMarkerMouseDown = (
    e: React.MouseEvent | React.TouchEvent,
    idx: number,
  ) => {
    e.stopPropagation();
    setDragging(true);
    setSelectedIdx(idx);

    const container = containerRef.current;
    if (!container) return;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      moveEvent.preventDefault();
      const pos = getRelativePos(moveEvent, container);
      if (!pos) return;
      const flatIdx = value.findIndex(
        (m) => m.side === side && m === currentMarkers[idx],
      );
      if (flatIdx === -1) return;
      const updated = [...value];
      updated[flatIdx] = { ...updated[flatIdx], x: pos.x, y: pos.y };
      onChange(updated);
    };

    const handleUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', handleMove as EventListener);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove as EventListener);
      document.removeEventListener('touchend', handleUp);
    };

    document.addEventListener('mousemove', handleMove as EventListener);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove as EventListener, {
      passive: false,
    });
    document.addEventListener('touchend', handleUp);
  };

  const handleSizeChange = (delta: number) => {
    if (selectedIdx === null) return;
    const flatIdx = value.findIndex(
      (m) => m.side === side && m === currentMarkers[selectedIdx],
    );
    if (flatIdx === -1) return;
    const updated = [...value];
    const newSize = Math.max(8, Math.min(28, updated[flatIdx].size + delta));
    updated[flatIdx] = { ...updated[flatIdx], size: newSize };
    onChange(updated);
  };

  const handleLevelChange = (level: 'mild' | 'moderate' | 'severe') => {
    if (selectedIdx === null) return;
    const flatIdx = value.findIndex(
      (m) => m.side === side && m === currentMarkers[selectedIdx],
    );
    if (flatIdx === -1) return;
    const updated = [...value];
    updated[flatIdx] = { ...updated[flatIdx], painLevel: level };
    onChange(updated);
  };

  const handleRemove = () => {
    if (selectedIdx === null) return;
    const markerToRemove = currentMarkers[selectedIdx];
    onChange(value.filter((m) => m !== markerToRemove));
    setSelectedIdx(null);
  };

  const handleClearCurrentSide = () => {
    const remaining = value.filter((m) => m.side !== side);
    onChange(remaining);
    setSelectedIdx(null);
    setShowClearDialog(false);
    toast.success(
      `已清除${side === 'front' ? '正面' : '背面'}全部疼痛标记`,
    );
  };

  const handleClearClick = () => {
    if (currentSideCount === 0) {
      toast.info('当前没有标记');
      return;
    }
    setShowClearDialog(true);
  };

  useEffect(() => {
    setSelectedIdx(null);
  }, [side]);

  const selectedMarker =
    selectedIdx !== null ? currentMarkers[selectedIdx] : null;
  const currentSideCount = currentMarkers.length;
  const currentImg = side === 'front' ? FRONT_IMG : BACK_IMG;

  return (
    <div className="space-y-3 w-full min-w-0">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSide('front')}
          className={`flex-1 py-2 rounded-full text-sm transition-colors ${
            side === 'front'
              ? 'bg-primary text-white'
              : 'bg-muted text-muted-foreground hover:bg-primary-light hover:text-primary'
          }`}
        >
          正面
        </button>
        <button
          type="button"
          onClick={() => setSide('back')}
          className={`flex-1 py-2 rounded-full text-sm transition-colors ${
            side === 'back'
              ? 'bg-primary text-white'
              : 'bg-muted text-muted-foreground hover:bg-primary-light hover:text-primary'
          }`}
        >
          背面
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {PAIN_LEVELS.map((level) => (
            <div key={level.key} className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: level.dot }}
              />
              <span>{level.label}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleClearClick}
          className={`flex items-center gap-1 text-xs transition-colors ${
            currentSideCount === 0
              ? 'text-muted-foreground/50 cursor-not-allowed'
              : 'text-muted-foreground hover:text-destructive'
          }`}
        >
          <Trash2 className="w-3 h-3" />
          清除全部
        </button>
      </div>

      <div className="bg-module-pain-bg/40 rounded-3xl p-5 flex justify-center shadow-sm w-full min-w-0">
        <div
          ref={containerRef}
          className="relative w-40 rounded-2xl overflow-hidden cursor-crosshair select-none shadow-inner"
          style={{ aspectRatio: '9 / 16' }}
          onClick={handleBgClick}
        >
          <Image
            src={currentImg}
            alt={side === 'front' ? '人体正面图' : '人体背面图'}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
          <div className="absolute inset-0 bg-white/40 pointer-events-none" />

          {currentMarkers.map((marker, idx) => {
            const colors = getLevelColor(marker.painLevel);
            const isSelected = selectedIdx === idx;
            return (
              <div
                key={idx}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                  width: `${marker.size}px`,
                  height: `${marker.size}px`,
                  cursor: 'grab',
                }}
                onMouseDown={(e) => handleMarkerMouseDown(e, idx)}
                onTouchStart={(e) => handleMarkerMouseDown(e, idx)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIdx(idx);
                }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    backgroundColor: `${colors.dot}33`,
                    border: isSelected
                      ? `2px solid ${colors.ring}`
                      : `1.5px solid ${colors.dot}aa`,
                    boxShadow: isSelected
                      ? `0 0 0 2px ${colors.ring}33`
                      : 'none',
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    left: '35%',
                    top: '35%',
                    width: '30%',
                    height: '30%',
                    backgroundColor: colors.dot,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        点击人体图标记疼痛位置，拖拽可调整位置
      </p>

      {selectedMarker && (
        <div className="space-y-3 pt-3 border-t border-border/60">
          <div>
            <div className="text-sm text-foreground/80 mb-2">疼痛程度</div>
            <div className="flex gap-2">
              {PAIN_LEVELS.map((level) => {
                const active = selectedMarker.painLevel === level.key;
                return (
                  <button
                    key={level.key}
                    type="button"
                    onClick={() => handleLevelChange(level.key)}
                    className={`flex-1 py-2 rounded-full text-xs transition-all ${
                      active
                        ? 'text-white shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-primary-light hover:text-primary'
                    }`}
                    style={active ? { backgroundColor: level.dot } : {}}
                  >
                    {level.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/80">标记范围大小</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSizeChange(-2)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-primary-light hover:text-primary flex items-center justify-center text-sm transition-colors"
              >
                -
              </button>
              <span className="text-sm tabular-nums w-8 text-center">
                {selectedMarker.size}
              </span>
              <button
                type="button"
                onClick={() => handleSizeChange(2)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-primary-light hover:text-primary flex items-center justify-center text-sm transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="w-full py-2.5 rounded-full text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            移除该标记
          </button>
        </div>
      )}

      {value.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>共 {value.length} 个标记</span>
          <span>·</span>
          <span>正面 {value.filter((m) => m.side === 'front').length}</span>
          <span>·</span>
          <span>背面 {value.filter((m) => m.side === 'back').length}</span>
        </div>
      )}

      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-sans-hei text-base">确认清除疼痛标记</DialogTitle>
            <DialogDescription>
              确定清除当前{side === 'front' ? '正面' : '背面'}的全部疼痛标记吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setShowClearDialog(false)}
              className="flex-1 py-2.5 rounded-full text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleClearCurrentSide}
              className="flex-1 py-2.5 rounded-full text-sm bg-destructive text-white hover:bg-destructive/90 transition-colors"
            >
              确认清除
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BodyMapPicker;
