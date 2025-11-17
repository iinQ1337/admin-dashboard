import type { BadgeProps } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TONE_STYLES: Record<StatusTone, string> = {
  success: "bg-emerald-500/15 text-emerald-500",
  warning: "bg-amber-500/15 text-amber-600",
  danger: "bg-red-500/15 text-red-600",
  info: "bg-sky-500/15 text-sky-600"
};

export type StatusTone = "success" | "warning" | "danger" | "info";

type StatusBadgeProps = BadgeProps & {
  tone?: StatusTone;
};

export function StatusBadge({ tone = "info", className, ...props }: StatusBadgeProps) {
  return <Badge {...props} className={cn("border-none", TONE_STYLES[tone], className)} />;
}
