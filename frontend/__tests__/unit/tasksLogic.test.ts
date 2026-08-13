// Unit tests for shared/tasksLogic.ts 
import { describe, it, expect } from "vitest";
import { isOverdue, hasDueTime, formatDeadline } from "../../../shared/tasksLogic";

describe("isOverdue", () => {
  // Unit Number 01
  it("is false when there is no due date at all", () => {
    expect(isOverdue(null, false)).toBe(false);
  });

  // Unit Number 02
  it("is false for a completed task, even with a due date in the past", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(isOverdue(yesterday, true)).toBe(false);
  });

  // Unit Number 03
  it("is true for an incomplete task with a due date in the past", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(isOverdue(yesterday, false)).toBe(true);
  });

  // Unit Number 04
  it("is false for an incomplete task with a due date in the future", () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    expect(isOverdue(tomorrow, false)).toBe(false);
  });
});

describe("hasDueTime", () => {
  // Unit Number 05
  it("is false for null and true for any non-empty date string", () => {
    expect(hasDueTime(null)).toBe(false);
    expect(hasDueTime("2026-01-15T10:00:00.000Z")).toBe(true);
  });
});

describe("formatDeadline", () => {
  // Unit Number 06
  it("renders a short, human-readable month/day/time string", () => {
    const formatted = formatDeadline("2026-03-15T10:30:00.000Z");
    // Locale-dependent exact formatting
    expect(formatted).toMatch(/Mar/);
    expect(formatted).toMatch(/15/);
  });
});
