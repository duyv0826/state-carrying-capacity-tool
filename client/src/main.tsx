import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SessionProvider } from './store/session';
import { App } from './App';
import './styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('root 容器缺失');

createRoot(container).render(
  <StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </StrictMode>,
);
