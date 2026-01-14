import { useState } from 'react';
import { useRSVPEngine } from './hooks/useRSVPEngine';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { WordDisplay } from './components/WordDisplay';
import { PlaybackControls } from './components/PlaybackControls';
import { SpeedControl } from './components/SpeedControl';
import { TextInput } from './components/TextInput';
import { ProgressBar } from './components/ProgressBar';
import { Settings } from './components/Settings';
import type { ReadingSettings } from './types';
import './App.css';

function App() {
  const rsvpEngine = useRSVPEngine();
  
  const [readingSettings, setReadingSettings] = useState<ReadingSettings>({
    fontFamily: 'monospace',
    fontSize: 48,
    orpColor: '#3b82f6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    darkMode: false,
    centerAlignment: true,
    dyslexiaFont: false,
  });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: () => {
      if (rsvpEngine.playbackState === 'playing') {
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
    setReadingSettings(prev => ({ ...prev, ...settings }));
  };

  const appStyle = {
    backgroundColor: readingSettings.darkMode ? '#1f2937' : '#ffffff',
    color: readingSettings.darkMode ? '#f9fafb' : '#1f2937',
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
            textColor={readingSettings.darkMode ? '#f9fafb' : '#1f2937'}
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
            onSeek={rsvpEngine.seekToIndex}
          />
        </div>

        <div className={`controls-section ${readingSettings.darkMode ? 'dark-mode' : ''}`}>
          <SpeedControl
            wpm={rsvpEngine.timingConfig.wpm}
            onWPMChange={rsvpEngine.setWPM}
            darkMode={readingSettings.darkMode}
          />

          <TextInput
            onTextSubmit={handleTextSubmit}
            disabled={rsvpEngine.playbackState === 'playing'}
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
          <span><kbd>Space</kbd> Play/Pause</span>
          <span><kbd>←</kbd> Back</span>
          <span><kbd>→</kbd> Forward</span>
          <span><kbd>Esc</kbd> Reset</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
