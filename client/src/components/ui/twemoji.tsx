import { useMemo } from 'react';

interface TwemojiProps {
  emoji: string;
  size?: number;
  className?: string;
}

const codePointAt = (str: string): number => {
  const code = str.charCodeAt(0);
  if (code >= 0xd800 && code <= 0xdbff) {
    const high = code - 0xd800;
    const low = str.charCodeAt(1) - 0xdc00;
    return (high << 10) + low + 0x10000;
  }
  return code;
};

const toCodePoints = (emoji: string): string => {
  const codes: string[] = [];
  let i = 0;
  while (i < emoji.length) {
    const cp = codePointAt(emoji.slice(i));
    codes.push(cp.toString(16));
    if (cp > 0xffff) {
      i += 2;
    } else {
      i += 1;
    }
  }
  return codes.join('-');
};

const Twemoji: React.FC<TwemojiProps> = ({ emoji, size = 24, className = '' }) => {
  const src = useMemo(() => {
    const code = toCodePoints(emoji);
    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${code}.svg`;
  }, [emoji]);

  return (
    <img
      src={src}
      alt={emoji}
      className={`inline-block align-middle ${className}`}
      style={{ width: size, height: size, verticalAlign: 'middle' }}
      draggable={false}
      onError={(e) => {
        const target = e.currentTarget;
        target.style.display = 'none';
        if (target.nextElementSibling) {
          (target.nextElementSibling as HTMLElement).style.display = 'inline';
        }
      }}
    />
  );
};

export default Twemoji;
