"use client";

import { useState } from "react";
import { Globe, ShieldAlert, X } from "lucide-react";

import { useTranslations } from "@/components/language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DnsResult } from "@/lib/report";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "./status-badge";

export function DnsPanel({ results }: { results: DnsResult[] }) {
  const t = useTranslations();
  const [selected, setSelected] = useState<DnsResult | null>(null);

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{t("DNS и домены", "DNS and domains")}</CardTitle>
          <CardDescription>{t("Проверка TTL, whois и записей", "TTL, whois, and records checks")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[260px] pr-4">
            <div className="space-y-4">
              {results.map((item) => (
                <div key={item.domain} className="rounded-xl border bg-card/60 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium">
                      <Globe className="h-4 w-4" />
                      {item.domain}
                    </div>
                    <StatusBadge tone={item.status === "ok" ? "success" : "danger"} className="gap-1 uppercase">
                      {item.status === "ok" ? (
                        <>OK</>
                      ) : (
                        <>
                          <ShieldAlert className="h-3.5 w-3.5" />
                          {item.status}
                        </>
                      )}
                    </StatusBadge>
                  </div>
                  {item.error ? <p className="mt-2 text-xs text-destructive">{item.error}</p> : null}
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">A</p>
                      <p className="text-xs">{formatRecords(item.dns?.A, 3)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">MX</p>
                      <p className="text-xs">{formatRecords(item.dns?.MX, 2)}</p>
                    </div>
                  </div>
                  {item.whois && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("Регистратор", "Registrar")}: {item.whois.registrar ?? "—"} · {t("До", "Expires")}: {item.whois.expiration_date ?? "—"}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="mt-3 text-xs font-semibold text-primary transition hover:text-primary/80 focus:outline-none"
                  >
                    {t("Подробнее", "Details")}
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <DnsModal result={selected} onClose={() => setSelected(null)} translate={t} />
    </>
  );
}

function DnsModal({
  result,
  onClose,
  translate
}: {
  result: DnsResult | null;
  onClose: () => void;
  translate: ReturnType<typeof useTranslations>;
}) {
  if (!result) return null;

  const entries = Object.entries(result.dns ?? {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-border/60 p-1 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{translate("Детали DNS", "DNS details")}</p>
        <h3 className="text-2xl font-semibold">{result.domain}</h3>
        {result.whois && (
          <p className="mt-1 text-xs text-muted-foreground">
            {translate("Регистратор", "Registrar")}: {result.whois.registrar ?? "—"} · {translate("До", "Expires")}:{" "}
            {result.whois.expiration_date ?? "—"}
          </p>
        )}
        <div className="mt-5 space-y-4 text-sm">
          {entries.length ? (
            entries.map(([record, rawValues]) => {
              const values = normalizeRecordValues(rawValues);
              if (!values.length) {
                return (
                  <div key={record}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{record}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{translate("Нет данных", "No data")}</p>
                  </div>
                );
              }
              return (
                <div key={record}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{record}</p>
                  <div className="mt-2 space-y-2 rounded-xl border bg-muted/40 p-3">
                    {values.map((value) => (
                      <p key={`${record}-${value}`} className="font-mono text-xs break-all">
                        {value}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">{translate("Нет дополнительных записей.", "No additional records.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRecords(value: unknown, limit: number) {
  const values = normalizeRecordValues(value);
  if (!values.length) {
    return "—";
  }
  return values.slice(0, limit).join(", ");
}

function normalizeRecordValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (!value) {
    return [];
  }
  if (typeof value === "string") {
    return [value];
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const direct = record.values ?? record.value;
    if (Array.isArray(direct)) {
      return direct.map(String);
    }
    if (typeof direct === "string") {
      return [direct];
    }
  }
  return [String(value)];
}
