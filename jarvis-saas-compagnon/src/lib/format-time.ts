export function formatDuration(secondsInput?: number | null): string {
  if (!secondsInput || secondsInput <= 0) return '0m'
  const seconds = Math.floor(secondsInput)
  if (seconds >= 86400) {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    return `${days}j ${hours}h`
  }
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
  const minutes = Math.floor(seconds / 60)
  const remSeconds = seconds % 60
  return `${minutes}m ${remSeconds}s`
}

export function formatDurationFromMinutes(minutesInput?: number | null): string {
  if (!minutesInput || minutesInput <= 0) return '0m'
  const totalSeconds = Math.floor(minutesInput * 60)
  return formatDuration(totalSeconds)
}

