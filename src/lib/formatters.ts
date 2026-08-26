/**
 * Formats a duration in seconds into mm:ss.cc (minutes:seconds.hundredths)
 * e.g., 65.42 -> "01:05.42"
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hundredths = Math.floor((seconds - Math.floor(seconds)) * 100);

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const cc = String(hundredths).padStart(2, '0');

  return `${mm}:${ss}.${cc}`;
}

/**
 * Formats seconds into a compact string with unit (e.g., "14.25s" or "2m 14.2s")
 */
export function formatSecondsShort(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0.00s';
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const remSecs = (seconds % 60).toFixed(1);
  return `${mins}m ${remSecs}s`;
}

/**
 * Formats ISO string or Date into readable local date and time string
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return isoString;
  }
}
