
export enum ReminderType {
  WATER = 'WATER',
  BREAK = 'BREAK',
  POSTURE = 'POSTURE'
}

export interface AppSettings {
  waterInterval: number; // minutes
  breakWorkDuration: number; // minutes
  breakDuration: number; // minutes
  postureInterval: number; // minutes
  startHour: number; // 0-23
  endHour: number; // 0-23
  notificationsEnabled: boolean;
  isDarkMode: boolean;
}

export interface TimerState {
  remainingSeconds: number;
  totalSeconds: number;
  isActive: boolean;
  lastTick: number;
}

export interface AppStats {
  waterCount: number;
  breaksCount: number;
  postureCount: number;
  date: string;
}
