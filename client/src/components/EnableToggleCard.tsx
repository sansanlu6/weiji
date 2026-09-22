import { BellRing, BellOff } from 'lucide-react';

interface EnableToggleCardProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  title?: string;
  subtitleOn?: string;
  subtitleOff?: string;
  className?: string;
}

const EnableToggleCard: React.FC<EnableToggleCardProps> = ({
  enabled,
  onChange,
  title = '启用提醒',
  subtitleOn = '开启后将在设定时间提醒你',
  subtitleOff = '提醒已关闭，不会收到通知',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-3 transition-all duration-300 text-left w-full ${className}`}
      style={{
        padding: '14px 16px',
        borderRadius: '16px',
        backgroundColor: enabled ? '#fef3c7' : '#f5f5f5',
        border: enabled ? '1.5px solid rgba(245, 215, 110, 0.4)' : '1.5px solid #e8e8e8',
      }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0 transition-colors duration-300"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          backgroundColor: enabled ? '#ffffff' : '#ebebeb',
        }}
      >
        {enabled ? (
          <BellRing
            className="w-5 h-5"
            style={{ color: '#6b5a3e' }}
            strokeWidth={1.8}
          />
        ) : (
          <BellOff
            className="w-5 h-5"
            style={{ color: '#999999' }}
            strokeWidth={1.8}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="font-sans-hei font-semibold"
          style={{
            color: enabled ? '#6b5a3e' : '#777777',
            fontSize: '14px',
          }}
        >
          {title}
        </div>
        <div
          className="font-sans-hei"
          style={{
            color: enabled ? '#9e8f6e' : '#aaaaaa',
            fontSize: '12px',
            marginTop: '2px',
          }}
        >
          {enabled ? subtitleOn : subtitleOff}
        </div>
      </div>
      <div
        className="flex-shrink-0 transition-all duration-300 relative"
        style={{
          width: '44px',
          height: '26px',
          borderRadius: '13px',
            backgroundColor: enabled ? '#6b5a3e' : '#cccccc',
            boxShadow: enabled
              ? '0 2px 8px rgba(107, 90, 62, 0.25)'
              : 'none',
        }}
      >
        <div
          className="absolute top-0.5 transition-all duration-300"
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            left: enabled ? '20px' : '2px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
          }}
        />
      </div>
    </button>
  );
};

export default EnableToggleCard;
