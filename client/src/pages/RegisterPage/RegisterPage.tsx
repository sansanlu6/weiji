import { User, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useState, forwardRef } from 'react';

import { Button } from '@client/src/components/ui/button';
import { Card } from '@client/src/components/ui/card';
import { useAuth } from '@client/src/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import loginBg from '@client/src/assets/login-bg.png';
import newDesktopBg from '@client/src/assets/bg-desktop-new.png';
import petal1 from '@client/src/assets/petals/petal1.png';
import petal2 from '@client/src/assets/petals/petal2.png';
import petal3 from '@client/src/assets/petals/petal3.png';
import { Image } from '@client/src/components/ui/image';


interface RoundedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
}

const RoundedInput = forwardRef<HTMLInputElement, RoundedInputProps>(
  ({ icon, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
        <div
           className={`relative flex items-center rounded-[24px] px-5 transition-all duration-250 ease-out ${focused ? 'bg-[#E5F0E7]' : 'bg-[#EFF5EF]'}`}
           style={{
             boxShadow: focused ? 'inset 0 2px 8px rgba(45, 90, 69, 0.06)' : 'none',
           }}
      >
        <span className={`mr-3 transition-colors shrink-0 ${focused ? 'text-[#3d6b51]' : 'text-[#8AA898]'}`}>
           {icon}
         </span>
        <input
          ref={ref}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
           className={`w-full bg-transparent border-none outline-none py-3.5 text-[15px] text-[#2d5a45] placeholder:text-[#9DB8AA] flex-1 ${className || ''}`}
        />
      </div>
    );
  },
);

