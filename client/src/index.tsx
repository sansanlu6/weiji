import React from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import RoutesComponent from './app.tsx';
import './index.css';

import { Toaster } from '@client/src/components/ui/sonner';

const CLIENT_BASE_PATH = '/';
const CHUNK_RELOAD_KEY = 'weiji:chunk-reload-at';
const CHUNK_RELOAD_GUARD_MS = 15_000;

// 新版本部署后，旧页面可能仍引用已经删除的哈希分包。Vite 会在动态导入
// 失败时派发此事件；带时间戳重新进入可绕过旧 HTML/分包缓存。
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();

  const now = Date.now();
  let canReload = true;

  try {
    const lastReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
    canReload = now - lastReloadAt > CHUNK_RELOAD_GUARD_MS;
    if (canReload) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
    }
  } catch {
    // 部分 WebView 会禁用 sessionStorage；仍允许执行一次普通恢复刷新。
  }

  if (!canReload) return;

  const freshUrl = new URL(window.location.href);
  freshUrl.searchParams.set('__app_reload', String(now));
  window.location.replace(freshUrl.toString());
});

window.setTimeout(() => {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    // sessionStorage 不可用时无需额外处理。
  }
}, CHUNK_RELOAD_GUARD_MS);

const MainApp = () => {
  return (
    <BrowserRouter basename={CLIENT_BASE_PATH}>
      <ErrorBoundary
        fallbackRender={() => (
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center px-6">
              <h2 className="text-lg font-semibold text-foreground">
                页面加载失败
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                请刷新页面后重试
              </p>

              <button
                type="button"
                className="mt-4 rounded-full bg-primary px-6 py-2 text-sm text-white"
                onClick={() => window.location.reload()}
              >
                重新加载
              </button>
            </div>
          </div>
        )}
      >
        <RoutesComponent />
        {createPortal(<Toaster />, document.body)}
      </ErrorBoundary>
    </BrowserRouter>
  );
};

document.title = '记录微小，留下痕迹';

createRoot(document.getElementById('root')!).render(<MainApp />);
