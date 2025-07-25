declare module 'react-speech-recognition' {
  export interface UseSpeechRecognitionOptions {
    commands?: any[]
  }
  export interface SpeechRecognitionResult {
    transcript: string
    confidence: number
  }
  export interface UseSpeechRecognitionResult {
    transcript: string
    listening: boolean
    resetTranscript: () => void
    browserSupportsSpeechRecognition: boolean
    finalTranscript: string
    interimTranscript: string
  }
  export function useSpeechRecognition(
    options?: UseSpeechRecognitionOptions
  ): UseSpeechRecognitionResult

  const SpeechRecognition: {
    startListening: (options?: { continuous?: boolean; language?: string }) => void
    stopListening: () => void
    abortListening: () => void
  }
  export default SpeechRecognition
}
