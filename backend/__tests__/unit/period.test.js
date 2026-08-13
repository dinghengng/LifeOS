// Unit tests for backend/utils/period.js.

const {
  getSGTDateStr,
  getWeekBoundsSGT,
  getMonthBoundsSGT,
  getPeriodBounds,
} = require("../../utils/period");

describe("getSGTDateStr", () => {
  // Unit test 1: Check that the function correctly converts a UTC instant to the SGT date string.
  it("rolls over to the next calendar day once SGT (UTC+8) crosses midnight, even though UTC hasn't", () => {
    // 2026-01-01T16:30:00Z = 2026-01-02T00:30:00 in Singapore.
    const utcInstant = new Date("2026-01-01T16:30:00Z");
    expect(getSGTDateStr(utcInstant)).toBe("2026-01-02");
  });

  // Unit test 2: returns the same calendar date when there is no boundary crossing
  it("returns the same calendar date when there is no boundary crossing", () => {
    // 2026-01-01T04:00:00Z = 2026-01-01T12:00:00 in Singapore — well inside the same day.
    const utcInstant = new Date("2026-01-01T04:00:00Z");
    expect(getSGTDateStr(utcInstant)).toBe("2026-01-01");
  });
});

describe("getWeekBoundsSGT", () => {
  // Unit test 3: anchors a mid-week date to the Monday-to-next-Monday window
  it("anchors a mid-week date to the Monday-to-next-Monday window", () => {
    // Wednesday, 14 Jan 2026 (SGT).
    const wednesday = new Date("2026-01-14T04:00:00Z");
    const { startDateStr, endDateStr } = getWeekBoundsSGT(wednesday);
    expect(startDateStr).toBe("2026-01-12"); // Monday
    expect(endDateStr).toBe("2026-01-19"); // following Monday (exclusive)
  });

  // Unit test 4: treats a Monday itself as the start of its own week
  it("treats a Monday itself as the start of its own week", () => {
    const monday = new Date("2026-01-12T04:00:00Z");
    const { startDateStr, endDateStr } = getWeekBoundsSGT(monday);
    expect(startDateStr).toBe("2026-01-12");
    expect(endDateStr).toBe("2026-01-19");
  });

  // Unit test 5: treats a Sunday as the last day of the week that started the prior Monday
  it("treats a Sunday as the last day of the week that started the prior Monday", () => {
    const sunday = new Date("2026-01-18T04:00:00Z");
    const { startDateStr, endDateStr } = getWeekBoundsSGT(sunday);
    expect(startDateStr).toBe("2026-01-12");
    expect(endDateStr).toBe("2026-01-19");
  });

  // Unit test 6: produces start/end instants exactly 7 days apart
  it("produces start/end instants exactly 7 days apart", () => {
    const { startInstant, endInstant } = getWeekBoundsSGT(new Date("2026-01-14T04:00:00Z"));
    const diffDays = (endInstant.getTime() - startInstant.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(7);
  });
});

describe("getMonthBoundsSGT", () => {
  // Unit test 7: handles a normal month without a year rollover
  it("handles a normal month without a year rollover", () => {
    const midMarch = new Date("2026-03-15T04:00:00Z");
    const { startDateStr, endDateStr } = getMonthBoundsSGT(midMarch);
    expect(startDateStr).toBe("2026-03-01");
    expect(endDateStr).toBe("2026-04-01");
  });

  // Unit test 8: handles the December -> January year rollover
  it("handles the December -> January year rollover", () => {
    const midDecember = new Date("2026-12-20T04:00:00Z");
    const { startDateStr, endDateStr } = getMonthBoundsSGT(midDecember);
    expect(startDateStr).toBe("2026-12-01");
    expect(endDateStr).toBe("2027-01-01");
  });
});

describe("getPeriodBounds", () => {
  // Unit test 9: delegates to getMonthBoundsSGT for periodType 'monthly'
  it("delegates to getMonthBoundsSGT for periodType 'monthly'", () => {
    const result = getPeriodBounds("monthly");
    const expected = getMonthBoundsSGT();
    expect(result.startDateStr).toBe(expected.startDateStr);
    expect(result.endDateStr).toBe(expected.endDateStr);
  });

  // Unit test 10: falls back to getWeekBoundsSGT for any non-'monthly' periodType
  it("falls back to getWeekBoundsSGT for any non-'monthly' periodType", () => {
    const result = getPeriodBounds("weekly");
    const expected = getWeekBoundsSGT();
    expect(result.startDateStr).toBe(expected.startDateStr);
    expect(result.endDateStr).toBe(expected.endDateStr);
  });
});
