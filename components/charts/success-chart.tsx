"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { SuccessPoint } from "@/lib/report";
import { formatNumber } from "@/lib/utils";

export function SuccessChart({ data }: { data: SuccessPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
        <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip content={<SuccessTooltip />} />
        <Legend />
        <Bar dataKey="success" stackId="a" fill="hsl(var(--primary))" name="Успехи" radius={[8, 8, 0, 0]} />
        <Bar dataKey="failed" stackId="a" fill="hsl(var(--destructive))" name="Ошибки" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SuccessTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const success = payload.find((item: any) => item.dataKey === "success")?.value ?? 0;
  const failed = payload.find((item: any) => item.dataKey === "failed")?.value ?? 0;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow">
      <div className="font-medium">Распределение</div>
      <div className="text-emerald-500">Успехи: {formatNumber(success, 0)}</div>
      <div className="text-destructive">Ошибки: {formatNumber(failed, 0)}</div>
    </div>
  );
}
