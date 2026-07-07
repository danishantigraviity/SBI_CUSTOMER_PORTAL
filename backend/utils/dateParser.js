/**
 * Safe date parsing utility.
 * Handles:
 * - Date instances (returns them directly)
 * - DD/MM/YYYY (with slashes or dashes)
 * - YYYY-MM-DD (with slashes or dashes)
 * - Other standard date string formats
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();

  // Try DD/MM/YYYY or DD-MM-YYYY format first
  const dmw = trimmed.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (dmw) {
    const day = parseInt(dmw[1], 10);
    const month = parseInt(dmw[2], 10) - 1;
    const year = parseInt(dmw[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Try YYYY-MM-DD or YYYY/MM/DD
  const ymd = trimmed.match(/^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})$/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10) - 1;
    const day = parseInt(ymd[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

module.exports = { parseDate };
