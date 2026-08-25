import type { FinancialSnapshot } from "./financialSnapshot";
import { focusDebt } from "./financialSnapshot";
import { compareStrategies, impactOfExtraPayment } from "./payoffCalculator";
import { round2 } from "./utils";

export interface BudgetBreakdown {
  monthlyIncome: number;
  monthlyExpenses: number;
  surplus: number;
  totalMinimums: number;
  afterMinimums: number;
  extraMonthlyPayment: number;
  unallocated: number;
}

export function computeBudget(snapshot: FinancialSnapshot): BudgetBreakdown {
  const { debts, extraMonthlyPayment, averageMonthlyIncome, averageMonthlyExpenses } = snapshot;
  const surplus = round2(averageMonthlyIncome - averageMonthlyExpenses);
  const totalMinimums = round2(debts.reduce((sum, d) => sum + (d.balance > 0 ? d.minimumPayment : 0), 0));
  const afterMinimums = round2(surplus - totalMinimums);
  const unallocated = round2(afterMinimums - extraMonthlyPayment);
  return {
    monthlyIncome: averageMonthlyIncome,
    monthlyExpenses: averageMonthlyExpenses,
    surplus,
    totalMinimums,
    afterMinimums,
    extraMonthlyPayment,
    unallocated,
  };
}

export type AdviceTone = "positive" | "suggestion" | "warning";

export interface AdviceTip {
  id: string;
  title: string;
  body: string;
  tone: AdviceTone;
}

/** Rule-based coaching tips built entirely from numbers already in the
 * snapshot — no network calls. Ordered roughly by how much the tip should
 * matter to the user right now (warnings and money-on-the-table first). */
export function generateAdvice(snapshot: FinancialSnapshot, budget: BudgetBreakdown): AdviceTip[] {
  const tips: AdviceTip[] = [];

  if (budget.unallocated < -1) {
    tips.push({
      id: "overcommitted",
      title: "Your budget doesn't balance",
      body: `Minimums plus your extra payment add up to $${Math.abs(budget.unallocated)} more than your monthly surplus. Either lower your extra payment or find that much in your expenses.`,
      tone: "warning",
    });
  }

  if (snapshot.goalStage === "starterSafetyNet") {
    tips.push({
      id: "safety-net-focus",
      title: `Stay focused on the $${snapshot.profile.emergencyFundTarget}`,
      body: "Pause extra debt payments until your starter emergency fund is full — it's what keeps a flat tire or ER visit from becoming new debt.",
      tone: "suggestion",
    });
    return tips;
  }

  if (budget.unallocated > 20 && snapshot.currentPlan) {
    const impact = impactOfExtraPayment(budget.extraMonthlyPayment + budget.unallocated, snapshot.currentPlan, snapshot.debts);
    if (impact) {
      tips.push({
        id: "unallocated-surplus",
        title: `$${budget.unallocated}/month isn't assigned yet`,
        body: `Add it to your extra payment and you'd be debt-free ${Math.abs(impact.monthsDelta)} month${Math.abs(impact.monthsDelta) === 1 ? "" : "s"} sooner, saving about $${Math.abs(impact.interestDelta)} in interest.`,
        tone: "suggestion",
      });
    }
  }

  if (snapshot.currentPlan) {
    const plans = compareStrategies(snapshot.debts, snapshot.extraMonthlyPayment);
    if (plans.snowball && plans.avalanche) {
      const diff = round2(plans.snowball.totalInterestPaid - plans.avalanche.totalInterestPaid);
      if (snapshot.strategy === "snowball" && diff > 25) {
        tips.push({
          id: "avalanche-savings",
          title: "Avalanche would save more interest",
          body: `Switching from snowball to avalanche would save about $${diff} in interest here, at the cost of the quick wins smaller balances give you. Most people stick with snowball for the motivation — your call.`,
          tone: "suggestion",
        });
      }
    }

    const raiseImpact = impactOfExtraPayment(budget.extraMonthlyPayment + 100, snapshot.currentPlan, snapshot.debts);
    if (raiseImpact && raiseImpact.monthsDelta < 0) {
      tips.push({
        id: "income-boost",
        title: "What $100/month more would do",
        body: `An extra $100/month — a raise, a side gig, selling something you don't use — would get you debt-free ${Math.abs(raiseImpact.monthsDelta)} month${Math.abs(raiseImpact.monthsDelta) === 1 ? "" : "s"} sooner.`,
        tone: "suggestion",
      });
    }

    const focus = focusDebt(snapshot);
    if (focus) {
      const lateCost = round2(focus.balance * (focus.apr / 12));
      tips.push({
        id: "on-time",
        title: "Pay on time, every time",
        body: `Missing just one payment on ${focus.name} adds roughly $${lateCost} in interest plus a likely late fee — real money that isn't going toward being debt-free.`,
        tone: "warning",
      });
    }
  }

  return tips;
}
