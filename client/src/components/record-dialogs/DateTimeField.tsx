import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
  DialogClose,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { cn } from '@/lib/utils';

interface DateTimeFieldProps {
  value: string;
  onChange: (isoString: string) => void;
  label?: string;
  className?: string;
  triggerStyle?: React.CSSProperties;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const YEAR_VISIBLE_COUNT = 12;
const WHEEL_ROW_HEIGHT = 24;
const WHEEL_VISIBLE_ROWS = 3;
const WHEEL_CONTAINER_HEIGHT = WHEEL_ROW_HEIGHT * WHEEL_VISIBLE_ROWS;

const pad = (n: number) => n.toString().padStart(2, '0');

interface WheelColumnProps {
  items: number[];
  value: number;
  onChange: (v: number) => void;
  widthClass?: string;
  bgColor?: string;
}

const WheelColumn: React.FC<WheelColumnProps> = ({
  items,
  value,
  onChange,
  widthClass = 'w-14',
  bgColor = '#f7faf8',
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
      className={cn('relative overflow-hidden', widthClass)}
      style={{ height: `${WHEEL_CONTAINER_HEIGHT}px` }}
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
                  fontSize: isCenter ? '16px' : diff <= 1 ? '14px' : '13px',
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
        className="absolute inset-x-0 top-0 h-6 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${bgColor}, transparent)` }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-6 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${bgColor}, transparent)` }}
      />
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: `${midTop}px`,
          background: `linear-gradient(to bottom, ${bgColor}, transparent)`,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: `${midTop}px`,
          background: `linear-gradient(to top, ${bgColor}, transparent)`,
        }}
      />
      <div
        className="absolute inset-x-0 pointer-events-none border-t"
        style={{ top: `${midTop}px`, borderColor: 'rgba(42, 72, 58, 0.08)' }}
      />
      <div
        className="absolute inset-x-0 pointer-events-none border-t"
        style={{ top: `${midTop + WHEEL_ROW_HEIGHT}px`, borderColor: 'rgba(42, 72, 58, 0.08)' }}
      />
    </div>
  );
};

