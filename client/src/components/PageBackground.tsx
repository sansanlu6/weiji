import { useEffect } from 'react';
import { Image } from '@client/src/components/ui/image';
import newDesktopBg from '@client/src/assets/bg-desktop-new.png';
import mobileAppBg from '@client/src/assets/mobile-app-bg.png';
import osmanthusBranch from '@client/src/assets/osmanthus-branch.png';

const OSMANTHUS_IMG = osmanthusBranch;

const PageBackground: React.FC = () => {
  useEffect(() => {
    const styleId = 'page-global-bg-style-v5';
    const existing = document.getElementById(styleId);
    if (existing) return;

    const oldIds = [
      'page-global-bg-style',
      'page-global-bg-style-v2',
      'page-global-bg-style-v3',
      'page-global-bg-style-v4',
    ];
    oldIds.forEach((id: string) => {
      const oldEl = document.getElementById(id);
      if (oldEl && oldEl.parentNode) oldEl.parentNode.removeChild(oldEl);
    });

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .page-bg-layer {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        z-index: 0;
        pointer-events: none;
        background-image: url(${mobileAppBg});
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        background-attachment: fixed;
        font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .page-bg-ambient {
        display: none;
      }

      .page-osmanthus {
        position: fixed !important;
        top: -45px !important;
        right: -55px !important;
        width: 320px !important;
        max-width: 78vw !important;
        opacity: 0.92 !important;
        pointer-events: none !important;
        z-index: 50 !important;
        transform-origin: top right !important;
        transform: scaleX(-1) rotate(15deg) !important;
      }

      .page-content-wrap {
        position: relative;
        z-index: 2;
      }

      .osmanthus-corner {
        opacity: 0.92;
      }

      @media (min-width: 768px) {
        .page-bg-layer {
          background-image: url(${newDesktopBg});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
        }

        .page-bg-ambient {
          display: none;
        }

        .page-osmanthus {
          display: none !important;
        }

        .osmanthus-corner {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <>
      <div className="page-bg-layer" aria-hidden="true" />
      <div className="page-bg-ambient page-bg-ambient-one" aria-hidden="true" />
      <div className="page-bg-ambient page-bg-ambient-two" aria-hidden="true" />
      <div className="page-osmanthus" aria-hidden="true">
        <Image
          src={OSMANTHUS_IMG}
          alt=""
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
          }}
        />
      </div>
    </>
  );
};

export default PageBackground;
