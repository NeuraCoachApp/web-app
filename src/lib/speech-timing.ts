/**
 * Utility functions for calculating speech timing based on text content
 */

/**
 * Calculate speaking time for a given text
 * 
 * @param text - The text to be spoken
 * @param wordsPerMinute - Average speaking rate (default: 150 WPM, which is typical for conversational speech)
 * @param minimumTime - Minimum time in milliseconds (default: 2000ms = 2 seconds)
 * @param maximumTime - Maximum time in milliseconds (default: 15000ms = 15 seconds)
 * @param bufferMultiplier - Buffer multiplier to add extra time (default: 1.5 = 50% extra time)
 * @returns Speaking time in milliseconds
 */
export function calculateSpeakingTime(
  text: string,
  wordsPerMinute: number = 150,
  minimumTime: number = 2000,
  maximumTime: number = 15000,
  bufferMultiplier: number = 1.5
): number {
  if (!text || text.trim().length === 0) {
    return minimumTime
  }

  // Count words in the text
  const wordCount = countWords(text)
  
  // Calculate base speaking time in milliseconds
  const baseTimeMs = (wordCount / wordsPerMinute) * 60 * 1000
  
  // Apply buffer multiplier to account for pauses, emphasis, and processing time
  const bufferedTimeMs = baseTimeMs * bufferMultiplier
  
  // Ensure the time is within reasonable bounds
  return Math.max(minimumTime, Math.min(maximumTime, Math.round(bufferedTimeMs)))
}

/**
 * Count words in a text string
 * Handles multiple spaces, punctuation, and special characters
 * 
 * @param text - The text to count words in
 * @returns Number of words
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0
  }

  // Remove extra whitespace and split by whitespace
  // This handles multiple spaces, tabs, newlines, etc.
  const words = text.trim().split(/\s+/).filter(word => word.length > 0)
  
  return words.length
}

/**
 * Get speaking time for onboarding/goal creation steps
 * This is a specialized version with settings optimized for the conversational AI coach
 * 
 * @param text - The main text to be spoken
 * @param subtext - Optional subtext that will also be spoken
 * @returns Speaking time in milliseconds
 */
export function getCoachSpeakingTime(text: string, subtext?: string): number {
  const fullText = subtext ? `${text} ${subtext}` : text
  
  // Use slightly slower speaking rate for conversational AI (140 WPM)
  // and more generous buffer (1.8x) to account for AI voice synthesis timing
  return calculateSpeakingTime(
    fullText,
    140, // words per minute
    3000, // minimum 3 seconds
    20000, // maximum 20 seconds
    1.8 // 80% buffer for AI voice timing
  )
}

/**
 * Debug function to log timing calculations
 */
export function logSpeakingTimeDebug(text: string, subtext?: string): void {
  const fullText = subtext ? `${text} ${subtext}` : text
  const wordCount = countWords(fullText)
  const speakingTime = getCoachSpeakingTime(text, subtext)
  
  console.log('🎤 [Speech Timing]', {
    text: fullText.substring(0, 50) + (fullText.length > 50 ? '...' : ''),
    wordCount,
    speakingTimeMs: speakingTime,
    speakingTimeSeconds: (speakingTime / 1000).toFixed(1)
  })
}
