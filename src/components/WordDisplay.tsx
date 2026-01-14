import React from 'react';
import type { Token } from '../types';
import './WordDisplay.css';

interface WordDisplayProps {
  token: Token | null;
  orpColor?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  darkMode?: boolean;
}

export const WordDisplay: React.FC<WordDisplayProps> = ({
  token,
  orpColor = '#3b82f6',
  fontSize = 48,
  fontFamily = 'monospace',
  textColor = '#1f2937',
  darkMode = false,
}) => {
  if (!token) {
    return (
      <div className={`word-display-container ${darkMode ? 'dark-mode' : ''}`}>
        <div className="word-display-placeholder" style={{ fontSize, fontFamily, color: textColor }}>
          Ready to read
        </div>
      </div>
    );
  }

  const { word, orpIndex } = token;
  
  // Split word at ORP
  const beforeORP = word.slice(0, orpIndex);
  const orpChar = word[orpIndex];
  const afterORP = word.slice(orpIndex + 1);

  return (
    <div className={`word-display-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="word-display" style={{ fontSize, fontFamily, color: textColor }}>
        <span className="before-orp">{beforeORP}</span>
        <span className="orp-char" style={{ color: orpColor, fontWeight: 'bold' }}>
          {orpChar}
        </span>
        <span className="after-orp">{afterORP}</span>
      </div>
    </div>
  );
};
