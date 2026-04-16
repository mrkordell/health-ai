/**
 * Database query helpers
 *
 * All date/time functions are timezone-aware and return ranges as
 * { start: Date; end: Date } where both are UTC instants suitable for
 * comparing against `timestamp with time zone` columns in Postgres.
 */

import { subDays, format } from 'date-fns';
import { fromZonedTime, formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Get date range for "today" in user's timezone.
 *
 * @example
 * // User in New York (UTC-4 during DST) on 2026-04-15 at 3pm local
 * getTodayRange('America/New_York')
 * // start: 2026-04-15T04:00:00Z (midnight NY)
 * // end:   2026-04-16T03:59:59.999Z (end of day NY)
 */
export function getTodayRange(timezone: string): { start: Date; end: Date } {
  const todayInTz = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  return getDateRange(todayInTz, timezone);
}

/**
 * Get date range for a specific calendar day in the user's timezone.
 *
 * @param date - YYYY-MM-DD (interpreted in the given timezone)
 */
export function getDateRange(
  date: string,
  timezone: string
): { start: Date; end: Date } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  }

  const start = fromZonedTime(`${date}T00:00:00.000`, timezone);
  const end = fromZonedTime(`${date}T23:59:59.999`, timezone);

  return { start, end };
}

/**
 * Get date range for the last N days (inclusive of today) in the user's timezone.
 */
export function getLastNDaysRange(
  days: number = 30,
  timezone: string
): { start: Date; end: Date } {
  const { end } = getTodayRange(timezone);

  // Do the day arithmetic on the wall-clock date in the user's zone so DST
  // transitions don't shift us across a day boundary.
  const zonedNow = toZonedTime(new Date(), timezone);
  const earlierDate = format(subDays(zonedNow, days - 1), 'yyyy-MM-dd');
  const { start } = getDateRange(earlierDate, timezone);

  return { start, end };
}
