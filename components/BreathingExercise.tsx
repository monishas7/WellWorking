
import React, { useState, useEffect } from 'react';
import { BREATHING_PHASES } from '../constants';

export const BreathingExercise: React.FC = () => {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhaseIndex((prev) => (prev + 1) % BREATHING_PHASES.length);
    }, BREATHING_PHASES[phaseIndex].duration);
    
    return () => clearTimeout(timer);
  }, [phaseIndex]);

  const currentPhase = BREATHING_PHASES[phaseIndex];
  const isBreathingIn = phaseIndex === 0;
  const isBreathingOut = phaseIndex === 2;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800/20">
      <div className="relative flex items-center justify-center w-48 h-48">
        <div 
          className={`absolute w-32 h-32 rounded-full bg-blue-400/20 dark:bg-blue-400/10 transition-transform duration-[4000ms] ease-in-out
            ${isBreathingIn ? 'scale-150' : isBreathingOut ? 'scale-100' : ''}`}
        />
        <div 
          className={`w-24 h-24 rounded-full bg-blue-500 dark:bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform duration-[4000ms] ease-in-out
            ${isBreathingIn ? 'scale-150' : isBreathingOut ? 'scale-100' : ''}`}
        >
          <span className="text-white font-bold text-lg select-none">
            {currentPhase.text.split('...')[0]}
          </span>
        </div>
      </div>
      <p className="mt-8 text-blue-600 dark:text-blue-400 font-medium animate-pulse">
        Let's take a quick breath together
      </p>
    </div>
  );
};
