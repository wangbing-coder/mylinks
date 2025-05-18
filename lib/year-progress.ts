/**
 * Calculate the progress percentage of a year
 * @param date Current date
 * @param year Year to calculate progress for
 * @returns Progress percentage (0-100)
 */
export function calculateYearProgress(date: Date = new Date(), year?: number): number {
  const targetYear = year || date.getFullYear()
  const now = new Date(date)
  const currentYear = now.getFullYear()
  
  // For past years, return 100%
  if (targetYear < currentYear) {
    return 100
  }
  
  // For future years, return 0%
  if (targetYear > currentYear) {
    return 0
  }
  
  // For current year, calculate actual progress
  const startOfYear = new Date(targetYear, 0, 1) // January 1st of specified year
  const endOfYear = new Date(targetYear + 1, 0, 1) // January 1st of next year
  const totalMilliseconds = endOfYear.getTime() - startOfYear.getTime()
  const elapsedMilliseconds = now.getTime() - startOfYear.getTime()
  return (elapsedMilliseconds / totalMilliseconds) * 100
}

/**
 * Calculate time left in the year
 * @param date Current date
 * @param year Year to calculate time left for
 * @returns Formatted time left string
 */
export function calculateTimeLeft(date: Date = new Date(), year?: number): string {
  const targetYear = year || date.getFullYear()
  const now = new Date(date)
  const currentYear = now.getFullYear()
  
  // For past years, no time left
  if (targetYear < currentYear) {
    return "Year completed"
  }
  
  // For future years, full year left
  if (targetYear > currentYear) {
    return "Year hasn't started yet"
  }
  
  // For current year, calculate actual time left
  const endOfYear = new Date(targetYear + 1, 0, 1) // January 1st of next year
  const timeLeftMs = endOfYear.getTime() - now.getTime()
  
  // Calculate time units
  const seconds = Math.floor((timeLeftMs / 1000) % 60)
  const minutes = Math.floor((timeLeftMs / (1000 * 60)) % 60)
  const hours = Math.floor((timeLeftMs / (1000 * 60 * 60)) % 24)
  const days = Math.floor((timeLeftMs / (1000 * 60 * 60 * 24)) % 30)
  const months = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24 * 30))
  
  // Format the time left string
  let timeLeftString = ""
  if (months > 0) timeLeftString += `${months} month${months !== 1 ? 's' : ''}, `
  if (days > 0 || months > 0) timeLeftString += `${days} day${days !== 1 ? 's' : ''}, `
  if (hours > 0 || days > 0 || months > 0) timeLeftString += `${hours} hour${hours !== 1 ? 's' : ''}, `
  if (minutes > 0 || hours > 0 || days > 0 || months > 0) timeLeftString += `${minutes} minute${minutes !== 1 ? 's' : ''}, `
  timeLeftString += `${seconds} second${seconds !== 1 ? 's' : ''} left`
  
  return timeLeftString
}

/**
 * Get the year status
 * @param date Current date
 * @param year Year to check status for
 * @returns Object with status flags
 */
export function getYearStatus(date: Date = new Date(), year?: number) {
  const targetYear = year || date.getFullYear()
  const currentYear = date.getFullYear()
  
  return {
    isCurrentYear: targetYear === currentYear,
    isCompleted: targetYear < currentYear,
    isFuture: targetYear > currentYear
  }
}
