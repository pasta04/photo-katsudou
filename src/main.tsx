import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { requestPersistentStorage } from './lib/platform';
import { applyTheme } from './lib/theme';
import { listenInstallPrompt } from './store/install';
import { useSettings } from './store/settings';
import './styles.css';

applyTheme(useSettings.getState().theme);
useSettings.subscribe((state, prev) => {
  if (state.theme !== prev.theme) applyTheme(state.theme);
});

listenInstallPrompt();
requestPersistentStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
