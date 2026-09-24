import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplet, Moon, Dumbbell, Pencil, ChevronLeft } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { goalsApi, sleepApi } from '@client/src/api';
import type { GoalItem, TodayOverview } from '@shared/api.interface';
import GoalEditDialog from '@client/src/components/GoalEditDialog';
import PageBackground from '@client/src/components/PageBackground';
import { Image } from '@client/src/components/ui/image';
import type { LucideIcon } from 'lucide-react';
import osmanthusBranch from '@client/src/assets/osmanthus-branch.png';

interface GoalDisplayConfig {
  goalType: string;
  title: string;
  description: string;
  unit: string;
  period: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  progressLabel: string;
  progressColor: string;
  getProgress: (overview: TodayOverview, goal: GoalItem | undefined) => number;
  getCurrentText: (overview: TodayOverview, goal: GoalItem | undefined) => string;
  getTargetText: (goal: GoalItem | undefined) => string;
}

const goalConfigs: GoalDisplayConfig[] = [
  {
    goalType: 'water',
    title: '喝水目标',
    description: '每日饮水目标',
    unit: '杯',
    period: 'daily',
    icon: Droplet,
    iconBg: 'rgba(210, 232, 245, 0.6)',
    iconColor: '#4a90b8',
    progressLabel: '今日已饮',
    progressColor: '#5ba8c9',
    getProgress: (overview, goal) => {
      if (!goal || goal.targetValue <= 0) return 0;
      return Math.min(100, Math.round((overview.waterCups / goal.targetValue) * 100));
    },
    getCurrentText: (overview) => String(overview.waterCups),
    getTargetText: (goal) => String(goal?.targetValue ?? 8),
  },
  {
    goalType: 'sleep',
    title: '睡眠目标',
    description: '每日睡眠目标',
    unit: '小时',
    period: 'daily',
    icon: Moon,
    iconBg: 'rgba(200, 200, 230, 0.5)',
    iconColor: '#6b6b9e',
    progressLabel: '昨晚睡眠',
    progressColor: '#7d7db5',
    getProgress: (overview, goal) => {
      if (!goal || goal.targetValue <= 0) return 0;
      const hours = overview.sleepMinutes / 60;
      return Math.min(100, Math.round((hours / goal.targetValue) * 100));
    },
    getCurrentText: (overview) => (overview.sleepMinutes / 60).toFixed(1),
    getTargetText: (goal) => String(goal?.targetValue ?? 8),
  },
  {
    goalType: 'exercise',
    title: '运动目标',
    description: '每周运动目标',
    unit: '次',
    period: 'weekly',
    icon: Dumbbell,
    iconBg: 'rgba(200, 230, 200, 0.6)',
    iconColor: '#5a8a5a',
    progressLabel: '本周已完成',
    progressColor: '#6ba36b',
    getProgress: (_overview, goal) => {
      if (!goal || goal.targetValue <= 0) return 0;
      return 0;
    },
    getCurrentText: () => '0',
    getTargetText: (goal) => String(goal?.targetValue ?? 3),
  },
];

