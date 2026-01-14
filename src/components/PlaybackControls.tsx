import React from 'react';
import type { PlaybackState } from '../types';
import './PlaybackControls.css';

interface PlaybackControlsProps {
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onJumpBackward: () => void;
  onJumpForward: () => void;
  disabled?: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playbackState,
  onPlay,
  onPause,
  onReset,
  onJumpBackward,
  onJumpForward,
  disabled = false,
}) => {
  const isPlaying = playbackState === 'playing';
  const isFinished = playbackState === 'finished';

  return (
    <div className="playback-controls">
      <button
        className="control-btn"
        onClick={onJumpBackward}
        disabled={disabled}
        aria-label="Jump backward 10 words"
        title="Jump backward (←)"
      >
        ⏮
      </button>

      {isPlaying ? (
        <button
          className="control-btn control-btn-primary"
          onClick={onPause}
          disabled={disabled}
          aria-label="Pause"
          title="Pause (Space)"
        >
          ⏸
        </button>
      ) : (
        <button
          className="control-btn control-btn-primary"
          onClick={onPlay}
          disabled={disabled}
          aria-label={isFinished ? 'Restart' : 'Play'}
          title={isFinished ? 'Restart' : 'Play (Space)'}
        >
          ▶
        </button>
      )}

      <button
        className="control-btn"
        onClick={onJumpForward}
        disabled={disabled}
        aria-label="Jump forward 10 words"
        title="Jump forward (→)"
      >
        ⏭
      </button>

      <button
        className="control-btn"
        onClick={onReset}
        disabled={disabled}
        aria-label="Reset to beginning"
        title="Reset"
      >
        ⏹
      </button>
    </div>
  );
};
