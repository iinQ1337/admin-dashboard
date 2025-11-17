"use client";

import { useMemo, useState } from "react";
import { ChevronDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SiteSeriesMap } from "@/lib/report";
import { LatencyChart } from "@/components/charts/latency-chart";
import { SuccessChart } from "@/components/charts/success-chart";

export function PerformancePanel({ siteSeries }: { siteSeries: SiteSeriesMap }) {
  const siteKeys = useMemo(() => Object.keys(siteSeries), [siteSeries]);
  const [selectedSite, setSelectedSite] = useState<string>(() => siteKeys[0] ?? "all");

  const current = useMemo(() => {
    if (siteSeries[selectedSite]) {
      return siteSeries[selectedSite];
    }
    const fallbackKey = siteKeys[0];
    return fallbackKey ? siteSeries[fallbackKey] : { latency: [], success: [] };
  }, [selectedSite, siteSeries, siteKeys]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Производительность</CardTitle>
            <CardDescription>Данные из JSON</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" /> Живая аналитика
            </div>
            <div className="relative">
              <select
                value={selectedSite}
                onChange={(event) => setSelectedSite(event.target.value)}
                className="appearance-none rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-sm font-medium shadow-sm transition hover:border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {siteKeys.map((site) => (
                  <option key={site} value={site}>
                    {site === "all" ? "Все сайты" : site}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <ChevronDown className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="latency">
          <TabsList>
            <TabsTrigger value="latency">Латентность</TabsTrigger>
            <TabsTrigger value="success">Процент успеха</TabsTrigger>
          </TabsList>
          <TabsContent value="latency" className="mt-6">
            {current.latency.length ? (
              <LatencyChart data={current.latency} showAxisLabels={false} />
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                Нет данных для выбранного сайта
              </div>
            )}
          </TabsContent>
          <TabsContent value="success" className="mt-6">
            <SuccessChart data={current.success} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
