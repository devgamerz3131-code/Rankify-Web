/**
 * Utility formatters for dates, numbers, time, and percentages.
 */

export function formatDate(date: Date | number | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hrs = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return remMin > 0 ? `${hrs}h ${remMin}m` : `${hrs}h`;
}

export function formatPercentage(val: number, decimals: number = 0): string {
  return `${val.toFixed(decimals)}%`;
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-IN').format(val);
}
