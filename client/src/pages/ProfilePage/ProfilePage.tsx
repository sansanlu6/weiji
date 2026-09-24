import { useState, useEffect } from 'react';
import {
  Target,
  Bell,
  Database,
  FileText,
  Settings,
  HelpCircle,
  ChevronRight,
  User,
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
  Check,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { achievementsApi, profileApi } from '@client/src/api';
import type { LucideIcon } from 'lucide-react';
import type { AchievementItem, ProfileSummary, UserProfileInfo } from '@shared/api.interface';
import osmanthusBranch from '@client/src/assets/osmanthus-branch.png';

interface QuickMenuItem {
  label: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  path: string;
}

const quickMenuItems: QuickMenuItem[] = [
  { label: '健康报告', description: '查看你的身体数据趋势', icon: FileText, iconBg: '#ebe6f7', iconColor: '#6b5aa8', path: '/report' },
  { label: '目标管理', description: '设置并追踪每日目标', icon: Target, iconBg: '#ffe27a', iconColor: '#c98210', path: '/goals' },
  { label: '提醒设置', description: '自定义打卡提醒时间', icon: Bell, iconBg: '#fbdce4', iconColor: '#d86a86', path: '/reminders' },
  { label: '数据管理', description: '导出与备份你的记录', icon: Database, iconBg: '#cfe5f0', iconColor: '#4e8bb0', path: '/data' },
  { label: '设置', description: '账号与通用偏好', icon: Settings, iconBg: '#dfe3e0', iconColor: '#6e7a75', path: '/settings' },
  { label: '帮助中心', description: '常见问题与使用指南', icon: HelpCircle, iconBg: '#cce5d6', iconColor: '#4fa17e', path: '/help' },
];

const iconMap: Record<string, LucideIcon> = {
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

import { Button } from '@client/src/components/ui/button';
import { useAuth } from '@client/src/contexts/AuthContext';
import PageBackground from '@client/src/components/PageBackground';
import { Image } from '@client/src/components/ui/image';

const categoryColors: Record<string, { bg: string; text: string; bgColor: string; textColor: string }> = {
  milestone: { bg: 'bg-accent-light', text: 'text-accent', bgColor: '#f7f3e3', textColor: '#d4a359' },
  streak: { bg: 'bg-module-pain-bg', text: 'text-module-pain', bgColor: 'hsl(0 60% 86%)', textColor: 'hsl(0 55% 55%)' },
  water: { bg: 'bg-module-water-bg', text: 'text-module-water', bgColor: 'hsl(195 55% 88%)', textColor: 'hsl(195 50% 48%)' },
  exercise: { bg: 'bg-module-exercise-bg', text: 'text-module-exercise', bgColor: 'hsl(95 55% 86%)', textColor: 'hsl(95 50% 42%)' },
  mood: { bg: 'bg-module-mood-bg', text: 'text-module-mood', bgColor: 'hsl(45 70% 86%)', textColor: 'hsl(40 70% 45%)' },
  sleep: { bg: 'bg-module-sleep-bg', text: 'text-module-sleep', bgColor: 'hsl(230 40% 90%)', textColor: 'hsl(230 45% 55%)' },
  medication: { bg: 'bg-module-medication-bg', text: 'text-module-medication', bgColor: 'hsl(270 35% 90%)', textColor: 'hsl(270 40% 58%)' },
  diet: { bg: 'bg-module-diet-bg', text: 'text-module-diet', bgColor: 'hsl(25 65% 88%)', textColor: 'hsl(25 65% 48%)' },
  poop: { bg: 'bg-module-poop-bg', text: 'text-module-poop', bgColor: 'hsl(100 45% 88%)', textColor: 'hsl(100 40% 42%)' },
};

interface ProfilePageCacheEntry {
  achievements: AchievementItem[];
  profileSummary: ProfileSummary;
  userProfile: UserProfileInfo;
  cachedAt: number;
}

const PROFILE_CACHE_TTL_MS = 2 * 60 * 1000;
const profilePageCache = new Map<string, ProfilePageCacheEntry>();

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const refreshProfile = Boolean(
    (location.state as { refreshProfile?: boolean } | null)?.refreshProfile,
  );
  const cachedAtMount = user?.id ? profilePageCache.get(user.id) : undefined;
  const initialCache =
    !refreshProfile &&
    cachedAtMount &&
    Date.now() - cachedAtMount.cachedAt < PROFILE_CACHE_TTL_MS
      ? cachedAtMount
      : undefined;
  const [achievements, setAchievements] = useState<AchievementItem[]>(
    initialCache?.achievements ?? [],
  );
  const [profileSummary, setProfileSummary] = useState<ProfileSummary | null>(
    initialCache?.profileSummary ?? null,
  );
  const [userProfile, setUserProfile] = useState<UserProfileInfo | null>(
    initialCache?.userProfile ?? null,
  );
  const [loading, setLoading] = useState(!initialCache);

  useEffect(() => {
    if (!user?.id) return;

    const cached = profilePageCache.get(user.id);
    if (
      !refreshProfile &&
      cached &&
      Date.now() - cached.cachedAt < PROFILE_CACHE_TTL_MS
    ) {
      setAchievements(cached.achievements);
      setProfileSummary(cached.profileSummary);
      setUserProfile(cached.userProfile);
      setLoading(false);
      return;
    }

    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        const [achRes, summaryRes, profileRes] = await Promise.all([
          achievementsApi.getAchievements(),
          profileApi.getProfileSummary(),
          profileApi.getProfile(),
        ]);
        setAchievements(achRes.items);
        setProfileSummary(summaryRes);
        setUserProfile(profileRes);
        profilePageCache.set(user.id, {
          achievements: achRes.items,
          profileSummary: summaryRes,
          userProfile: profileRes,
          cachedAt: Date.now(),
        });
      } catch (err) {
        logger.error('加载个人数据失败', err as Error);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [refreshProfile, user?.id]);

  const handleItemClick = (item: QuickMenuItem): void => {
    logger.info(`点击功能入口: ${item.label}`);
    navigate(item.path);
  };

  const achievedItems = achievements.filter((a) => a.isAchieved);

  const progressPercent = (item: AchievementItem): number => {
    if (item.target <= 0) return 0;
    return Math.min(100, Math.round((item.progress / item.target) * 100));
  };

  const statusLabel = (item: AchievementItem): string => {
    if (item.isAchieved) return '已达成';
    if (item.progress > 0) return '进行中';
    return '未解锁';
  };

  return (
    <div className="relative min-h-screen overflow-visible">
      <style>{`
        .achievement-scroll-inner::-webkit-scrollbar {
          display: none;
        }
        .achievement-scroll-inner {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
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
      <div className="relative z-10 space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight font-title">我的</h1>
      </header>

      {/* 用户信息卡片（含数据指标） */}
      <div
        className="rounded-3xl p-[18px_16px_14px_16px]"
        style={{
          borderRadius: '24px',
          background: 'rgba(254, 249, 231, 0.8)',
          boxShadow: '0 6px 20px rgba(214, 178, 76, 0.08)',
          border: '1px solid rgba(245, 215, 110, 0.3)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-4" style={{ marginBottom: '16px' }}>
          <div
            className="rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ width: '54px', height: '54px', background: '#fef3c7' }}
          >
            {userProfile?.avatarUrl ? (
              <Image src={userProfile.avatarUrl} alt="头像" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User className="w-7 h-7" style={{ color: '#6b5a3e' }} strokeWidth={1.5} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2
                className="truncate font-semibold"
                style={{ fontSize: '18px', color: '#5d4e37' }}
              >
                {userProfile?.username || user?.username || '健康用户'}
              </h2>
               <button
                onClick={() => navigate('/profile/edit')}
                className="flex-shrink-0 transition-colors hover:opacity-80"
                style={{
                  padding: '3px 11px',
                  borderRadius: '12px',
                  background: '#fef3c7',
                  border: '1px solid rgba(245, 215, 110, 0.4)',
                  color: '#6b5a3e',
                  fontSize: '12px',
                  lineHeight: 1.5,
                }}
              >
                编辑
              </button>
            </div>
            <p
              className="mt-0.5"
              style={{ fontSize: '12.5px', color: '#9e8f6e' }}
            >
                {userProfile?.signature || '记录微小，留下痕迹'}
            </p>
          </div>
        </div>

        <div
          className="grid grid-cols-3 text-center"
          style={{
            background: '#fef3c7',
            border: '1px solid rgba(245, 215, 110, 0.3)',
            borderRadius: '16px',
            padding: '11px 8px',
          }}
        >
          {[
            { value: loading ? '—' : profileSummary?.streakDays ?? 0, label: '连续天数' },
            { value: loading ? '—' : profileSummary?.totalRecords ?? 0, label: '总记录' },
            { value: loading ? '—' : profileSummary?.companionDays ?? 0, label: '陪伴天数' },
          ].map((item, idx) => (
            <div
              key={item.label}
              className="relative"
              style={{
                padding: idx === 0 ? '0 8px 0 0' : idx === 2 ? '0 0 0 8px' : '0 8px',
              }}
            >
              {idx < 2 && (
                <div
                  className="absolute top-1/2 right-0 -translate-y-1/2"
                  style={{
                   width: '1px',
                   height: '20px',
                   background: 'rgba(214, 178, 76, 0.25)',
                  }}
                />
              )}
               <div
                className="tabular-nums font-bold"
                style={{ fontSize: '18px', color: '#5d4e37', fontWeight: 600 }}
              >
                {item.value}
              </div>
               <div
                className="mt-1 text-xs"
                style={{ color: '#8b7d5c' }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 我的成就卡片 */}
      <div className="paper-card p-[12px_16px_12px_16px]" style={{ background: 'rgba(255, 255, 255, 0.65)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold font-sans-hei">我的成就</h3>
          <button
            onClick={() => navigate('/achievements')}
            className="text-sm text-primary font-medium font-sans-hei flex items-center gap-0.5 hover:text-primary/80 transition-colors"
          >
            查看全部
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {[0, 1].map((i) => (
              <div key={i} className="flex-shrink-0 w-[45%] h-20 rounded-2xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : achievements.length > 0 ? (
          <div className="achievement-scroll -mx-6 px-6">
            <div className="flex gap-3 overflow-x-auto pb-2 achievement-scroll-inner">
              {achievements.map((item) => {
                const Icon = iconMap[item.icon] ?? Trophy;
                const colors = categoryColors[item.category] ?? categoryColors.milestone;
                const achieved = item.isAchieved;
                const inProgress = !achieved && item.progress > 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => navigate('/achievements')}
                    className={`flex-shrink-0 w-[140px] rounded-xl p-[12px_8px] flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 ${
                      achieved
                        ? 'bg-white/90 border border-[rgba(217_234_224_0.95)] shadow-sm'
                        : inProgress
                        ? 'bg-muted/60'
                        : 'bg-muted/40'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        achieved
                          ? ''
                          : inProgress
                          ? 'opacity-60'
                          : 'bg-muted'
                      }`}
                      style={achieved || inProgress ? { backgroundColor: item.name === '三日坚持' ? '#fbf3f3' : colors.bgColor } : undefined}
                    >
                      {achieved || inProgress ? (
                        <Icon
                          className={`w-5 h-5 ${achieved ? '' : 'opacity-60'}`}
                          style={{ color: colors.textColor }}
                          strokeWidth={1.8}
                        />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground/40" strokeWidth={1.8} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h4
                        className={`text-sm font-medium truncate font-sans-hei ${
                          achieved ? 'text-foreground/80' : 'text-muted-foreground/60'
                        }`}
                      >
                        {item.name}
                      </h4>
                      <p
                        className={`text-xs mt-1 flex items-center gap-1 ${
                          achieved
                            ? 'text-primary'
                            : inProgress
                            ? 'text-accent'
                            : 'text-muted-foreground/50'
                        }`}
                      >
                        {achieved && <Check className="w-3 h-3" strokeWidth={2.5} />}
                        {achieved ? '已达成' : inProgress ? '进行中' : '未达成'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Trophy className="w-6 h-6 text-muted-foreground/50" strokeWidth={1.8} />
            </div>
            <p className="text-sm text-muted-foreground">还没有获得成就</p>
            <p className="text-xs text-muted-foreground/60 mt-1">开始记录，解锁第一个徽章吧</p>
          </div>
        )}
      </div>

      {/* 功能入口列表 */}
      <div className="paper-card p-[12px_16px_12px_16px]" style={{ background: 'rgba(255, 255, 255, 0.55)' }}>
        <h3 className="text-lg font-semibold font-sans-hei mb-3 px-1">常用功能</h3>
        <div className="flex flex-col">
          {quickMenuItems.map((item, idx) => (
            <button
              key={item.label}
              onClick={() => handleItemClick(item)}
              className="flex items-center gap-3 py-3 group cursor-pointer text-left w-full transition-all duration-200 hover:opacity-80"
              style={{
                borderBottom: idx < quickMenuItems.length - 1 ? '1px solid #edf4ee' : 'none',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.iconBg }}
              >
                <item.icon
                  className="w-5 h-5"
                  style={{ color: item.iconColor }}
                  strokeWidth={1.8}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-medium font-sans-hei" style={{ color: '#2e4e3f' }}>
                  {item.label}
                </div>
                <div className="text-sm mt-0.5" style={{ color: '#5C7467' }}>
                  {item.description}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>

      {/* 退出登录 */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="rounded-full font-medium transition-colors hover:opacity-90"
          style={{
            background: '#fff5f5',
            color: '#e55353',
            border: 'none',
            borderRadius: '20px',
            padding: '10px 32px',
            minWidth: '140px',
          }}
          onClick={logout}
        >
          退出登录
        </Button>
      </div>

        {/* 版本信息 */}
        <div className="text-center text-xs text-muted-foreground/50">
          <p>微迹 v1.0.0</p>
          <p className="mt-1">记录微小，留下痕迹</p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProfilePage;
