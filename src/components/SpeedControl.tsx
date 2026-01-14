import React from 'react';
import './SpeedControl.css';

interface SpeedControlProps {
  wpm: number;
  onWPMChange: (wpm: number) => void;
  min?: number;
  max?: number;
  step?: number;
  darkMode?: boolean;
}

export const SpeedControl: React.FC<SpeedControlProps> = ({
  wpm,
  onWPMChange,
  min = 100,
  max = 1000,
  step = 10,
  darkMode = false,
}) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onWPMChange(Number(e.target.value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value) && value >= min && value <= max) {
      onWPMChange(value);
    }
  };

  const presets = [150, 200, 250, 300, 400, 500];

  return (
    <div className={`speed-control ${darkMode ? 'dark-mode' : ''}`}>
      <div className="speed-control-header">
        <label htmlFor="wpm-slider" className="speed-label">
          Reading Speed
        </label>
        <div className="speed-input-group">
          <input
            type="number"
            className="speed-input"
            value={wpm}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            aria-label="Words per minute"
          />
          <span className="speed-unit">WPM</span>
        </div>
      </div>

      <input
        type="range"
        id="wpm-slider"
        className="speed-slider"
        value={wpm}
        onChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        aria-label="Adjust reading speed"
      />

      <div className="speed-presets">
        {presets.map((preset) => (
          <button
            key={preset}
            className={`preset-btn ${wpm === preset ? 'preset-btn-active' : ''}`}
            onClick={() => onWPMChange(preset)}
            type="button"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
};
