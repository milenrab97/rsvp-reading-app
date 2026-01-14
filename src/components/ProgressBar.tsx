import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  current: number;
  total: number;
  percentage: number;
  elapsedTime?: number; // in milliseconds
  totalTime?: number; // in milliseconds
  onSeek?: (index: number) => void;
}

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  percentage,
  elapsedTime,
  totalTime,
  onSeek,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPercentage = (x / rect.width) * 100;
    const targetIndex = Math.floor((clickPercentage / 100) * total);
    
    onSeek(Math.max(0, Math.min(targetIndex, total - 1)));
  };

  return (
    <div className="progress-container">
      <div className="progress-info">
        <span className="progress-text">
          {current + 1} / {total}
        </span>
        <span className="progress-time">
          {elapsedTime !== undefined && totalTime !== undefined
            ? `${formatTime(elapsedTime)} / ${formatTime(totalTime)}`
            : ''}
        </span>
        <span className="progress-percentage">
          {percentage.toFixed(1)}%
        </span>
      </div>
      
      <div
        className={`progress-bar ${onSeek ? 'progress-bar-clickable' : ''}`}
        onClick={handleClick}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Reading progress: ${percentage.toFixed(1)}%`}
      >
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
