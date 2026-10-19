import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Ensure service workers update cleanly on new deploys without wiping active notification/PWA workers
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const registration of registrations) {
        if (import.meta.env.DEV && registration.active?.scriptURL.includes('/dev-sw.js')) {
          registration.unregister().catch(() => {});
        } else {
          registration.update().catch(() => {});
        }
      }
    })
    .catch(() => {});
}

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
