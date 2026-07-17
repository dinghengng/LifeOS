// weekly reset for challenges in sgt
function getSGTDateStr(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(date);
}

function calendarDate(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d));
}

function calendarToDateStr(calDate) {
  return calDate.toISOString().split("T")[0];
}

function calendarToSGTInstant(calDate) {
  return new Date(calDate.getTime() - 8 * 60 * 60 * 1000);
}

function getWeekBoundsSGT(date = new Date()) {
  const [y, m, d] = getSGTDateStr(date).split("-").map(Number);
  const today = calendarDate(y, m, d);
  const dow = today.getUTCDay();
  const mondayOffset = (dow + 6) % 7;

  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - mondayOffset);

  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(monday.getUTCDate() + 7);

  return {
    startDateStr: calendarToDateStr(monday),
    endDateStr: calendarToDateStr(nextMonday),
    startInstant: calendarToSGTInstant(monday),
    endInstant: calendarToSGTInstant(nextMonday),
  };
}

function getMonthBoundsSGT(date = new Date()) {
  const [y, m] = getSGTDateStr(date).split("-").map(Number);
  const start = calendarDate(y, m, 1);
  const nextMonth = calendarDate(y, m + 1, 1); // JS Date handles year rollover automatically

  return {
    startDateStr: calendarToDateStr(start),
    endDateStr: calendarToDateStr(nextMonth),
    startInstant: calendarToSGTInstant(start),
    endInstant: calendarToSGTInstant(nextMonth),
  };
}

function getPeriodBounds(periodType) {
  return periodType === "monthly" ? getMonthBoundsSGT() : getWeekBoundsSGT();
}

module.exports = { getSGTDateStr, getWeekBoundsSGT, getMonthBoundsSGT, getPeriodBounds };