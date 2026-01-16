import { useState } from "react";
import { useRSVPEngine } from "./hooks/useRSVPEngine";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { WordDisplay } from "./components/WordDisplay";
import { PlaybackControls } from "./components/PlaybackControls";
import { SpeedControl } from "./components/SpeedControl";
import { TextInput } from "./components/TextInput";
import { PDFUploader } from "./components/PDFUploader";
import { MOBIUploader } from "./components/MOBIUploader";
import { ChapterNavigation } from "./components/ChapterNavigation";
import { ProgressBar } from "./components/ProgressBar";
import { Settings } from "./components/Settings";
import type { ReadingSettings, MobiChapter, MobiMetadata } from "./types";
import "./App.css";

function App() {
  const rsvpEngine = useRSVPEngine();

  const [readingSettings, setReadingSettings] = useState<ReadingSettings>({
    fontFamily: "monospace",
    fontSize: 36,
    orpColor: "#3b82f6",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    darkMode: true,
    centerAlignment: true,
    dyslexiaFont: false,
  });

  // MOBI state
  const [mobiChapters, setMobiChapters] = useState<MobiChapter[]>([]);
  const [_mobiMetadata, setMobiMetadata] = useState<MobiMetadata | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);

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

  const handleTextSubmit = (text: string) => {
    rsvpEngine.setText(text);
  };

  const handleReadingSettingsChange = (settings: Partial<ReadingSettings>) => {
    setReadingSettings((prev) => ({ ...prev, ...settings }));
  };

  // MOBI handlers
  const handleMobiLoaded = (chapters: MobiChapter[], metadata: MobiMetadata) => {
    setMobiChapters(chapters);
    setMobiMetadata(metadata);
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
      </footer>
    </div>
  );
}

export default App;
