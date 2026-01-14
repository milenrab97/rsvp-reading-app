import type { Token, TimingConfig } from '../types';

/**
 * Calculate the Optimal Recognition Point (ORP) for a word
 * Usually ~30-40% into the word for optimal recognition
 */
export function calculateORP(word: string): number {
  const length = word.length;
  if (length <= 1) return 0;
  if (length <= 5) return Math.floor(length * 0.3);
  if (length <= 9) return Math.floor(length * 0.35);
  return Math.floor(length * 0.4);
}

/**
 * Get length-based timing factor
 */
export function getLengthFactor(word: string, config: TimingConfig): number {
  if (!config.adaptiveTiming) return 1.0;
  
  const length = word.length;
  if (length <= 4) return config.lengthFactors.short;
  if (length <= 7) return config.lengthFactors.medium;
  if (length <= 10) return config.lengthFactors.long;
  return config.lengthFactors.veryLong;
}

/**
 * Get punctuation-based timing factor
 */
export function getPunctuationFactor(word: string, config: TimingConfig): number {
  if (!config.adaptiveTiming) return 1.0;
  
  const lastChar = word[word.length - 1];
  const factors = config.punctuationFactors;
  
  switch (lastChar) {
    case ',':
      return factors.comma;
    case '.':
      return factors.period;
    case '!':
      return factors.exclamation;
    case '?':
      return factors.question;
    case ';':
      return factors.semicolon;
    case ':':
      return factors.colon;
    default:
      return 1.0;
  }
}

/**
 * Check if text contains paragraph break (multiple newlines)
 */
export function hasParagraphBreak(text: string, startIndex: number): boolean {
  // Look for double newline or more
  const nextChars = text.slice(startIndex, startIndex + 10);
  return /\n\s*\n/.test(nextChars);
}

/**
 * Calculate display duration for a word
 */
export function calculateWordDuration(
  word: string,
  config: TimingConfig,
  hasParagraphAfter: boolean = false
): number {
  const baseTime = 60000 / config.wpm; // Base time per word in ms
  const lengthFactor = getLengthFactor(word, config);
  const punctuationFactor = getPunctuationFactor(word, config);
  const paragraphFactor = hasParagraphAfter ? config.paragraphFactor : 1.0;
  
  let duration = baseTime * lengthFactor * punctuationFactor * paragraphFactor;
  
  // Apply max delay cap
  if (config.maxWordDelay > 0) {
    duration = Math.min(duration, config.maxWordDelay);
  }
  
  return Math.round(duration);
}

/**
 * Tokenize text into words with timing information
 */
export function tokenizeText(text: string, config: TimingConfig): Token[] {
  if (!text.trim()) return [];
  
  // Normalize whitespace but preserve paragraph breaks
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ');
  
  // Split by whitespace while preserving structure
  const words = normalized.split(/\s+/).filter(word => word.length > 0);
  
  const tokens: Token[] = [];
  let charIndex = 0;
  
  words.forEach((word, index) => {
    // Find the word's position in original text for paragraph detection
    const wordPosition = normalized.indexOf(word, charIndex);
    const hasParagraphAfter = hasParagraphBreak(normalized, wordPosition + word.length);
    
    tokens.push({
      word,
      index,
      duration: calculateWordDuration(word, config, hasParagraphAfter),
      orpIndex: calculateORP(word),
    });
    
    charIndex = wordPosition + word.length;
  });
  
  return tokens;
}

/**
 * Default timing configuration
 */
export const DEFAULT_TIMING_CONFIG: TimingConfig = {
  wpm: 250,
  adaptiveTiming: true,
  lengthFactors: {
    short: 1.0,
    medium: 1.1,
    long: 1.25,
    veryLong: 1.4,
  },
  punctuationFactors: {
    comma: 1.3,
    period: 1.6,
    exclamation: 1.6,
    question: 1.6,
    semicolon: 1.4,
    colon: 1.4,
  },
  paragraphFactor: 2.0,
  maxWordDelay: 3000, // 3 seconds max
};
