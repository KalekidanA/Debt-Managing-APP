import { Card } from "@/components/ui/Card";
import { GOAL_STAGES, goalStageIndex, type GoalStageId } from "@/lib/engine/goals";

type StageStatus = "done" | "current" | "upcoming";

function StatusIcon({ status }: { status: StageStatus }) {
  if (status === "done") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
    );
  }
  if (status === "current") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary-soft">
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
      </div>
    );
  }
  return <div className="h-8 w-8 shrink-0 rounded-full border-2 border-dashed border-border" />;
}

export function GoalRoadmap({ currentStage }: { currentStage: GoalStageId }) {
  const currentIndex = goalStageIndex(currentStage);

  return (
    <Card>
      <p className="mb-4 text-sm font-semibold text-foreground">Your roadmap</p>
      <div className="flex flex-col">
        {GOAL_STAGES.map((stage, i) => {
          const status: StageStatus = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
          const isLast = i === GOAL_STAGES.length - 1;
          return (
            <div key={stage.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StatusIcon status={status} />
                {!isLast && <div className={`w-0.5 flex-1 ${status === "done" ? "bg-primary" : "bg-border"}`} />}
              </div>
              <div className={`min-w-0 pb-6 ${isLast ? "pb-0" : ""}`}>
                <p
                  className={`text-sm font-medium ${
                    status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {stage.title}
                  {status === "current" && (
                    <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Current
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{stage.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
