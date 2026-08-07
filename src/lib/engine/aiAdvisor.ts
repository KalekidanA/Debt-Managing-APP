import { format } from "date-fns";
import { goalStage } from "./goals";
import { daysUntilNextDueDate, type Debt } from "./debt";
import { compareStrategies, impactOfExtraPayment, interestSavedVersusMinimumOnly } from "./payoffCalculator";
import type { FinancialSnapshot } from "./aiContext";
import { focusDebt } from "./aiContext";
import { round2 } from "./utils";

export type AIChatRole = "user" | "advisor";

export interface AIChatMessage {
  id: string;
  role: AIChatRole;
  text: string;
  date: Date;
}

/** Anything that can hold up its end of the AI tab's conversation. Zero
 * ships with `mockAdvisorRespond` (rule-based, fully offline) so the tab is
 * genuinely useful before any API key is configured; a real implementation
 * backed by the Claude API just needs to match this same signature, using
 * `systemPromptContext` as its system prompt. */
export type AIAdvisorRespond = (
  message: string,
  context: FinancialSnapshot,
  history: AIChatMessage[]
) => Promise<string>;

function firstDollarAmount(text: string): number | undefined {
  const match = text.match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  if (!match) return undefined;
  return Number(match[1]);
}

/** `isDelta` distinguishes "what if I paid $50 EXTRA" (additive — $50 on
 * top of the current extra payment) from "what if my payment WAS $50"
 * (absolute — replaces it). Additive language ("extra", "more") defaults
 * to the former, since that's what people mean colloquially and getting
 * it backwards turns a hopeful question into a confusing "this sets you
 * back" answer. */
function extraPaymentImpact(amount: number, context: FinancialSnapshot, isDelta: boolean): string {
  if (!context.currentPlan) {
    return "I couldn't run those numbers yet — make sure your debts and payment amounts are entered first.";
  }
  const newExtra = isDelta ? context.extraMonthlyPayment + amount : amount;
  const impact = impactOfExtraPayment(newExtra, context.currentPlan, context.debts);
  if (!impact) {
    return "I couldn't run those numbers yet — make sure your debts and payment amounts are entered first.";
  }
  const monthsWord = Math.abs(impact.monthsDelta) === 1 ? "month" : "months";
  const changeDescription = isDelta
    ? `Putting $${amount} more toward your extra payment (total $${newExtra})`
    : `Putting $${newExtra} toward your extra payment instead of $${context.extraMonthlyPayment}`;
  if (impact.monthsDelta < 0) {
    return `${changeDescription} gets you debt-free ${Math.abs(
      impact.monthsDelta
    )} ${monthsWord} sooner and saves roughly $${Math.abs(impact.interestDelta)} in interest.`;
  } else if (impact.monthsDelta > 0) {
    return `${changeDescription} pushes your debt-free date back ${impact.monthsDelta} ${monthsWord} and costs about $${impact.interestDelta} more in interest.`;
  }
  return "That's close to your current extra payment — barely moves your debt-free date.";
}

function latePaymentImpact(context: FinancialSnapshot): string {
  const focus = focusDebt(context);
  if (!focus) return "You don't have an active focus debt right now — nice work.";
  const oneMonthInterest = round2(focus.balance * (focus.apr / 12));
  return `Missing this month's ${focus.name} payment would add roughly $${oneMonthInterest} in extra interest, plus whatever late fee your card issuer charges (often $25-$40), and could ding your credit score. Paying even the minimum on time keeps the snowball on schedule.`;
}

function strategyComparison(context: FinancialSnapshot): string {
  const plans = compareStrategies(context.debts, context.extraMonthlyPayment);
  const snowball = plans.snowball;
  const avalanche = plans.avalanche;
  if (!snowball || !avalanche) return "I need at least one active debt to compare strategies.";
  const interestDiff = round2(snowball.totalInterestPaid - avalanche.totalInterestPaid);
  if (interestDiff <= 0) {
    return "In your case, snowball and avalanche land in about the same place — stick with snowball for the motivational wins.";
  }
  return `Switching to avalanche would save about $${interestDiff} in interest, but you'd lose the quick psychological wins of knocking out small balances first. Zero's default guidance is to stick with snowball unless the interest gap is large.`;
}

