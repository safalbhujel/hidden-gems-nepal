import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HiddenScoreBadgeProps {
  score: number; // 0-100 scale
  className?: string;
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Deeply Hidden";
  if (score >= 60) return "Very Hidden";
  if (score >= 40) return "Hidden";
  if (score >= 20) return "Somewhat Known";
  return "Well Known";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-primary text-primary-foreground";
  if (score >= 60) return "bg-accent text-accent-foreground";
  if (score >= 40) return "bg-secondary text-secondary-foreground";
  return "bg-muted text-muted-foreground";
}

export function HiddenScoreBadge({ score, className }: HiddenScoreBadgeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const label = getScoreLabel(clampedScore);
  const colorClass = getScoreColor(clampedScore);

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold gap-1.5",
        "border-0",
        colorClass,
        className
      )}
    >
      <span className="tabular-nums">{clampedScore}</span>
      <span className="hidden sm:inline">{label}</span>
    </Badge>
  );
}