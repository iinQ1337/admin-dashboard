"use client";

import { useState } from "react";
import { ActivitySquare, KeyRound, MailWarning, PlugZap, ShieldAlert, SignalHigh, Wifi, X } from "lucide-react";

import { useTranslations } from "@/components/language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NetworkCheck, PortResult, TcpResult, SmtpResult, CertificateResult } from "@/lib/report";
import { cn, formatNumber } from "@/lib/utils";
import { StatusBadge, type StatusTone } from "./status-badge";

const STATUS_TONE_MAP: Record<string, StatusTone> = {
  ok: "success",
  warning: "warning",
  critical: "danger"
};

export function NetworkPanel({ network }: { network: NetworkCheck }) {
  const t = useTranslations();
  const [selectedCert, setSelectedCert] = useState<CertificateResult | null>(null);
  const statusTone = STATUS_TONE_MAP[network.overall_status] ?? "info";

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{t("Сеть", "Network")}</CardTitle>
          <CardDescription>{t("Порты, TCP, SMTP и TLS-сертификаты", "Ports, TCP, SMTP, and TLS certificates")}</CardDescription>
        </div>
        <StatusBadge tone={statusTone} className="uppercase tracking-wide">
          {network.overall_status}
        </StatusBadge>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ports" className="gap-2">
              <PlugZap className="h-4 w-4" /> {t("Порты", "Ports")}
            </TabsTrigger>
            <TabsTrigger value="tcp" className="gap-2">
              <Wifi className="h-4 w-4" /> TCP
            </TabsTrigger>
            <TabsTrigger value="smtp" className="gap-2">
              <MailWarning className="h-4 w-4" /> SMTP
            </TabsTrigger>
            <TabsTrigger value="certs" className="gap-2">
              <KeyRound className="h-4 w-4" /> TLS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ports">
            <SummaryGrid
              items={[
                { label: t("Целей", "Targets"), value: network.ports.total_targets },
                { label: t("Открыто", "Open"), value: network.ports.open },
                { label: t("Закрыто / timeout", "Closed / timeout"), value: network.ports.closed_or_timeout }
              ]}
            />
            <PortList results={network.ports.results} />
          </TabsContent>

          <TabsContent value="tcp">
            <SummaryGrid
              items={[
                { label: t("Чеков", "Checks"), value: network.tcp.total_checks },
                { label: t("Успешно", "Success"), value: network.tcp.successful },
                { label: t("Ошибок", "Errors"), value: network.tcp.failed }
              ]}
            />
            <TcpList results={network.tcp.results} />
          </TabsContent>

          <TabsContent value="smtp">
            <SummaryGrid
              items={[
                { label: t("Серверов", "Servers"), value: network.smtp.total_servers },
                { label: t("Успешно", "Success"), value: network.smtp.successful },
                { label: t("Ошибок", "Errors"), value: network.smtp.failed }
              ]}
            />
            <SmtpList results={network.smtp.results} />
          </TabsContent>

          <TabsContent value="certs">
            <SummaryGrid
              items={[
                { label: t("Хостов", "Hosts"), value: network.certificates.total_hosts },
                { label: "Ok", value: network.certificates.ok },
                { label: "Warn", value: network.certificates.warn }
              ]}
            />
            <CertificateList results={network.certificates.results} onSelect={setSelectedCert} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CertificateModal result={selectedCert} onClose={() => setSelectedCert(null)} />
    </Card>
  );
}

function SummaryGrid({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border bg-card/50 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
          <p className="text-2xl font-semibold">{formatNumber(item.value, 0)}</p>
        </div>
      ))}
    </div>
  );
}

