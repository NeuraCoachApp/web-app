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

  async synthesize(options: SynthesizeOptions): Promise<ArrayBuffer> {
    const { text, voiceSettings = {} } = options

    const defaultVoiceSettings = {
      stability: 0.75, // Increased for more measured speech
      similarity_boost: 0.8,
      style: 0.4, // Increased for more expressive, slower delivery
      use_speaker_boost: true,
      ...voiceSettings
    }

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

// Create a singleton instance
let elevenLabsInstance: ElevenLabsService | null = null

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
  
  // Add some debug logging to help troubleshoot
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log(`Audio progress: ${currentTime.toFixed(2)}/${duration.toFixed(2)} (${(progress * 100).toFixed(1)}%) -> word ${wordIndex}/${wordCount}`)
  }
  
  return Math.min(Math.max(0, wordIndex), wordCount - 1)
}

// Utility function to split text into words while preserving spacing
// This MUST match the splitting logic in RealTimeCaptions.tsx
function splitTextIntoWords(text: string): string[] {
  return text.split(/(\s+)/).filter(part => part.length > 0)
}

// Hook for using voice synthesis in React components
export function useVoiceSynthesis() {
  const synthesizeText = async (text: string): Promise<HTMLAudioElement> => {
    try {
      const service = getElevenLabsService()
      const audioBuffer = await service.synthesize({ text })
      
      // Convert ArrayBuffer to audio element
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)
      
      // Slow down the playback rate for more measured speech
      audio.playbackRate = 0.85 // 15% slower than normal speed
      
      return audio
    } catch (error) {
      console.error('Voice synthesis error:', error)
      throw error
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
    callbacks: SpeechProgressCallbacks = {}
  ): Promise<HTMLAudioElement> => {
    const { onPreparing, onStart, onProgress, onEnd, onError } = callbacks

    try {
      // Notify that we're preparing the speech
      onPreparing?.()
      
      const audio = await synthesizeText(text)
      
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
    playTextWithProgress
  }
}
