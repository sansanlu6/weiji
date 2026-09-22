import { useEffect, useMemo } from 'react';
import petal1 from '@client/src/assets/petals/petal1.png';
import petal2 from '@client/src/assets/petals/petal2.png';
import petal3 from '@client/src/assets/petals/petal3.png';
import { Image } from '@client/src/components/ui/image';

const PETAL_IMAGES = [petal1, petal2, petal3];

interface PetalConfig {
  id: number;
  src: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotateStart: number;
  rotateRange: number;
  swayRange: number;
  opacity: number;
}

const PetalFall: React.FC = () => {
  const petals = useMemo<PetalConfig[]>(() => {
    const result: PetalConfig[] = [];
    const count = 12;
    for (let i = 0; i < count; i += 1) {
      result.push({
        id: i,
        src: PETAL_IMAGES[i % PETAL_IMAGES.length],
        left: Math.random() * 100,
        delay: -(Math.random() * 14),
        duration: 10 + Math.random() * 8,
        size: 14 + Math.random() * 12,
        rotateStart: Math.random() * 360,
        rotateRange: 180 + Math.random() * 180,
        swayRange: 30 + Math.random() * 40,
        opacity: 0.6 + Math.random() * 0.35,
      });
    }
    return result;
  }, []);

  useEffect(() => {
    const styleId = 'petal-fall-global-style';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .petal-fall-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 4;
        overflow: hidden;
      }

      .petal-fall-item {
        position: fixed;
        top: -60px;
        display: block;
        animation: petal-fall-anim linear infinite forwards;
        will-change: transform, opacity;
      }

      .petal-fall-item > img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: transparent !important;
        filter: drop-shadow(0 1px 2px rgba(180, 120, 0, 0.15));
      }

      @keyframes petal-fall-anim {
        0% {
          transform: translateY(-10vh) translateX(0) rotate(var(--petal-rs, 0deg));
          opacity: 0;
        }
        10% {
          opacity: var(--petal-op, 0.75);
        }
        25% {
          transform: translateY(25vh) translateX(var(--petal-sw, 30px)) rotate(calc(var(--petal-rs, 0deg) + var(--petal-rr, 180deg) * 0.25));
        }
        50% {
          transform: translateY(50vh) translateX(0) rotate(calc(var(--petal-rs, 0deg) + var(--petal-rr, 180deg) * 0.5));
        }
        75% {
          transform: translateY(75vh) translateX(calc(var(--petal-sw, 30px) * -1)) rotate(calc(var(--petal-rs, 0deg) + var(--petal-rr, 180deg) * 0.75));
        }
        90% {
          opacity: var(--petal-op, 0.75);
        }
        100% {
          transform: translateY(110vh) translateX(0) rotate(calc(var(--petal-rs, 0deg) + var(--petal-rr, 180deg)));
          opacity: 0;
        }
      }

      @media (min-width: 768px) {
        .petal-fall-container {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="petal-fall-container" aria-hidden="true">
      {petals.map((petal: PetalConfig) => (
        <div
          key={petal.id}
          className="petal-fall-item"
          style={{
            left: `${petal.left}%`,
            animationDelay: `${petal.delay}s`,
            animationDuration: `${petal.duration}s`,
            width: `${petal.size}px`,
            height: `${petal.size}px`,
            '--petal-rs': `${petal.rotateStart}deg` as unknown as string,
            '--petal-rr': `${petal.rotateRange}deg` as unknown as string,
            '--petal-sw': `${petal.swayRange}px` as unknown as string,
            '--petal-op': String(petal.opacity),
          }}
        >
          <Image src={petal.src} alt="" />
        </div>
      ))}
    </div>
  );
};

export default PetalFall;
