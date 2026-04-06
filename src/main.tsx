import {StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Network } from '@capacitor/network';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { WifiOff } from 'lucide-react';

function Root() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const initCapacitor = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        await SplashScreen.hide();
      } catch (e) {
        console.warn('Capacitor plugins not available in web browser');
      }
    };

    const setupNetwork = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);

      Network.addListener('networkStatusChange', status => {
        setIsOnline(status.connected);
      });
    };

    initCapacitor();
    setupNetwork();
  }, []);

  return (
    <StrictMode>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-4 z-[100] flex items-center justify-center">
          <WifiOff className="w-3 h-3 mr-2" />
          Offline Mode
        </div>
      )}
      <App />
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
