// ======================================================
// UTILITIES
// ======================================================

function formatDate(date) {
  if (!date) return "";
  try {
    return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
  } catch(e) {
    return String(date);
  }
}

/**
 * Generates a unique ID for orders or customers
 */
function generateUniqueId(prefix) {
  return (prefix || "ID") + Math.floor(100000 + Math.random() * 900000);
}

/**
 * Cleans mobile numbers to standard 10 digits
 */
function cleanMobile(mobile) {
  if (!mobile) return "";
  const cleaned = String(mobile).replace(/\D/g, "");
  return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
}

/**
 * Finds column index by name (case-insensitive, space-insensitive, special-chars-insensitive)
 */
function findColumnIndex(headerRow, name) {
  if (!headerRow || !Array.isArray(headerRow)) return -1;
  const target = String(name || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i] || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (header === target) return i;
  }
  return -1;
}