/**
 * IST (Asia/Kolkata, UTC+5:30) date helpers for the API server.
 *
 * All date-logic in this app must use IST because:
 *  - NSE operates on IST
 *  - "Today's" recommendations are IST calendar days
 *  - The server runs on UTC — never use new Date().toISOString() for business logic
 */

/** Returns the current year/month/day in IST. */
export function nowISTParts(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)!.value, 10);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Returns today's date string in IST as "YYYY-MM-DD". */
export function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/**
 * Returns the first day of a month (N months ago from now in IST) as "YYYY-MM-DD".
 * monthsAgo=0 → this month, 1 → last month, etc.
 */
export function startOfMonthISTStr(monthsAgo = 0): string {
  const { year, month } = nowISTParts();
  const d = new Date(year, month - 1 - monthsAgo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Returns the first day of the month AFTER N months ago (exclusive end boundary).
 * e.g. monthsAgo=0 → first day of next month.
 */
export function endOfMonthISTStr(monthsAgo = 0): string {
  const { year, month } = nowISTParts();
  const d = new Date(year, month - 1 - monthsAgo + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Returns the month label for N months ago as "YYYY-MM".
 */
export function monthLabelIST(monthsAgo = 0): string {
  const { year, month } = nowISTParts();
  const d = new Date(year, month - 1 - monthsAgo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Returns a UTC Date representing midnight IST on the given "YYYY-MM-DD" string.
 * Use this when comparing against timestamp columns (createdAt etc.) in Postgres.
 */
export function istMidnightUTC(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+05:30`);
}
