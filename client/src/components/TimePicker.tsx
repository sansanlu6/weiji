import { useState, useEffect, useRef, useMemo } from 'react';
import { Clock } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@client/src/components/ui/popover';
import { Button } from '@client/src/components/ui/button';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  triggerStyle?: React.CSSProperties;
  className?: string;
}

const WHEEL_ROW_HEIGHT = 32;
const WHEEL_VISIBLE_ROWS = 5;
const WHEEL_CONTAINER_HEIGHT = WHEEL_ROW_HEIGHT * WHEEL_VISIBLE_ROWS;

const pad = (n: number) => n.toString().padStart(2, '0');

interface WheelColumnProps {
  items: number[];
  value: number;
  onChange: (v: number) => void;
  widthPx?: number;
}

const WheelColumn: React.FC<WheelColumnProps> = ({
  items,
  value,
  onChange,
  widthPx = 72,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const programmaticRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const wheelTimerRef = useRef<number | null>(null);
  const scrollTimerRef = useRef<number | null>(null);
  const touchStartYRef = useRef(0);
  const touchStartScrollRef = useRef(0);
  const touchVelocityRef = useRef(0);
  const touchLastYRef = useRef(0);
  const touchLastTimeRef = useRef(0);
  const [centerIndex, setCenterIndex] = useState(() => items.indexOf(value));
  const centerIndexRef = useRef(items.indexOf(value));
  const rafRef = useRef<number | null>(null);
  const midTop = (WHEEL_CONTAINER_HEIGHT - WHEEL_ROW_HEIGHT) / 2;

  const updateCenterFromScroll = () => {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollTop / WHEEL_ROW_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (clamped !== centerIndexRef.current) {
      centerIndexRef.current = clamped;
      setCenterIndex(clamped);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateCenterFromScroll();
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [items]);

  useEffect(() => {
    if (scrollRef.current) {
      const idx = items.indexOf(value);
      if (idx < 0) return;
      programmaticRef.current = true;
      centerIndexRef.current = idx;
      setCenterIndex(idx);
      scrollRef.current.scrollTop = idx * WHEEL_ROW_HEIGHT;
      requestAnimationFrame(() => {
        programmaticRef.current = false;
      });
    }
  }, [value, items]);

  const scrollToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    if (scrollRef.current) {
      programmaticRef.current = true;
      centerIndexRef.current = clamped;
      setCenterIndex(clamped);
      scrollRef.current.scrollTop = clamped * WHEEL_ROW_HEIGHT;
    }
    if (items[clamped] !== value) {
      onChange(items[clamped]);
    }
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => {
      programmaticRef.current = false;
      scrollTimerRef.current = null;
    }, 120);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    wheelAccumRef.current += e.deltaY;
    const step = Math.trunc(wheelAccumRef.current / 30);
    if (step !== 0) {
      wheelAccumRef.current -= step * 30;
      const currentIdx = items.indexOf(value);
      const nextIdx = Math.max(0, Math.min(items.length - 1, currentIdx + step));
      scrollToIndex(nextIdx);
    }
    if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = window.setTimeout(() => {
      wheelAccumRef.current = 0;
      wheelTimerRef.current = null;
    }, 150);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    const touch = e.touches[0];
    touchStartYRef.current = touch.clientY;
    touchStartScrollRef.current = scrollRef.current.scrollTop;
    touchLastYRef.current = touch.clientY;
    touchLastTimeRef.current = Date.now();
    touchVelocityRef.current = 0;
    if (scrollTimerRef.current) {
      window.clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    const touch = e.touches[0];
    const deltaY = touchStartYRef.current - touch.clientY;
    const now = Date.now();
    const dt = now - touchLastTimeRef.current;
    if (dt > 0) {
      touchVelocityRef.current = (touchLastYRef.current - touch.clientY) / dt;
    }
    touchLastYRef.current = touch.clientY;
    touchLastTimeRef.current = now;
    programmaticRef.current = true;
    scrollRef.current.scrollTop = touchStartScrollRef.current + deltaY;
  };

  const handleTouchEnd = () => {
    if (!scrollRef.current) return;
    const velocity = touchVelocityRef.current;
    const currentScrollTop = scrollRef.current.scrollTop;
    const maxScroll = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
    if (Math.abs(velocity) > 0.3) {
      const inertiaDistance = velocity * 200;
      const targetScroll = Math.max(0, Math.min(maxScroll, currentScrollTop + inertiaDistance));
      const targetIndex = Math.round(targetScroll / WHEEL_ROW_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, targetIndex));
      programmaticRef.current = true;
      centerIndexRef.current = clampedIndex;
      setCenterIndex(clampedIndex);
      scrollRef.current.scrollTo({
        top: clampedIndex * WHEEL_ROW_HEIGHT,
        behavior: 'smooth',
      });
      if (items[clampedIndex] !== value) {
        onChange(items[clampedIndex]);
      }
      scrollTimerRef.current = window.setTimeout(() => {
        programmaticRef.current = false;
        scrollTimerRef.current = null;
      }, 300);
    } else {
      programmaticRef.current = false;
      handleScroll();
    }
    touchVelocityRef.current = 0;
  };

  const handleScroll = () => {
    if (programmaticRef.current) return;
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => {
      scrollTimerRef.current = null;
      if (!scrollRef.current) return;
      const scrollTop = scrollRef.current.scrollTop;
      const index = Math.round(scrollTop / WHEEL_ROW_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      centerIndexRef.current = clamped;
      setCenterIndex(clamped);
      if (items[clamped] !== value) {
        onChange(items[clamped]);
      }
      programmaticRef.current = true;
      scrollRef.current.scrollTop = clamped * WHEEL_ROW_HEIGHT;
      setTimeout(() => {
        programmaticRef.current = false;
      }, 50);
    }, 100);
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: `${WHEEL_CONTAINER_HEIGHT}px`, width: `${widthPx}px` }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full overflow-y-auto scrollbar-hide cursor-ns-resize"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          touchAction: 'pan-y',
        }}
      >
        <div
          style={{
            paddingTop: `${midTop}px`,
            paddingBottom: `${midTop}px`,
          }}
        >
          {items.map((item, idx) => {
            const diff = Math.abs(idx - centerIndex);
            const isCenter = diff === 0;
            return (
              <div
                key={item}
                onClick={() => scrollToIndex(idx)}
                className="flex items-center justify-center tabular-nums cursor-pointer"
                style={{
                  height: `${WHEEL_ROW_HEIGHT}px`,
                  lineHeight: `${WHEEL_ROW_HEIGHT}px`,
                  scrollSnapAlign: 'center',
                  color: isCenter ? '#1a1a1a' : '#7d9387',
                  fontWeight: isCenter ? 700 : 400,
                  fontSize: isCenter ? '18px' : diff <= 1 ? '15px' : '13px',
                  opacity: isCenter ? 1 : diff <= 1 ? 0.85 : diff <= 2 ? 0.45 : 0.2,
                  transform: isCenter ? 'scale(1)' : `scale(${1 - Math.min(diff, 3) * 0.06})`,
                  transition: 'color 80ms linear, font-weight 80ms linear, opacity 80ms linear',
                }}
              >
                {pad(item)}
              </div>
            );
          })}
        </div>
      </div>
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: `${midTop}px`,
          background: 'linear-gradient(to bottom, #ffffff, rgba(255, 255, 255, 0.6), transparent)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: `${midTop}px`,
          background: 'linear-gradient(to top, #ffffff, rgba(255, 255, 255, 0.6), transparent)',
        }}
      />
      <div
        className="absolute inset-x-3 pointer-events-none rounded-lg"
        style={{
          top: `${midTop}px`,
          height: `${WHEEL_ROW_HEIGHT}px`,
          backgroundColor: 'rgba(234, 243, 237, 0.4)',
          borderTop: '1px solid rgba(42, 72, 58, 0.1)',
          borderBottom: '1px solid rgba(42, 72, 58, 0.1)',
        }}
      />
    </div>
  );
};

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  triggerStyle,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = 0; h < 24; h += 1) arr.push(h);
    return arr;
  }, []);

  const minutes = useMemo(() => {
    const arr: number[] = [];
    for (let m = 0; m < 60; m += 1) arr.push(m);
    return arr;
  }, []);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHour(parseInt(h, 10));
      setMinute(parseInt(m, 10));
    }
  }, [value]);

  const handleConfirm = () => {
    onChange(`${pad(hour)}:${pad(minute)}`);
    setOpen(false);
  };

  return (
    <div className={cn('', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className="w-full justify-start text-left font-normal rounded-xl h-11 bg-[#f0f3f1] border-none hover:bg-[#e8edeb] shadow-none text-[#274737] text-sm pl-3"
            style={triggerStyle}
          >
            <Clock className="mr-2 h-4 w-4 text-[#6f8c80]" />
            {value || '选择时间'}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-fit p-4 border-[#e8f1eb]"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 16px 40px rgba(42, 72, 58, 0.12)',
          }}
          sideOffset={6}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="text-sm font-semibold" style={{ color: '#2a483a', fontFamily: '"Source Han Sans CN", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' }}>
              选择时间
            </div>
            <div className="flex items-center gap-1">
              <WheelColumn items={hours} value={hour} onChange={setHour} />
              <div
                className="text-lg font-semibold pb-0.5"
                style={{ color: '#2a483a' }}
              >
                :
              </div>
              <WheelColumn items={minutes} value={minute} onChange={setMinute} />
            </div>
            <div className="flex gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: '#f2f7f4',
                  color: '#617a6d',
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-xl py-2 text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: '#2a483a',
                  color: '#ffffff',
                }}
              >
                确认
              </button>
            </div>
          </div>
          <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
          `}</style>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TimePicker;