const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [overview, setOverview] = useState<TodayOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<GoalDisplayConfig | null>(null);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [goalList, ov] = await Promise.all([
        goalsApi.getGoals(),
        sleepApi.getTodayOverview(),
      ]);
      setGoals(goalList);
      setOverview(ov);
    } catch (err) {
      logger.error('加载目标数据失败', err as Error);
      toast.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleEdit = (config: GoalDisplayConfig): void => {
    setEditingConfig(config);
    setEditOpen(true);
  };

  const findGoal = (goalType: string): GoalItem | undefined =>
    goals.find((g: GoalItem) => g.goalType === goalType);

  if (loading) {
    return (
      <div className="relative min-h-screen font-sans-hei overflow-visible">
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
               onClick={() => navigate(-1)}
               className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-secondary/60 transition-colors"
               aria-label="返回"
             >
               <ChevronLeft
                 className="w-5 h-5"
                 style={{ color: '#2a483a' }}
                 strokeWidth={1.8}
               />
             </button>
             <div>
               <h1 className="text-lg font-bold tracking-tight font-sans-hei" style={{ color: '#2a483a' }}>
                 目标管理
               </h1>
               <p className="text-xs mt-0.5" style={{ color: '#85998d' }}>
                 设定目标，稳步前行
               </p>
             </div>
           </header>
           <div className="space-y-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '24px',
                  height: '180px',
                  boxShadow: '0 8px 32px rgba(42, 72, 58, 0.06)',
                }}
              />
            ))}
          </div>
         </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen font-sans-hei overflow-visible">
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
      {/* 标题 */}
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-secondary/60 transition-colors"
          aria-label="返回"
        >
          <ChevronLeft
            className="w-5 h-5"
            style={{ color: '#2a483a' }}
            strokeWidth={1.8}
          />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight font-sans-hei" style={{ color: '#2a483a' }}>
            目标管理
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#85998d' }}>
            设定目标，稳步前行
          </p>
        </div>
      </header>

        <div className="space-y-5">
          {goalConfigs.map((config) => {
            const goal = findGoal(config.goalType);
            const current = overview ? config.getCurrentText(overview, goal) : '0';
            const target = config.getTargetText(goal);
            const progress = overview ? config.getProgress(overview, goal) : 0;
            const Icon = config.icon;

            return (
              <div
                key={config.goalType}
                className="overflow-hidden"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.55)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  borderRadius: '24px',
                  boxShadow: '0 8px 32px rgba(42, 72, 58, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                }}
                data-ai-section-type="card-list"
              >
                <div
                  className="flex items-center gap-3"
                  style={{ padding: '16px 20px' }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: config.iconBg,
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: config.iconColor }}
                      strokeWidth={1.8}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-base font-semibold font-sans-hei"
                      style={{ color: '#2a483a' }}
                    >
                      {config.title}
                    </h3>
                    <p
                      className="text-xs whitespace-nowrap"
                      style={{ color: '#85998d', marginTop: '2px' }}
                    >
                      {config.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEdit(config)}
                    className="flex items-center gap-1.5 rounded-full text-sm font-sans-hei transition-colors flex-shrink-0"
                    style={{
                      padding: '8px 16px',
                       backgroundColor: '#fef3c7bf',
                      color: '#6b5a3e',
                      border: '1px solid rgba(245, 215, 110, 0.3)',
                      boxShadow: '0 2px 6px rgba(214, 178, 76, 0.1)',
                    }}
                  >
                    <Pencil className="w-4 h-4" strokeWidth={1.8} style={{ width: '18px', height: '18px', color: '#6b5a3e' }} />
                    编辑
                  </button>
                </div>

                <div
                  style={{
                    borderTop: '1px solid rgba(200, 220, 208, 0.4)',
                    padding: '18px 20px',
                  }}
                >
                  <div className="flex items-baseline justify-between mb-3">
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-2xl font-semibold tabular-nums"
                        style={{ color: '#2a483a' }}
                      >
                        {current}
                      </span>
                      <span className="text-sm" style={{ color: '#85998d' }}>
                        / {target} {config.unit}
                      </span>
                    </div>
                    <span className="text-sm" style={{ color: '#637a6d' }}>
                      {progress}%
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{
                      height: '8px',
                      backgroundColor: 'rgba(222, 235, 226, 0.6)',
                    }}
                  >
                    <div
                      className="transition-all duration-500 rounded-full"
                      style={{
                        width: `${progress}%`,
                        height: '100%',
                        backgroundColor: config.progressColor,
                      }}
                    />
                  </div>
                  <p
                    className="text-xs mt-2"
                    style={{ color: '#85998d' }}
                  >
                    {config.progressLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {editingConfig && (
          <GoalEditDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            goalType={editingConfig.goalType}
            goalTitle={editingConfig.title}
            unit={editingConfig.unit}
            period={editingConfig.period}
            currentValue={Number(editingConfig.getTargetText(findGoal(editingConfig.goalType)))}
            onSaved={() => {
              void fetchData();
            }}
          />
        )}
       </div>
       </div>
     </div>
   );
};

export default GoalsPage;
