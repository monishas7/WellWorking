
export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') return true;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  static notify(title: string, body: string, icon: string = '💧') {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${icon}</text></svg>`,
        });
      } catch (err) {
        console.error('Notification error:', err);
      }
    }
  }
}