const DateTimeField: React.FC<DateTimeFieldProps> = ({
  value,
  onChange,
  label,
  className,
  triggerStyle,
}) => {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'year'>('day');
  const [viewYear, setViewYear] = useState(0);

  const year = draftDate.getFullYear();
  const month = draftDate.getMonth();
  const day = draftDate.getDate();
  const hour = draftDate.getHours();
  const minute = draftDate.getMinutes();

  useEffect(() => {
    if (value) {
      setDraftDate(new Date(value));
    }
  }, [value]);

  useEffect(() => {
    if (open) {
      if (value) {
        setDraftDate(new Date(value));
      }
      setViewYear(draftDate.getFullYear());
      setViewMode('day');
    }
  }, [open]);

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

  const updateDateTime = (patch: {
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
  }) => {
    const newYear = patch.year ?? year;
    const newMonth = patch.month ?? month;
    let newDay = patch.day ?? day;
    const newHour = patch.hour ?? hour;
    const newMinute = patch.minute ?? minute;
    const lastDayOfMonth = new Date(newYear, newMonth + 1, 0).getDate();
    if (newDay > lastDayOfMonth) newDay = lastDayOfMonth;
    const d = new Date(newYear, newMonth, newDay, newHour, newMinute, 0, 0);
    setDraftDate(d);
  };

  const goPrevMonth = () => {
    const d = new Date(year, month - 1, 1);
    updateDateTime({ year: d.getFullYear(), month: d.getMonth() });
  };

  const goNextMonth = () => {
    const d = new Date(year, month + 1, 1);
    updateDateTime({ year: d.getFullYear(), month: d.getMonth() });
  };

  const handleDayClick = (d: Date) => {
    updateDateTime({
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
    });
  };

  const handleYearClick = (y: number) => {
    updateDateTime({ year: y });
    setViewMode('day');
  };

  const isToday = (d: Date) => {
    const now = new Date();
    return d.getFullYear() === now.getFullYear()
      && d.getMonth() === now.getMonth()
      && d.getDate() === now.getDate();
  };

  const isSelected = (d: Date) =>
    d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startWeekday = firstOfMonth.getDay();
    const firstDisplay = new Date(year, month, 1 - startWeekday);
    const days: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(firstDisplay);
      d.setDate(firstDisplay.getDate() + i);
      days.push({ date: d, inMonth: d.getMonth() === month });
    }
    return days;
  }, [year, month]);

  const currentYear = new Date().getFullYear();

  const yearGrid = useMemo(() => {
    const start = viewYear - 5;
    const years: number[] = [];
    for (let i = 0; i < YEAR_VISIBLE_COUNT; i += 1) {
      years.push(start + i);
    }
    return years;
  }, [viewYear]);

  const handleHourChange = (h: number) => {
    updateDateTime({ hour: h });
  };

  const handleMinuteChange = (m: number) => {
    updateDateTime({ minute: m });
  };

  const handleConfirm = () => {
    onChange(draftDate.toISOString());
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <Button
        variant="outline"
        type="button"
        onClick={() => setOpen(true)}
        className="w-full justify-start text-left font-normal rounded-xl h-11 bg-[#e4ede8] border border-[#D8E6DE] hover:bg-[#d8e4dc] shadow-none text-[#2A483A] text-[15px] pl-3"
        style={triggerStyle}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-[#6f8c80]" />
        {value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '请选择时间'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
        <DialogContent
          className="w-[min(320px,calc(100vw-32px))] p-0 rounded-[24px] border-[#e8f1eb] max-h-[90vh] overflow-hidden"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 24px 60px rgba(42, 72, 58, 0.18)',
          }}
        >
          <div className="px-5 pt-5 pb-2">
            <DialogTitle className="text-base font-semibold text-left" style={{ color: '#2a483a', fontFamily: '"Source Han Sans CN", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' }}>
              选择日期和时间
            </DialogTitle>
          </div>

          <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            <div className="flex flex-col gap-3">
              {viewMode === 'day' ? (
                <>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={goPrevMonth}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: '#e2f2e7' }}
                      aria-label="上个月"
                    >
                      <ChevronLeft className="w-4 h-4" style={{ color: '#2a483a' }} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewYear(year);
                        setViewMode('year');
                      }}
                      className="text-sm font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity"
                      style={{ color: '#2a483a', fontFamily: '"Source Han Sans CN", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' }}
                    >
                      {year}年{month + 1}月
                      <ChevronRight
                        className="w-3.5 h-3.5"
                        strokeWidth={2.5}
                        style={{ color: '#85998d', transform: 'rotate(90deg)' }}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={goNextMonth}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: '#e2f2e7' }}
                      aria-label="下个月"
                    >
                      <ChevronRight className="w-4 h-4" style={{ color: '#2a483a' }} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-0">
                    {WEEKDAYS.map((w) => (
                      <div
                        key={w}
                        className="h-9 flex items-center justify-center text-xs font-normal"
                        style={{ color: '#85998d' }}
                      >
                        {w}
                      </div>
                    ))}
                    {calendarDays.map(({ date: d, inMonth }, idx) => {
                      const selected = isSelected(d);
                      const today = isToday(d);
                            const todayStyle = !selected && today && inMonth
                        ? {
                            backgroundColor: '#e2f2e7',
                            color: '#2a483a',
                            fontWeight: 600,
                          }
                        : undefined;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleDayClick(d)}
                          className="h-9 flex items-center justify-center text-sm tabular-nums rounded-full transition-colors"
                          style={
                            selected
                              ? { backgroundColor: '#3b9169', color: '#ffffff', fontWeight: 600 }
                              : inMonth
                                ? { color: '#2a483a', ...todayStyle }
                                : { color: '#c8d4ce' }
                          }
                          onMouseEnter={(e) => {
                            if (!selected && inMonth) {
                               e.currentTarget.style.backgroundColor = '#e2f2e7';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selected) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {d.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center gap-4 py-3" style={{ backgroundColor: '#f7faf8', borderRadius: '16px' }}>
                    <WheelColumn
                      items={hours}
                      value={hour}
                      onChange={handleHourChange}
                      widthClass="w-16"
                      bgColor="#f7faf8"
                    />
                    <div className="text-lg font-semibold" style={{ color: '#2a483a' }}>:</div>
                    <WheelColumn
                      items={minutes}
                      value={minute}
                      onChange={handleMinuteChange}
                      widthClass="w-16"
                      bgColor="#f7faf8"
                    />
                  </div>
                </>
              ) : (
                <div style={{ minHeight: '310px' }} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setViewYear((y) => y - YEAR_VISIBLE_COUNT)}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: '#e2f2e7' }}
                      aria-label="上一组年份"
                    >
                      <ChevronLeft className="w-4 h-4" style={{ color: '#2a483a' }} strokeWidth={2.5} />
                    </button>
                    <div className="text-sm font-semibold" style={{ color: '#2a483a', fontFamily: '"Source Han Sans CN", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' }}>
                      选择年份
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewYear((y) => y + YEAR_VISIBLE_COUNT)}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: '#e2f2e7' }}
                      aria-label="下一组年份"
                    >
                      <ChevronRight className="w-4 h-4" style={{ color: '#2a483a' }} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 flex-1 content-center">
                    {yearGrid.map((y) => {
                      const selected = y === year;
                      const isCur = y === currentYear;
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => handleYearClick(y)}
                          className="h-10 flex items-center justify-center text-sm tabular-nums rounded-full transition-colors font-medium"
                          style={
                            selected
                              ? { backgroundColor: '#3b9169', color: '#ffffff', fontWeight: 600 }
                              : isCur
                                ? { backgroundColor: '#e2f2e7', color: '#2a483a', fontWeight: 600 }
                                : { color: '#2a483a' }
                          }
                          onMouseEnter={(e) => {
                            if (!selected && !isCur) {
                               e.currentTarget.style.backgroundColor = '#e2f2e7';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selected && !isCur) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {y}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('day')}
                       className="w-full text-sm transition-colors py-2 hover:opacity-80"
                      style={{ color: '#637a6d' }}
                    >
                      返回日期
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-5 pb-5 pt-0 flex flex-row md:flex-col items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1 md:w-full md:flex-none h-11 rounded-full text-[15px] font-medium border-[#d8e4dc] md:order-2"
              style={{ color: '#306d51', backgroundColor: '#e2f2e7' }}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="flex-1 md:w-full md:flex-none h-11 rounded-full text-[15px] font-medium md:order-1"
              style={{ backgroundColor: '#63bd80', color: '#ffffff' }}
            >
              确定
            </Button>
          </DialogFooter>

          <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
          `}</style>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DateTimeField;
