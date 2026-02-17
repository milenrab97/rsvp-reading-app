import React, { useState } from 'react';
import type { ReadingStats as ReadingStatsType } from '../types';
import './ReadingStats.css';

interface ReadingStatsProps {
  stats: ReadingStatsType;
  currentBookName: string;
  darkMode: boolean;
}

type StatsTab = 'total' | 'book' | 'history';

function formatTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return '<1m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

function StatCards({ wordsRead, timeMs, sessionsCount }: { wordsRead: number; timeMs: number; sessionsCount?: number }) {
  const avgWpm = timeMs > 0 ? Math.round(wordsRead / (timeMs / 60000)) : 0;
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-value">{formatNumber(wordsRead)}</div>
        <div className="stat-label">Words Read</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{formatTime(timeMs)}</div>
        <div className="stat-label">Time Spent</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{avgWpm || '—'}</div>
        <div className="stat-label">Avg WPM</div>
      </div>
      {sessionsCount !== undefined && (
        <div className="stat-card">
          <div className="stat-value">{sessionsCount}</div>
          <div className="stat-label">Sessions</div>
        </div>
      )}
    </div>
  );
}

export const ReadingStats: React.FC<ReadingStatsProps> = ({ stats, currentBookName, darkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<StatsTab>('total');

  const bookStats = currentBookName ? stats.books?.[currentBookName] : null;

  return (
    <div className={`stats-container ${isExpanded ? 'expanded' : 'collapsed'} ${darkMode ? 'dark-mode' : ''}`}>
      <div className="stats-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>📊 Reading Stats</h3>
        <button
          className="toggle-btn"
          type="button"
          aria-label={isExpanded ? 'Collapse stats' : 'Expand stats'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="stats-content">
          <div className="stats-tabs">
            <button
              className={`stats-tab ${activeTab === 'total' ? 'active' : ''}`}
              onClick={() => setActiveTab('total')}
              type="button"
            >
              Total
            </button>
            <button
              className={`stats-tab ${activeTab === 'book' ? 'active' : ''}`}
              onClick={() => setActiveTab('book')}
              type="button"
            >
              This Book
            </button>
            <button
              className={`stats-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
              type="button"
            >
              History
            </button>
          </div>

          {activeTab === 'total' && (
            <StatCards
              wordsRead={stats.totalWordsRead}
              timeMs={stats.totalReadingTimeMs}
            />
          )}

          {activeTab === 'book' && (
            currentBookName && bookStats ? (
              <div>
                <div className="book-subtitle">{truncate(currentBookName, 40)}</div>
                <StatCards
                  wordsRead={bookStats.totalWordsRead}
                  timeMs={bookStats.totalReadingTimeMs}
                  sessionsCount={bookStats.sessionsCount}
                />
              </div>
            ) : (
              <div className="stats-empty">No book loaded</div>
            )
          )}

          {activeTab === 'history' && (
            (stats.sessions?.length ?? 0) > 0 ? (
              <div className="session-list">
                {stats.sessions.map((session, i) => (
                  <div key={i} className="session-item">
                    <div className="session-book">{truncate(session.bookName, 30)}</div>
                    <div className="session-details">
                      <span>{formatNumber(session.wordsRead)} words</span>
                      <span>{formatTime(session.readingTimeMs)}</span>
                      <span className="session-time">{formatRelativeTime(session.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="stats-empty">No sessions yet</div>
            )
          )}
        </div>
      )}
    </div>
  );
};
