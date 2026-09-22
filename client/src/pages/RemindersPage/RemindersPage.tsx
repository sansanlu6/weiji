import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplet, Pill, Activity, Plus, Pencil, Trash2, Bell, BellRing, BellOff, ChevronLeft } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { remindersApi } from '@client/src/api';
import { Button } from '@client/src/components/ui/button';
import ReminderEditDialog from '@client/src/components/ReminderEditDialog';
import PageBackground from '@client/src/components/PageBackground';
import { Image } from '@client/src/components/ui/image';
import type { ReminderItem } from '@shared/api.interface';
import type { LucideIcon } from 'lucide-react';

type ReminderType = 'water' | 'medication' | 'activity';

interface ReminderCategory {
  key: ReminderType;
  title: string;
  description: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

const categories: ReminderCategory[] = [
  {
    key: 'water',
    title: '喝水提醒',
    description: '定时提醒补充水分',
    icon: Droplet,
    bgColor: '#e0f2fe',
    iconColor: '#0ea5e9',
  },
  {
    key: 'medication',
    title: '吃药提醒',
    description: '提醒按时服药',
    icon: Pill,
    bgColor: '#fce7f3',
    iconColor: '#ec4899',
  },
  {
    key: 'activity',
    title: '活动提醒',
    description: '久坐提醒起身活动',
    icon: Activity,
    bgColor: '#fef3c7',
    iconColor: '#f59e0b',
  },
];

const getRepeatLabel = (reminder: ReminderItem): string => {
  switch (reminder.repeatType) {
    case 'daily':
      return '每天';
    case 'weekly': {
      const dayMap: Record<string, string> = {
        mon: '一',
        tue: '二',
        wed: '三',
        thu: '四',
        fri: '五',
        sat: '六',
        sun: '日',
      };
      const days = reminder.repeatDays.map((d: string) => dayMap[d] ?? d).join('、');
      return `每周${days}`;
    }
    case 'interval':
      return `每 ${reminder.repeatInterval} 天`;
    default:
      return '';
  }
};

type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);
  const [dialogType, setDialogType] = useState<ReminderType>('water');

  const navigate = useNavigate();

  const [notifPermission, setNotifPermission] =
    useState<NotificationPermissionState>('default');

  const fetchReminders = async (): Promise<void> => {
    try {
      setLoading(true);
      const list = await remindersApi.getReminders();
      setReminders(list);
    } catch (err) {
      logger.error('加载提醒失败', err as Error);
      toast.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReminders();
  }, []);

  useEffect(() => {
    if (typeof Notification === 'undefined') {
      setNotifPermission('unsupported');
      return;
    }
    setNotifPermission(Notification.permission as NotificationPermissionState);
  }, []);

  const handleAdd = (type: ReminderType): void => {
    setEditingReminder(null);
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleEdit = (reminder: ReminderItem): void => {
    setEditingReminder(reminder);
    setDialogType(reminder.reminderType as ReminderType);
    setDialogOpen(true);
  };

  const handleToggle = async (id: string): Promise<void> => {
    try {
      const updated = await remindersApi.toggleReminder(id);
      setReminders((prev) =>
        prev.map((r: ReminderItem) => (r.id === id ? updated : r)),
      );
    } catch (err) {
      logger.error('切换提醒状态失败', err as Error);
      toast.error('操作失败，请稍后重试');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await remindersApi.deleteReminder(id);
      setReminders((prev) => prev.filter((r: ReminderItem) => r.id !== id));
      toast.success('已删除');
    } catch (err) {
      logger.error('删除提醒失败', err as Error);
      toast.error('删除失败，请稍后重试');
    }
  };

  const requestNotificationPermission = async (): Promise<void> => {
    if (typeof Notification === 'undefined') {
      toast.error('当前浏览器不支持通知');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setNotifPermission(result as NotificationPermissionState);
      if (result === 'granted') {
        toast.success('通知已开启');
      } else if (result === 'denied') {
        toast.error('通知权限被拒绝，请到浏览器设置中开启');
      }
    } catch (err) {
      logger.error('请求通知权限失败', err as Error);
      toast.error('请求权限失败');
    }
  };

  const getRemindersByType = (type: ReminderType): ReminderItem[] =>
    reminders.filter((r: ReminderItem) => r.reminderType === type);

  const totalCount = reminders.length;

  const getNotifButtonContent = (): {
     icon: LucideIcon;
     text: string;
     onClick?: () => void;
     className: string;
     style?: React.CSSProperties;
     disabled: boolean;
   } => {
    switch (notifPermission) {
      case 'granted':
        return {
          icon: BellRing,
          text: '通知已开启',
          className: 'bg-primary/10 text-primary',
          disabled: true,
        };
       case 'denied':
         return {
           icon: BellOff,
           text: '通知已被拒绝，请到浏览器设置开启',
           className: '',
           style: {
             backgroundColor: '#fcf8f2',
             color: '#9e7a3b',
           },
           disabled: true,
         };
      case 'unsupported':
        return {
          icon: BellOff,
          text: '当前浏览器不支持通知',
          className: 'bg-muted text-muted-foreground',
          disabled: true,
        };
      default:
        return {
          icon: Bell,
          text: '开启浏览器通知',
          onClick: requestNotificationPermission,
          className: 'bg-primary text-white hover:bg-primary/90',
          disabled: false,
        };
    }
  };

  const notifBtn = getNotifButtonContent();
  const NotifIcon = notifBtn.icon;

  if (loading) {
    return (
      <div className="page-content-wrap relative">
       <div className="space-y-6 relative z-10 font-sans-hei">
        <header className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-secondary/60 transition-colors"
            aria-label="返回"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" strokeWidth={1.8} />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight font-sans-hei">提醒设置</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              开启后将在设定时间提醒
            </p>
          </div>
        </header>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="paper-card p-6 h-28 animate-pulse"
            />
          ))}
        </div>
       </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen font-sans-hei">
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
          src="https://aka.doubaocdn.com/s/9jIrYowigU"
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
           <ChevronLeft className="w-5 h-5 text-foreground" strokeWidth={1.8} />
         </button>
         <div>
           <h1 className="text-lg font-bold tracking-tight font-sans-hei">提醒设置</h1>
           <p className="text-xs text-muted-foreground mt-0.5">
             开启后将在设定时间提醒
           </p>
         </div>
       </header>

      {/* 浏览器通知授权按钮 */}
       <button
         onClick={notifBtn.onClick}
         disabled={notifBtn.disabled}
         style={notifBtn.style}
         className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-colors shadow-sm ${notifBtn.className} ${notifBtn.disabled ? 'cursor-default' : 'cursor-pointer'}`}
       >
        <NotifIcon className="w-4 h-4" strokeWidth={1.8} />
        {notifBtn.text}
      </button>

      {/* 分组列表 */}
      <div className="space-y-5">
        {categories.map((cat) => {
          const list = getRemindersByType(cat.key);
          const Icon = cat.icon;
          return (
             <div
               key={cat.key}
               className="overflow-hidden"
               data-ai-section-type="card-list"
               style={{
                 backgroundColor: 'rgba(255, 255, 255, 0.55)',
                 backdropFilter: 'blur(14px)',
                 WebkitBackdropFilter: 'blur(14px)',
                 borderRadius: '24px',
                 border: '1px solid rgba(255, 255, 255, 0.5)',
                 boxShadow: '0 8px 32px rgba(42, 72, 58, 0.06)',
               }}
             >
              {/* 分组头部 */}
               <div className="px-5 py-4 flex items-center gap-3">
                 <div
                   className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cat.bgColor }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: cat.iconColor }}
                      strokeWidth={1.8}
                    />
                  </div>
                <div className="flex-1 min-w-0">
                   <h3 className="text-base font-semibold text-foreground font-sans-hei">
                    {cat.title}
                  </h3>
                   <p className="text-xs text-muted-foreground truncate">
                    {cat.description}
                  </p>
                </div>
                 <button
                   onClick={() => handleAdd(cat.key)}
                   className="flex items-center gap-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ffffffbf',
                      color: '#2a483a',
                    }}
                 >
                   <Plus className="w-4 h-4" style={{ width: '18px', height: '18px' }} />
                   新增
                 </button>
              </div>

              {/* 提醒项列表 */}
              {list.length > 0 ? (
                 <div className="border-t border-border/50">
                    {list.map((reminder, idx) => (
                      <div
                        key={reminder.id}
                         className={`px-5 py-2.5 flex items-start gap-3 ${
                           idx !== list.length - 1
                             ? 'border-b border-border/50'
                             : ''
                         }`}
                       >
                         <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1">
                            {reminder.timePoints.map((tp, i) => (
                              <span
                                key={i}
                                className="text-[11px] font-medium leading-tight"
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: reminder.isEnabled
                                    ? '#eaf3ed'
                                    : '#f0f0f0',
                                  color: reminder.isEnabled ? '#2a483a' : '#888',
                                }}
                              >
                                {tp}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground/80 mt-1">
                            {getRepeatLabel(reminder)}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleToggle(reminder.id)}
                            className="transition-all duration-300 flex items-center gap-1.5 font-sans-hei"
                            style={{
                              padding: '5px 12px 5px 8px',
                              borderRadius: '999px',
                              backgroundColor: reminder.isEnabled ? '#fef3c7' : '#f0f0f0',
                              border: reminder.isEnabled
                                ? '1.5px solid rgba(245, 215, 110, 0.4)'
                                : '1.5px solid #e0e0e0',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: reminder.isEnabled ? '#6b5a3e' : '#888888',
                            }}
                          >
                            <div
                              className="transition-all duration-300 flex items-center justify-center"
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: reminder.isEnabled ? '#6b5a3e' : '#cccccc',
                              }}
                            >
                              {reminder.isEnabled ? (
                                <BellRing
                                  className="w-3 h-3"
                                  style={{ color: '#ffffff' }}
                                  strokeWidth={2}
                                />
                              ) : (
                                <BellOff
                                  className="w-3 h-3"
                                  style={{ color: '#ffffff' }}
                                  strokeWidth={2}
                                />
                              )}
                            </div>
                            {reminder.isEnabled ? '已开启' : '已关闭'}
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(reminder)}
                              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                              aria-label="编辑"
                            >
                              <Pencil className="w-4 h-4" strokeWidth={1.8} />
                            </button>
                            <button
                              onClick={() => handleDelete(reminder.id)}
                              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                              aria-label="删除"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                 <div className="border-t border-border/50 px-5 py-6 text-center">
                  <p className="text-sm text-muted-foreground font-sans-hei">
                    暂无提醒，点击右上角添加
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ReminderEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reminder={editingReminder}
        defaultType={dialogType}
        onSaved={() => {
          void fetchReminders();
        }}
      />
    </div>
     </div>
     </div>
   );
};

export default RemindersPage;
