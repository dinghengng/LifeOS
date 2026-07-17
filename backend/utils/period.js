// weekly reset for challenges in sgt
function getSGTDateStr(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(date);
}

function getWeekBoundsSGT() {
  const sgtTodayStr = getSGTDateStr();
  const sgtToday = new Date(`${sgtTodayStr}T00:00:00+08:00`);
  const jsDayOfWeek = sgtToday.getUTCDay(); 
  const todayIndexMon = (jsDayOfWeek + 6) % 7; 

  const monday = new Date(sgtToday);
  monday.setUTCDate(sgtToday.getUTCDate() - todayIndexMon);

  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(monday.getUTCDate() + 7);

  return { start: monday, end: nextMonday };
}

function getMonthBoundsSGT() {
  const sgtTodayStr = getSGTDateStr();
  const [year, month] = sgtTodayStr.split("-").map(Number);

  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+08:00`);
  const nextMonth = new Date(start);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

  return { start, end: nextMonth };
}

function getPeriodBounds(periodType) {
  return periodType === "monthly" ? getMonthBoundsSGT() : getWeekBoundsSGT();
}

module.exports = { getSGTDateStr, getWeekBoundsSGT, getMonthBoundsSGT, getPeriodBounds };