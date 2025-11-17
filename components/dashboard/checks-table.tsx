"use client";

import { useState } from "react";
import { Globe, Server, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ApiChecks, ApiResult, PageChecks, PageResult } from "@/lib/report";
import { cn } from "@/lib/utils";
import { StatusBadge as ToneBadge } from "./status-badge";

type CombinedRow = (ApiResult & { category: "API" }) | (PageResult & { category: "Page" });

export function ChecksTable({ api, pages }: { api: ApiChecks; pages: PageChecks }) {
  const apiRows = api.results.map((item) => ({ ...item, category: "API" as const })) as CombinedRow[];
  const pageRows = pages.results.map((item) => ({ ...item, category: "Page" as const })) as CombinedRow[];
  const rows = [...apiRows, ...pageRows].slice(0, 8);
  const [selectedResponse, setSelectedResponse] = useState<ApiResult | null>(null);

  function handleRowClick(row: CombinedRow) {
    if (row.category === "API" && row.response_preview) {
      setSelectedResponse(row);
    }
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Последние проверки</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div className="relative flex-1" style={{ minHeight: 0 }}>
          <Table className="min-h-full">
            <TableHeader>
              <TableRow>
                <TableHead>Тип</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="hidden md:table-cell">Метод</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Латентность</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isApiWithPreview = row.category === "API" && !!row.response_preview;
                return (
                  <TableRow
                    key={`${row.url}-${row.method}`}
                    className={cn(
                      "transition",
                      isApiWithPreview && "cursor-pointer hover:bg-muted/40"
                    )}
                    onClick={() => isApiWithPreview && handleRowClick(row)}
                  >
                    <TableCell className="font-medium">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {row.category === "API" ? <Server className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />} {row.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">{row.url}</TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{row.method}</TableCell>
                    <TableCell>
                      <ResultStatusBadge success={row.success} code={row.status} error={row.error} />
                    </TableCell>
                    <TableCell>{row.response_time.toFixed(1)} мс</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <ApiResponseModal response={selectedResponse} onClose={() => setSelectedResponse(null)} />
    </Card>
  );
}

function ResultStatusBadge({ success, code, error }: { success: boolean; code: number; error?: string | null }) {
  return (
    <div className={cn("relative", !success && "group")}>
      <ToneBadge tone={success ? "success" : "danger"} className="text-xs uppercase tracking-wide">
        {success ? "OK" : "Ошибка"} · {code}
      </ToneBadge>
      {!success && error ? (
        <div className="pointer-events-none absolute left-0 top-[calc(100%+6px)] z-20 w-56 max-w-[260px] rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-xl opacity-0 invisible transition-opacity duration-200 group-hover:visible group-hover:opacity-100">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function ApiResponseModal({ response, onClose }: { response: ApiResult | null; onClose: () => void }) {
  if (!response?.response_preview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-border/60 p-1 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Ответ сервера</p>
        <h3 className="text-xl font-semibold">{response.method} {response.url}</h3>
        <p className="mt-1 text-xs text-muted-foreground">Статус: {response.status} · {response.response_time.toFixed(1)} мс</p>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-xs font-mono">
          {response.response_preview}
        </pre>
      </div>
    </div>
  );
}