function PortList({ results }: { results: PortResult[] }) {
  const t = useTranslations();
  return (
    <ScrollArea className="mt-4 h-[240px] pr-4">
      <div className="space-y-3">
        {results.map((result) => (
          <div key={`${result.host}-${result.port}`} className="rounded-xl border bg-card/60 p-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {result.host}:{result.port}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("Латентность", "Latency")}: {result.latency_ms.toFixed(1)} {t("мс", "ms")}
                </p>
              </div>
              <StatusBadge tone={result.open ? "success" : "danger"} className="gap-1 text-xs uppercase">
                {result.open ? <SignalHigh className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                {result.open ? t("Открыт", "Open") : t("Закрыт", "Closed")}
              </StatusBadge>
            </div>
            {result.error ? <p className="mt-2 text-xs text-destructive">{result.error}</p> : null}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function TcpList({ results }: { results: TcpResult[] }) {
  const t = useTranslations();
  return (
    <ScrollArea className="mt-4 h-[240px] pr-4">
      <div className="space-y-3">
        {results.map((result) => (
          <div key={`${result.host}-${result.port}`} className="rounded-xl border bg-card/60 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {result.host}:{result.port} {result.use_tls ? "· TLS" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("Латентность", "Latency")}: {result.latency_ms.toFixed(1)} {t("мс", "ms")}
                </p>
              </div>
              <StatusBadge tone={result.success ? "success" : "danger"} className="text-xs uppercase">
                {result.success ? "OK" : t("Ошибка", "Error")}
              </StatusBadge>
            </div>
            {result.response_preview ? (
              <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-muted/40 p-3 text-xs font-mono whitespace-pre-wrap">
                {result.response_preview}
              </pre>
            ) : null}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function SmtpList({ results }: { results: SmtpResult[] }) {
  const t = useTranslations();
  return (
    <ScrollArea className="mt-4 h-[240px] pr-4">
      <div className="space-y-3">
        {results.map((result) => (
          <div key={`${result.host}-${result.port}`} className="rounded-xl border bg-card/60 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {result.host}:{result.port}
                </p>
                <p className="text-xs text-muted-foreground">
                  TLS: {result.tls ? "Да" : "Нет"} · STARTTLS: {result.starttls ? "Да" : "Нет"}
                </p>
              </div>
              <StatusBadge tone={result.success ? "success" : "danger"} className="text-xs uppercase">
                {result.success ? "OK" : t("Проблема", "Issue")}
              </StatusBadge>
            </div>
            {result.error ? <p className="mt-2 text-xs text-destructive">{result.error}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              {["connected", "ehlo_ok", "starttls_ok", "auth_ok", "noop_ok"].map((key) => (
                <span
                  key={key}
                  className={cn(
                    "rounded-full border px-2 py-0.5",
                    (result as any)[key] ? "border-emerald-500/40 text-emerald-500" : "border-border/70"
                  )}
                >
                  {key.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function CertificateList({ results, onSelect }: { results: CertificateResult[]; onSelect: (result: CertificateResult) => void }) {
  const t = useTranslations();
  return (
    <ScrollArea className="mt-4 h-[240px] pr-4">
      <div className="space-y-3">
        {results.map((result) => (
          <div key={`${result.host}-${result.port}`} className="rounded-xl border bg-card/60 p-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {result.host}:{result.port}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("Действует до", "Valid until")}: {result.not_after ?? "—"} · {t("Осталось", "Days left")}: {result.days_remaining ?? "—"}{" "}
                  {t("дн.", "days")}
                </p>
              </div>
              <StatusBadge tone={result.error ? "danger" : "info"} className="gap-1 text-xs uppercase">
                {result.error ? (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5" /> {t("Ошибка", "Error")}
                  </>
                ) : (
                  <>
                    <ActivitySquare className="h-3.5 w-3.5" /> {t("Проверено", "Checked")}
                  </>
                )}
              </StatusBadge>
            </div>
            {result.error ? <p className="mt-2 text-xs text-destructive">{result.error}</p> : null}
            {result.san?.length ? (
              <div className="mt-3 text-xs text-muted-foreground">
                <span className="font-semibold">SAN:</span>{" "}
                {result.san.slice(0, 5).join(", ")}
                {result.san.length > 5 ? "…" : ""}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => onSelect(result)}
              className="mt-3 text-xs font-semibold text-primary transition hover:text-primary/80 focus:outline-none"
            >
              {t("Подробнее", "Details")}
            </button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function CertificateModal({ result, onClose }: { result: CertificateResult | null; onClose: () => void }) {
  const t = useTranslations();
  if (!result) return null;

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
        <p className="text-xs uppercase tracking-wide text-muted-foreground">TLS {t("сертификат", "certificate")}</p>
        <h3 className="text-2xl font-semibold">
          {result.host}:{result.port}
        </h3>
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <p>{t("Issuer", "Issuer")}: {result.issuer ?? "—"}</p>
          <p>{t("Subject", "Subject")}: {result.subject ?? "—"}</p>
          <p>
            {t("Not before", "Not before")}: {result.not_before ?? "—"} · {t("Not after", "Not after")}: {result.not_after ?? "—"}
          </p>
          <p>{t("Осталось дней", "Days remaining")}: {result.days_remaining ?? "—"}</p>
        </div>
        {result.error ? <p className="mt-3 text-xs text-destructive">{result.error}</p> : null}
        {result.san?.length ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SAN</p>
            <div className="space-y-2 rounded-xl border bg-muted/40 p-3 text-xs">
              {result.san.map((entry) => (
                <p key={entry} className="font-mono break-all">
                  {entry}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
