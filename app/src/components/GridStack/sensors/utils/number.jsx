export function hasDecimals(n) {
  return n % 1 !== 0;
}

export function formatValue(v) {
  if (v == null) return "-";
  return Number.isInteger(v)
    ? v.toLocaleString()
    : v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

