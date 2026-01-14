import React, { useState } from 'react';
import type { ReadingSettings, TimingConfig } from '../types';
import './Settings.css';

interface SettingsProps {
  readingSettings: ReadingSettings;
  timingConfig: TimingConfig;
  onReadingSettingsChange: (settings: Partial<ReadingSettings>) => void;
  onTimingConfigChange: (config: Partial<TimingConfig>) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  readingSettings,
  timingConfig,
  onReadingSettingsChange,
  onTimingConfigChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const fontFamilies = [
    { value: 'monospace', label: 'Monospace' },
    { value: 'sans-serif', label: 'Sans Serif' },
    { value: 'serif', label: 'Serif' },
    { value: 'OpenDyslexic, sans-serif', label: 'Dyslexia Friendly' },
  ];

  return (
    <div className={`settings-container ${isExpanded ? 'expanded' : 'collapsed'} ${readingSettings.darkMode ? 'dark-mode' : ''}`}>
      <div className="settings-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>⚙️ Settings</h3>
        <button
          className="toggle-btn"
          type="button"
          aria-label={isExpanded ? 'Collapse settings' : 'Expand settings'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="settings-content">
          {/* Display Settings */}
          <section className="settings-section">
            <h4>Display</h4>
            
            <div className="setting-row">
              <label htmlFor="font-family">Font</label>
              <select
                id="font-family"
                value={readingSettings.fontFamily}
                onChange={(e) => onReadingSettingsChange({ fontFamily: e.target.value })}
              >
                {fontFamilies.map(font => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-row">
              <label htmlFor="font-size">Font Size</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  id="font-size"
                  value={readingSettings.fontSize}
                  onChange={(e) => onReadingSettingsChange({ fontSize: Number(e.target.value) })}
                  min={24}
                  max={96}
                  step={4}
                />
                <span>px</span>
              </div>
            </div>

            <div className="setting-row">
              <label htmlFor="orp-color">ORP Highlight Color</label>
              <input
                type="color"
                id="orp-color"
                value={readingSettings.orpColor}
                onChange={(e) => onReadingSettingsChange({ orpColor: e.target.value })}
              />
            </div>

            <div className="setting-row">
              <label htmlFor="dark-mode">Dark Mode</label>
              <input
                type="checkbox"
                id="dark-mode"
                checked={readingSettings.darkMode}
                onChange={(e) => onReadingSettingsChange({ darkMode: e.target.checked })}
              />
            </div>
          </section>

          {/* Timing Settings */}
          <section className="settings-section">
            <h4>Adaptive Timing</h4>
            
            <div className="setting-row">
              <label htmlFor="adaptive-timing">Enable Adaptive Timing</label>
              <input
                type="checkbox"
                id="adaptive-timing"
                checked={timingConfig.adaptiveTiming}
                onChange={(e) => onTimingConfigChange({ adaptiveTiming: e.target.checked })}
              />
            </div>

            {timingConfig.adaptiveTiming && (
              <>
                <div className="setting-row">
                  <label htmlFor="max-delay">Max Word Delay (ms)</label>
                  <input
                    type="number"
                    id="max-delay"
                    value={timingConfig.maxWordDelay}
                    onChange={(e) => onTimingConfigChange({ maxWordDelay: Number(e.target.value) })}
                    min={0}
                    max={10000}
                    step={100}
                  />
                </div>

                <div className="setting-subsection">
                  <h5>Punctuation Factors</h5>
                  
                  <div className="setting-row-compact">
                    <label htmlFor="comma-factor">Comma (,)</label>
                    <input
                      type="number"
                      id="comma-factor"
                      value={timingConfig.punctuationFactors.comma}
                      onChange={(e) => onTimingConfigChange({
                        punctuationFactors: {
                          ...timingConfig.punctuationFactors,
                          comma: Number(e.target.value)
                        }
                      })}
                      min={1.0}
                      max={3.0}
                      step={0.1}
                    />
                  </div>

                  <div className="setting-row-compact">
                    <label htmlFor="period-factor">Period (.)</label>
                    <input
                      type="number"
                      id="period-factor"
                      value={timingConfig.punctuationFactors.period}
                      onChange={(e) => onTimingConfigChange({
                        punctuationFactors: {
                          ...timingConfig.punctuationFactors,
                          period: Number(e.target.value)
                        }
                      })}
                      min={1.0}
                      max={3.0}
                      step={0.1}
                    />
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Reset Button */}
          <button
            className="reset-btn"
            onClick={() => {
              // Reset to defaults would go here
              alert('Reset to defaults (implement in App.tsx)');
            }}
            type="button"
          >
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
};
