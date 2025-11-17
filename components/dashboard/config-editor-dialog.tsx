"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ConfigEditorDialogProps = {
  open: boolean;
  onClose: () => void;
};

type StatusMessage = { type: "success" | "error"; text: string } | null;

export function ConfigEditorDialog({ open, onClose }: ConfigEditorDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/config/raw", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось загрузить config.yaml");
      }
      setContent(payload.content ?? "");
    } catch (error) {
      setStatus({ type: "error", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchConfig();
    } else {
      setStatus(null);
    }
  }, [open, fetchConfig]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/config/raw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось сохранить config.yaml");
      }
      setStatus({ type: "success", text: "Файл сохранён" });
    } catch (error) {
      setStatus({ type: "error", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const disabled = loading || saving;

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={handleClose} aria-hidden />
      <div className="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border/70 bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">config.yaml</p>
            <h3 className="text-xl font-semibold">Редактирование конфигурации</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Закрыть" disabled={saving}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="space-y-3 px-5 py-4">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[360px] font-mono text-sm"
            disabled={disabled}
          />
          {status ? (
            <p
              className={
                status.type === "success"
                  ? "text-sm text-emerald-500"
                  : "text-sm text-destructive"
              }
            >
              {status.text}
            </p>
          ) : null}
        </div>

        <footer className="flex flex-col gap-3 border-t border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Загрузка файла…
            </div>
          ) : null}
          <div className="flex flex-1 justify-end gap-2">
            <Button variant="ghost" onClick={handleClose} disabled={saving}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={disabled}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Сохранение…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Сохранить
                </>
              )}
            </Button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
