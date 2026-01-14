// Core types for RSVP reading app

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'finished';

export interface Token {
  word: string;
  index: number;
  duration: number; // in milliseconds
  orpIndex: number; // Optimal Recognition Point index within the word
}

export interface TimingConfig {
  wpm: number; // Words per minute
  adaptiveTiming: boolean;
  lengthFactors: {
    short: number; // ≤ 4 chars
    medium: number; // 5-7 chars
    long: number; // 8-10 chars
    veryLong: number; // > 10 chars
  };
  punctuationFactors: {
    comma: number;
    period: number;
    exclamation: number;
    question: number;
    semicolon: number;
    colon: number;
  };
  paragraphFactor: number;
  maxWordDelay: number; // Cap on maximum word delay in ms
}

export interface ReadingSettings {
  fontFamily: string;
  fontSize: number;
  orpColor: string;
  backgroundColor: string;
  textColor: string;
  darkMode: boolean;
  centerAlignment: boolean;
  dyslexiaFont: boolean;
}

export interface RSVPState {
  playbackState: PlaybackState;
  tokens: Token[];
  currentIndex: number;
  text: string;
  timingConfig: TimingConfig;
  readingSettings: ReadingSettings;
}
