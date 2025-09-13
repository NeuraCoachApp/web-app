// Eleven Labs Voice Synthesis Service

interface ElevenLabsConfig {
  apiKey: string
  voiceId: string
  modelId?: string
}

interface SynthesizeOptions {
  text: string
  voiceSettings?: {
    stability?: number
    similarity_boost?: number
    style?: number
    use_speaker_boost?: boolean
  }
}

class ElevenLabsService {
  private apiKey: string
  private voiceId: string
  private modelId: string
  private baseUrl = 'https://api.elevenlabs.io/v1'

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey
    this.voiceId = config.voiceId
    this.modelId = config.modelId || 'eleven_monolingual_v1'
  }

  async synthesize(options: SynthesizeOptions & { onRetry?: (attempt: number, delay: number) => void }): Promise<ArrayBuffer> {
    const { text, voiceSettings = {}, onRetry } = options

    const defaultVoiceSettings = {
      stability: 0.75, // Increased for more measured speech
      similarity_boost: 0.8,
      style: 0.4, // Increased for more expressive, slower delivery
      use_speaker_boost: true,
      ...voiceSettings
    }

    return await this.retryWithBackoff(async () => {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${this.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text,
          model_id: this.modelId,
          voice_settings: defaultVoiceSettings
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
      }

      return await response.arrayBuffer()
    }, onRetry)
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, delay: number) => void,
    maxRetries: number = 3,
    baseDelay: number = 5000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error: any) {
        // Check if it's a rate limit error (429)
        const is429Error = error?.message?.includes('429') || error?.status === 429
        
        if (is429Error && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000 // Exponential backoff with jitter
          console.log(`🔄 [ElevenLabs] Rate limited. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
          
          // Notify the UI about the retry
          if (onRetry) {
            onRetry(attempt + 1, delay)
          }
          
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        // If it's not a rate limit error or we're out of retries, throw
        throw error
      }
    }
    
    throw new Error('Max retries exceeded')
  }

  async getVoices() {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'xi-api-key': this.apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    return await response.json()
  }
}

// Audio cache for pre-fetched audio
interface AudioCacheEntry {
  audio: HTMLAudioElement
  timestamp: number
}

class AudioCache {
  private cache = new Map<string, AudioCacheEntry>()
  private readonly maxAge = 5 * 60 * 1000 // 5 minutes

  set(key: string, audio: HTMLAudioElement) {
    // Clean up old entries
    this.cleanup()
    
    this.cache.set(key, {
      audio,
      timestamp: Date.now()
    })
  }

  get(key: string): HTMLAudioElement | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if entry is still valid
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key)
      // Clean up blob URL
      if (entry.audio.src) {
        URL.revokeObjectURL(entry.audio.src)
      }
      return null
    }

    return entry.audio
  }

  private cleanup() {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.maxAge) {
        keysToDelete.push(key)
        // Clean up blob URL
        if (entry.audio.src) {
          URL.revokeObjectURL(entry.audio.src)
        }
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  clear() {
    // Clean up all blob URLs before clearing
    this.cache.forEach(entry => {
      if (entry.audio.src) {
        URL.revokeObjectURL(entry.audio.src)
      }
    })
    this.cache.clear()
  }
}

// Create a singleton instance
let elevenLabsInstance: ElevenLabsService | null = null
const audioCache = new AudioCache()

export function getElevenLabsService(): ElevenLabsService {
  if (!elevenLabsInstance) {
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
    const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL' // Default Bella voice

    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_ELEVENLABS_API_KEY environment variable is required')
    }

    elevenLabsInstance = new ElevenLabsService({
      apiKey,
      voiceId
    })
  }

  return elevenLabsInstance
}

// Enhanced interface for speech progress tracking
interface SpeechProgressCallbacks {
  onPreparing?: () => void
  onStart?: (audio: HTMLAudioElement) => void
  onProgress?: (currentTime: number, duration: number, text: string, currentWordIndex?: number) => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

// Utility function to estimate which word is being spoken based on time
function getCurrentWordIndex(currentTime: number, duration: number, wordCount: number, playbackRate: number = 0.85): number {
  if (duration === 0 || wordCount === 0) return 0
  
  // Calculate progress through the audio
  const progress = currentTime / duration
  
  // Show words slightly ahead of the audio for more natural reading experience
  // This gives users time to read before hearing the word
  const leadTime = 0.1 // 100ms ahead
  const adjustedProgress = Math.min(1, progress + leadTime)
  const wordIndex = Math.floor(adjustedProgress * wordCount)
  
  return Math.min(Math.max(0, wordIndex), wordCount - 1)
}

// Utility function to split text into words while preserving spacing
// This MUST match the splitting logic in RealTimeCaptions.tsx
function splitTextIntoWords(text: string): string[] {
  return text.split(/(\s+)/).filter(part => part.length > 0)
}

// Hook for using voice synthesis in React components
export function useVoiceSynthesis() {
  const synthesizeText = async (text: string, useCache: boolean = true, onRetry?: (attempt: number, delay: number) => void): Promise<HTMLAudioElement> => {
    try {
      // Check cache first if enabled
      if (useCache) {
        const cached = audioCache.get(text)
        if (cached) {
          // Clone the cached audio element to avoid conflicts
          const clonedAudio = cached.cloneNode(true) as HTMLAudioElement
          clonedAudio.playbackRate = 0.85
          return clonedAudio
        }
      }

      const service = getElevenLabsService()
      const audioBuffer = await service.synthesize({ text, onRetry })
      
      // Convert ArrayBuffer to audio element
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)
      
      // Slow down the playback rate for more measured speech
      audio.playbackRate = 0.85 // 15% slower than normal speed
      
      // Cache the audio if caching is enabled
      if (useCache) {
        audioCache.set(text, audio)
      }
      
      return audio
    } catch (error) {
      console.error('Voice synthesis error:', error)
      throw error
    }
  }

  // Pre-fetch audio for future use
  const prefetchAudio = async (text: string): Promise<void> => {
    try {
      // Don't prefetch if already cached
      if (audioCache.get(text)) {
        return
      }

      // Synthesize and cache in background
      await synthesizeText(text, true)
    } catch (error) {
      // Silently fail for prefetch operations
      console.warn('Pre-fetch failed for text:', text, error)
    }
  }

  const playText = async (
    text: string, 
    onStart?: () => void, 
    onEnd?: () => void
  ): Promise<void> => {
    try {
      const audio = await synthesizeText(text)
      
      if (onStart) {
        audio.addEventListener('play', onStart)
      }
      
      if (onEnd) {
        audio.addEventListener('ended', onEnd)
      }
      
      await audio.play()
    } catch (error) {
      console.error('Error playing text:', error)
      if (onEnd) onEnd()
    }
  }

  const playTextWithProgress = async (
    text: string,
    callbacks: SpeechProgressCallbacks & { onRetry?: (attempt: number, delay: number) => void } = {}
  ): Promise<HTMLAudioElement> => {
    const { onPreparing, onStart, onProgress, onEnd, onError, onRetry } = callbacks

    try {
      // Notify that we're preparing the speech
      onPreparing?.()
      
      const audio = await synthesizeText(text, true, onRetry)
      
      // Set up event listeners
      const handleLoadedMetadata = () => {
        onStart?.(audio)
      }
      
      const handleTimeUpdate = () => {
        if (audio.duration) {
          const words = splitTextIntoWords(text)
          const wordCount = words.filter(word => word.trim().length > 0).length
          const currentWordIndex = getCurrentWordIndex(audio.currentTime, audio.duration, wordCount, audio.playbackRate)
          onProgress?.(audio.currentTime, audio.duration, text, currentWordIndex)
        }
      }
      
      const handleEnded = () => {
        cleanup()
        onEnd?.()
      }
      
      const handleError = (e: Event) => {
        cleanup()
        onError?.(new Error('Audio playback error'))
      }
      
      // Also add a more frequent update mechanism using requestAnimationFrame
      // for smoother caption updates
      let animationFrameId: number | null = null
      const updateProgress = () => {
        if (audio && !audio.paused && !audio.ended && audio.duration) {
          handleTimeUpdate()
          animationFrameId = requestAnimationFrame(updateProgress)
        }
      }
      
      // Start the animation frame updates when audio starts playing
      const handlePlay = () => {
        animationFrameId = requestAnimationFrame(updateProgress)
      }
      
      const handlePause = () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
      }
      
      const cleanup = () => {
        // Cancel animation frame updates
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
        // Remove all event listeners
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('error', handleError)
        audio.removeEventListener('play', handlePlay)
        audio.removeEventListener('pause', handlePause)
        // Clean up blob URL to prevent memory leaks
        if (audio.src) {
          URL.revokeObjectURL(audio.src)
        }
      }
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('error', handleError)
      audio.addEventListener('play', handlePlay)
      audio.addEventListener('pause', handlePause)
      
      await audio.play()
      return audio
    } catch (error) {
      console.error('Error playing text with progress:', error)
      onError?.(error as Error)
      throw error
    }
  }

  return {
    synthesizeText,
    playText,
    playTextWithProgress,
    prefetchAudio
  }
}
