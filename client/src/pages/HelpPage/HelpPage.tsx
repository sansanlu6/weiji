import { ArrowLeft, HelpCircle, MessageCircle, BookOpen, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageBackground from '@client/src/components/PageBackground';

const helpItems = [
  { icon: BookOpen, label: '使用指南', desc: '了解产品功能与操作说明' },
  { icon: MessageCircle, label: '常见问题', desc: '快速找到问题解答' },
  { icon: Mail, label: '联系我们', desc: '有疑问随时联系客服' },
];

const HelpPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative h-full overflow-hidden font-sans-hei">
      <PageBackground />
      <div className="page-content-wrap relative h-full overflow-y-auto">
        <div className="space-y-6 relative z-10 py-2">
          <header className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center hover:bg-secondary/60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={1.8} />
            </button>
            <h1 className="text-lg font-bold tracking-tight font-sans-hei">帮助中心</h1>
          </header>

          <div className="h-[95px] p-[16px_24px_16px_24px] flex items-center rounded-2xl shadow-sm bg-[#fef9e7f2]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#fef3c7b3] border border-[#5d4e370f] flex items-center justify-center">
                <HelpCircle className="w-7 h-7" strokeWidth={1.8} style={{ color: '#5d4e37' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold font-sans-hei text-[#5d4e37]">需要帮助？</h2>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(76, 71, 62, 0.6)' }}>我们随时为您解答</p>
              </div>
            </div>
          </div>

          <div
            className="rounded-3xl shadow-sm p-2"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
          >
            {helpItems.map((item, index) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-secondary/60 transition-colors ${
                  index !== helpItems.length - 1 ? 'mb-0.5' : ''
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-[#c8e4cf80] flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5" strokeWidth={1.8} style={{ color: '#5bb979' }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base text-foreground font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center text-xs text-muted-foreground/50">
            <p>微迹 v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
