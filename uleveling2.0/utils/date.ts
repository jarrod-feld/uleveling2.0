import { formatDistanceToNow, parseISO, isSameDay, startOfDay } from 'date-fns';

/**
 * Formats an ISO date string into a relative time string (e.g., "about 2 hours ago").
 * @param isoDate - The ISO date string to format.
 * @returns The formatted relative time string.
 */
export function formatRelativeTime(isoDate: string): string {
  try {
    const date = parseISO(isoDate);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Checks if a given date string is in the past.
 * @param isoDate - The ISO date string to check.
 * @returns True if the date is in the past, false otherwise.
 */
export function isPastDate(isoDate: string): boolean {
  try {
    const date = parseISO(isoDate);
    return date.getTime() < Date.now();
  } catch (error) {
    console.error('Error parsing date:', error);
    return false;
  }
}

/**
 * Checks if a given ISO date string falls on the current calendar day.
 * @param isoDate - The ISO date string to check.
 * @returns True if the date is today, false otherwise.
 */
export function isToday(isoDate: string): boolean {
  try {
    const date = parseISO(isoDate);
    const today = startOfDay(new Date());
    return isSameDay(date, today);
  } catch (error) {
    console.error('[date utils] Error checking if date is today:', error);
    return false; // Assume not today on error
  }
} 