"use client";

import { Calendar, Clock, Gauge, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardSummary } from "@/lib/report";
import { cn, formatNumber } from "@/lib/utils";
import { useTranslations } from "@/components/language-provider";

const ICONS = [Gauge, ShieldCheck, Clock, Calendar];

export function OverviewCards({ summary }: { summary: DashboardSummary }) {
  const t = useTranslations();
  const data = [
    {
      label: t("Всего проверок", "Total checks"),
      value: formatNumber(summary.totalChecks, 0),
      sub: "API + pages",
      accent: "from-sky-500/20 to-sky-500/5",
      href: "#dashboard-checks"
    },
    {
      label: t("Процент успеха", "Success rate"),
      value: `${summary.successRate.toFixed(1)}%`,
      sub: t("Выполнено без ошибок", "Completed without errors"),
      accent: "from-emerald-500/20 to-emerald-500/5",
      href: "#dashboard-performance"
    },
    {
      label: t("Средняя задержка", "Average latency"),
      value: `${summary.avgLatency.toFixed(1)} ${t("мс", "ms")}`,
      sub: t("По всем категориям", "Across all categories"),
      accent: "from-amber-500/20 to-amber-500/5",
      href: "#dashboard-performance"
    },
    {
      label: t("Ошибки", "Incidents"),
      value: summary.incidents.toString(),
      sub: t("Нужно внимание", "Needs attention"),
      accent: "from-rose-500/20 to-rose-500/5",
      href: "#dashboard-logs"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {data.map((item, index) => {
        const Icon = ICONS[index];
        const card = (
          <Card
            className={cn(
              "border border-border/60 bg-gradient-to-b from-background to-background/30 transition duration-300",
              item.href && "group-hover/card:border-primary/60 group-hover/card:shadow-lg"
            )}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div>
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="mt-2 text-3xl">{item.value}</CardTitle>
              </div>
              <div className={`rounded-full bg-gradient-to-br ${item.accent} p-3`}>
                {Icon ? <Icon className="h-5 w-5 text-foreground" /> : null}
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="border-dashed text-xs text-muted-foreground">
                {item.sub}
              </Badge>
            </CardContent>
          </Card>
        );
        if (item.href) {
          return (
            <a
              key={item.label}
              href={item.href}
              className="group/card block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {card}
            </a>
          );
        }
        return (
          <div key={item.label}>
            {card}
          </div>
        );
      })}
    </div>
  );
}
