// Speech Recognition Service for capturing voice input

interface SpeechRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  maxAlternatives?: number
  onInterimResult?: (transcript: string) => void
  onFinalResult?: (transcript: string) => void
}

interface NameExtractionResult {
  firstName?: string
  lastName?: string
  fullText: string
  confidence: number
}

class SpeechRecognitionService {
  private recognition: any = null
  private isSupported = false

  constructor() {
    if (typeof window !== 'undefined') {
      // Check for browser support
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.isSupported = true
      }
    }
  }

  isAvailable(): boolean {
    return this.isSupported && this.recognition !== null
  }

  async requestMicrophonePermission(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.warn('Microphone permission denied:', error)
      return false
    }
  }

  async startListening(options: SpeechRecognitionOptions = {}): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Speech recognition is not supported in this browser')
    }

    // Request microphone permission first
    const hasPermission = await this.requestMicrophonePermission()
    if (!hasPermission) {
      throw new Error('Microphone permission is required for speech recognition')
    }

    return new Promise((resolve, reject) => {
      // Configure recognition
      this.recognition.continuous = options.continuous || false
      this.recognition.interimResults = options.interimResults || false
      this.recognition.lang = options.language || 'en-US'
      this.recognition.maxAlternatives = options.maxAlternatives || 1

      let finalTranscript = ''

      this.recognition.onresult = (event: any) => {
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        // If we have a final result, resolve with it
        if (finalTranscript) {
          resolve(finalTranscript.trim())
        }
      }

      this.recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      this.recognition.onend = () => {
        if (finalTranscript) {
          resolve(finalTranscript.trim())
        } else {
          reject(new Error('No speech was recognized'))
        }
      }

      // Start recognition
      this.recognition.start()
    })
  }

  stop(): void {
    if (this.recognition) {
      this.recognition.stop()
    }
  }

  /**
   * Extract first and last name from speech text using simple patterns
   */
  extractNameFromSpeech(speechText: string): NameExtractionResult {
    const text = speechText.toLowerCase().trim()
    
    // Common patterns for name introduction
    const patterns = [
      /my name is ([a-zA-Z]+)\s+([a-zA-Z]+)/i,
      /i'm ([a-zA-Z]+)\s+([a-zA-Z]+)/i,
      /i am ([a-zA-Z]+)\s+([a-zA-Z]+)/i,
      /call me ([a-zA-Z]+)\s+([a-zA-Z]+)/i,
      /it's ([a-zA-Z]+)\s+([a-zA-Z]+)/i,
      /this is ([a-zA-Z]+)\s+([a-zA-Z]+)/i,
    ]

    // Try to match full name patterns first
    for (const pattern of patterns) {
      const match = speechText.match(pattern)
      if (match) {
        return {
          firstName: this.capitalizeFirstLetter(match[1]),
          lastName: this.capitalizeFirstLetter(match[2]),
          fullText: speechText,
          confidence: 0.9
        }
      }
    }

    // Try single name patterns
    const singleNamePatterns = [
      /my name is ([a-zA-Z]+)/i,
      /i'm ([a-zA-Z]+)/i,
      /i am ([a-zA-Z]+)/i,
      /call me ([a-zA-Z]+)/i,
      /it's ([a-zA-Z]+)/i,
      /this is ([a-zA-Z]+)/i,
    ]

    for (const pattern of singleNamePatterns) {
      const match = speechText.match(pattern)
      if (match) {
        return {
          firstName: this.capitalizeFirstLetter(match[1]),
          fullText: speechText,
          confidence: 0.7
        }
      }
    }

    // If no patterns match, try to extract potential names from the text
    const words = speechText.split(/\s+/).filter(word => 
      word.length > 1 && 
      /^[a-zA-Z]+$/.test(word) &&
      !this.isCommonWord(word.toLowerCase())
    )

    if (words.length >= 2) {
      return {
        firstName: this.capitalizeFirstLetter(words[0]),
        lastName: this.capitalizeFirstLetter(words[1]),
        fullText: speechText,
        confidence: 0.5
      }
    } else if (words.length === 1) {
      return {
        firstName: this.capitalizeFirstLetter(words[0]),
        fullText: speechText,
        confidence: 0.4
      }
    }

    return {
      fullText: speechText,
      confidence: 0.1
    }
  }

  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
      'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
      'hello', 'hi', 'hey', 'yes', 'no', 'okay', 'ok', 'well', 'so', 'now', 'then',
      'name', 'called', 'call', 'me', 'it', 'its'
    ]
    return commonWords.includes(word)
  }
}

// Create singleton instance
let speechRecognitionInstance: SpeechRecognitionService | null = null

export function getSpeechRecognitionService(): SpeechRecognitionService {
  if (!speechRecognitionInstance) {
    speechRecognitionInstance = new SpeechRecognitionService()
  }
  return speechRecognitionInstance
}

// React hook for speech recognition
export function useSpeechRecognition() {
  const service = getSpeechRecognitionService()

  const isSupported = service.isAvailable()

  const startListening = async (options?: SpeechRecognitionOptions): Promise<string> => {
    return await service.startListening(options)
  }

  const stopListening = () => {
    service.stop()
  }

  const requestPermission = async (): Promise<boolean> => {
    return await service.requestMicrophonePermission()
  }

  const extractName = (speechText: string): NameExtractionResult => {
    return service.extractNameFromSpeech(speechText)
  }

  const listenForName = async (): Promise<NameExtractionResult> => {
    try {
      const speechText = await startListening({
        continuous: false,
        interimResults: false,
        language: 'en-US'
      })
      
      return extractName(speechText)
    } catch (error) {
      throw error
    }
  }

  return {
    isSupported,
    startListening,
    stopListening,
    requestPermission,
    extractName,
    listenForName
  }
}
