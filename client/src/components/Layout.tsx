import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, ClipboardList, BarChart3, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import PetalFall from '@client/src/components/PetalFall';

const scrollPositions = new Map<string, number>();

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/records', label: '记录', icon: ClipboardList },
  { path: '/stats', label: '统计', icon: BarChart3 },
  { path: '/profile', label: '我的', icon: User },
];

const Layout = () => {
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef<string>(location.pathname);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    const currentPath = location.pathname;
    const container = scrollRef.current;

    if (!container) {
      prevPathRef.current = currentPath;
      return;
    }

    const prevBase = prevPath.split('/').slice(0, 2).join('/');
    const currentBase = currentPath.split('/').slice(0, 2).join('/');
    const isBackToSameSection = prevBase === currentBase || currentBase === '';
    const savedPos = scrollPositions.get(currentPath);

    if (savedPos !== undefined && isBackToSameSection && currentPath !== prevPath) {
      requestAnimationFrame(() => {
        container.scrollTop = savedPos;
      });
    } else {
      container.scrollTop = 0;
    }

    scrollPositions.set(prevPath, container.scrollTop);
    prevPathRef.current = currentPath;
  }, [location.pathname]);

  const handleScroll = () => {
    if (scrollRef.current) {
      scrollPositions.set(location.pathname, scrollRef.current.scrollTop);
    }
  };

  return (
    <div className="h-screen h-dvh flex flex-col bg-background">
      <main
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0 md:pl-[128px] overscroll-behavior-y-none"
      >
        <PetalFall />
        <div className="max-w-[520px] md:mx-0 mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-xl border-t border-primary/10 shadow-[0_-4px_20px_rgba(35_78_60_0.06)] md:hidden z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);
            return (
              <NavLink
                key={path}
                to={path}
                replace
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-xs mt-1 font-medium">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 bg-white/50 backdrop-blur-xl flex-col z-40 shadow-[2px_0_16px_rgba(35_78_60_0.06)] border-r border-white/40">
        <nav className="flex-1 p-2 pt-8 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);
            return (
               <NavLink
                 key={path}
                 to={path}
                 replace
                 className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all duration-300 text-xs ${
                   isActive
                     ? 'text-[#274737] font-semibold'
                     : 'text-[#5a6f62] hover:text-[#274737] opacity-60 hover:opacity-100'
                 }`}
                 style={{
                   fontFamily: '"Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
                 }}
                >
                   <div
                     className="relative flex items-center justify-center w-9 h-9"
                     style={{
                       transform: isActive ? 'scale(1.1) translateY(-2px)' : 'scale(1) translateY(0)',
                       transformOrigin: 'center center',
                       transition: 'transform 300ms ease',
                     }}
                   >
                     {isActive && (
                       <motion.div
                         layoutId="activeNavBackground"
                         className="absolute inset-0 rounded-xl"
                         style={{
                           backgroundColor: '#e8f4ea',
                           boxShadow:
                             '0 2px 8px rgba(39, 71, 55, 0.08), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 0 0 1px rgba(255,255,255,0.5)',
                         }}
                         transition={{ type: 'spring', stiffness: 400, damping: 26, mass: 0.8 }}
                       />
                     )}
                     <Icon
                       size={18}
                       strokeWidth={isActive ? 2.5 : 2}
                       style={{
                         color: isActive ? '#274737' : '#5a6f62',
                         transition: 'color 300ms ease',
                         display: 'block',
                         lineHeight: 0,
                       }}
                       className="relative z-10"
                     />
                   </div>
                 <span>{label}</span>
               </NavLink>
            );
          })}
        </nav>
      </aside>
    </div>
  );
};

export default Layout;
