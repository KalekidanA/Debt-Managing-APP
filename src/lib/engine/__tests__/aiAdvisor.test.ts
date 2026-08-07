import { describe, expect, it } from "vitest";
import { buildSnapshot } from "../aiContext";
import { mockAdvisorRespond } from "../aiAdvisor";
import type { Debt } from "../debt";

function makeSnapshot() {
  const profile = { monthlyIncome: 5000, monthlyExpenses: 3500, emergencyFundSaved: 1000, emergencyFundTarget: 1000 };
  const debt: Debt = {
    id: "visa",
    name: "Visa Card",
    type: "creditCard",
    balance: 2000,
    apr: 0.22,
    minimumPayment: 60,
    dueDayOfMonth: 15,
  };
  return buildSnapshot(profile, [debt], "snowball", 100);
}

describe("mockAdvisorRespond", () => {
  it("mentions the current goal and focus debt by default", async () => {
    const response = await mockAdvisorRespond("hi", makeSnapshot(), []);
    expect(response.toLowerCase()).toContain("current goal");
    expect(response).toContain("Visa Card");
  });

  it("returns details when asked about a specific debt", async () => {
    const response = await mockAdvisorRespond("tell me about my Visa Card", makeSnapshot(), []);
    expect(response).toMatch(/22\.00%|2000/);
  });

  it("quantifies an extra-payment what-if", async () => {
    const response = await mockAdvisorRespond("what if I paid $150 extra?", makeSnapshot(), []);
    expect(response.toLowerCase()).toMatch(/sooner|save/);
  });

  it("answers a debt-free timing question", async () => {
    const response = await mockAdvisorRespond("when will I be debt free?", makeSnapshot(), []);
    expect(response.toLowerCase()).toMatch(/debt-free|months/);
  });
});
