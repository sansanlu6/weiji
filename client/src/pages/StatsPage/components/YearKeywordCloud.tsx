interface YearKeywordCloudProps {
  keywords: { word: string; count: number; category: string }[];
}

const NEGATIVE_MOOD_WORDS = new Set([
  '焦虑', '低落', '烦躁', '疲惫', '失落', '惊恐', '愤怒', '紧张',
]);

type KeywordTone = 'positive' | 'neutral' | 'mid' | 'negative';

function getTone(word: string, category: string): KeywordTone {
  if (category === 'pain') return 'negative';
  if (category === 'mood' && NEGATIVE_MOOD_WORDS.has(word)) return 'negative';
  return 'neutral';
}

function getSizeClass(rank: number): string {
  if (rank <= 1) return 'text-lg font-semibold px-4 py-2';
  if (rank <= 4) return 'text-base font-medium px-3 py-1.5';
  return 'text-sm px-2.5 py-1';
}

function getColorClass(tone: KeywordTone, rank: number): string {
  if (tone === 'negative') {
    return 'bg-[#F28E90]/15 text-[#C94A4D] border border-[#F28E90]/30';
  }
  if (tone === 'positive' || rank <= 1) {
    return 'bg-[#2F9E6E]/10 text-[#2F9E6E] border border-[#2F9E6E]/20';
  }
  if (rank <= 4) {
    return 'bg-[#9CCC65]/15 text-[#5A8F30] border border-[#9CCC65]/30';
  }
  return 'bg-[#F4B393]/15 text-[#C46A3D] border border-[#F4B393]/30';
}

const YearKeywordCloud: React.FC<YearKeywordCloudProps> = ({ keywords }) => {
  const topKeywords = [...keywords]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="p-4 rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.66)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(39, 71, 55, 0.04)' }}>
      <div className="mb-4">
        <h3 className="text-lg font-sans-hei font-semibold text-foreground">年度关键词</h3>
        <p className="text-sm text-muted-foreground mt-0.5">全年记录中的高频标签</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {topKeywords.map((item: { word: string; count: number; category: string }, index: number) => {
          const tone = getTone(item.word, item.category);
          const sizeClass = getSizeClass(index);
          const colorClass = getColorClass(tone, index);
          return (
            <span
              key={`${item.word}-${index}`}
              className={`rounded-full inline-flex items-center gap-1 ${sizeClass} ${colorClass} transition-all duration-200`}
            >
              <span>{item.word}</span>
              <span className="text-xs opacity-70 tabular-nums">{item.count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default YearKeywordCloud;
