function isQuietHours(quietStart, quietEnd) {
  if (!quietStart || !quietEnd) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = quietStart.split(':').map(Number);
  const [endH, endM] = quietEnd.split(':').map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  if (start > end) {
    return current >= start || current <= end;
  }
  return current >= start && current <= end;
}

module.exports = { isQuietHours };