RoundedInput.displayName = 'RoundedInput';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (!agreed) {
      setError('请先阅读并同意用户协议与隐私政策');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || '注册失败，请重试';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = username.trim() && password && confirmPassword && agreed;

  return (
     <div
       className="min-h-screen flex flex-col items-center px-4 py-10 relative overflow-hidden md:flex-row md:items-center md:justify-start md:px-0 md:py-0"
     >
       {/* 移动端背景 */}
       <div
         className="absolute inset-0 z-0 md:hidden"
         style={{
           backgroundImage: `url(${loginBg})`,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundRepeat: 'no-repeat',
         }}
       />
        {/* 桌面端背景 */}
        <div
          className="absolute inset-0 z-0 hidden md:block"
          style={{
            backgroundImage: `url(${newDesktopBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          }}
        />

       {/* 内容容器：移动端居中，桌面端左侧垂直居中 */}
        <div className="w-full max-w-[430px] mx-auto pt-[90px] relative z-10 md:mx-0 md:ml-[10%] md:pt-0">
         {/* 品牌标题 */}
          <div className="pointer-events-none mb-[30px]">
            <h1
              className="text-4xl font-bold leading-none tracking-[0.1em] m-[0px_12px_8px_12px]"
              style={{
                fontFamily: 'Noto Serif SC, Source Han Serif SC, Songti SC, serif',
                fontWeight: 800,
                color: '#0c5a2c',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)',
              }}
            >
              微迹
            </h1>
            <p
              className="text-base m-[0px_16px_0px_16px]"
              style={{
                color: '#6b8a78',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
              }}
            >
             记录微小，留下痕迹
           </p>
         </div>

         {/* 注册卡片 */}
         <div className="w-full">

         <Card
           className="rounded-[28px] px-8 pt-8 pb-6"
           style={{
             background: 'rgba(245, 250, 245, 0.85)',
             backdropFilter: 'blur(16px) saturate(1.1)',
             WebkitBackdropFilter: 'blur(16px) saturate(1.1)',
             boxShadow: '0 8px 32px rgba(45, 90, 69, 0.08), 0 2px 8px rgba(45, 90, 69, 0.04)',
             border: '1px solid rgba(255, 255, 255, 0.6)',
           }}
         >
          <div className="mb-6 pl-1">
            <h1 className="text-2xl font-bold mb-1.5 ml-[-4px]" style={{ fontFamily: 'Noto Serif SC, Source Han Serif SC, Songti SC, serif', color: '#115c29' }}>注册</h1>
            <p className="text-sm text-muted-foreground/80">加入微迹，开始记录你的生活</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <RoundedInput
              icon={<User size={18} strokeWidth={1.5} />}
              id="username"
              type="text"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />

            <div className="relative">
              <RoundedInput
                icon={<Lock size={18} strokeWidth={1.5} />}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码（至少6位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C9E94] hover:text-[#5a7264] transition-colors w-10 h-10 flex items-center justify-center"
                  tabIndex={-1}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="relative mt-4">
                <RoundedInput
                  icon={<Lock size={18} strokeWidth={1.5} />}
                  id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C9E94] hover:text-[#5a7264] transition-colors w-10 h-10 flex items-center justify-center"
                tabIndex={-1}
                aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex items-start gap-2">
               <button
                 type="button"
                 onClick={() => setAgreed(!agreed)}
                 className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0"
                 style={{
                   backgroundColor: agreed ? '#5bb979' : 'transparent',
                   border: agreed ? 'none' : '1.5px solid rgba(91, 185, 121, 0.3)',
                   color: 'white',
                 }}
                 aria-label={agreed ? '取消同意协议' : '同意协议'}
               >
                 {agreed && <Check size={12} strokeWidth={3} />}
               </button>
               <p className="text-sm leading-relaxed" style={{ color: '#2c7e46' }}>
                 注册即同意
                 <Link to="/agreement/user" className="hover:underline" style={{ color: '#2c7e46', fontWeight: 500 }} target="_blank" rel="noopener noreferrer">
                  《用户协议》
                </Link>
                与
                 <Link to="/agreement/privacy" className="hover:underline" style={{ color: '#2c7e46', fontWeight: 500 }} target="_blank" rel="noopener noreferrer">
                  《隐私政策》
                </Link>
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-[24px] text-[16px] font-semibold text-white transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:hover:shadow-none"
              style={{
                 backgroundColor: '#5bb979',
                 boxShadow: canSubmit
                   ? '0 4px 12px rgba(91, 185, 121, 0.25), 0 8px 24px rgba(91, 185, 121, 0.15)'
                   : 'none',
                 border: 'none',
               }}
               onMouseEnter={(e) => {
                 if (canSubmit) {
                   e.currentTarget.style.boxShadow = '0 6px 16px rgba(91, 185, 121, 0.3), 0 12px 28px rgba(91, 185, 121, 0.18)';
                 }
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.boxShadow = canSubmit
                   ? '0 4px 12px rgba(91, 185, 121, 0.25), 0 8px 24px rgba(91, 185, 121, 0.15)'
                   : 'none';
               }}
               onMouseDown={(e) => {
                 if (canSubmit) {
                   e.currentTarget.style.boxShadow = '0 2px 6px rgba(91, 185, 121, 0.25), 0 4px 12px rgba(91, 185, 121, 0.15)';
                 }
               }}
               onMouseUp={(e) => {
                 if (canSubmit) {
                   e.currentTarget.style.boxShadow = '0 6px 16px rgba(91, 185, 121, 0.3), 0 12px 28px rgba(91, 185, 121, 0.18)';
                 }
               }}
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? '注册中...' : '注册'}
            </Button>

            <div className="flex justify-between items-center pt-1">
               <span className="text-sm" style={{ color: '#8AA898' }}>已有账号？</span>
               <Link to="/login" className="text-sm font-medium hover:underline" style={{ color: '#126b2e' }}>
                 返回登录
               </Link>
            </div>
          </form>
        </Card>
         </div>
       </div>

       {/* 桂花花瓣装饰 - 移动端右下 */}
       <div
         className="absolute bottom-0 right-0 pointer-events-none z-0 overflow-hidden md:hidden"
         style={{ width: '260px', height: '200px' }}
       >
         <Image
           src={petal1}
           alt=""
           className="absolute"
           style={{
             width: '24px',
             bottom: '24px',
             right: '32px',
             transform: 'rotate(20deg)',
             opacity: 0.95,
             filter: 'drop-shadow(0 2px 4px rgba(180, 120, 0, 0.15))',
           }}
         />
         <Image
           src={petal2}
           alt=""
           className="absolute"
           style={{
             width: '18px',
             bottom: '100px',
             right: '70px',
             transform: 'rotate(-25deg)',
             opacity: 0.85,
             filter: 'drop-shadow(0 2px 4px rgba(180, 120, 0, 0.12))',
           }}
         />
         <Image
           src={petal3}
           alt=""
           className="absolute"
           style={{
             width: '21px',
             bottom: '60px',
             right: '160px',
             transform: 'rotate(50deg)',
             opacity: 0.9,
             filter: 'drop-shadow(0 2px 4px rgba(180, 120, 0, 0.12))',
           }}
         />
       </div>

       {/* 桂花花瓣装饰 - 桌面端左下 */}
       <div
         className="absolute bottom-0 left-0 pointer-events-none z-0 overflow-hidden hidden md:block"
         style={{ width: '260px', height: '200px' }}
       >
         <Image
           src={petal1}
           alt=""
           className="absolute"
           style={{
             width: '24px',
             bottom: '24px',
             left: '32px',
             transform: 'rotate(-20deg)',
             opacity: 0.95,
             filter: 'drop-shadow(0 2px 4px rgba(180, 120, 0, 0.15))',
           }}
         />
         <Image
           src={petal2}
           alt=""
           className="absolute"
           style={{
             width: '18px',
             bottom: '100px',
             left: '70px',
             transform: 'rotate(25deg)',
             opacity: 0.85,
             filter: 'drop-shadow(0 2px 4px rgba(180, 120, 0, 0.12))',
           }}
         />
         <Image
           src={petal3}
           alt=""
           className="absolute"
           style={{
             width: '21px',
             bottom: '60px',
             left: '160px',
             transform: 'rotate(-50deg)',
             opacity: 0.9,
             filter: 'drop-shadow(0 2px 4px rgba(180, 120, 0, 0.12))',
           }}
         />
       </div>
     </div>
  );
}
