import { LocalNotifications } from '@capacitor/local-notifications';
import { githubService } from './githubService';
import { useAuthStore } from '../stores/useAuthStore';

export const notificationService = {
  requestPermissions: async () => {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  },

  scheduleNotification: async (title: string, body: string, extra: any) => {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Math.floor(Math.random() * 1000000),
          extra,
          smallIcon: 'res://ic_stat_name', // Ensure this exists or use default
          iconColor: '#488AFF',
        },
      ],
    });
  },

  checkNewNotifications: async () => {
    const session = useAuthStore.getState().session;
    if (!session) return;

    try {
      const notifications = await githubService.getNotifications();
      const lastChecked = localStorage.getItem('last_notification_check');
      const lastCheckedDate = lastChecked ? new Date(lastChecked) : new Date(0);

      // Filter for new unread notifications since last check
      const newNotifications = notifications.filter(n => {
        const updatedAt = new Date(n.updated_at);
        return n.unread && updatedAt > lastCheckedDate;
      });

      for (const n of newNotifications) {
        let deepLink = '';
        const repoFullName = n.repository.full_name;
        
        if (n.subject.type === 'Commit') {
          const commitSha = n.subject.url.split('/').pop();
          deepLink = `/repo/${repoFullName}/commit/${commitSha}`;
        } else {
          deepLink = `/repo/${repoFullName}`;
        }

        await notificationService.scheduleNotification(
          n.subject.title,
          `${n.reason.replace(/_/g, ' ')} in ${repoFullName}`,
          { url: deepLink }
        );
      }

      localStorage.setItem('last_notification_check', new Date().toISOString());
    } catch (error) {
      console.error('Failed to check notifications:', error);
    }
  },

  init: async (navigate: (url: string) => void) => {
    await notificationService.requestPermissions();

    // Handle notification clicks
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const url = action.notification.extra?.url;
      if (url) {
        navigate(url);
      }
    });

    // Initial check
    await notificationService.checkNewNotifications();

    // Periodic check every 5 minutes
    setInterval(() => {
      notificationService.checkNewNotifications();
    }, 5 * 60 * 1000);
  }
};
