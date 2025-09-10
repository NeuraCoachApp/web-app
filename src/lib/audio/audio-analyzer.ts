'use client'

/**
 * Audio Analysis Utility for Real-time Audio Visualization
 * Extracts volume, frequency, and other audio characteristics from HTML Audio elements
 */

export interface AudioAnalysisData {
  volume: number // 0-1, overall volume level
  averageFrequency: number // 0-1, average frequency
  lowFrequency: number // 0-1, bass/low frequency energy
  midFrequency: number // 0-1, mid frequency energy  
  highFrequency: number // 0-1, treble/high frequency energy
  frequencyBands: number[] // Array of frequency band levels for detailed visualization
  isPlaying: boolean
  timestamp: number
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null
  private analyserNode: AnalyserNode | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private dataArray: Uint8Array | null = null
  private isInitialized = false
  private animationFrameId: number | null = null
  private callbacks: ((data: AudioAnalysisData) => void)[] = []
  private currentAudio: HTMLAudioElement | null = null

  constructor() {
    // Initialize Web Audio API when first used
  }

  private async initializeAudioContext() {
    if (this.isInitialized) return

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create analyser node
      this.analyserNode = this.audioContext.createAnalyser()
      this.analyserNode.fftSize = 256 // Higher values = more frequency detail, but more CPU intensive
      this.analyserNode.smoothingTimeConstant = 0.8 // Smooth out rapid changes
      
      // Create data array for frequency data
      const bufferLength = this.analyserNode.frequencyBinCount
      this.dataArray = new Uint8Array(bufferLength)
      
      this.isInitialized = true
    } catch (error) {
      console.warn('Failed to initialize audio context:', error)
    }
  }

  async connectToAudio(audio: HTMLAudioElement) {
    await this.initializeAudioContext()
    
    if (!this.audioContext || !this.analyserNode) {
      console.warn('Audio context not available')
      return
    }

    try {
      // Disconnect previous audio if any
      if (this.sourceNode) {
        this.sourceNode.disconnect()
      }

      // Create source node from audio element
      this.sourceNode = this.audioContext.createMediaElementSource(audio)
      
      // Connect: source -> analyser -> destination
      this.sourceNode.connect(this.analyserNode)
      this.analyserNode.connect(this.audioContext.destination)
      
      this.currentAudio = audio
      
      // Start analysis loop
      this.startAnalysis()
      
    } catch (error) {
      console.warn('Failed to connect to audio:', error)
    }
  }

  private startAnalysis() {
    if (!this.analyserNode || !this.dataArray) return

    const analyze = () => {
      if (!this.analyserNode || !this.dataArray || !this.currentAudio) return

      // Get frequency data
      this.analyserNode.getByteFrequencyData(this.dataArray as Uint8Array)      
      // Calculate volume (RMS of all frequency data)
      let sum = 0
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i] * this.dataArray[i]
      }
      const volume = Math.sqrt(sum / this.dataArray.length) / 255

      // Calculate frequency bands
      const frequencyBands: number[] = []
      const bandsCount = 8 // Number of frequency bands for visualization
      const bandSize = Math.floor(this.dataArray.length / bandsCount)
      
      for (let i = 0; i < bandsCount; i++) {
        let bandSum = 0
        const startIndex = i * bandSize
        const endIndex = Math.min(startIndex + bandSize, this.dataArray.length)
        
        for (let j = startIndex; j < endIndex; j++) {
          bandSum += this.dataArray[j]
        }
        
        frequencyBands.push((bandSum / (endIndex - startIndex)) / 255)
      }

      // Calculate specific frequency ranges
      const lowEnd = Math.floor(this.dataArray.length * 0.1) // First 10% for bass
      const midStart = lowEnd
      const midEnd = Math.floor(this.dataArray.length * 0.7) // 10-70% for mids
      const highStart = midEnd // 70-100% for highs

      const lowFrequency = this.getAverageInRange(0, lowEnd)
      const midFrequency = this.getAverageInRange(midStart, midEnd)
      const highFrequency = this.getAverageInRange(highStart, this.dataArray.length)
      const averageFrequency = (lowFrequency + midFrequency + highFrequency) / 3

      const analysisData: AudioAnalysisData = {
        volume: Math.min(volume * 2, 1), // Amplify volume for better visualization
        averageFrequency,
        lowFrequency,
        midFrequency,
        highFrequency,
        frequencyBands,
        isPlaying: !this.currentAudio.paused && !this.currentAudio.ended,
        timestamp: Date.now()
      }

      // Notify all callbacks
      this.callbacks.forEach(callback => callback(analysisData))

      // Continue analysis if audio is playing
      if (analysisData.isPlaying) {
        this.animationFrameId = requestAnimationFrame(analyze)
      }
    }

    // Start the analysis loop
    analyze()
  }

  private getAverageInRange(start: number, end: number): number {
    if (!this.dataArray) return 0
    
    let sum = 0
    for (let i = start; i < end && i < this.dataArray.length; i++) {
      sum += this.dataArray[i]
    }
    return (sum / (end - start)) / 255
  }

  onAnalysisData(callback: (data: AudioAnalysisData) => void) {
    this.callbacks.push(callback)
    
    // Return cleanup function
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  stopAnalysis() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  disconnect() {
    this.stopAnalysis()
    
    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
    
    this.currentAudio = null
    this.callbacks = []
  }

  cleanup() {
    this.disconnect()
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    
    this.audioContext = null
    this.analyserNode = null
    this.dataArray = null
    this.isInitialized = false
  }
}

// Singleton instance for app-wide use
let audioAnalyzerInstance: AudioAnalyzer | null = null

export function getAudioAnalyzer(): AudioAnalyzer {
  if (!audioAnalyzerInstance) {
    audioAnalyzerInstance = new AudioAnalyzer()
  }
  return audioAnalyzerInstance
}

// React hook for using audio analysis
export function useAudioAnalysis() {
  const analyzer = getAudioAnalyzer()
  
  return {
    connectToAudio: (audio: HTMLAudioElement) => analyzer.connectToAudio(audio),
    onAnalysisData: (callback: (data: AudioAnalysisData) => void) => analyzer.onAnalysisData(callback),
    stopAnalysis: () => analyzer.stopAnalysis(),
    disconnect: () => analyzer.disconnect()
  }
}
