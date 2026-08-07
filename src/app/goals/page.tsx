"use client";

import { AppShell, PageHeader } from "@/components/AppShell";
import { CelebrationHistory } from "@/components/goals/CelebrationHistory";
import { GoalRoadmap } from "@/components/goals/GoalRoadmap";
import { Card } from "@/components/ui/Card";
import { useAppState } from "@/lib/state/AppStateContext";
import { useFinancials } from "@/lib/state/useFinancials";

export default function GoalsPage() {
  const { state, isLoaded } = useAppState();
  const { snapshot } = useFinancials();

  if (!isLoaded) return null;

  if (!state.hasCompletedOnboarding) {
    return (
      <AppShell>
        <PageHeader title="Goals" />
        <Card className="py-8 text-center text-sm text-muted-foreground">
          Finish setting up your profile on the Home tab first.
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Goals" subtitle="Where you're headed, and what you've already knocked out." />
      <div className="flex flex-col gap-4">
        <GoalRoadmap currentStage={snapshot.goalStage} />
        <CelebrationHistory events={state.celebrations} />
      </div>
    </AppShell>
  );
}
