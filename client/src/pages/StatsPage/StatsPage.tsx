import { useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import HalfYearView from './views/HalfYearView';
import YearView from './views/YearView';
import PageBackground from '@client/src/components/PageBackground';
import { Image } from '@client/src/components/ui/image';

type ViewKey = 'week' | 'month' | 'halfyear' | 'year';

interface TabOption {
  key: ViewKey;
  label: string;
}

const TABS: TabOption[] = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'halfyear', label: '近半年' },
  { key: 'year', label: '本年' },
];

const StatsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewKey>('week');

  const handleTabChange = (key: ViewKey): void => {
    logger.info(`[stats] switch tab: ${key}`);
    setActiveTab(key);
  };

  const renderView = (): React.ReactNode => {
    switch (activeTab) {
      case 'week':
        return <WeekView />;
      case 'month':
        return <MonthView />;
      case 'halfyear':
        return <HalfYearView />;
      case 'year':
        return <YearView />;
      default:
        return null;
    }
  };

  return (
    <div id="stats-page-root" className="relative min-h-screen overflow-visible">
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
      <div className="page-content-wrap space-y-6 relative z-[1]">
      <header>
        <h1 className="text-2xl font-bold tracking-tight font-title">
          统计看板
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
         多维度查看健康数据
        </p>
      </header>

      {/* 时间维度切换 */}
      {/* 时间维度切换 */}
      <div className="bg-[#fef9e7] rounded-2xl p-1.5 flex border border-[#f5d76e]/30 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex-1 py-2 text-base font-sans-hei rounded-xl transition-all duration-300 ${activeTab === tab.key ? 'bg-[#fef3c7] text-[#6b5a3e] shadow-sm font-semibold' : 'text-[#8b9d8f] hover:bg-[#fef0c4]/60 hover:text-[#6b5a3e] font-medium'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

        <div key={activeTab} className="transition-opacity duration-300 ease-out">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
