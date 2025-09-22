/**
 * Minimal RealCostSyncService to satisfy imports at build time.
 * You can later replace with the real implementation.
 */
export type RealCostSyncResult = {
  success: boolean
  message?: string
  sessionsUpdated: number
  totalRealCost: number
  skipped?: boolean
}

export class RealCostSyncService {
  /**
   * Decide if a sync is needed. For now, default to false to avoid heavy work during build/tests.
   */
  static async needsSync(): Promise<boolean> {
    return false
  }

  /**
   * Perform a no-op sync and return a neutral payload so UIs don't break.
   */
  static async syncRealCosts(daysBack: number = 1): Promise<RealCostSyncResult> {
    return {
      success: true,
      message: `Sync placeholder executed (daysBack=${daysBack}). Replace with real logic when ready.`,
      sessionsUpdated: 0,
      totalRealCost: 0,
      skipped: true
    }
  }
}




