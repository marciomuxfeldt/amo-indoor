class AudioService {
  private audio: HTMLAudioElement | null = null

  playNotification(): void {
    try {
      if (!this.audio) {
        this.audio = new Audio('/assets/sounds/notification.mp3')
        this.audio.volume = 0.7
      }
      this.audio.currentTime = 0
      this.audio.play().catch(err => {
        console.warn('Failed to play notification sound:', err)
      })
    } catch (error) {
      console.warn('Audio playback not supported:', error)
    }
  }
}

export const audio = new AudioService()
export default audio