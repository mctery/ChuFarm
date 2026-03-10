/**
 * Format a date value to Thai locale short date + time string.
 * Returns "—" for falsy values.
 */
export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}
