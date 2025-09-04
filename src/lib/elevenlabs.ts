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
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.0,
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

  return {
    synthesizeText,
    playText
  }
}
