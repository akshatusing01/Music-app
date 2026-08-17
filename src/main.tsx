import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { installYouTubePlaybackAdapter } from './services/youtubePlaybackAdapter';
import { installRoomPlaybackCoordinator } from './services/roomPlaybackCoordinator';
import App from './App.tsx';
import './index.css';

installYouTubePlaybackAdapter();
installRoomPlaybackCoordinator();

const root = document.getElementById('root');
if (!root) throw new Error('SyncBeat root element is missing');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
