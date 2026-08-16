import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './services/youtubePlaybackAdapter';
import { installYouTubePlaybackAdapter } from './services/youtubePlaybackAdapter';
import App from './App.tsx';
import './index.css';

installYouTubePlaybackAdapter();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
