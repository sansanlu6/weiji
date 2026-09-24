import { useState, useEffect } from 'react';
import {
  Droplets,
  Droplet,
  Smile,
  Activity,
  Plus,
  Flame,
  Moon,
  ChevronRight,
  Utensils,
  MoonStar,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { useNavigate } from 'react-router-dom';
import { sleepApi } from '@client/src/api';
import type { TodayOverview, RecentRecord, RecordType } from '@shared/api.interface';
import { RECORD_META } from '@client/src/utils/record-constants';
import { useAuth } from '@client/src/contexts/AuthContext';
import ToiletIcon from '@client/src/components/icons/ToiletIcon';
import dayjs from 'dayjs';

import MoodDialog from '@client/src/components/record-dialogs/MoodDialog';
import ExerciseDialog from '@client/src/components/record-dialogs/ExerciseDialog';
import PainDialog from '@client/src/components/record-dialogs/PainDialog';
import WaterDialog from '@client/src/components/record-dialogs/WaterDialog';
import PageBackground from '@client/src/components/PageBackground';
import { Image } from '@client/src/components/ui/image';
import osmanthusBranch from '@client/src/assets/osmanthus-branch.png';

const quickActions = [
  { type: 'water' as const, icon: Droplet, label: '喝水', bg: 'var(--color-water-soft)', color: 'var(--color-water)' },
  { type: 'diet' as const, icon: Utensils, label: '饮食', bg: '#f5f0e8', color: '#b8956a' },
  { type: 'sleep' as const, icon: MoonStar, label: '睡眠', bg: 'var(--color-sleep-soft)', color: 'var(--color-sleep)' },
  { type: 'poop' as const, icon: ToiletIcon, label: '排便', bg: '#e8f0ec', color: '#7ba89a' },
];

const moduleColorMap: Record<string, { bg: string; color: string }> = {
  water: { bg: 'var(--color-water-soft)', color: 'var(--color-water)' },
  mood: { bg: 'var(--color-joy-soft)', color: 'var(--color-joy)' },
  exercise: { bg: 'var(--color-vitality-soft)', color: 'var(--color-vitality)' },
  pain: { bg: 'var(--color-care-soft)', color: 'var(--color-care)' },
  diet: { bg: '#f5f0e8', color: '#b8956a' },
  sleep: { bg: 'var(--color-sleep-soft)', color: 'var(--color-sleep)' },
  medication: { bg: 'var(--color-care-soft)', color: 'var(--color-care)' },
  poop: { bg: '#e8f0ec', color: '#7ba89a' },
};

interface HomePageCacheEntry {
  overview: TodayOverview;
  recent: RecentRecord[];
  cachedAt: number;
}

const HOME_CACHE_TTL_MS = 2 * 60 * 1000;
const homePageCache = new Map<string, HomePageCacheEntry>();

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const cachedAtMount = user?.id ? homePageCache.get(user.id) : undefined;
  const initialCache =
    cachedAtMount && Date.now() - cachedAtMount.cachedAt < HOME_CACHE_TTL_MS
      ? cachedAtMount
      : undefined;
  const [overview, setOverview] = useState<TodayOverview | null>(
    initialCache?.overview ?? null,
  );
  const [recent, setRecent] = useState<RecentRecord[]>(
    initialCache?.recent ?? [],
  );
  const [loading, setLoading] = useState(!initialCache);
  const [error, setError] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<RecordType | null>(null);

  const fetchData = async (): Promise<void> => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const [ov, rec] = await Promise.all([
        sleepApi.getTodayOverview(),
        sleepApi.getRecentRecords(10),
      ]);
      setOverview(ov);
      setRecent(rec);
      homePageCache.set(user.id, {
        overview: ov,
        recent: rec,
        cachedAt: Date.now(),
      });
    } catch (err) {
      logger.error('加载首页数据失败', err as Error);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const cached = homePageCache.get(user.id);
    if (cached && Date.now() - cached.cachedAt < HOME_CACHE_TTL_MS) {
      setOverview(cached.overview);
      setRecent(cached.recent);
      setError(null);
      setLoading(false);
      return;
    }

    void fetchData();
  }, [isAuthenticated, user?.id]);

  const openDialog = (type: RecordType): void => {
    setDialogType(type);
  };

  const handleDialogSuccess = (): void => {
    setDialogType(null);
    void fetchData();
  };

  const handleDialogClose = (): void => {
    setDialogType(null);
  };

  const waterPercent = overview?.waterTarget
    ? Math.min(100, Math.round((overview.waterCups / overview.waterTarget) * 100))
    : 0;

  const sleepPercent = overview?.sleepTarget
    ? Math.min(100, Math.round((overview.sleepMinutes / overview.sleepTarget) * 100))
    : 0;

  const streakDays = overview?.streakDays ?? 0;
  const weekdayMap = ['日', '一', '二', '三', '四', '五', '六'];
  const today = `${dayjs().month() + 1}月${dayjs().date()}日 周${weekdayMap[dayjs().day()]}`;

  return (
    <>
      <style>{`
        :root {
          --color-ink: #123f36;
          --color-brand: #176958;
          --color-brand-strong: #0f5445;
          --color-brand-soft: #d7eee0;
          --color-page: #f7faf5;
          --color-page-warm: #fffdf8;
          --color-surface: #ffffff;
          --color-surface-tint: #f4fbf6;
          --color-border: #dcebe1;
          --color-text-muted: #6f8c80;

          --color-water: #398fc2;
          --color-water-soft: #e0f2fb;
          --color-joy: #d99127;
          --color-joy-soft: #fff0cf;
          --color-vitality: #4c9c63;
          --color-vitality-soft: #e2f3df;
          --color-care: #d96f70;
          --color-care-soft: #fde8e7;
          --color-sleep: #8269c7;
          --color-sleep-soft: #eee9fa;

          --radius-card: 18px;
          --radius-pill: 999px;
          --border-subtle: 1px solid rgba(217,234,224,.95);
          --shadow-card: 0 8px 18px rgba(31,97,72,.045);
          --shadow-card-hover: 0 13px 23px rgba(26,106,75,.14);
          --motion-card: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
        }

        #home-page-root {
          position: relative;
          z-index: 1;
        }

        .home-mobile-canvas {
          position: relative;
          z-index: 1;
          width: min(100%, 520px);
          min-height: calc(100vh - 48px);
          margin: 0 auto;
          padding: 29px 0 100px;
          box-sizing: border-box;
        }

        .home-intro {
          position: relative;
          z-index: 1;
          padding: 4px 2px 2px;
        }

        .home-intro::before {
          content: '';
          position: absolute;
          top: -20px;
          left: -20px;
          width: 140px;
          height: 140px;
          background: radial-gradient(circle, rgba(168,216,184,.12) 0%, rgba(168,216,184,0) 70%);
          pointer-events: none;
          z-index: 0;
        }

        .home-brand-title {
          font-family: 'Noto Serif SC', 'Source Han Serif CN', '思源宋体', 'SimSun', 'STSong', 'Times New Roman', Times, serif;
          font-size: 36px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.04em;
          color: #164e42;
          margin: 0;
        }

        .home-brand-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 10px;
          position: relative;
          z-index: 1;
        }

        .home-brand-subtitle {
          font-size: 14px;
          color: rgba(23,105,88,.85);
          font-style: italic;
          font-weight: 500;
          margin: 0;
          letter-spacing: 0.01em;
        }

        .home-brand-sep {
          color: #8c9e94;
          font-size: 12px;
          line-height: 1;
        }

        .home-brand-date {
          color: #6f8c80;
          font-weight: 400;
          margin: 0;
        }

        @media (min-width: 768px) {
          .home-brand-title {
            font-weight: 800;
          }

          .home-brand-meta {
            flex-direction: row;
            align-items: center;
            gap: 10px;
          }

          .home-brand-date::before {
            content: '';
            display: inline-block;
            width: 1px;
            height: 10px;
            background: rgba(111,140,128,.35);
            margin-right: 10px;
            vertical-align: middle;
          }
        }

        .home-moment-card {
          margin-top: 20px;
          padding: 20px 16px 18px;
          border: 1px solid rgba(255,255,255,.95);
          border-radius: 20px;
          background: linear-gradient(145deg, rgba(255,255,255,.96), rgba(244,251,246,.88));
          box-shadow: 0 15px 35px rgba(28,89,67,.11);
          position: relative;
          z-index: 1;
        }

        .home-moment-title {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--color-ink);
          margin: 0;
          font-family: var(--font-sans-hei);
        }

        .home-streak-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 11px;
          border-radius: var(--radius-pill);
          background: #fff3d8;
        }

        .home-streak-badge-text {
          font-size: 12px;
          font-weight: 700;
          color: #76540f;
        }

        .home-streak-badge-num {
          color: #dc991e;
        }

        .home-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          padding: 26px 0 19px;
          text-align: center;
        }

        .home-stat-num {
          font-size: 22px;
          line-height: 1;
          font-weight: 600;
          letter-spacing: -0.04em;
          color: var(--color-ink);
          font-variant-numeric: tabular-nums;
        }

        .home-stat-label {
          font-size: 11px;
          color: var(--color-text-muted);
          white-space: nowrap;
          margin-top: 6px;
        }

        .home-progress-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 11px;
        }

        .home-progress-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .home-progress-label-text {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #41695d;
          font-weight: 500;
        }

        .home-progress-value {
          font-size: 12px;
          color: #41695d;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .home-progress-value strong {
          color: #2e6859;
          font-weight: 600;
        }

        .home-progress-track {
          height: 7px;
          border-radius: var(--radius-pill);
          background: #e3eee6;
          overflow: hidden;
        }

        .home-progress-fill-water {
          height: 100%;
          border-radius: var(--radius-pill);
          background: linear-gradient(90deg, #4aabd2 0%, #65bf95 100%);
          transition: width 0.3s ease;
        }

        .home-progress-fill-sleep {
          height: 100%;
          border-radius: var(--radius-pill);
          background: linear-gradient(90deg, #c7b8eb 0%, #a58cdb 100%);
          transition: width 0.3s ease;
        }

        .home-quick-section {
          margin-top: 25px;
          position: relative;
          z-index: 1;
        }

        .home-section-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--color-ink);
          margin: 0;
          font-family: var(--font-sans-hei);
        }

        .home-quick-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 11px;
          margin-top: 16px;
        }

        .home-quick-card {
          padding: 15px 3px 13px;
          border: none;
          border-radius: var(--radius-card);
          background: color-mix(in srgb, var(--color-surface) 65%, transparent);
          box-shadow: var(--shadow-card);
          cursor: pointer;
          transition: var(--motion-card);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .home-quick-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-card-hover);
        }

        .home-quick-card:active {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(31,97,72,.07);
        }

        .home-quick-icon-wrap {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 9px;
        }

        .home-quick-label {
          font-size: 13px;
          color: #416b5e;
          text-align: center;
        }

        .home-trail-section {
          margin-top: 25px;
          position: relative;
          z-index: 1;
        }

        .home-trail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .home-see-all {
          font-size: 11px;
          font-weight: 600;
          color: #1c715d;
          display: flex;
          align-items: center;
          gap: 2px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .home-empty-card {
          min-height: 168px;
          margin-top: 17px;
          border: var(--border-subtle);
          border-radius: var(--radius-card);
          background: rgba(255,255,255,.82);
          box-shadow: 0 10px 22px rgba(31,93,69,.045);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          box-sizing: border-box;
        }

        .home-empty-plus {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #dff0e3;
          color: #28735f;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          cursor: pointer;
          border: 1px solid rgba(217,234,224,.95);
          font-size: 29px;
          box-shadow: 0 8px 18px rgba(31,97,72,.045);
          transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
        }

        .home-empty-plus:hover {
          transform: translateY(-3px);
          box-shadow: 0 13px 23px rgba(26,106,75,.14);
          border-color: #d7eee0;
        }

        .home-empty-plus:active {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(31,97,72,.07);
        }

        .home-empty-title {
          font-size: 13px;
          font-weight: 500;
          color: #507a6b;
          margin: 0;
        }

        .home-empty-desc {
          font-size: 11px;
          color: #8da89c;
          margin-top: 6px;
          margin-bottom: 0;
        }

        .home-record-list {
          margin-top: 17px;
          border: var(--border-subtle);
          border-radius: var(--radius-card);
          background: rgba(255,255,255,.9);
          box-shadow: 0 10px 22px rgba(31,93,69,.045);
          overflow: hidden;
        }

        .home-record-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 16px;
          border-bottom: 1px solid rgba(217,234,224,.6);
          transition: background-color 200ms ease;
          cursor: pointer;
          font-family: var(--font-sans-hei);
        }

        .home-record-item:last-child {
          border-bottom: none;
        }

        .home-record-item:hover {
          background: var(--color-surface-tint);
        }

        .home-record-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .home-record-content {
          flex: 1;
          min-width: 0;
        }

        .home-record-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .home-record-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-brand);
          margin: 0;
          font-family: var(--font-sans-hei);
        }

        .home-record-time {
          font-size: 12px;
          color: var(--color-text-muted);
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
          font-family: var(--font-sans-hei);
        }

        .home-record-summary {
          font-size: 13px;
          color: var(--color-text-muted);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: var(--font-sans-hei);
        }

        .home-bottom-nav {
          position: fixed;
          z-index: 4;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: min(100%, 470px);
          height: 75px;
          padding: 8px 20px;
          box-sizing: border-box;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid #d9e9df;
          background: rgba(248,253,248,.9);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .home-nav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          background: none;
          border: none;
          color: #86a398;
          font-size: 11px;
          cursor: pointer;
          padding: 0;
          text-decoration: none;
        }

        .home-nav-btn.active {
          color: var(--color-brand);
          font-weight: 700;
        }

        .home-nav-icon {
          width: 20px;
          height: 20px;
        }

        .home-loading, .home-error {
          padding: 32px 0;
          text-align: center;
          color: var(--color-text-muted);
          font-size: 13px;
        }

        .home-retry-btn {
          background: none;
          border: none;
          color: var(--color-brand);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          margin-top: 12px;
        }

        /* 桂花枝 */
        .osmanthus-corner {
          position: absolute;
          z-index: 0;
          top: -45px;
          right: -55px;
          width: 320px;
          max-width: 78vw;
          opacity: 0.9;
          pointer-events: none;
          transform-origin: top right;
          transform: translateX(-100%) scaleX(-1) rotate(15deg);
        }
        .osmanthus-img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: contain;
        }

      `}</style>

      <div id="home-page-root">
        <PageBackground />

        {/* 右上角桂花枝 */}
        <div className="osmanthus-corner" aria-hidden="true">
          <Image
            src={osmanthusBranch}
            alt=""
            className="osmanthus-img"
          />
        </div>

        <div className="home-mobile-canvas">
          {/* 顶部标题区 */}
          <header className="home-intro">
            <h1 className="home-brand-title">微迹</h1>
            <div className="home-brand-meta">
              <p className="home-brand-subtitle">记录微小，留下痕迹</p>
              <p className="home-brand-date text-sm">{today}</p>
            </div>
          </header>

          {/* 今日概览卡片 */}
          <section className="home-moment-card">
            <div className="flex items-start justify-between">
              <h2 className="home-moment-title">今日概览</h2>
              <div className="home-streak-badge">
                <Flame size={14} color="#dc991e" strokeWidth={1.8} />
                <span className="home-streak-badge-text tabular-nums">
                  {streakDays} <span className="home-streak-badge-num">天</span>
                </span>
              </div>
            </div>

            {loading ? (
              <div className="home-loading">加载中...</div>
            ) : error ? (
              <div className="home-error">
                <div>{error}</div>
                <button className="home-retry-btn" onClick={() => void fetchData()}>
                  重试
                </button>
              </div>
            ) : (
              <>
                <div className="home-stats-row">
                  <div>
                    <div className="home-stat-num">{overview?.recordCount ?? 0}</div>
                    <div className="home-stat-label">今日记录</div>
                  </div>
                  <div>
                    <div className="home-stat-num">{overview?.waterCups ?? 0}</div>
                    <div className="home-stat-label">喝水(杯)</div>
                  </div>
                  <div>
                    <div className="home-stat-num">{overview?.exerciseMinutes ?? 0}</div>
                    <div className="home-stat-label">运动(分)</div>
                  </div>
                  <div>
                    <div className="home-stat-num">
                      {overview ? Math.floor(overview.sleepMinutes / 60) : 0}
                    </div>
                    <div className="home-stat-label">睡眠(时)</div>
                  </div>
                </div>

                <div className="home-progress-section">
                  {/* 喝水进度 */}
                  <div>
                    <div className="home-progress-label">
                      <div className="home-progress-label-text">
                        <Droplets size={16} color="var(--color-water)" strokeWidth={1.8} />
                        喝水目标
                      </div>
                      <div className="home-progress-value">
                        <strong>{overview?.waterCups ?? 0}</strong> / {overview?.waterTarget ?? 8} 杯
                      </div>
                    </div>
                    <div className="home-progress-track">
                      <div
                        className="home-progress-fill-water"
                        style={{ width: `${waterPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 睡眠进度 */}
                  {overview && overview.sleepTarget > 0 && (
                    <div>
                      <div className="home-progress-label">
                        <div className="home-progress-label-text">
                          <Moon size={16} color="var(--color-sleep)" strokeWidth={1.8} />
                          睡眠目标
                        </div>
                        <div className="home-progress-value">
                          <strong>{sleepPercent}</strong>%
                        </div>
                      </div>
                      <div className="home-progress-track">
                        <div
                          className="home-progress-fill-sleep"
                          style={{ width: `${sleepPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          {/* 快捷记录 */}
          <section className="home-quick-section">
            <h2 className="home-section-title">快捷记录</h2>
            <div className="home-quick-grid">
              {quickActions.map(({ type, icon: Icon, label, bg, color }) => (
                <button
                  key={type}
                  className="home-quick-card"
                  onClick={() => navigate(`/records/${type}?new=1`)}
                >
                  <div className="home-quick-icon-wrap" style={{ background: bg }}>
                    <Icon size={24} color={color} strokeWidth={1.8} />
                  </div>
                  <span className="home-quick-label">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 最近记录 */}
          <section className="home-trail-section">
            <div className="home-trail-header">
              <h2 className="home-section-title">最近记录</h2>
              <button className="home-see-all" onClick={() => navigate('/data')}>
                查看全部
                <ChevronRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="home-empty-card">
                <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  加载中...
                </div>
              </div>
            ) : recent.length === 0 ? (
              <div className="home-empty-card">
                <button
                  className="home-empty-plus"
                  onClick={() => navigate('/records')}
                >
                  <Plus size={28} strokeWidth={1.8} />
                </button>
                <p className="home-empty-title">今天还没有记录哦</p>
                <p className="home-empty-desc">点击上方快捷记录开始吧</p>
              </div>
            ) : (
              <div className="home-record-list">
                {recent.map((record) => {
                  const meta = RECORD_META[record.type];
                  const Icon = meta.icon;
                  const mc = moduleColorMap[record.type] || { bg: '#eef5f0', color: 'var(--color-brand)' };
                  return (
                    <div key={`${record.type}-${record.id}`} className="home-record-item">
                      <div className="home-record-icon" style={{ background: mc.bg }}>
                        <Icon size={20} color={mc.color} strokeWidth={1.8} />
                      </div>
                      <div className="home-record-content">
                        <div className="home-record-top">
                          <p className="home-record-name">
                            {record.typeLabel || meta.name}
                          </p>
                          <span className="home-record-time">
                            {dayjs(record.time).format('HH:mm')}
                          </span>
                        </div>
                        <p className="home-record-summary">{record.summary}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Dialogs */}
      {dialogType === 'water' && (
        <WaterDialog open={true} onClose={handleDialogClose} onSuccess={handleDialogSuccess} />
      )}
      {dialogType === 'mood' && (
        <MoodDialog open={true} onClose={handleDialogClose} onSuccess={handleDialogSuccess} />
      )}
      {dialogType === 'exercise' && (
        <ExerciseDialog open={true} onClose={handleDialogClose} onSuccess={handleDialogSuccess} />
      )}
      {dialogType === 'pain' && (
        <PainDialog open={true} onClose={handleDialogClose} onSuccess={handleDialogSuccess} />
      )}
    </>
  );
};

export default HomePage;
