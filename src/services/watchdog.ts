class WatchdogService {
  private timeout: number = 5 * 60 * 1000 // 5 minutes
  private timer: number | null = null
  private lastActivity: number = Date.now()

  start(): void {
    this.reset()
    this.setupActivityListeners()
    this.checkActivity()
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  reset(): void {
    this.lastActivity = Date.now()
  }

  private setupActivityListeners(): void {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(event => {
      window.addEventListener(event, () => this.reset(), { passive: true })
    })
  }

  private checkActivity(): void {
    const check = () => {
      const now = Date.now()
      const elapsed = now - this.lastActivity

      if (elapsed > this.timeout) {
        console.warn('Watchdog: System appears frozen, reloading...')
        window.location.reload()
      } else {
        this.timer = window.setTimeout(check, 30000) // Check every 30 seconds
      }
    }

    check()
  }
}

export const watchdog = new WatchdogService()
export default watchdog