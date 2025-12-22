import { supabase } from './supabase'

class HeartbeatService {
  private interval: number | null = null
  private deviceId: string | null = null

  start(deviceId: string): void {
    this.deviceId = deviceId
    this.sendHeartbeat()
    this.interval = window.setInterval(() => {
      this.sendHeartbeat()
    }, 30000) // Every 30 seconds
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  private async sendHeartbeat(): Promise<void> {
    if (!this.deviceId) return

    try {
      const { error } = await supabase
        .from('app_8c186_devices')
        .update({
          is_online: true,
          last_heartbeat: new Date().toISOString()
        })
        .eq('id', this.deviceId)

      if (error) {
        console.error('Heartbeat error:', error)
      }
    } catch (error) {
      console.error('Failed to send heartbeat:', error)
    }
  }
}

export const heartbeat = new HeartbeatService()
export default heartbeat