function debtFreeSummary(context: FinancialSnapshot): string {
  if (!context.currentPlan) {
    return "Add your debts and a monthly extra payment first, and I'll project your debt-free date.";
  }
  const plan = context.currentPlan;
  return `At your current pace you're projected debt-free on ${format(plan.debtFreeDate, "MMM d, yyyy")} — about ${plan.totalMonths} months from now, paying roughly $${plan.totalInterestPaid} in total interest.`;
}

function debtDetail(debt: Debt, context: FinancialSnapshot): string {
  const result = context.currentPlan?.perDebtResults.find((r) => r.debtId === debt.id);
  let text = `${debt.name}: $${debt.balance} balance at ${(debt.apr * 100).toFixed(2)}% APR, $${debt.minimumPayment} minimum due on day ${debt.dueDayOfMonth} each month.`;
  if (result) {
    text += ` At your current plan it'll be paid off around ${format(result.payoffDate, "MMM d, yyyy")}.`;
  }
  return text;
}

function interestSummary(context: FinancialSnapshot): string {
  const saved = interestSavedVersusMinimumOnly(context.debts, context.strategy, context.extraMonthlyPayment);
  if (!saved) {
    return "Add an extra monthly payment and I'll show you exactly how much interest it's saving versus paying minimums only.";
  }
  const monthsWord = Math.abs(saved.monthsSaved) === 1 ? "month" : "months";
  return `Your extra $${context.extraMonthlyPayment}/month is saving you about $${saved.interestSaved} in interest and getting you debt-free ${saved.monthsSaved} ${monthsWord} sooner than paying minimums only.`;
}

function defaultSummary(context: FinancialSnapshot): string {
  const stepText = `Your current goal is to ${goalStage(context.goalStage).title.charAt(0).toLowerCase()}${goalStage(context.goalStage).title.slice(1)}.`;
  const focus = focusDebt(context);
  if (focus) {
    const days = daysUntilNextDueDate(focus, context.referenceDate);
    return `${stepText} Right now your focus debt is ${focus.name} — ${days} day${days === 1 ? "" : "s"} until it's due. Ask me things like "what if I paid $50 more" or "how long until I'm debt-free".`;
  }
  return `${stepText} Ask me about a specific debt, a hypothetical extra payment, or how long you have left.`;
}

/** Rule-based stand-in for a real LLM. It pattern-matches on the user's
 * message and answers using real numbers pulled from the payoff
 * calculator, so the AI tab behaves correctly end-to-end today. Swap in a
 * Claude-API-backed implementation later without touching the UI layer —
 * it just needs to match the `AIAdvisorRespond` signature. */
export const mockAdvisorRespond: AIAdvisorRespond = async (message, context) => {
  const lowered = message.toLowerCase();
  const amount = firstDollarAmount(lowered);

  if (amount !== undefined && (lowered.includes("extra") || lowered.includes("more") || lowered.includes("what if"))) {
    const isDelta = lowered.includes("extra") || lowered.includes("more");
    return extraPaymentImpact(amount, context, isDelta);
  }
  if (lowered.includes("late") || lowered.includes("miss a payment") || lowered.includes("skip")) {
    return latePaymentImpact(context);
  }
  if (lowered.includes("avalanche") || (lowered.includes("switch") && lowered.includes("strategy"))) {
    return strategyComparison(context);
  }
  if (lowered.includes("how long") || (lowered.includes("when") && lowered.includes("debt free"))) {
    return debtFreeSummary(context);
  }
  const namedDebt = context.debts.find((d) => lowered.includes(d.name.toLowerCase()));
  if (namedDebt) return debtDetail(namedDebt, context);
  if (lowered.includes("interest")) return interestSummary(context);
  return defaultSummary(context);
};
