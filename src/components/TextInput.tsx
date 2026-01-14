import React, { useState } from 'react';
import './TextInput.css';

interface TextInputProps {
  onTextSubmit: (text: string) => void;
  disabled?: boolean;
  darkMode?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  onTextSubmit,
  disabled = false,
  darkMode = false,
}) => {
  const [text, setText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSubmit = () => {
    if (text.trim()) {
      onTextSubmit(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  const sampleText = `The quick brown fox jumps over the lazy dog. This is a sample text to demonstrate the RSVP speed reading technique. You can paste your own text here, or edit this sample to get started.

RSVP (Rapid Serial Visual Presentation) allows you to read faster by displaying one word at a time in a fixed position. This eliminates the need for eye movement across the page.

Try it out! Adjust the speed to find your optimal reading pace.`;

  const loadSample = () => {
    setText(sampleText);
  };

  return (
    <div className={`text-input-container ${isExpanded ? 'expanded' : 'collapsed'} ${darkMode ? 'dark-mode' : ''}`}>
      <div className="text-input-header">
        <h3>Text Input</h3>
        <div className="text-input-actions">
          <button
            className="action-btn"
            onClick={loadSample}
            disabled={disabled}
            type="button"
          >
            Load Sample
          </button>
          <button
            className="action-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          <textarea
            className="text-input-area"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste or type your text here..."
            disabled={disabled}
            rows={8}
          />
          <div className="text-input-footer">
            <span className="text-info">
              {text.trim().split(/\s+/).filter(w => w.length > 0).length} words
            </span>
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={disabled || !text.trim()}
              type="button"
            >
              Load Text
            </button>
          </div>
          <div className="text-input-hint">
            Tip: Press Cmd/Ctrl + Enter to load text quickly
          </div>
        </>
      )}
    </div>
  );
};
