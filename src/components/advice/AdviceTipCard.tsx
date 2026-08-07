import { Card } from "@/components/ui/Card";
import type { AdviceTip } from "@/lib/engine/adviceEngine";

const TONE_CLASSES: Record<AdviceTip["tone"], { border: string; badge: string; label: string }> = {
  positive: { border: "border-primary/40", badge: "bg-primary-soft text-primary", label: "Nice work" },
  suggestion: { border: "border-border", badge: "bg-primary-soft text-primary", label: "Suggestion" },
  warning: { border: "border-critical/30", badge: "bg-critical-soft text-critical", label: "Heads up" },
};

export function AdviceTipCard({ tip }: { tip: AdviceTip }) {
  const tone = TONE_CLASSES[tip.tone];
  return (
    <Card className={tone.border}>
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tone.badge}`}>
        {tone.label}
      </span>
      <p className="mt-2 text-sm font-semibold text-foreground">{tip.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{tip.body}</p>
    </Card>
  );
}
