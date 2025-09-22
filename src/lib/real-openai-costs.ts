/**
 * Minimal RealOpenAICostsService to unblock Next.js build.
 * Replace with your real-time OpenAI billing integration when ready.
 */
export type RealCostSnapshot = {
  timestamp: string
  usd: number
}

export class RealOpenAICostsService {
  /**
   * Return a mock current month cost to render UI without crashing.
   */
  static async getCurrentMonthCost(): Promise<RealCostSnapshot> {
    return { timestamp: new Date().toISOString(), usd: 0 }
  }

  /**
   * Return daily snapshots for the last N days. Default to empty data.
   */
  static async getDailySnapshots(days: number = 7): Promise<RealCostSnapshot[]> {
    const today = Date.now()
    return Array.from({ length: days }).map((_, i) => ({
      timestamp: new Date(today - i * 24 * 60 * 60 * 1000).toISOString(),
      usd: 0
    }))
  }
}




