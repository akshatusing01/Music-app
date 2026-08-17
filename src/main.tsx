import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { installYouTubePlaybackAdapter } from './services/youtubePlaybackAdapter';
import { installRoomPlaybackCoordinator } from './services/roomPlaybackCoordinator';
import App from './App.tsx';
import { AuthController } from './components/AuthController';
import './index.css';

installYouTubePlaybackAdapter();
installRoomPlaybackCoordinator();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <AuthController />
  </StrictMode>,
);