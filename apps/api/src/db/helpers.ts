/**
 * Database query helpers
 *
 * All date/time functions are timezone-aware.
 * Return ranges as { start: Date; end: Date } for consistency.
 */

/**
 * Get date range for "today" in user's timezone
 *
 * @param timezone - IANA timezone (e.g., "America/New_York")
 * @returns { start, end } - UTC timestamps for start and end of day
 *
 * @example
 * // User in New York (UTC-5) on 2025-01-15 at 3pm
 * getTodayRange('America/New_York')
 * // Returns:
 * // start: 2025-01-15 05:00:00 UTC (midnight in NY)
 * // end:   2025-01-16 04:59:59 UTC (23:59:59 in NY)
 */
export function getTodayRange(timezone: string): { start: Date; end: Date } {
  const now = new Date();

  // Get the date string in the user's timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatter.format(now); // "2025-01-15"

  // Parse the date parts
  const [year, month, day] = dateStr.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Failed to parse date string: ${dateStr}`);
  }

  // Create start of day in the user's timezone
  const startStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`;
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59.999`;

  // Convert to UTC by creating dates with timezone offset
  const start = new Date(
    new Date(startStr).toLocaleString('en-US', { timeZone: timezone })
  );
  const end = new Date(
    new Date(endStr).toLocaleString('en-US', { timeZone: timezone })
  );

  // Calculate the offset and adjust
  const startInTz = new Date(
    startStr + getTimezoneOffsetString(timezone, new Date(startStr))
  );
  const endInTz = new Date(
    endStr + getTimezoneOffsetString(timezone, new Date(endStr))
  );

  return {
    start: startInTz,
    end: endInTz,
  };
}

/**
 * Get timezone offset string for a given timezone and date
 */
function getTimezoneOffsetString(timezone: string, date: Date): string {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const offsetMs = utcDate.getTime() - tzDate.getTime();
  const offsetHours = Math.floor(Math.abs(offsetMs) / (1000 * 60 * 60));
  const offsetMinutes = Math.floor(
    (Math.abs(offsetMs) % (1000 * 60 * 60)) / (1000 * 60)
  );
  const sign = offsetMs >= 0 ? '+' : '-';
  return `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
}

/**
 * Get date range for last N days (inclusive)
 *
 * @param days - Number of days to include (default 30)
 * @param timezone - User's timezone
 * @returns { start, end } - UTC timestamps
 */
export function getLastNDaysRange(
  days: number = 30,
  timezone: string
): { start: Date; end: Date } {
  const { end } = getTodayRange(timezone);

  // Go back N-1 days from today's start (today counts as day 1)
  const { start: todayStart } = getTodayRange(timezone);
  const start = new Date(todayStart);
  start.setDate(start.getDate() - (days - 1));

  return { start, end };
}

/**
 * Get date range for a specific date in user's timezone
 *
 * @param date - The date to get range for (YYYY-MM-DD format)
 * @param timezone - User's timezone
 * @returns { start, end } - UTC timestamps for start and end of that day
 */
export function getDateRange(
  date: string,
  timezone: string
): { start: Date; end: Date } {
  const [year, month, day] = date.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  }

  const startStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`;
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59.999`;

  const startInTz = new Date(
    startStr + getTimezoneOffsetString(timezone, new Date(startStr))
  );
  const endInTz = new Date(
    endStr + getTimezoneOffsetString(timezone, new Date(endStr))
  );

  return {
    start: startInTz,
    end: endInTz,
  };
}
