import { useEffect } from 'react';

interface KeyboardShortcutsConfig {
  onPlayPause: () => void;
  onReset?: () => void;
  onJumpForward?: () => void;
  onJumpBackward?: () => void;
  disabled?: boolean;
}

export function useKeyboardShortcuts({
  onPlayPause,
  onReset,
  onJumpForward,
  onJumpBackward,
  disabled = false,
}: KeyboardShortcutsConfig) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'Spacebar': // Older browsers
          e.preventDefault();
          onPlayPause();
          break;

        case 'ArrowRight':
          e.preventDefault();
          onJumpForward?.();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          onJumpBackward?.();
          break;

        case 'r':
        case 'R':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onReset?.();
          }
          break;

        case 'Escape':
          e.preventDefault();
          onReset?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onPlayPause, onReset, onJumpForward, onJumpBackward, disabled]);
}
