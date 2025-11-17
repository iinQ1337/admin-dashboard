import { AlertTriangle, FileWarning, RefreshCcw } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LogFile } from "@/lib/report";
import { StatusBadge } from "./status-badge";

export function LogsPanel({ files }: { files: LogFile[] }) {
  const hasIssues = files.length > 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Логи</CardTitle>
          <CardDescription>Автоматический разбор ошибок</CardDescription>
        </div>
        <StatusBadge tone={hasIssues ? "danger" : "success"} className="gap-1 text-xs uppercase">
          {hasIssues ? <AlertTriangle className="h-3.5 w-3.5" /> : <RefreshCcw className="h-3.5 w-3.5" />}
          {hasIssues ? "Есть проблемы" : "Чисто"}
        </StatusBadge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[260px] pr-4">
          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.path} className="rounded-xl border bg-card/60 p-4 text-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">{file.path}</p>
                  <StatusBadge tone={file.exists ? "info" : "danger"}>
                    {file.exists ? "Проанализирован" : "Файл недоступен"}
                  </StatusBadge>
                </div>
                {file.error && (
                  <p className="flex items-center gap-2 text-xs text-destructive">
                    <FileWarning className="h-4 w-4" /> {file.error}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Warnings: {file.warnings}</span>
                  <span>Errors: {file.errors}</span>
                  <span>Critical: {file.critical}</span>
                </div>
                {file.last_errors?.length ? (
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {file.last_errors.slice(0, 2).map((line) => (
                      <li key={line} className="rounded bg-muted/40 px-2 py-1">
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
            {!files.length && <p className="text-sm text-muted-foreground">Все файлы чисты.</p>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
