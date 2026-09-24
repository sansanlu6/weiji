import { useState } from 'react';
import { Lock, LogOut, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import PageBackground from '@client/src/components/PageBackground';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleBack = (): void => {
    navigate('/profile', { replace: true });
  };

  const handleChangePassword = (): void => {
    setShowChangePwd(true);
  };

  const handleBackFromPassword = (): void => {
    setShowChangePwd(false);
  };

  const handleSubmitPassword = (e: React.FormEvent): void => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写所有密码字段');
      return;
    }
    if (newPassword.length < 6) {
      setError('新密码至少 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    logger.info('修改密码提交');
    setSuccess('密码修改成功');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setShowChangePwd(false), 1200);
  };

  const confirmLogout = (): void => {
    logger.info('退出登录');
    setShowLogoutConfirm(false);
  };

  const menuItems = [
    {
      label: '修改密码',
      icon: Lock,
      iconBg: 'bg-module-sleep-bg',
      iconColor: '#5C6BC0',
      labelColor: '#2e4e3f',
      onClick: handleChangePassword,
    },
    {
      label: '退出登录',
      icon: LogOut,
      iconBg: 'bg-module-pain-bg',
      iconColor: '#D64848',
      labelColor: '#2e4e3f',
      onClick: () => setShowLogoutConfirm(true),
    },
  ];

  if (showChangePwd) {
    return (
      <div className="relative h-full overflow-hidden font-sans-hei">
        <PageBackground />
        <div className="page-content-wrap relative h-full overflow-y-auto">
          <div className="space-y-6 relative z-10 py-2">
            <header className="flex items-center gap-3">
              <button
                onClick={handleBackFromPassword}
                className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-secondary/60 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={1.8} />
              </button>
              <h1 className="text-lg font-bold tracking-tight font-sans-hei">修改密码</h1>
            </header>

            <form
              onSubmit={handleSubmitPassword}
              className="rounded-3xl shadow-sm p-6 space-y-5"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
              }}
            >
              <div className="space-y-2">
                <label className="text-sm text-foreground font-medium">原密码</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="请输入原密码"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-foreground font-medium">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="至少 6 位"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-foreground font-medium">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-primary">{success}</p>}
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-white font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ backgroundColor: '#5bb979' }}
              >
                确认修改
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden font-sans-hei">
      <PageBackground />
      <div className="page-content-wrap relative h-full overflow-y-auto">
        <div className="space-y-6 relative z-10 py-2">
          <header className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-secondary/60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={1.8} />
            </button>
            <h1 className="text-lg font-bold tracking-tight font-sans-hei">设置</h1>
          </header>

          <div className="paper-card overflow-hidden p-2" style={{ background: 'rgba(255, 255, 255, 0.6)' }}>
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-secondary/60 transition-colors ${
                  index !== menuItems.length - 1 ? 'mb-0.5' : ''
                }`}
              >
                <div className={`w-11 h-11 rounded-2xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <item.icon className="w-5 h-5" style={{ color: item.iconColor }} strokeWidth={1.8} />
                </div>
                <span className="flex-1 text-left text-base font-medium" style={{ color: item.labelColor }}>
                  {item.label}
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground/50" strokeWidth={1.8} />
              </button>
            ))}
          </div>

          <div className="text-center text-xs text-muted-foreground/50">
            <p>微迹 v1.0.0</p>
          </div>

          <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
            <AlertDialogContent className="rounded-2xl max-w-[90%] sm:max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-sans-hei">确认退出登录吗？</AlertDialogTitle>
                <AlertDialogDescription>
                  退出后需要重新登录才能查看您的健康记录
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-full">取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmLogout}
                  className="rounded-full bg-module-pain text-white hover:bg-module-pain/90"
                >
                  确认退出
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
