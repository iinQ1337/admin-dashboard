"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

import type { ChartPoint } from "@/lib/report";
import { cn } from "@/lib/utils";

const COLORS = {
  API: "hsl(221.2 83.2% 53.3%)",
  Page: "hsl(142.1 70.6% 45.3%)"
};

export function LatencyChart({ data, showAxisLabels = true }: { data: ChartPoint[]; showAxisLabels?: boolean }) {
  const sorted = useMemo(() => {
    const items = [...data];
    const timestamps = items.map((item) => item.timestamp).filter((value): value is string => Boolean(value));
    const uniqueTimestamps = new Set(timestamps);

    if (uniqueTimestamps.size > 1) {
      return items.sort((a, b) => {
        const first = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const second = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return first - second;
      });
    }

    return items.sort((a, b) => a.latency - b.latency);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={sorted} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
        <defs>
          {Object.entries(COLORS).map(([key, color]) => (
            <linearGradient id={`gradient-${key}`} key={key} x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis
          dataKey="label"
          stroke="hsl(var(--muted-foreground))"
          tickLine={false}
          axisLine={false}
          interval={showAxisLabels ? 0 : undefined}
          angle={showAxisLabels ? -20 : 0}
          height={showAxisLabels ? 60 : 0}
          textAnchor={showAxisLabels ? "end" : "middle"}
          hide={!showAxisLabels}
        />
        <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}ms`} />
        <Tooltip content={<LatencyTooltip />} />
        <Area type="monotone" dataKey="latency" strokeWidth={2} stroke="hsl(var(--primary))" fill="url(#gradient-API)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function LatencyTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as ChartPoint;
  const timestampLabel =
    item.timestamp && !Number.isNaN(new Date(item.timestamp).getTime())
      ? new Date(item.timestamp).toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
      : null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow">
      <div className="font-medium">{item.label}</div>
      <div className="text-muted-foreground">{item.category}</div>
      {timestampLabel ? <div className="text-muted-foreground/80">{timestampLabel}</div> : null}
      <div className={cn("font-semibold", item.status === "ok" ? "text-emerald-500" : "text-amber-500")}>{item.latency.toFixed(1)} мс</div>
    </div>
  );
}
