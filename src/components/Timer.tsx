import React, { useState, useEffect } from 'react';

interface TimerProps {
  initialTime: number; // saniye cinsinden
  onExpire: () => void;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({ initialTime, onExpire, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClass = () => {
    if (timeLeft <= 30) return 'text-red-500';
    if (timeLeft <= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className={`text-center ${className}`}>
      <p className="text-sm text-gray-600 mb-1">Verbleibende Zeit</p>
      <div className={`text-2xl font-mono font-bold ${getColorClass()}`}>
        {formatTime(timeLeft)}
      </div>
      {timeLeft <= 30 && (
        <p className="text-xs text-red-500 mt-1">Beeilen Sie sich!</p>
      )}
    </div>
  );
};