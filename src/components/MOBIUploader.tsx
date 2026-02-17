import React, { useState } from 'react';
import { parseMobiFile } from '../utils/mobiProcessor';
import type { MobiChapter, MobiMetadata } from '../types';
import './MOBIUploader.css';

interface MOBIUploaderProps {
  onMobiLoaded: (chapters: MobiChapter[], metadata: MobiMetadata) => void;
  disabled?: boolean;
  darkMode?: boolean;
  initialPreview?: { chapters: MobiChapter[]; metadata: MobiMetadata } | null;
}

export const MOBIUploader: React.FC<MOBIUploaderProps> = ({
  onMobiLoaded,
  disabled = false,
  darkMode = false,
  initialPreview = null,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [preview, setPreview] = useState<{
    chapters: MobiChapter[];
    metadata: MobiMetadata;
  } | null>(initialPreview);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Check file extension
    if (!selectedFile.name.toLowerCase().endsWith('.mobi')) {
      setError('Please select a valid MOBI file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsLoading(true);

    try {
      const result = await parseMobiFile(selectedFile);
      setPreview({
        chapters: result.chapters,
        metadata: result.metadata,
      });
      setError(null);
    } catch (err) {
      console.error('Error loading MOBI file:', err);
      setError(err instanceof Error ? err.message : 'Failed to load MOBI file');
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadBook = () => {
    if (preview) {
      onMobiLoaded(preview.chapters, preview.metadata);
    }
  };

  const handleLoadChapter = () => {
    if (preview && preview.chapters[selectedChapterIndex]) {
      // Set the selected chapter as the current one and load just that chapter initially
      const selectedChapter = preview.chapters[selectedChapterIndex];
      onMobiLoaded([selectedChapter], preview.metadata);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setSelectedChapterIndex(0);
    // Reset file input
    const fileInput = document.getElementById('mobi-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className={`mobi-uploader-container ${isExpanded ? 'expanded' : 'collapsed'} ${darkMode ? 'dark-mode' : ''}`}>
      <div className="mobi-uploader-header">
        <h3>📚 MOBI Reader</h3>
        <button
          className="action-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="mobi-upload-section">
            <input
              type="file"
              accept=".mobi"
              onChange={onFileChange}
              disabled={disabled || isLoading}
              id="mobi-file-input"
              className="mobi-file-input"
            />
            <label htmlFor="mobi-file-input" className="mobi-upload-label">
              {file ? file.name : 'Choose MOBI file'}
            </label>
            {file && (
              <button
                className="clear-file-btn"
                onClick={handleClearFile}
                type="button"
                aria-label="Clear file"
                disabled={disabled || isLoading}
              >
                ✕
              </button>
            )}
          </div>

          {isLoading && (
            <div className="mobi-loading">
              <div className="loading-spinner"></div>
              <p>Parsing MOBI file...</p>
            </div>
          )}

          {error && (
            <div className="mobi-error">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {preview && !isLoading && (
            <div className="mobi-preview">
              <div className="mobi-metadata">
                <h4>{preview.metadata.title || 'Untitled'}</h4>
                {preview.metadata.author && (
                  <p className="metadata-author">by {preview.metadata.author}</p>
                )}
                {preview.metadata.publisher && (
                  <p className="metadata-info">Publisher: {preview.metadata.publisher}</p>
                )}
                {preview.metadata.language && (
                  <p className="metadata-info">Language: {preview.metadata.language}</p>
                )}
              </div>

              <div className="mobi-chapters-info">
                <h5>Chapters</h5>
                <p className="chapters-count">{preview.chapters.length} chapter{preview.chapters.length !== 1 ? 's' : ''} found</p>
                <div className="chapters-preview-list">
                  {preview.chapters.slice(0, 5).map((chapter, index) => (
                    <div 
                      key={chapter.id} 
                      className={`chapter-preview-item ${selectedChapterIndex === index ? 'selected' : ''}`}
                      onClick={() => setSelectedChapterIndex(index)}
                    >
                      <span className="chapter-number">{index + 1}.</span>
                      <span className="chapter-title">{chapter.title}</span>
                    </div>
                  ))}
                  {preview.chapters.length > 5 && (
                    <p className="more-chapters">
                      ...and {preview.chapters.length - 5} more
                    </p>
                  )}
                </div>
              </div>

              {preview.chapters.length > 0 && preview.chapters[selectedChapterIndex] && (
                <div className="mobi-content-preview">
                  <div className="preview-header">
                    <h5>Chapter Preview</h5>
                    <select 
                      value={selectedChapterIndex}
                      onChange={(e) => setSelectedChapterIndex(Number(e.target.value))}
                      className="chapter-select"
                    >
                      {preview.chapters.map((chapter, index) => (
                        <option key={chapter.id} value={index}>
                          {index + 1}. {chapter.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="content-preview-text">
                    {preview.chapters[selectedChapterIndex].content}
                  </div>
                  <p className="preview-note">
                    {preview.chapters[selectedChapterIndex].content.split(/\s+/).length.toLocaleString()} words in this chapter
                  </p>
                  <button
                    onClick={handleLoadChapter}
                    disabled={disabled}
                    className="load-chapter-btn"
                  >
                    Load This Chapter
                  </button>
                </div>
              )}

              <button
                onClick={handleLoadBook}
                disabled={disabled}
                className="load-book-btn"
              >
                Load All Chapters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
