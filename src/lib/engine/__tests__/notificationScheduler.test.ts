import { describe, expect, it } from "vitest";
import type { Debt } from "../debt";
import { DEFAULT_FINANCIAL_PROFILE } from "../financialProfile";
import { criticalReminders, dailyMorningReminder } from "../notificationScheduler";

function makeDebt(overrides: Partial<Debt> & { id: string }): Debt {
  return {
    name: overrides.id,
    type: "creditCard",
    balance: 0,
    apr: 0.2,
    minimumPayment: 25,
    dueDayOfMonth: 15,
    ...overrides,
  };
}

// Jan 10, 2026, local time — matches how date-fns' local helpers will
// interpret the debts' due dates in these tests.
const referenceDate = new Date(2026, 0, 10);

describe("dailyMorningReminder", () => {
  it("mentions the emergency fund during Baby Step 1", () => {
    const profile = { ...DEFAULT_FINANCIAL_PROFILE, emergencyFundSaved: 400 };
    const reminder = dailyMorningReminder(profile, [], "snowball", referenceDate);
    expect(reminder).toBeDefined();
    expect(reminder!.isCritical).toBe(false);
    expect(reminder!.body).toContain("600");
  });

  it("mentions the focus debt during Baby Step 2", () => {
    const profile = { ...DEFAULT_FINANCIAL_PROFILE, emergencyFundSaved: 1000 };
    const debt = makeDebt({ id: "chase", name: "Chase Card", balance: 500, dueDayOfMonth: 13 });
    const reminder = dailyMorningReminder(profile, [debt], "snowball", referenceDate);
    expect(reminder).toBeDefined();
    expect(reminder!.title).toContain("Chase Card");
  });
});

describe("criticalReminders", () => {
  it("fires exactly at configured thresholds", () => {
    // Due on the 13th => 3 days out (a default threshold).
    const dueSoon = makeDebt({ id: "due-soon", name: "Due Soon", balance: 500, dueDayOfMonth: 13 });
    // Due on the 20th => 10 days out (not a threshold).
    const dueLater = makeDebt({ id: "due-later", name: "Due Later", balance: 500, dueDayOfMonth: 20 });

    const reminders = criticalReminders([dueSoon, dueLater], undefined, referenceDate);

    expect(reminders).toHaveLength(1);
    expect(reminders[0].title).toContain("Due Soon");
    expect(reminders[0].isCritical).toBe(true);
  });

  it("returns nothing when no debt is near a threshold", () => {
    const farOut = makeDebt({ id: "far-out", name: "Far Out", balance: 500, dueDayOfMonth: 28 });
    const reminders = criticalReminders([farOut], undefined, referenceDate);
    expect(reminders).toHaveLength(0);
  });
});
