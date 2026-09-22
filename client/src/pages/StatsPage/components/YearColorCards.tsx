interface YearColorCardsProps {
  topMood: string;
  topMoodCount: number;
  negativePeakMonth: string;
  negativePeakCount: number;
  totalExercise: number;
}

const YearColorCards: React.FC<YearColorCardsProps> = ({
  topMood,
  topMoodCount,
  negativePeakMonth,
  negativePeakCount,
  totalExercise,
}) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* 平静绿 */}
      <div
        className="rounded-xl p-4 flex flex-col justify-between min-h-[128px] shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #2F9E6E 0%, #4CC392 100%)',
        }}
      >
        <div className="text-base text-white/80 font-medium">平静绿</div>
        <div>
          <div className="text-2xl font-semibold text-white tabular-nums leading-tight">
            {topMoodCount}
            <span className="text-sm font-normal ml-1">天</span>
          </div>
          <div className="text-xs text-white/70 mt-1">
            主导情绪 · {topMood}
          </div>
        </div>
      </div>

      {/* 焦虑蓝 */}
      <div
        className="rounded-xl p-4 flex flex-col justify-between min-h-[128px] shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #6FA8DC 0%, #9BC7F0 100%)',
        }}
      >
        <div className="text-base text-white/80 font-medium">焦虑蓝</div>
        <div>
          <div className="text-2xl font-semibold text-white tabular-nums leading-tight">
            {negativePeakMonth}
          </div>
          <div className="text-xs text-white/70 mt-1">
            {negativePeakCount}次峰值 · 季节性特征
          </div>
        </div>
      </div>

      {/* 活力橙 */}
      <div
        className="rounded-xl p-4 flex flex-col justify-between min-h-[128px] shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #E8966B 0%, #F4B393 100%)',
        }}
      >
        <div className="text-base text-white/80 font-medium">活力橙</div>
        <div>
          <div className="text-2xl font-semibold text-white tabular-nums leading-tight">
            {totalExercise}
            <span className="text-sm font-normal ml-1">次</span>
          </div>
          <div className="text-xs text-white/70 mt-1">全年运动</div>
        </div>
      </div>
    </div>
  );
};

export default YearColorCards;
