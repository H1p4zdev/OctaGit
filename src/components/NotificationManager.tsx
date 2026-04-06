import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from '../stores/useAuthStore';

export function NotificationManager() {
  const navigate = useNavigate();
  const session = useAuthStore(state => state.session);

  useEffect(() => {
    if (session) {
      notificationService.init(navigate);
    }
  }, [session, navigate]);

  return null;
}
