import React from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import RoutesComponent from './app.tsx';
import './index.css';

import { Toaster } from '@client/src/components/ui/sonner';

const CLIENT_BASE_PATH = '/';

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