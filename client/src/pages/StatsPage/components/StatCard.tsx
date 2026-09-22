interface StatCardProps {
  value: string | number;
  label: string;
  bgClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, bgClass = '' }) => (
  <div
    className={`flex flex-col items-center justify-center rounded-[14px] py-3 px-3 h-[80px] ${bgClass}`}
    style={{
      background: 'rgba(255, 255, 255, 0.65)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 4px 20px rgba(39, 71, 55, 0.04)',
    }}
  >
    <div className="text-xl font-bold tabular-nums font-sans-hei leading-none" style={{ color: '#3d6a4f' }}>
      {value}
    </div>
    <div className="text-sm mt-2.5 font-sans-hei font-medium" style={{ color: 'rgba(46, 90, 62, 0.6)' }}>
      {label}
    </div>
  </div>
);

export default StatCard;
