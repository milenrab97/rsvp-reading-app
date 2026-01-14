import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  current: number;
  total: number;
  percentage: number;
  onSeek?: (index: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  percentage,
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
