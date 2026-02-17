import { useState, useEffect, useCallback, useRef } from "react";
import { useRSVPEngine } from "./hooks/useRSVPEngine";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { saveState, loadState, saveStats, loadStats, appVersion } from "./utils/storage";
import { WordDisplay } from "./components/WordDisplay";
import { PlaybackControls } from "./components/PlaybackControls";
import { SpeedControl } from "./components/SpeedControl";
import { TextInput } from "./components/TextInput";
import { PDFUploader } from "./components/PDFUploader";
import { MOBIUploader } from "./components/MOBIUploader";
import { ChapterNavigation } from "./components/ChapterNavigation";
import { ProgressBar } from "./components/ProgressBar";
import { Settings } from "./components/Settings";
import { ReadingStats } from "./components/ReadingStats";
import type { ReadingSettings, MobiChapter, MobiMetadata, ReadingStats as ReadingStatsType, SessionEntry } from "./types";
import "./App.css";

const DEFAULT_READING_SETTINGS: ReadingSettings = {
  fontFamily: "monospace",
  fontSize: 36,
  orpColor: "#3b82f6",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  darkMode: true,
  centerAlignment: true,
  dyslexiaFont: false,
};

function App() {
  const savedState = useRef(loadState());
  const rsvpEngine = useRSVPEngine();

  const [readingSettings, setReadingSettings] = useState<ReadingSettings>(
    savedState.current?.readingSettings ?? DEFAULT_READING_SETTINGS
  );

  // MOBI state
  const [mobiChapters, setMobiChapters] = useState<MobiChapter[]>(
    savedState.current?.mobiChapters ?? []
  );
  const [_mobiMetadata, setMobiMetadata] = useState<MobiMetadata | null>(
    savedState.current?.mobiMetadata ?? null
  );
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(
    savedState.current?.currentChapterId ?? null
  );
  const [currentBookName, setCurrentBookName] = useState<string>(
    savedState.current?.currentBookName ?? ''
  );

  // Live timer
  const [liveTimerSeconds, setLiveTimerSeconds] = useState(0);

  // Restore saved reading position and timing config on mount
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current || !savedState.current) return;
    restoredRef.current = true;
    const s = savedState.current;
    if (s.timingConfig) {
      rsvpEngine.updateTimingConfig(s.timingConfig);
    }
    if (s.rawText) {
      // Use setTimeout to ensure timingConfig has been applied
      setTimeout(() => {
        rsvpEngine.restorePosition(s.rawText, s.currentIndex);
      }, 0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Gather current state for saving
  const getCurrentState = useCallback(() => ({
    appVersion,
    rawText: rsvpEngine.rawText,
    currentIndex: rsvpEngine.currentIndex,
    readingSettings,
    timingConfig: rsvpEngine.timingConfig,
    mobiChapters,
    currentChapterId,
    mobiMetadata: _mobiMetadata,
    currentBookName,
  }), [rsvpEngine.rawText, rsvpEngine.currentIndex, readingSettings, rsvpEngine.timingConfig, mobiChapters, currentChapterId, _mobiMetadata, currentBookName]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!rsvpEngine.rawText) return;
    const timer = setTimeout(() => saveState(getCurrentState()), 1000);
    return () => clearTimeout(timer);
  }, [getCurrentState, rsvpEngine.rawText]);

  // Save on page unload / hide — commitSessionRef is wired up further below
  const commitSessionRef = useRef<() => void>(() => {});
  useEffect(() => {
    const flushAndSave = () => {
      commitSessionRef.current();
      if (rsvpEngine.rawText) {
        saveState(getCurrentState());
      }
    };
    // pagehide is reliable on mobile Safari; visibilitychange covers backgrounding
    const handlePageHide = () => flushAndSave();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushAndSave();
    };
    window.addEventListener('beforeunload', flushAndSave);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', flushAndSave);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getCurrentState, rsvpEngine.rawText]);

  // Reading stats tracking
  const [readingStatsState, setReadingStatsState] = useState<ReadingStatsType>(loadStats);
  const playStartTimeRef = useRef<number | null>(null);
  const playStartIndexRef = useRef<number>(0);
  const prevPlaybackStateRef = useRef(rsvpEngine.playbackState);
  const currentBookNameRef = useRef(currentBookName);
  useEffect(() => { currentBookNameRef.current = currentBookName; }, [currentBookName]);

  // Session-level accumulators (across play/pause cycles within one session)
  const sessionWordsRef = useRef(0);
  const sessionTimeRef = useRef(0);

  // Commits accumulated session data to stats and resets accumulators
  const commitSession = useCallback(() => {
    const wordsRead = sessionWordsRef.current;
    const elapsed = sessionTimeRef.current;
    sessionWordsRef.current = 0;
    sessionTimeRef.current = 0;
    if (elapsed <= 0 && wordsRead <= 0) return;
    const bookName = currentBookNameRef.current || 'Untitled';
    setReadingStatsState(s => {
      const existingBook = s.books[bookName] || {
        bookName,
        totalWordsRead: 0,
        totalReadingTimeMs: 0,
        sessionsCount: 0,
      };
      const sessionEntry: SessionEntry = {
        bookName,
        wordsRead,
        readingTimeMs: elapsed,
        timestamp: Date.now(),
      };
      const updated: ReadingStatsType = {
        ...s,
        totalReadingTimeMs: s.totalReadingTimeMs + elapsed,
        totalWordsRead: s.totalWordsRead + wordsRead,
        sessionsCount: s.sessionsCount + 1,
        books: {
          ...s.books,
          [bookName]: {
            ...existingBook,
            totalWordsRead: existingBook.totalWordsRead + wordsRead,
            totalReadingTimeMs: existingBook.totalReadingTimeMs + elapsed,
            sessionsCount: existingBook.sessionsCount + 1,
          },
        },
        sessions: [sessionEntry, ...(s.sessions || [])].slice(0, 50),
      };
      saveStats(updated);
      return updated;
    });
  }, []);

  // Keep ref in sync so beforeunload can flush any in-progress play segment + accumulated session
  useEffect(() => {
    commitSessionRef.current = () => {
      // Flush current play segment if still playing
      if (playStartTimeRef.current) {
        const elapsed = Date.now() - playStartTimeRef.current;
        sessionWordsRef.current += Math.max(0, rsvpEngine.currentIndex - playStartIndexRef.current);
        sessionTimeRef.current += elapsed;
        playStartTimeRef.current = null;
      }
      commitSession();
    };
  }, [commitSession, rsvpEngine.currentIndex]);

  // Track play/pause transitions — accumulate into session refs, don't commit yet
  useEffect(() => {
    const prev = prevPlaybackStateRef.current;
    const curr = rsvpEngine.playbackState;
    prevPlaybackStateRef.current = curr;

    if (prev !== 'playing' && curr === 'playing') {
      playStartTimeRef.current = Date.now();
      playStartIndexRef.current = rsvpEngine.currentIndex;
    } else if (prev === 'playing' && curr !== 'playing') {
      const elapsed = playStartTimeRef.current ? Date.now() - playStartTimeRef.current : 0;
      const wordsRead = Math.max(0, rsvpEngine.currentIndex - playStartIndexRef.current);
      playStartTimeRef.current = null;
      sessionWordsRef.current += wordsRead;
      sessionTimeRef.current += elapsed;
    }
  }, [rsvpEngine.playbackState, rsvpEngine.currentIndex]);

  // Live timer — accumulates across play/pause, commits session after 60s idle
  const timerBaseRef = useRef(0);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (rsvpEngine.playbackState === 'playing') {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      timerBaseRef.current = liveTimerSeconds;
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setLiveTimerSeconds(timerBaseRef.current + elapsed);
      }, 1000);
      return () => clearInterval(interval);
    } else if (liveTimerSeconds > 0) {
      // Paused — after 60s idle, commit the session and reset timer
      idleTimeoutRef.current = setTimeout(() => {
        commitSession();
        setLiveTimerSeconds(0);
        timerBaseRef.current = 0;
      }, 60000);
      return () => {
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      };
    }
  }, [rsvpEngine.playbackState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: () => {
      if (rsvpEngine.playbackState === "playing") {
        rsvpEngine.pause();
      } else {
        rsvpEngine.play();
      }
    },
    onReset: rsvpEngine.reset,
    onJumpForward: () => rsvpEngine.jumpForward(10),
    onJumpBackward: () => rsvpEngine.jumpBackward(10),
    disabled: rsvpEngine.totalTokens === 0,
  });

  const handleTextSubmit = (text: string, bookName?: string) => {
    rsvpEngine.setText(text);
    if (bookName) setCurrentBookName(bookName);
  };

  const handleReadingSettingsChange = (settings: Partial<ReadingSettings>) => {
    setReadingSettings((prev) => ({ ...prev, ...settings }));
  };

  // MOBI handlers
  const handleMobiLoaded = (chapters: MobiChapter[], metadata: MobiMetadata) => {
    setMobiChapters(chapters);
    setMobiMetadata(metadata);
    const name = metadata.title || 'MOBI Book';
    setCurrentBookName(name);
    // Automatically load the first chapter
    if (chapters.length > 0) {
      const firstChapter = chapters[0];
      setCurrentChapterId(firstChapter.id);
      rsvpEngine.setText(firstChapter.content);
    }
  };

  const handleChapterSelect = (chapterId: string) => {
    const chapter = mobiChapters.find(ch => ch.id === chapterId);
    if (chapter) {
      setCurrentChapterId(chapterId);
      rsvpEngine.setText(chapter.content);
      rsvpEngine.reset();
    }
  };

  const appStyle = {
    backgroundColor: readingSettings.darkMode ? "#1f2937" : "#ffffff",
    color: readingSettings.darkMode ? "#f9fafb" : "#1f2937",
  };

  return (
    <div className="app" style={appStyle}>
      <header className="app-header">
        <h1>📖 RSVP Speed Reader</h1>
        <p className="app-subtitle">
          Rapid Serial Visual Presentation - Read faster, comprehend better
        </p>
      </header>

      <main className="app-main">
        <div className="reader-section">
          <WordDisplay
            token={rsvpEngine.currentToken}
            orpColor={readingSettings.orpColor}
            fontSize={readingSettings.fontSize}
            fontFamily={readingSettings.fontFamily}
            textColor={readingSettings.darkMode ? "#f9fafb" : "#1f2937"}
            darkMode={readingSettings.darkMode}
          />

          <PlaybackControls
            playbackState={rsvpEngine.playbackState}
            onPlay={rsvpEngine.play}
            onPause={rsvpEngine.pause}
            onReset={rsvpEngine.reset}
            onJumpBackward={() => rsvpEngine.jumpBackward(10)}
            onJumpForward={() => rsvpEngine.jumpForward(10)}
            disabled={rsvpEngine.totalTokens === 0}
          />

          <ProgressBar
            current={rsvpEngine.currentIndex}
            total={rsvpEngine.totalTokens}
            percentage={rsvpEngine.progress}
            elapsedTime={rsvpEngine.elapsedTime}
            totalTime={rsvpEngine.totalTime}
            onSeek={rsvpEngine.seekToIndex}
          />

          {liveTimerSeconds > 0 && (
            <div className="live-timer">
              {String(Math.floor(liveTimerSeconds / 60)).padStart(2, '0')}:{String(liveTimerSeconds % 60).padStart(2, '0')}
            </div>
          )}
        </div>

        <div
          className={`controls-section ${
            readingSettings.darkMode ? "dark-mode" : ""
          }`}
        >
          <SpeedControl
            wpm={rsvpEngine.timingConfig.wpm}
            onWPMChange={rsvpEngine.setWPM}
            darkMode={readingSettings.darkMode}
          />

          <PDFUploader
            onTextExtracted={handleTextSubmit}
            disabled={rsvpEngine.playbackState === "playing"}
            darkMode={readingSettings.darkMode}
          />

          <MOBIUploader
            onMobiLoaded={handleMobiLoaded}
            disabled={rsvpEngine.playbackState === "playing"}
            darkMode={readingSettings.darkMode}
          />

          {mobiChapters.length > 0 && (
            <ChapterNavigation
              chapters={mobiChapters}
              currentChapterId={currentChapterId}
              onChapterSelect={handleChapterSelect}
              disabled={rsvpEngine.playbackState === "playing"}
              darkMode={readingSettings.darkMode}
            />
          )}

          <TextInput
            onTextSubmit={handleTextSubmit}
            disabled={rsvpEngine.playbackState === "playing"}
            darkMode={readingSettings.darkMode}
          />

          <ReadingStats
            stats={readingStatsState}
            currentBookName={currentBookName}
            darkMode={readingSettings.darkMode}
          />

          <Settings
            readingSettings={readingSettings}
            timingConfig={rsvpEngine.timingConfig}
            onReadingSettingsChange={handleReadingSettingsChange}
            onTimingConfigChange={rsvpEngine.updateTimingConfig}
          />
        </div>
      </main>

      <footer className="app-footer">
        <div className="keyboard-hints">
          <span>
            <kbd>Space</kbd> Play/Pause
          </span>
          <span>
            <kbd>←</kbd> Back
          </span>
          <span>
            <kbd>→</kbd> Forward
          </span>
          <span>
            <kbd>Esc</kbd> Reset
          </span>
        </div>
        <div className="app-version">v{appVersion}</div>
      </footer>
    </div>
  );
}

export default App;
