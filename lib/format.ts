/** Display helpers. Money renders in mono (the callers set the font). */

import { POISHA_PER_TAKA } from "./money.ts";

/** Format a plain taka amount: taka(50) → "৳50". */
export function taka(n: number): string {
  return `৳${Math.round(n).toLocaleString("en-US")}`;
}

/**
 * Format integer poisha as taka: whole amounts stay whole ("৳210"),
 * fractional poisha keep two decimals ("৳210.05"). Never rounds money away.
 */
export function takaFromPoisha(poisha: number): string {
  const sign = poisha < 0 ? "−" : "";
  const abs = Math.abs(poisha);
  const whole = Math.floor(abs / POISHA_PER_TAKA);
  const rem = abs % POISHA_PER_TAKA;
  const wholeStr = whole.toLocaleString("en-US");
  return rem === 0
    ? `${sign}৳${wholeStr}`
    : `${sign}৳${wholeStr}.${String(rem).padStart(2, "0")}`;
}

export function views(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export function dateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400_000));
}

export function hoursSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 3600_000));
}

/* ── Asia/Dhaka — all product-facing dates & streak weeks (UTC+6, no DST) ── */

const DHAKA_TZ = "Asia/Dhaka";
const DHAKA_OFFSET_MS = 6 * 3600_000;

export function dhakaDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: DHAKA_TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Today's Dhaka date for the app-shell header eyebrow: "Thursday 23 July". */
export function dhakaToday(now: Date = new Date()): string {
  const part = (o: Intl.DateTimeFormatOptions) =>
    now.toLocaleDateString("en-US", { timeZone: DHAKA_TZ, ...o });
  return `${part({ weekday: "long" })} ${part({ day: "numeric" })} ${part({ month: "long" })}`;
}

export function dhakaDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: DHAKA_TZ,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * The Dhaka week key for streak accounting — "YYYY-Wnn" (ISO week, Monday
 * start), computed on the Dhaka-local calendar date. Two timestamps share a
 * streak week iff their keys match.
 */
export function dhakaWeek(iso: string): string {
  // Shift to Dhaka wall-clock, then do ISO-week math in UTC space.
  const local = new Date(new Date(iso).getTime() + DHAKA_OFFSET_MS);
  const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
  const day = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day); // nearest Thursday decides the week-year
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Normalise a date-input value (YYYY-MM-DD) to the END of that day in Dhaka
 * (23:59:59.999+06) as a UTC ISO string — campaign end-date semantics.
 */
export function endOfDhakaDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) throw new Error(`invalid date: ${dateStr}`);
  const endLocal = Date.UTC(y, m - 1, d, 23, 59, 59, 999);
  return new Date(endLocal - DHAKA_OFFSET_MS).toISOString();
}

/** ISO → the Dhaka calendar date as a `YYYY-MM-DD` `<input type="date">` value. */
export function dhakaDateInput(iso: string): string {
  // en-CA renders ISO-style YYYY-MM-DD; the tz pins it to the Dhaka day.
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: DHAKA_TZ });
}
