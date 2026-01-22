
import React from 'react';

interface StatusCardProps {
  title: string;
  icon: string;
  remainingSeconds: number;
  totalSeconds: number;
  colorClass: string;
  onReset: () => void;
  isPaused: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  icon,
  remainingSeconds,
  totalSeconds,
  colorClass,
  onReset,
  isPaused
}) => {
  const percentage = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-all hover:shadow-md group relative overflow-hidden">
      <div 
        className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${colorClass}`}
        style={{ width: `${percentage}%` }}
      />
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-semibold text-gray-700 dark:text-slate-200">{title}</h3>
        </div>
        <button 
          onClick={onReset}
          className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="flex items-baseline gap-1">
        <span className={`text-4xl font-bold tracking-tight ${isPaused ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          {formatTime(remainingSeconds)}
        </span>
        <span className="text-sm text-gray-400 dark:text-slate-500">remaining</span>
      </div>
      
      {isPaused && (
        <div className="mt-2 text-xs font-medium text-amber-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Paused
        </div>
      )}
    </div>
  );
};
