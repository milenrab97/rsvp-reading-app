import React from 'react';
import type { MobiChapter } from '../types';
import './ChapterNavigation.css';

interface ChapterNavigationProps {
  chapters: MobiChapter[];
  currentChapterId: string | null;
  onChapterSelect: (chapterId: string) => void;
  disabled?: boolean;
  darkMode?: boolean;
}

export const ChapterNavigation: React.FC<ChapterNavigationProps> = ({
  chapters,
  currentChapterId,
  onChapterSelect,
  disabled = false,
  darkMode = false,
}) => {
  const currentChapter = chapters.find(ch => ch.id === currentChapterId);
  const currentIndex = currentChapter ? currentChapter.position : -1;

  const handlePreviousChapter = () => {
    if (currentIndex > 0) {
      const prevChapter = chapters.find(ch => ch.position === currentIndex - 1);
      if (prevChapter) {
        onChapterSelect(prevChapter.id);
      }
    }
  };

  const handleNextChapter = () => {
    if (currentIndex < chapters.length - 1) {
      const nextChapter = chapters.find(ch => ch.position === currentIndex + 1);
      if (nextChapter) {
        onChapterSelect(nextChapter.id);
      }
    }
  };

  if (chapters.length === 0) {
    return null;
  }

  return (
    <div className={`chapter-navigation ${darkMode ? 'dark-mode' : ''}`}>
      <div className="chapter-nav-header">
        <h4>📖 Chapter Navigation</h4>
      </div>

      <div className="chapter-selector">
        <select
          value={currentChapterId || ''}
          onChange={(e) => onChapterSelect(e.target.value)}
          disabled={disabled}
          className="chapter-dropdown"
        >
          {!currentChapterId && <option value="">Select a chapter...</option>}
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.position + 1}. {chapter.title}
            </option>
          ))}
        </select>
      </div>

      {currentChapterId && (
        <div className="chapter-controls">
          <button
            onClick={handlePreviousChapter}
            disabled={disabled || currentIndex <= 0}
            className="chapter-nav-btn"
            title="Previous chapter"
          >
            ← Previous
          </button>
          <span className="chapter-position">
            {currentIndex + 1} / {chapters.length}
          </span>
          <button
            onClick={handleNextChapter}
            disabled={disabled || currentIndex >= chapters.length - 1}
            className="chapter-nav-btn"
            title="Next chapter"
          >
            Next →
          </button>
        </div>
      )}

      {currentChapter && (
        <div className="current-chapter-info">
          <p className="chapter-title-display">{currentChapter.title}</p>
        </div>
      )}
    </div>
  );
};
