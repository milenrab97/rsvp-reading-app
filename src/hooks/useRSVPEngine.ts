import { useState, useCallback, useRef, useEffect } from 'react';
import type { PlaybackState, Token, TimingConfig } from '../types';
import { tokenizeText, DEFAULT_TIMING_CONFIG } from '../utils/textProcessor';

interface UseRSVPEngineReturn {
  playbackState: PlaybackState;
  currentToken: Token | null;
  currentIndex: number;
  totalTokens: number;
  progress: number; // 0-100
  elapsedTime: number; // in milliseconds
  totalTime: number; // in milliseconds
  rawText: string;
  play: () => void;
  pause: () => void;
  reset: () => void;
  setText: (text: string) => void;
  setWPM: (wpm: number) => void;
  jumpForward: (words?: number) => void;
  jumpBackward: (words?: number) => void;
  seekToIndex: (index: number) => void;
  restorePosition: (text: string, index: number) => void;
  timingConfig: TimingConfig;
  updateTimingConfig: (config: Partial<TimingConfig>) => void;
}

export function useRSVPEngine(): UseRSVPEngineReturn {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timingConfig, setTimingConfig] = useState<TimingConfig>(DEFAULT_TIMING_CONFIG);
  const [rawText, setRawText] = useState('');
  
  // Refs for precise timing control
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);
  const tokensRef = useRef<Token[]>([]);
  const currentIndexRef = useRef(0);
  
  // Keep refs in sync with state
  useEffect(() => {
    tokensRef.current = tokens;
    currentIndexRef.current = currentIndex;
  }, [tokens, currentIndex]);
  
  const currentToken = tokens[currentIndex] || null;
  const totalTokens = tokens.length;
  const progress = totalTokens > 0 ? (currentIndex / totalTokens) * 100 : 0;
  
  // Calculate elapsed and total time
  const elapsedTime = tokens.slice(0, currentIndex).reduce((sum, token) => sum + token.duration, 0);
  const totalTime = tokens.reduce((sum, token) => sum + token.duration, 0);

  /**
   * Core playback loop using requestAnimationFrame for precision
   */
  useEffect(() => {
    const playbackLoop = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const currentTokenData = tokensRef.current[currentIndexRef.current];

      if (!currentTokenData) {
        setPlaybackState('finished');
        return;
      }

      // Check if it's time to move to next word
      if (elapsed >= currentTokenData.duration) {
        const nextIndex = currentIndexRef.current + 1;
        
        if (nextIndex >= tokensRef.current.length) {
          setPlaybackState('finished');
          setCurrentIndex(tokensRef.current.length - 1);
          return;
        }

        setCurrentIndex(nextIndex);
        startTimeRef.current = timestamp; // Reset timer for next word
      }

      // Continue animation loop
      if (playbackState === 'playing') {
        animationFrameRef.current = requestAnimationFrame(playbackLoop);
      }
    };

    if (playbackState === 'playing') {
      animationFrameRef.current = requestAnimationFrame(playbackLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playbackState]);

  /**
   * Start or resume playback
   */
  const play = useCallback(() => {
    if (tokens.length === 0) return;
    
    if (playbackState === 'finished') {
      // Restart from beginning
      setCurrentIndex(0);
      startTimeRef.current = undefined;
      setPlaybackState('playing');
    } else if (playbackState === 'idle' || playbackState === 'paused') {
      startTimeRef.current = undefined;
      setPlaybackState('playing');
    }
  }, [tokens.length, playbackState]);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    if (playbackState === 'playing') {
      setPlaybackState('paused');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      startTimeRef.current = undefined;
    }
  }, [playbackState]);

  /**
   * Reset to beginning
   */
  const reset = useCallback(() => {
    setPlaybackState('idle');
    setCurrentIndex(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    startTimeRef.current = undefined;
  }, []);

  /**
   * Set new text and tokenize
   */
  const setText = useCallback((text: string) => {
    setRawText(text);
    const newTokens = tokenizeText(text, timingConfig);
    setTokens(newTokens);
    setCurrentIndex(0);
    setPlaybackState(newTokens.length > 0 ? 'idle' : 'idle');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    startTimeRef.current = undefined;
  }, [timingConfig]);

  /**
   * Update WPM and retokenize
   */
  const setWPM = useCallback((wpm: number) => {
    const newConfig = { ...timingConfig, wpm };
    setTimingConfig(newConfig);
    
    // Retokenize with new timing if we have text
    if (tokens.length > 0) {
      // Reconstruct original text from tokens
      const text = tokens.map(t => t.word).join(' ');
      const newTokens = tokenizeText(text, newConfig);
      setTokens(newTokens);
    }
  }, [timingConfig, tokens]);

  /**
   * Update timing configuration
   */
  const updateTimingConfig = useCallback((config: Partial<TimingConfig>) => {
    const newConfig = { ...timingConfig, ...config };
    setTimingConfig(newConfig);
    
    // Retokenize with new config if we have text
    if (tokens.length > 0) {
      const text = tokens.map(t => t.word).join(' ');
      const newTokens = tokenizeText(text, newConfig);
      setTokens(newTokens);
    }
  }, [timingConfig, tokens]);

  /**
   * Jump forward by N words
   */
  const jumpForward = useCallback((words: number = 10) => {
    const newIndex = Math.min(currentIndex + words, tokens.length - 1);
    setCurrentIndex(newIndex);
    startTimeRef.current = undefined;
  }, [currentIndex, tokens.length]);

  /**
   * Jump backward by N words
   */
  const jumpBackward = useCallback((words: number = 10) => {
    const newIndex = Math.max(currentIndex - words, 0);
    setCurrentIndex(newIndex);
    startTimeRef.current = undefined;
  }, [currentIndex]);

  /**
   * Seek to specific index
   */
  const seekToIndex = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, tokens.length - 1));
    setCurrentIndex(clampedIndex);
    startTimeRef.current = undefined;
    
    if (playbackState === 'finished' && clampedIndex < tokens.length - 1) {
      setPlaybackState('paused');
    }
  }, [tokens.length, playbackState]);

  /**
   * Restore text and position in one call (used when loading saved state)
   */
  const restorePosition = useCallback((text: string, index: number) => {
    setRawText(text);
    const newTokens = tokenizeText(text, timingConfig);
    setTokens(newTokens);
    const clampedIndex = Math.max(0, Math.min(index, newTokens.length - 1));
    setCurrentIndex(clampedIndex);
    setPlaybackState(newTokens.length > 0 ? 'paused' : 'idle');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    startTimeRef.current = undefined;
  }, [timingConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    playbackState,
    currentToken,
    currentIndex,
    totalTokens,
    progress,
    elapsedTime,
    totalTime,
    rawText,
    play,
    pause,
    reset,
    setText,
    setWPM,
    jumpForward,
    jumpBackward,
    seekToIndex,
    restorePosition,
    timingConfig,
    updateTimingConfig,
  };
}
