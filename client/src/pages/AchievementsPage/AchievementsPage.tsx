import { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Droplets,
  Activity,
  Smile,
  Moon,
  Pill,
  Sparkles,
  Zap,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { achievementsApi } from '@client/src/api';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@client/src/components/ui/popover';
import dayjs from 'dayjs';
import type { AchievementItem } from '@shared/api.interface';
import PageBackground from '@client/src/components/PageBackground';
import { Image } from '@client/src/components/ui/image';
import osmanthusBranch from '@client/src/assets/osmanthus-branch.png';

const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  trophy: Trophy,
  flame: Flame,
  droplets: Droplets,
  activity: Activity,
  smile: Smile,
  moon: Moon,
  pill: Pill,
  sparkles: Sparkles,
  zap: Zap,
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  milestone: { bg: 'bg-accent-light', text: 'text-accent' },
  streak: { bg: 'bg-module-pain-bg', text: 'text-module-pain' },
  water: { bg: 'bg-module-water-bg', text: 'text-module-water' },
  exercise: { bg: 'bg-module-exercise-bg', text: 'text-module-exercise' },
  mood: { bg: 'bg-module-mood-bg', text: 'text-module-mood' },
  sleep: { bg: 'bg-module-sleep-bg', text: 'text-module-sleep' },
  medication: { bg: 'bg-module-medication-bg', text: 'text-module-medication' },
  diet: { bg: 'bg-module-diet-bg', text: 'text-module-diet' },
  poop: { bg: 'bg-module-poop-bg', text: 'text-module-poop' },
};

const AchievementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'achieved' | 'inProgress' | 'locked'>('all');

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const result = await achievementsApi.getAchievements();
      setItems(result.items);
    } catch (err) {
      logger.error('加载成就失败', err as Error);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const achievedCount = items.filter((i) => i.isAchieved).length;
  const totalCount = items.length || 10;
  const progressPercent = items.length > 0
    ? Math.round((achievedCount / totalCount) * 100)
    : 0;

  const filteredItems = items.filter((item) => {
    const isInProgress = !item.isAchieved && item.progress > 0;
    if (filter === 'achieved') return item.isAchieved;
    if (filter === 'inProgress') return isInProgress;
    if (filter === 'locked') return !item.isAchieved && item.progress === 0;
    return true;
  });

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'achieved', label: '已达成' },
    { key: 'inProgress', label: '进行中' },
    { key: 'locked', label: '未解锁' },
  ];

  return (
    <div className="relative min-h-screen">
      <PageBackground />
      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          zIndex: 0,
          top: '-45px',
          right: '-55px',
          width: '320px',
          maxWidth: '78vw',
          opacity: 0.9,
          pointerEvents: 'none',
          transformOrigin: 'top right',
          transform: 'translateX(-100%) scaleX(-1) rotate(15deg)',
        }}
        aria-hidden="true"
      >
        <Image
          src={osmanthusBranch}
          alt=""
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
          }}
        />
      </div>
      <div className="page-content-wrap relative">
      <div className="space-y-6 relative z-10">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate('/profile', { replace: true })}
          className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-secondary/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={1.8} />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight font-sans-hei">
            我的成就
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            已获得 {achievedCount} / {totalCount} 项
          </p>
        </div>
      </header>

      <section className="p-5 relative overflow-hidden rounded-2xl" style={{ background: '#fef9e7', border: '1px solid rgba(245, 215, 110, 0.25)', boxShadow: '0 6px 20px rgba(214, 178, 76, 0.08)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: 'rgba(245, 215, 110, 0.15)', filter: 'blur(24px)' }} />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#fef3c7' }}>
            <Trophy className="w-7 h-7" strokeWidth={1.5} style={{ color: '#6b5a3e' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold tabular-nums font-sans-hei" style={{ color: '#5d4e37' }}>
                {achievedCount}
              </span>
              <span style={{ color: '#9e8f6e' }} className="text-sm font-sans-hei">
                / {totalCount} 项成就
              </span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: 'rgba(245, 215, 110, 0.25)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%`, background: '#d4a843' }}
              />
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          加载中...
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <button
            onClick={() => void fetchData()}
            className="text-primary text-sm font-medium"
          >
            重试
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl p-1.5 flex" style={{ background: '#fef9e7', border: '1px solid rgba(245, 215, 110, 0.25)', boxShadow: '0 2px 8px rgba(214, 178, 76, 0.06)' }}>
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="flex-1 py-2 text-sm font-sans-hei whitespace-nowrap transition-all duration-300 rounded-xl"
                style={{
                  background: filter === tab.key ? '#fef3c7' : 'transparent',
                   color: filter === tab.key ? '#6b5a3e' : '#8b9d8f',
                  boxShadow: filter === tab.key ? '0 1px 3px rgba(214, 178, 76, 0.15)' : 'none',
                  fontWeight: filter === tab.key ? 600 : 500,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <section className="p-5 rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 4px 16px rgba(46, 78, 63, 0.04)' }}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {filteredItems.map((item) => {
                const Icon = iconMap[item.icon] ?? Trophy;
                const colors = categoryColors[item.category] ?? categoryColors.milestone;
                const isInProgress = !item.isAchieved && item.progress > 0;
                let statusLabel = '未解锁';
                if (item.isAchieved) statusLabel = '已达成';
                else if (isInProgress) statusLabel = '进行中';

                return (
                  <Popover key={item.id}>
                    <PopoverTrigger asChild>
                      <div
                        className="flex flex-col items-center gap-1.5 group cursor-pointer outline-none"
                      >
                        <div
                          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md ${
                            item.isAchieved
                              ? colors.bg
                              : isInProgress
                              ? `${colors.bg} opacity-70`
                              : 'bg-muted'
                          }`}
                        >
                          {item.isAchieved || isInProgress ? (
                            <Icon
                              className={`w-6 h-6 ${item.isAchieved ? colors.text : `${colors.text} opacity-60`}`}
                              strokeWidth={1.8}
                            />
                          ) : (
                            <Lock className="w-5 h-5 text-muted-foreground/50" strokeWidth={1.8} />
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium text-center truncate w-full ${
                            item.isAchieved ? 'text-foreground/80' : 'text-muted-foreground/60'
                          }`}
                        >
                          {item.name}
                        </span>
                        <span
                              className={`text-[10px] font-medium ${
                          item.isAchieved
                            ? 'text-primary'
                            : isInProgress
                            ? 'text-accent'
                            : 'text-muted-foreground/40'
                        }`}
                        >
                          {statusLabel}
                        </span>
                        {!item.isAchieved && item.target > 0 && (
                            <div className="w-full px-1">
                              <div className="w-full progress-track h-0.5">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${Math.min(100, Math.round((item.progress / item.target) * 100))}%` }}
                                />
                              </div>
                            </div>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-56 max-w-[calc(100vw-32px)] p-3 border-[#dcebe1] shadow-lg"
                      style={{ borderRadius: 12 }}
                      side="top"
                      sideOffset={8}
                      collisionPadding={16}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-[#274737] leading-tight">
                            {item.name}
                          </h4>
                          <span
                            className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              item.isAchieved
                                ? 'bg-module-exercise-bg text-module-exercise'
                                : isInProgress
                                ? 'bg-module-mood-bg text-module-mood'
                                : 'bg-muted text-muted-foreground/60'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-xs text-[#4a6356] leading-relaxed">
                          {item.criterion}
                        </p>
                        {item.target > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-[#8c9e94]">
                              <span>当前进度</span>
                              <span className="tabular-nums">
                                {item.progress}
                                {item.unit || ''} / {item.target}
                                {item.unit || ''}
                              </span>
                            </div>
                            <div className="w-full progress-track h-1.5">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.round((item.progress / item.target) * 100),
                                  )}%`,
                                  backgroundColor: '#274737',
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {item.isAchieved && item.achievedAt && (
                          <p className="text-[11px] text-[#8c9e94] pt-1 border-t border-[#e8ece9]">
                            {dayjs(item.achievedAt).format('YYYY年M月D日')} 达成
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          </section>
        </div>
      )}
      </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
