
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppSettings, TimerState, ReminderType, AppStats } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { NotificationService } from './services/NotificationService';
import { StatusCard } from './components/StatusCard';
import { BreathingExercise } from './components/BreathingExercise';

const App: React.FC = () => {
  // --- State ---
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('wellworking_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [stats, setStats] = useState<AppStats>(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem('wellworking_stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) return parsed;
    }
    return { waterCount: 0, breaksCount: 0, postureCount: 0, date: today };
  });

  const [isAppActive, setIsAppActive] = useState(false);
  const [isMeetingMode, setIsMeetingMode] = useState(false);
  const [isTakingBreak, setIsTakingBreak] = useState(false);
  
  const [waterTimer, setWaterTimer] = useState<TimerState>({ 
    remainingSeconds: DEFAULT_SETTINGS.waterInterval * 60, 
    totalSeconds: DEFAULT_SETTINGS.waterInterval * 60, 
    isActive: false, 
    lastTick: Date.now() 
  });
  
  const [breakTimer, setBreakTimer] = useState<TimerState>({ 
    remainingSeconds: DEFAULT_SETTINGS.breakWorkDuration * 60, 
    totalSeconds: DEFAULT_SETTINGS.breakWorkDuration * 60, 
    isActive: false, 
    lastTick: Date.now() 
  });

  const [postureTimer, setPostureTimer] = useState<TimerState>({ 
    remainingSeconds: DEFAULT_SETTINGS.postureInterval * 60, 
    totalSeconds: DEFAULT_SETTINGS.postureInterval * 60, 
    isActive: false, 
    lastTick: Date.now() 
  });

  const [breakDurationTimer, setBreakDurationTimer] = useState<number>(0);

  // Refs for tracking background tab behavior
  const timerRef = useRef<number | null>(null);

  // --- Helpers ---
  const isWithinWorkingHours = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= settings.startHour && currentHour < settings.endHour;
  }, [settings.startHour, settings.endHour]);

  const toggleSettings = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetTimer = (type: ReminderType) => {
    switch (type) {
      case ReminderType.WATER:
        setWaterTimer(prev => ({ ...prev, remainingSeconds: settings.waterInterval * 60, totalSeconds: settings.waterInterval * 60 }));
        break;
      case ReminderType.BREAK:
        setBreakTimer(prev => ({ ...prev, remainingSeconds: settings.breakWorkDuration * 60, totalSeconds: settings.breakWorkDuration * 60 }));
        setIsTakingBreak(false);
        break;
      case ReminderType.POSTURE:
        setPostureTimer(prev => ({ ...prev, remainingSeconds: settings.postureInterval * 60, totalSeconds: settings.postureInterval * 60 }));
        break;
    }
  };

  // --- Side Effects ---
  useEffect(() => {
    localStorage.setItem('wellworking_settings', JSON.stringify(settings));
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('wellworking_stats', JSON.stringify(stats));
  }, [stats]);

  // Main Loop
  useEffect(() => {
    if (!isAppActive || isMeetingMode) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      const activeTime = isWithinWorkingHours();
      if (!activeTime) return;

      // Handle Water Timer
      setWaterTimer(prev => {
        if (prev.remainingSeconds <= 0) {
          NotificationService.notify("Stay Hydrated!", "It's time for some water 💧", "💧");
          setStats(s => ({ ...s, waterCount: s.waterCount + 1 }));
          return { ...prev, remainingSeconds: settings.waterInterval * 60 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });

      // Handle Break/Work Timer
      if (isTakingBreak) {
        setBreakDurationTimer(prev => {
          if (prev <= 0) {
            NotificationService.notify("Back to Work!", "Your break is over. Let's stay productive! 🚀", "🚀");
            setIsTakingBreak(false);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBreakTimer(prev => {
          if (prev.remainingSeconds <= 0) {
            NotificationService.notify("Break Time!", "You've worked for an hour. Time to stretch! 🧘‍♂️", "🧘‍♂️");
            setIsTakingBreak(true);
            setBreakDurationTimer(settings.breakDuration * 60);
            setStats(s => ({ ...s, breaksCount: s.breaksCount + 1 }));
            return { ...prev, remainingSeconds: settings.breakWorkDuration * 60 };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }

      // Handle Posture Timer
      setPostureTimer(prev => {
        if (prev.remainingSeconds <= 0) {
          NotificationService.notify("Check Your Posture!", "Sit up straight and relax your shoulders 🧘", "🧘");
          setStats(s => ({ ...s, postureCount: s.postureCount + 1 }));
          return { ...prev, remainingSeconds: settings.postureInterval * 60 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });

    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAppActive, isMeetingMode, isTakingBreak, settings, isWithinWorkingHours]);

  const handleStart = async () => {
    const granted = await NotificationService.requestPermission();
    if (granted) {
      setIsAppActive(true);
    } else {
      alert("Please enable notifications to use the reminders!");
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">W</div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">WellWorking</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => toggleSettings('isDarkMode', !settings.isDarkMode)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400"
            >
              {settings.isDarkMode ? '🌞' : '🌙'}
            </button>
            <button 
              onClick={() => setIsMeetingMode(!isMeetingMode)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isMeetingMode 
                ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800'
                : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {isMeetingMode ? 'Meeting Mode ON' : 'Meeting Mode'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!isAppActive ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-5xl mb-6">🧘‍♂️</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to stay healthy today?</h2>
            <p className="text-gray-500 dark:text-slate-400 max-w-md mb-10">
              WellWorking will remind you to drink water, take breaks, and check your posture while you focus on your work.
            </p>
            <button 
              onClick={handleStart}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1"
            >
              Start Session
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Dashboard Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Dashboard</h2>
                <p className="text-gray-500 dark:text-slate-400">Monitoring your working habits</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsAppActive(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-medium"
                >
                  Stop Session
                </button>
                <button 
                  onClick={() => {
                    resetTimer(ReminderType.WATER);
                    resetTimer(ReminderType.BREAK);
                    resetTimer(ReminderType.POSTURE);
                  }}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 rounded-xl font-medium"
                >
                  Reset All
                </button>
              </div>
            </div>

            {/* Timers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatusCard 
                title="Water Intake" 
                icon="💧" 
                remainingSeconds={waterTimer.remainingSeconds} 
                totalSeconds={waterTimer.totalSeconds}
                colorClass="bg-blue-500"
                onReset={() => resetTimer(ReminderType.WATER)}
                isPaused={isMeetingMode}
              />
              <StatusCard 
                title="Work Cycle" 
                icon="💻" 
                remainingSeconds={breakTimer.remainingSeconds} 
                totalSeconds={breakTimer.totalSeconds}
                colorClass="bg-indigo-500"
                onReset={() => resetTimer(ReminderType.BREAK)}
                isPaused={isMeetingMode || isTakingBreak}
              />
              <StatusCard 
                title="Posture Check" 
                icon="🧘" 
                remainingSeconds={postureTimer.remainingSeconds} 
                totalSeconds={postureTimer.totalSeconds}
                colorClass="bg-emerald-500"
                onReset={() => resetTimer(ReminderType.POSTURE)}
                isPaused={isMeetingMode}
              />
            </div>

            {/* Break View */}
            {isTakingBreak && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-blue-100 dark:border-blue-900/50 shadow-sm overflow-hidden relative">
                  <div className="flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1 space-y-6">
                      <div className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-sm font-bold">BREAK TIME</div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Take a moment for yourself</h3>
                      <p className="text-gray-500 dark:text-slate-400">Your eyes and back will thank you. Use this time to move away from the screen.</p>
                      
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Break ends in</p>
                          <p className="text-4xl font-black text-gray-900 dark:text-white">
                            {Math.floor(breakDurationTimer / 60)}:{(breakDurationTimer % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                        <button 
                          onClick={() => setIsTakingBreak(false)}
                          className="px-6 py-3 bg-gray-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold transition-transform hover:scale-105"
                        >
                          Skip Break
                        </button>
                      </div>
                    </div>
                    <div className="w-full md:w-auto">
                      <BreathingExercise />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Daily Progress</h3>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <p className="text-2xl mb-1">💧</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.waterCount}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Glasses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl mb-1">🧘‍♂️</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.breaksCount}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Breaks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl mb-1">🧘</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.postureCount}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Checks</p>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-gray-100 dark:border-slate-800">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Timer Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Water Interval (min)</label>
                    <input 
                      type="number" 
                      value={settings.waterInterval} 
                      onChange={(e) => toggleSettings('waterInterval', parseInt(e.target.value) || 1)}
                      className="w-20 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Work Duration (min)</label>
                    <input 
                      type="number" 
                      value={settings.breakWorkDuration} 
                      onChange={(e) => toggleSettings('breakWorkDuration', parseInt(e.target.value) || 1)}
                      className="w-20 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Break Length (min)</label>
                    <input 
                      type="number" 
                      value={settings.breakDuration} 
                      onChange={(e) => toggleSettings('breakDuration', parseInt(e.target.value) || 1)}
                      className="w-20 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Working Hours</h3>
                <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-3xl space-y-4">
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Reminders will only be active during these hours to respect your rest time.</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs uppercase text-gray-400 mb-1 block">Start</label>
                      <select 
                        value={settings.startHour}
                        onChange={(e) => toggleSettings('startHour', parseInt(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2"
                      >
                        {Array.from({length: 24}).map((_, i) => (
                          <option key={i} value={i}>{i}:00</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs uppercase text-gray-400 mb-1 block">End</label>
                      <select 
                        value={settings.endHour}
                        onChange={(e) => toggleSettings('endHour', parseInt(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2"
                      >
                        {Array.from({length: 24}).map((_, i) => (
                          <option key={i} value={i}>{i}:00</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} WellWorking — Your Health is Your Wealth</p>
      </footer>
    </div>
  );
};

export default App;
