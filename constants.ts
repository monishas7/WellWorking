
import { AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  waterInterval: 35,
  breakWorkDuration: 60,
  breakDuration: 5,
  postureInterval: 75,
  startHour: 9,
  endHour: 19,
  notificationsEnabled: true,
  isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
};

export const BREATHING_PHASES = [
  { text: 'Inhale...', duration: 4000 },
  { text: 'Hold...', duration: 2000 },
  { text: 'Exhale...', duration: 4000 },
  { text: 'Wait...', duration: 2000 },
];
