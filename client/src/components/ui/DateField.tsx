import { useState, useEffect, useMemo } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@client/src/components/ui/popover';
import { Button } from '@client/src/components/ui/button';
import { cn } from '@/lib/utils';

interface DateFieldProps {
  value: string;
  onChange: (dateString: string) => void;
  placeholder?: string;
  className?: string;
  triggerStyle?: React.CSSProperties;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const YEAR_VISIBLE_COUNT = 12;

const DateField: React.FC<DateFieldProps> = ({
  value,
  onChange,
  placeholder = '选择日期',
  className,
  triggerStyle,
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'year'>('day');
  const [viewYear, setViewYear] = useState(0);

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  useEffect(() => {
    if (value) {
      setDate(new Date(value));
    }
  }, [value]);

  useEffect(() => {
    if (open) {
      setViewYear(year);
      setViewMode('day');
    }
  }, [open, year]);

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

  const yearGrid = useMemo(() => {
    const start = viewYear - 5;
    const years: number[] = [];
    for (let i = 0; i < YEAR_VISIBLE_COUNT; i += 1) {
      years.push(start + i);
    }
    return years;
  }, [viewYear]);

  const updateDate = (patch: { year?: number; month?: number; day?: number }) => {
    const newYear = patch.year ?? year;
    const newMonth = patch.month ?? month;
    let newDay = patch.day ?? day;
    const lastDayOfMonth = new Date(newYear, newMonth + 1, 0).getDate();
    if (newDay > lastDayOfMonth) newDay = lastDayOfMonth;
    const d = new Date(newYear, newMonth, newDay, 0, 0, 0, 0);
    setDate(d);
    onChange(d.toISOString().split('T')[0]);
  };

  const goPrevMonth = () => {
    const d = new Date(year, month - 1, 1);
    updateDate({ year: d.getFullYear(), month: d.getMonth() });
  };

  const goNextMonth = () => {
    const d = new Date(year, month + 1, 1);
    updateDate({ year: d.getFullYear(), month: d.getMonth() });
  };

  const handleDayClick = (d: Date) => {
    updateDate({
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
    });
    setOpen(false);
  };

  const handleYearClick = (y: number) => {
    updateDate({ year: y });
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

  const currentYear = new Date().getFullYear();

  return (
    <div className={cn('space-y-1.5', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className="w-full justify-start text-left font-normal rounded-full h-11 bg-muted/40 border-transparent hover:bg-muted/60 shadow-none text-foreground text-sm pl-4"
            style={triggerStyle}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            {value ? dayjs(date).format('YYYY-MM-DD') : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-5 border-[#e8f1eb]"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 16px 40px rgba(42, 72, 58, 0.12)',
          }}
          align="start"
          sideOffset={6}
        >
          <div className="flex flex-col gap-4">
            {viewMode === 'day' ? (
              <>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={goPrevMonth}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: '#eaf3ed' }}
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
                    style={{ color: '#2a483a' }}
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
                    style={{ backgroundColor: '#eaf3ed' }}
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
                          backgroundColor: '#eaf3ed',
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
                            ? { backgroundColor: '#2a483a', color: '#ffffff', fontWeight: 600 }
                            : inMonth
                              ? todayStyle ?? { color: '#2a483a' }
                              : { color: '#c8d4ce' }
                        }
                        onMouseEnter={(e) => {
                          if (!selected && inMonth && !(today && inMonth)) {
                            e.currentTarget.style.backgroundColor = '#eaf3ed';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selected && inMonth && !(today && inMonth)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ minHeight: '240px' }} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewYear((y) => y - YEAR_VISIBLE_COUNT)}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: '#eaf3ed' }}
                    aria-label="上一组年份"
                  >
                    <ChevronLeft className="w-4 h-4" style={{ color: '#2a483a' }} strokeWidth={2.5} />
                  </button>
                  <div className="text-sm font-semibold" style={{ color: '#2a483a' }}>
                    选择年份
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewYear((y) => y + YEAR_VISIBLE_COUNT)}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: '#eaf3ed' }}
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
                            ? { backgroundColor: '#2a483a', color: '#ffffff', fontWeight: 600 }
                            : isCur
                              ? { backgroundColor: '#eaf3ed', color: '#2a483a', fontWeight: 600 }
                              : { color: '#2a483a' }
                        }
                        onMouseEnter={(e) => {
                          if (!selected && !isCur) {
                            e.currentTarget.style.backgroundColor = '#eaf3ed';
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
                    className="w-full text-xs transition-colors py-2 hover:opacity-80"
                    style={{ color: '#637a6d' }}
                  >
                    返回日期
                  </button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateField;
