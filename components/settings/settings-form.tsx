"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, Bot, Clock, Hash, MessageSquareWarning, Palette, Plus, Settings2, Trash2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "@/components/language-provider";

type NotifyEvent = "tls_expiry" | "sensitive_exposed" | "api_failures" | "server_alerts";

const TELEGRAM_EVENTS: { value: NotifyEvent; label: string }[] = [
  { value: "tls_expiry", label: "Срок TLS" },
  { value: "sensitive_exposed", label: "Чувствительные директории" },
  { value: "api_failures", label: "Сбои API" },
  { value: "server_alerts", label: "Нагрузочные алерты" }
];

const DISCORD_EVENTS: { value: NotifyEvent; label: string }[] = [
  { value: "tls_expiry", label: "Срок TLS" },
  { value: "sensitive_exposed", label: "Чувствительные директории" }
];

const SETTINGS_DICTIONARY: Record<string, string> = {
  "Срок TLS": "TLS expiry",
  "Чувствительные директории": "Sensitive directories",
  "Сбои API": "API failures",
  "Нагрузочные алерты": "Load alerts",
  "Автосохранение бэкапов": "Auto-save backups",
  "Алармы (RDS/ClickHouse)": "Alarms (RDS/ClickHouse)",
  "Бэкапы": "Backups",
  "Включить супервизор": "Enable supervisor",
  "Группа": "Group",
  "Дней до истечения TLS": "Days until TLS expiry",
  "Добавлять теги в сообщение": "Include tags in message",
  "Доп. инструкции": "Extra instructions",
  "Задержка (сек)": "Delay (sec)",
  "Имя бота": "Bot name",
  "Имя узла по умолчанию": "Default node name",
  "Интервал (сек)": "Interval (sec)",
  "Количество последних файлов на сайт": "Files per site",
  "Не оповещать о восстановлении": "Mute recovery notifications",
  "Оповещать о сбоях API": "Notify about API failures",
  "Папка для бэкапов": "Backup directory",
  "Папка логов": "Logs directory",
  "Повторных попыток": "Retry attempts",
  "Пользователь": "User",
  "Попыток до offline": "Attempts before offline",
  "Рабочая директория": "Working directory",
  "Следить за чувствительными директориями": "Monitor sensitive directories",
  "Собирать через docker CLI": "Collect via docker CLI",
  "Сообщать о нагрузке сервера": "Report server load",
  "Таймаут (сек)": "Timeout (sec)",
  "Таймаут запроса (сек)": "Request timeout (sec)",
  "Таймаут уведомления (сек)": "Notification timeout (sec)",
  "Уведомления включены": "Notifications enabled",
  "Хранить записей": "Retention count",
  "Lag порог (мс)": "Lag threshold (ms)",
  "Storage порог (%)": "Storage threshold (%)",
  "Загружаем config.yaml…": "Loading config.yaml…",
  "Не удалось загрузить config.yaml": "Failed to load config.yaml",
  "Сохраняем настройки…": "Saving settings…",
  "Настройки сохранены в config.yaml": "Settings saved to config.yaml",
  "Ошибка при сохранении config.yaml": "Error while saving config.yaml",
  "Интеграции": "Integrations",
  "Telegram / Discord без прямого редактирования config.yaml": "Telegram / Discord without editing config.yaml directly",
  "Потоки данных": "Data streams",
  "Интервалы и параметры для /docker и /databases": "Intervals and params for /docker and /databases",
  "Опрос и тайминги": "Polling and timing",
  "Соответствует секции `polling` из config.yaml": "Matches `polling` section from config.yaml",
  "Интеграции и настройки оповещений": "Integrations and notifications",
  "Мониторинг": "Monitoring",
  "Уведомления": "Notifications",
  "UI · только сайт": "UI · site only",
  "Триггеры уведомлений": "Notification triggers",
  "Сохранить параметры": "Save settings",
  "Сохраняем…": "Saving…",
  "Добавить": "Add",
  "Снимки контейнеров, узлов и событий": "Snapshots of containers, nodes, and events",
  "Использовать docker ps/stats/events вместо статического списка": "Use docker ps/stats/events instead of a static list",
  "Периодические проверки подключений": "Periodic connection checks",
  "Загружать и отображать сообщения": "Load and display messages",
  "Показывать расписание и статусы": "Show schedule and statuses",
  "Создавать запись бэкапа по каждому циклу": "Create a backup record each cycle",
  "Общие уведомления": "General notifications",
  "События": "Events",
  "Шаблон сообщения": "Message template",
  "Теги": "Tags",
  "Теги пока не добавлены.": "No tags added yet.",
  "Политика рестартов": "Restart policy",
  "Мониторинг ресурсов": "Resource monitoring",
  "Лимиты ресурсов (rlimit)": "Resource limits (rlimit)",
  "Нажмите, чтобы выбрать цвет": "Click to select a color",
  "Тема": "Theme",
  "Включить сбор CPU/RAM/сеть": "Enable CPU/RAM/network sampling",
  "Self-heal супервизоров": "Supervisor self-heal"
};

function translateWithSettings(t: ReturnType<typeof useTranslations>, value: string, english?: string) {
  return t(value, english ?? SETTINGS_DICTIONARY[value] ?? value);
}

type ThemeMode = "light" | "dark" | "system";

type ThemePreset = {
  id: string;
  name: string;
  mode: ThemeMode;
  primary: string;
  accent: string;
  background: string;
  description: string;
};

type SupervisorForm = {
  enabled: boolean;
  logDirectory: string;
  healthcheck: {
    enabled: boolean;
    host: string;
    port: number;
  };
  watchdog: {
    enabled: boolean;
    checkIntervalSec: number;
    staleThresholdSec: number;
  };
  command: {
    name: string;
    executable: string;
    args: string;
    workingDir: string;
    envText: string;
    user: string;
    group: string;
  };
  restartPolicy: {
    mode: string;
    restartDelaySeconds: number;
    restartOnExit0: boolean;
    maxRestartsPerMinute: number;
    hangTimeoutSeconds: number;
    hangCpuPercentThreshold: number;
    restartOnHang: boolean;
  };
  resources: {
    enabled: boolean;
    sampleIntervalSec: number;
    maxMemoryMb: number | "";
    maxCpuPercent: number | "";
    memoryLeakRestartMb: number | "";
    networkCheckHost: string;
    networkCheckTimeoutSec: number;
  };
  resourceLimits: {
    memoryMb: number | "";
    cpuSeconds: number | "";
  };
};

type FormState = {
  notificationsEnabled: boolean;
  telegram: {
    enabled: boolean;
    botToken: string;
    chatId: string;
    parseMode: string;
    notifyOn: NotifyEvent[];
    messageTemplate: string;
    extraInstructions: string;
  };
  discord: {
    enabled: boolean;
    webhookUrl: string;
    username: string;
    avatarUrl: string;
    notifyOn: NotifyEvent[];
    messageTemplate: string;
  };
  common: {
    retryAttempts: number;
    timeoutSec: number;
    muteWhenRecovering: boolean;
    includeTags: boolean;
    tags: string[];
  };
  polling: {
    intervalSec: number;
    offlineAttempts: number;
    requestTimeoutSec: number;
  };
  alerts: {
    tlsExpiryDays: number;
    notifySensitiveExposure: boolean;
    notifyApiFailures: boolean;
    notifyServerLoad: boolean;
  };
  dashboard: {
    siteHistoryFiles: number;
    themes: ThemePreset[];
    activeThemeId: string | null;
  };
  streams: {
    docker: {
      enabled: boolean;
      intervalSec: number;
      useCli: boolean;
      defaultNode: string;
    };
    databases: {
      enabled: boolean;
      intervalSec: number;
      replicationLagWarnMs: number;
      storageWarnPercent: number;
      alertsEnabled: boolean;
      backupsEnabled: boolean;
      autoBackupEnabled: boolean;
      backupDirectory: string;
      backupRetention: number;
      backupTimeoutSec: number;
    };
  };
  supervisor: SupervisorForm;
  notes: string;
};

const DEFAULT_FORM: FormState = {
  notificationsEnabled: true,
  telegram: {
    enabled: true,
    botToken: "",
    chatId: "",
    parseMode: "Markdown",
    notifyOn: TELEGRAM_EVENTS.map((item) => item.value) as NotifyEvent[],
    messageTemplate: `🚨 *{{event_type}}* detected
Host: \`{{host}}\`
Details: {{details}}
Time: {{timestamp}}`,
    extraInstructions: ""
  },
  discord: {
    enabled: false,
    webhookUrl: "",
    username: "Monitoring Bot",
    avatarUrl: "",
    notifyOn: DISCORD_EVENTS.map((item) => item.value) as NotifyEvent[],
    messageTemplate: `**{{event_type}}**
**Host:** {{host}}
**Details:** {{details}}
*(at {{timestamp}})*`
  },
  common: {
    retryAttempts: 3,
    timeoutSec: 5,
    muteWhenRecovering: true,
    includeTags: true,
    tags: []
  },
  polling: {
    intervalSec: 60,
    offlineAttempts: 3,
    requestTimeoutSec: 5
  },
  alerts: {
    tlsExpiryDays: 30,
    notifySensitiveExposure: true,
    notifyApiFailures: true,
    notifyServerLoad: true
  },
  dashboard: {
    siteHistoryFiles: 5,
    themes: [],
    activeThemeId: null
  },
  streams: {
    docker: {
      enabled: true,
      intervalSec: 20,
      useCli: true,
      defaultNode: ""
    },
    databases: {
      enabled: true,
      intervalSec: 30,
      replicationLagWarnMs: 250,
      storageWarnPercent: 85,
      alertsEnabled: true,
      backupsEnabled: true,
      autoBackupEnabled: false,
      backupDirectory: "output/db_backups",
      backupRetention: 20,
      backupTimeoutSec: 120
    }
  },
  supervisor: {
    enabled: false,
    logDirectory: "output/supervisor",
    healthcheck: { enabled: false, host: "127.0.0.1", port: 8130 },
    watchdog: { enabled: true, checkIntervalSec: 5, staleThresholdSec: 45 },
    command: {
      name: "supervised-task",
      executable: "",
      args: "",
      workingDir: "",
      envText: "",
      user: "",
      group: ""
    },
    restartPolicy: {
      mode: "always",
      restartDelaySeconds: 5,
      restartOnExit0: true,
      maxRestartsPerMinute: 10,
      hangTimeoutSeconds: 60,
      hangCpuPercentThreshold: 3,
      restartOnHang: true
    },
    resources: {
      enabled: true,
      sampleIntervalSec: 2,
      maxMemoryMb: 700,
      maxCpuPercent: 90,
      memoryLeakRestartMb: 128,
      networkCheckHost: "8.8.8.8",
      networkCheckTimeoutSec: 2
    },
    resourceLimits: {
      memoryMb: 512,
      cpuSeconds: 120
    }
  },
  notes: ""
};

type SettingsResponse = {
  notifications?: any;
  polling?: any;
  alerts?: any;
  dashboard?: any;
  supervisor?: any;
};

const THEME_SEEDS = [
  { primary: "#2563EB", accent: "#22C55E", background: "#0F172A" },
  { primary: "#DB2777", accent: "#F59E0B", background: "#111827" },
  { primary: "#0EA5E9", accent: "#A855F7", background: "#020617" }
];

function generateThemeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `theme-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function createThemeSeed(index: number): ThemePreset {
  const seed = THEME_SEEDS[index % THEME_SEEDS.length];
  return {
    id: generateThemeId(),
    name: `Тема ${index + 1}`,
    mode: "system",
    primary: seed.primary,
    accent: seed.accent,
    background: seed.background,
    description: ""
  };
}

export function SettingsForm({ initialTab = "monitoring" }: { initialTab?: string }) {
  const t = useTranslations();
  const tr = useCallback((value: string, english?: string) => translateWithSettings(t, value, english), [t]);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("loading");
  const [statusMessage, setStatusMessage] = useState("");
  const allowedTabs = ["monitoring", "notifications", "supervisor", "ui"];
  const defaultTab = allowedTabs.includes(initialTab || "") ? (initialTab as string) : "monitoring";

  useEffect(() => {
    async function loadSettings() {
      setStatus("loading");
      setStatusMessage(tr("Загружаем config.yaml…"));
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) throw new Error(await response.text());
        const data = (await response.json()) as SettingsResponse;
        setForm(mapConfigToForm(data));
        setStatus("idle");
        setStatusMessage("");
      } catch (error) {
        console.error(error);
        setStatus("error");
        setStatusMessage(tr("Не удалось загрузить config.yaml"));
      }
    }
    loadSettings();
  }, []);

  function toggleNotify(channel: "telegram" | "discord", value: NotifyEvent) {
    setForm((prev) => {
      const list = prev[channel].notifyOn;
      const exists = list.includes(value);
      const nextList = exists ? list.filter((item) => item !== value) : [...list, value];
      return {
        ...prev,
        [channel]: {
          ...prev[channel],
          notifyOn: nextList as NotifyEvent[]
        }
      };
    });
  }

  function handleAddTag() {
    if (!tagInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      common: { ...prev.common, tags: Array.from(new Set([...prev.common.tags, tagInput.trim()])) }
    }));
    setTagInput("");
  }

  function handleRemoveTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      common: { ...prev.common, tags: prev.common.tags.filter((item) => item !== tag) }
    }));
  }

  function handleAddTheme() {
    setForm((prev) => {
      const newTheme = createThemeSeed(prev.dashboard.themes.length);
      const themes = [...prev.dashboard.themes, newTheme];
      return {
        ...prev,
        dashboard: {
          ...prev.dashboard,
          themes,
          activeThemeId: prev.dashboard.activeThemeId ?? newTheme.id
        }
      };
    });
  }

  function handleThemeChange(id: string, patch: Partial<Omit<ThemePreset, "id">>) {
    setForm((prev) => ({
      ...prev,
      dashboard: {
        ...prev.dashboard,
        themes: prev.dashboard.themes.map((theme) =>
          theme.id === id ? { ...theme, ...patch } : theme
        )
      }
    }));
  }

  function handleRemoveTheme(id: string) {
    setForm((prev) => {
      const themes = prev.dashboard.themes.filter((theme) => theme.id !== id);
      const activeThemeId =
        prev.dashboard.activeThemeId === id
          ? themes[0]?.id ?? null
          : prev.dashboard.activeThemeId;
      return {
        ...prev,
        dashboard: {
          ...prev.dashboard,
          themes,
          activeThemeId
        }
      };
    });
  }

  function handleActivateTheme(id: string) {
    setForm((prev) => ({
      ...prev,
      dashboard: {
        ...prev.dashboard,
        activeThemeId: id
      }
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setStatusMessage(tr("Сохраняем настройки…"));
    try {
      const payload = buildPayload(form);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(await response.text());
      setStatus("success");
      setStatusMessage(tr("Настройки сохранены в config.yaml"));
    } catch (error) {
      console.error(error);
      setStatus("error");
      setStatusMessage(tr("Ошибка при сохранении config.yaml"));
    }
  }

  const disabled = status === "loading" || status === "saving";

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full gap-2 rounded-xl bg-muted/40 p-1 sm:grid-cols-4">
          <TabsTrigger value="monitoring" className="rounded-lg">
            {tr("Мониторинг", "Monitoring")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg">
            {tr("Уведомления", "Notifications")}
          </TabsTrigger>
          <TabsTrigger value="supervisor" className="rounded-lg">
            Supervisor
          </TabsTrigger>
          <TabsTrigger value="ui" className="rounded-lg">
            {tr("UI · только сайт")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="monitoring" className="settings-tab-content">
          <fieldset disabled={disabled} className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" /> {tr("Потоки данных", "Data streams")}
                  </CardTitle>
                  <CardDescription>
                    {tr("Интервалы и параметры для /docker и /databases", "Intervals and parameters for /docker and /databases")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-xl border bg-card/40 p-4">
                  <ToggleRow
                    label="Docker stream"
                    description="Снимки контейнеров, узлов и событий"
                    checked={form.streams.docker.enabled}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        streams: { ...prev.streams, docker: { ...prev.streams.docker, enabled: checked } }
                      }))
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      id="dockerInterval"
                      type="number"
                      min={5}
                      label="Интервал (сек)"
                      value={form.streams.docker.intervalSec}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          streams: {
                            ...prev.streams,
                            docker: { ...prev.streams.docker, intervalSec: Number(event.target.value) }
                          }
                        }))
                      }
                    />
                    <Field
                      id="dockerDefaultNode"
                      label="Имя узла по умолчанию"
                      placeholder="docker-node"
                      value={form.streams.docker.defaultNode}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          streams: {
                            ...prev.streams,
                            docker: { ...prev.streams.docker, defaultNode: event.target.value }
                          }
                        }))
                      }
                    />
                  </div>
                  <ToggleRow
                    label="Собирать через docker CLI"
                    description="Использовать docker ps/stats/events вместо статического списка"
                    checked={form.streams.docker.useCli}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        streams: { ...prev.streams, docker: { ...prev.streams.docker, useCli: checked } }
                      }))
                    }
                  />
                </div>

            <div className="space-y-3 rounded-xl border bg-card/40 p-4">
              <ToggleRow
                label="Databases stream"
                description="Периодические проверки подключений"
                checked={form.streams.databases.enabled}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        streams: { ...prev.streams, databases: { ...prev.streams.databases, enabled: checked } }
                      }))
                    }
                  />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  id="dbInterval"
                  type="number"
                  min={5}
                  label="Интервал (сек)"
                  value={form.streams.databases.intervalSec}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          streams: {
                            ...prev.streams,
                            databases: { ...prev.streams.databases, intervalSec: Number(event.target.value) }
                          }
                        }))
                      }
                    />
                    <Field
                      id="dbReplicationWarn"
                      type="number"
                      min={0}
                      label="Lag порог (мс)"
                      value={form.streams.databases.replicationLagWarnMs}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          streams: {
                            ...prev.streams,
                            databases: { ...prev.streams.databases, replicationLagWarnMs: Number(event.target.value) }
                          }
                        }))
                      }
                    />
                    <Field
                      id="dbStorageWarn"
                      type="number"
                      min={0}
                      max={100}
                      label="Storage порог (%)"
                      value={form.streams.databases.storageWarnPercent}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          streams: {
                            ...prev.streams,
                            databases: { ...prev.streams.databases, storageWarnPercent: Number(event.target.value) }
                          }
                        }))
                      }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ToggleRow
                  label="Алармы (RDS/ClickHouse)"
                  description="Загружать и отображать сообщения"
                  checked={form.streams.databases.alertsEnabled}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      streams: {
                        ...prev.streams,
                        databases: { ...prev.streams.databases, alertsEnabled: checked }
                      }
                    }))
                  }
                />
                <ToggleRow
                  label="Бэкапы"
                  description="Показывать расписание и статусы"
                  checked={form.streams.databases.backupsEnabled}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      streams: {
                        ...prev.streams,
                        databases: { ...prev.streams.databases, backupsEnabled: checked }
                      }
                    }))
                  }
                />
                <ToggleRow
                  label="Автосохранение бэкапов"
                  description="Создавать запись бэкапа по каждому циклу"
                  checked={form.streams.databases.autoBackupEnabled}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      streams: {
                        ...prev.streams,
                        databases: { ...prev.streams.databases, autoBackupEnabled: checked }
                      }
                    }))
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field
                  id="dbBackupDir"
                  label="Папка для бэкапов"
                  placeholder="output/db_backups"
                  value={form.streams.databases.backupDirectory}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      streams: {
                        ...prev.streams,
                        databases: { ...prev.streams.databases, backupDirectory: event.target.value }
                      }
                    }))
                  }
                />
                <Field
                  id="dbBackupRetention"
                  type="number"
                  min={1}
                  label="Хранить записей"
                  value={form.streams.databases.backupRetention}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      streams: {
                        ...prev.streams,
                        databases: { ...prev.streams.databases, backupRetention: Number(event.target.value) }
                      }
                    }))
                  }
                />
                <Field
                  id="dbBackupTimeout"
                  type="number"
                  min={10}
                  label="Таймаут (сек)"
                  value={form.streams.databases.backupTimeoutSec}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      streams: {
                        ...prev.streams,
                        databases: { ...prev.streams.databases, backupTimeoutSec: Number(event.target.value) }
                      }
                    }))
                  }
                />
              </div>
              </div>
            </CardContent>
          </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> {tr("Опрос и тайминги", "Polling and timings")}
            </CardTitle>
            <CardDescription>{tr("Соответствует секции `polling` из config.yaml")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field
              id="interval"
              label="Интервал (сек)"
              type="number"
              min={5}
              value={form.polling.intervalSec}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  polling: { ...prev.polling, intervalSec: Number(event.target.value) }
                }))
              }
            />
            <Field
              id="offlineAttempts"
              label="Попыток до offline"
              type="number"
              min={1}
              value={form.polling.offlineAttempts}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  polling: { ...prev.polling, offlineAttempts: Number(event.target.value) }
                }))
              }
            />
            <Field
              id="requestTimeout"
              label="Таймаут запроса (сек)"
              type="number"
              min={1}
              value={form.polling.requestTimeoutSec}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  polling: { ...prev.polling, requestTimeoutSec: Number(event.target.value) }
                }))
              }
            />
          </CardContent>
        </Card>
          </fieldset>
        </TabsContent>
        <TabsContent value="notifications" className="settings-tab-content">
          <fieldset disabled={disabled} className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" /> {tr("Интеграции")}
                  </CardTitle>
                  <CardDescription>{tr("Telegram / Discord без прямого редактирования config.yaml")}</CardDescription>
                </div>
                <ToggleCard
                  label="Уведомления включены"
                  checked={form.notificationsEnabled}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, notificationsEnabled: checked }))}
                />
              </CardHeader>
              <CardContent className="space-y-6">
                <IntegrationCard
                  title="Telegram"
                  enabled={form.telegram.enabled}
                  onToggle={(checked) =>
                    setForm((prev) => ({ ...prev, telegram: { ...prev.telegram, enabled: checked } }))
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      id="telegramToken"
                      label="Bot token"
                      placeholder="123456789:ABCDEF..."
                      value={form.telegram.botToken}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, telegram: { ...prev.telegram, botToken: event.target.value } }))
                      }
                    />
                    <Field
                      id="telegramChat"
                      label="Chat / Channel ID"
                      placeholder="@my_channel или -123456789"
                      value={form.telegram.chatId}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, telegram: { ...prev.telegram, chatId: event.target.value } }))
                      }
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      id="parseMode"
                      label="Parse mode"
                      placeholder="Markdown"
                      value={form.telegram.parseMode}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, telegram: { ...prev.telegram, parseMode: event.target.value } }))
                      }
                    />
                    <div>
                      <Label>{tr("События")}</Label>
                      <div className="mt-2 grid gap-2">
                        {TELEGRAM_EVENTS.map((option) => (
                          <CheckboxRow
                            key={option.value}
                            label={option.label}
                            checked={form.telegram.notifyOn.includes(option.value)}
                            onCheckedChange={() => toggleNotify("telegram", option.value)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="tgTemplate">{tr("Шаблон сообщения")}</Label>
                      <Textarea
                        id="tgTemplate"
                        value={form.telegram.messageTemplate}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            telegram: { ...prev.telegram, messageTemplate: event.target.value }
                          }))
                        }
                      />
                    </div>
                    <Field
                      id="tgInstructions"
                      label="Доп. инструкции"
                      placeholder="Добавить @devops..."
                      value={form.telegram.extraInstructions}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          telegram: { ...prev.telegram, extraInstructions: event.target.value }
                        }))
                      }
                    />
                  </div>
                </IntegrationCard>

                <IntegrationCard
                  title="Discord"
                  enabled={form.discord.enabled}
                  onToggle={(checked) =>
                    setForm((prev) => ({ ...prev, discord: { ...prev.discord, enabled: checked } }))
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      id="discordWebhook"
                      label="Webhook URL"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={form.discord.webhookUrl}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, discord: { ...prev.discord, webhookUrl: event.target.value } }))
                      }
                    />
                    <Field
                      id="discordUsername"
                      label="Имя бота"
                      value={form.discord.username}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, discord: { ...prev.discord, username: event.target.value } }))
                      }
                    />
                    <Field
                      id="discordAvatar"
                      label="Avatar URL"
                      value={form.discord.avatarUrl}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, discord: { ...prev.discord, avatarUrl: event.target.value } }))
                      }
                    />
                    <div>
                      <Label>{tr("События")}</Label>
                      <div className="mt-2 grid gap-2">
                        {DISCORD_EVENTS.map((option) => (
                          <CheckboxRow
                            key={option.value}
                            label={option.label}
                            checked={form.discord.notifyOn.includes(option.value)}
                            onCheckedChange={() => toggleNotify("discord", option.value)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="discordTemplate">{tr("Шаблон сообщения")}</Label>
                    <Textarea
                      id="discordTemplate"
                      value={form.discord.messageTemplate}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          discord: { ...prev.discord, messageTemplate: event.target.value }
                        }))
                      }
                    />
                  </div>
                </IntegrationCard>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-primary" /> {tr("Общие уведомления")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field
                  id="retryAttempts"
                  label="Повторных попыток"
                  type="number"
                  min={1}
                  value={form.common.retryAttempts}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      common: { ...prev.common, retryAttempts: Number(event.target.value) }
                    }))
                  }
                />
                <Field
                  id="timeoutSec"
                  label="Таймаут уведомления (сек)"
                  type="number"
                  min={1}
                  value={form.common.timeoutSec}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      common: { ...prev.common, timeoutSec: Number(event.target.value) }
                    }))
                  }
                />
                <ToggleRow
                  label="Не оповещать о восстановлении"
                  description="Соответствует `mute_when_recovering`"
                  checked={form.common.muteWhenRecovering}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, common: { ...prev.common, muteWhenRecovering: checked } }))
                  }
                />
                <ToggleRow
                  label="Добавлять теги в сообщение"
                  description="Соответствует `include_tags`"
                  checked={form.common.includeTags}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, common: { ...prev.common, includeTags: checked } }))
                  }
                />
                <div className="space-y-2">
                  <Label>{tr("Теги")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {form.common.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-xs text-muted-foreground"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    {!form.common.tags.length && (
                      <p className="text-xs text-muted-foreground">{tr("Теги пока не добавлены.")}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="prod-eu-west"
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                    />
                    <Button type="button" variant="secondary" onClick={handleAddTag}>
                      {tr("Добавить")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareWarning className="h-5 w-5 text-primary" /> {tr("Триггеры уведомлений")}
                </CardTitle>
                <CardDescription>{tr("Секция `alerts` в config.yaml", "Section `alerts` in config.yaml")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field
                  id="tlsDays"
                  label="Дней до истечения TLS"
                  type="number"
                  min={1}
                  value={form.alerts.tlsExpiryDays}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      alerts: { ...prev.alerts, tlsExpiryDays: Number(event.target.value) }
                    }))
                  }
                />
                <ToggleRow
                  label="Следить за чувствительными директориями"
                  description="notify_sensitive_exposure"
                  checked={form.alerts.notifySensitiveExposure}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      alerts: { ...prev.alerts, notifySensitiveExposure: checked }
                    }))
                  }
                />
                <ToggleRow
                  label="Оповещать о сбоях API"
                  description="notify_api_failures"
                  checked={form.alerts.notifyApiFailures}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      alerts: { ...prev.alerts, notifyApiFailures: checked }
                    }))
                  }
                />
                <ToggleRow
                  label="Сообщать о нагрузке сервера"
                  description="notify_server_load"
                  checked={form.alerts.notifyServerLoad}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      alerts: { ...prev.alerts, notifyServerLoad: checked }
                    }))
                  }
                />
              </CardContent>
            </Card>
          </fieldset>
        </TabsContent>

        <TabsContent value="supervisor" className="settings-tab-content">
          <fieldset disabled={disabled} className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" /> {tr("Мини-супервизор", "Mini supervisor")}
                  </CardTitle>
                  <CardDescription>
                    {tr("Настройки запуска процессов, watchdog и health-check API", "Process start settings, watchdog, and health-check API")}
                  </CardDescription>
                </div>
                <ToggleCard
                  label="Включить супервизор"
                  checked={form.supervisor.enabled}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, supervisor: { ...prev.supervisor, enabled: checked } }))}
                />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field
                    id="supLogDir"
                    label="Папка логов"
                    placeholder="output/supervisor"
                    value={form.supervisor.logDirectory}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        supervisor: { ...prev.supervisor, logDirectory: event.target.value }
                      }))
                    }
                  />
                  <Field
                    id="supCommand"
                    label="Executable"
                    placeholder="python / node / bash"
                    value={form.supervisor.command.executable}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        supervisor: {
                          ...prev.supervisor,
                          command: { ...prev.supervisor.command, executable: event.target.value }
                        }
                      }))
                    }
                  />
                  <Field
                    id="supArgs"
                    label="Args (через пробел)"
                    placeholder="-m app --flag"
                    value={form.supervisor.command.args}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        supervisor: { ...prev.supervisor, command: { ...prev.supervisor.command, args: event.target.value } }
                      }))
                    }
                  />
                  <Field
                    id="supWorkingDir"
                    label="Рабочая директория"
                    placeholder="/opt/app"
                    value={form.supervisor.command.workingDir}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        supervisor: {
                          ...prev.supervisor,
                          command: { ...prev.supervisor.command, workingDir: event.target.value }
                        }
                      }))
                    }
                  />
                  <Field
                    id="supUser"
                    label="Пользователь"
                    placeholder="www-data"
                    value={form.supervisor.command.user}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        supervisor: {
                          ...prev.supervisor,
                          command: { ...prev.supervisor.command, user: event.target.value }
                        }
                      }))
                    }
                  />
                  <Field
                    id="supGroup"
                    label="Группа"
                    placeholder="www-data"
                    value={form.supervisor.command.group}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        supervisor: {
                          ...prev.supervisor,
                          command: { ...prev.supervisor.command, group: event.target.value }
                        }
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="supEnv">
                    {tr("Переменные окружения (KEY=VALUE, по строкам)", "Environment variables (KEY=VALUE, per line)")}
                  </Label>
                  <Textarea
                    id="supEnv"
                    value={form.supervisor.command.envText}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        supervisor: {
                          ...prev.supervisor,
                          command: { ...prev.supervisor.command, envText: event.target.value }
                        }
                      }))
                    }
                    placeholder={"APP_ENV=prod\nSECRET=123"}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded-xl border bg-card/40 p-4">
                    <p className="text-sm font-medium">{tr("Политика рестартов")}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        id="supRestartMode"
                        label="mode"
                        placeholder="always/on-failure/never"
                        value={form.supervisor.restartPolicy.mode}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              restartPolicy: { ...prev.supervisor.restartPolicy, mode: event.target.value }
                            }
                          }))
                        }
                      />
                      <Field
                        id="supRestartDelay"
                        type="number"
                        label="Задержка (сек)"
                        min={0}
                        value={form.supervisor.restartPolicy.restartDelaySeconds}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              restartPolicy: {
                                ...prev.supervisor.restartPolicy,
                                restartDelaySeconds: Number(event.target.value)
                              }
                            }
                          }))
                        }
                      />
                      <Field
                        id="supMaxRestarts"
                        type="number"
                        label="max_restarts_per_minute"
                        min={0}
                        value={form.supervisor.restartPolicy.maxRestartsPerMinute}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              restartPolicy: {
                                ...prev.supervisor.restartPolicy,
                                maxRestartsPerMinute: Number(event.target.value)
                              }
                            }
                          }))
                        }
                      />
                      <Field
                        id="supHangTimeout"
                        type="number"
                        label="hang_timeout_seconds"
                        min={0}
                        value={form.supervisor.restartPolicy.hangTimeoutSeconds}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              restartPolicy: {
                                ...prev.supervisor.restartPolicy,
                                hangTimeoutSeconds: Number(event.target.value)
                              }
                            }
                          }))
                        }
                      />
                      <Field
                        id="supHangCpu"
                        type="number"
                        label="hang_cpu_percent_threshold"
                        min={0}
                        value={form.supervisor.restartPolicy.hangCpuPercentThreshold}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              restartPolicy: {
                                ...prev.supervisor.restartPolicy,
                                hangCpuPercentThreshold: Number(event.target.value)
                              }
                            }
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ToggleRow
                        label="restart_on_exit_0"
                        description="Перезапуск даже при exit 0"
                        checked={form.supervisor.restartPolicy.restartOnExit0}
                        onCheckedChange={(checked) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              restartPolicy: { ...prev.supervisor.restartPolicy, restartOnExit0: checked }
                            }
                          }))
                        }
                      />
                      <ToggleRow
                        label="restart_on_hang"
                        description="Перезапуск при зависании"
                        checked={form.supervisor.restartPolicy.restartOnHang}
                        onCheckedChange={(checked) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              restartPolicy: { ...prev.supervisor.restartPolicy, restartOnHang: checked }
                            }
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border bg-card/40 p-4">
                    <p className="text-sm font-medium">{tr("Мониторинг ресурсов")}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ToggleRow
                        label="sample_enabled"
                        description="Включить сбор CPU/RAM/сеть"
                        checked={form.supervisor.resources.enabled}
                        onCheckedChange={(checked) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              resources: { ...prev.supervisor.resources, enabled: checked }
                            }
                          }))
                        }
                      />
                      <Field
                        id="supSample"
                        type="number"
                        label="sample_interval_sec"
                        min={0.5}
                        step={0.5}
                        value={form.supervisor.resources.sampleIntervalSec}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              resources: {
                                ...prev.supervisor.resources,
                                sampleIntervalSec: Number(event.target.value)
                              }
                            }
                          }))
                        }
                      />
                      <Field
                        id="supMaxMem"
                        type="number"
                        label="max_memory_mb"
                        min={0}
                        value={
                          form.supervisor.resources.maxMemoryMb === ""
                            ? ""
                            : form.supervisor.resources.maxMemoryMb
                        }
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              resources: {
                                ...prev.supervisor.resources,
                                maxMemoryMb:
                                  event.target.value === "" ? "" : Number(event.target.value)
                              }
                            }
                          }))
                        }
                      />
                      <Field
                        id="supMaxCpu"
                        type="number"
                        label="max_cpu_percent"
                        min={0}
                        value={
                          form.supervisor.resources.maxCpuPercent === ""
                            ? ""
                            : form.supervisor.resources.maxCpuPercent
                        }
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              resources: {
                                ...prev.supervisor.resources,
                                maxCpuPercent:
                                  event.target.value === "" ? "" : Number(event.target.value)
                              }
                            }
                          }))
                        }
                      />
                      <Field
                        id="supLeak"
                        type="number"
                        label="memory_leak_restart_mb"
                        min={0}
                        value={
                          form.supervisor.resources.memoryLeakRestartMb === ""
                            ? ""
                            : form.supervisor.resources.memoryLeakRestartMb
                        }
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              resources: {
                                ...prev.supervisor.resources,
                                memoryLeakRestartMb:
                                  event.target.value === "" ? "" : Number(event.target.value)
                              }
                            }
                          }))
                        }
                      />
                      <div className="grid gap-3">
                        <Field
                          id="supNetworkHost"
                          label="network_check_host"
                          placeholder="8.8.8.8"
                          value={form.supervisor.resources.networkCheckHost}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              supervisor: {
                                ...prev.supervisor,
                                resources: {
                                  ...prev.supervisor.resources,
                                  networkCheckHost: event.target.value
                                }
                              }
                            }))
                          }
                        />
                        <Field
                          id="supNetworkTimeout"
                          type="number"
                          label="network_check_timeout_sec"
                          min={0}
                          value={form.supervisor.resources.networkCheckTimeoutSec}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              supervisor: {
                                ...prev.supervisor,
                                resources: {
                                  ...prev.supervisor.resources,
                                  networkCheckTimeoutSec: Number(event.target.value)
                                }
                              }
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border bg-card/40 p-4">
                    <p className="text-sm font-medium">Health-check API</p>
                    <div className="grid gap-3">
                      <ToggleRow
                        label="healthcheck.enabled"
                        description="host:port/health"
                        checked={form.supervisor.healthcheck.enabled}
                        onCheckedChange={(checked) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              healthcheck: { ...prev.supervisor.healthcheck, enabled: checked }
                            }
                          }))
                        }
                      />
                      <Field
                        id="supHealthHost"
                        label="Host"
                        value={form.supervisor.healthcheck.host}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              healthcheck: { ...prev.supervisor.healthcheck, host: event.target.value }
                            }
                          }))
                        }
                      />
                      <Field
                        id="supHealthPort"
                        type="number"
                        label="Port"
                        min={1}
                        value={form.supervisor.healthcheck.port}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              healthcheck: { ...prev.supervisor.healthcheck, port: Number(event.target.value) }
                            }
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card/40 p-4">
                    <p className="text-sm font-medium">Watchdog</p>
                    <div className="grid gap-3">
                      <ToggleRow
                        label="watchdog.enabled"
                        description="Self-heal супервизоров"
                        checked={form.supervisor.watchdog.enabled}
                        onCheckedChange={(checked) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              watchdog: { ...prev.supervisor.watchdog, enabled: checked }
                            }
                          }))
                        }
                      />
                      <Field
                        id="supWatchInterval"
                        type="number"
                        label="check_interval_sec"
                        min={1}
                        value={form.supervisor.watchdog.checkIntervalSec}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              watchdog: {
                                ...prev.supervisor.watchdog,
                                checkIntervalSec: Number(event.target.value)
                              }
                            }
                          }))
                        }
                      />
                      <Field
                        id="supWatchStale"
                        type="number"
                        label="stale_threshold_sec"
                        min={1}
                        value={form.supervisor.watchdog.staleThresholdSec}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              watchdog: {
                                ...prev.supervisor.watchdog,
                                staleThresholdSec: Number(event.target.value)
                              }
                            }
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card/40 p-4">
                    <p className="text-sm font-medium">{tr("Лимиты ресурсов (rlimit)")}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        id="supLimitMem"
                        type="number"
                        label="memory_mb"
                        min={0}
                        value={
                          form.supervisor.resourceLimits.memoryMb === ""
                            ? ""
                            : form.supervisor.resourceLimits.memoryMb
                        }
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              resourceLimits: {
                                ...prev.supervisor.resourceLimits,
                                memoryMb: event.target.value === "" ? "" : Number(event.target.value)
                              }
                            }
                          }))
                        }
                      />
                      <Field
                        id="supLimitCpu"
                        type="number"
                        label="cpu_seconds"
                        min={0}
                        value={
                          form.supervisor.resourceLimits.cpuSeconds === ""
                            ? ""
                            : form.supervisor.resourceLimits.cpuSeconds
                        }
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            supervisor: {
                              ...prev.supervisor,
                              resourceLimits: {
                                ...prev.supervisor.resourceLimits,
                                cpuSeconds: event.target.value === "" ? "" : Number(event.target.value)
                              }
                            }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </fieldset>
        </TabsContent>

        <TabsContent value="ui" className="settings-tab-content">
          <fieldset disabled={disabled} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" /> {tr("Настройки графиков", "Chart settings")}
                </CardTitle>
                <CardDescription>
                  {tr(
                    "Эти параметры влияют только на витрину /admin-dashboard и не задействуются самим мониторингом.",
                    "These options affect only the /admin-dashboard view and are not used by the monitoring service."
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {tr(
                    "Используется для подбора последних JSON файлов для каждого сайта при построении диаграмм. Можно смело экспериментировать — Python сервис продолжит работать по прежнему.",
                    "Used to pick the latest JSON files per site when building charts. Feel free to experiment — the Python service keeps working as before."
                  )}
                </p>
                <Field
                  id="historyFiles"
                  label="Количество последних файлов на сайт"
                  type="number"
                  min={1}
                  max={50}
                  value={form.dashboard.siteHistoryFiles}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      dashboard: { ...prev.dashboard, siteHistoryFiles: Number(event.target.value) }
                    }))
                  }
                />
              </CardContent>
            </Card>
            
          </fieldset>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed bg-card/40 p-4 text-sm text-muted-foreground">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
            {tr(
              "Значения синхронизируются с секциями `notifications`, `polling`, `alerts`, `dashboard`, `supervisor` в config.yaml.",
              "Values sync with `notifications`, `polling`, `alerts`, `dashboard`, `supervisor` sections in config.yaml."
            )}
          </div>
          {statusMessage && (
            <span
              className={
                status === "error"
                  ? "text-destructive"
                  : status === "success"
                    ? "text-emerald-500"
                    : "text-muted-foreground"
              }
            >
              {statusMessage}
            </span>
          )}
        </div>
        <Button type="submit" disabled={disabled}>
          {status === "saving" ? tr("Сохраняем…") : tr("Сохранить параметры")}
        </Button>
      </div>
    </form>
  );
}

function Field(props: React.ComponentProps<typeof Input> & { label: string }) {
  const t = useTranslations();
  const { id, label, className, ...rest } = props;
  const translatedLabel = translateWithSettings(t, label);
  return (
    <div>
      <Label htmlFor={id} className="break-words">
        {translatedLabel}
      </Label>
      <Input id={id} className={className} {...rest} />
    </div>
  );
}

function ToggleCard({
  label,
  checked,
  onCheckedChange
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  const t = useTranslations();
  const translatedLabel = translateWithSettings(t, label);
  return (
    <div className="flex items-center gap-3 rounded-full border bg-card/50 px-4 py-1.5 text-sm">
      {translatedLabel}
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  const t = useTranslations();
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border bg-card/50 p-4">
      <div>
        <p className="text-sm font-medium">{translateWithSettings(t, label)}</p>
        <p className="text-xs text-muted-foreground">{translateWithSettings(t, description)}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onCheckedChange
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  const t = useTranslations();
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
      <span>{translateWithSettings(t, label)}</span>
    </label>
  );
}

function IntegrationCard({
  title,
  enabled,
  onToggle,
  children
}: {
  title: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card/40 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      <div className={enabled ? "space-y-4" : "pointer-events-none space-y-4 opacity-60"}>{children}</div>
    </div>
  );
}

function ThemeColorField({
  label,
  value,
  onChange,
  fallback = "#2563EB"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fallback?: string;
}) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const normalized = normalizeHex(value, fallback);
  const textColor = getReadableTextColor(normalized);

  const handleBlockClick = () => inputRef.current?.click();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleBlockClick();
    }
  };

  return (
    <div>
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      <div
        className="mt-2 cursor-pointer rounded-2xl border p-4 text-sm font-semibold shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
        style={{ backgroundColor: normalized, color: textColor }}
        role="button"
        tabIndex={0}
        onClick={handleBlockClick}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between">
          <span>{label}</span>
          <span className="text-xs uppercase opacity-80">{normalized.toUpperCase()}</span>
        </div>
        <p className="text-xs font-normal opacity-80">{translateWithSettings(t, "Нажмите, чтобы выбрать цвет")}</p>
      </div>
      <input
        type="color"
        ref={inputRef}
        value={normalized}
        onChange={(event) => onChange(event.target.value)}
        className="sr-only"
        aria-label={`${t("Выбрать цвет", "Choose color")} ${label}`}
      />
      <Input
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 font-mono text-xs uppercase"
        placeholder="#2563EB"
      />
    </div>
  );
}

function normalizeHex(value: string | undefined, fallback: string) {
  if (typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())) {
    return value.trim();
  }
  return fallback;
}

function getReadableTextColor(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return "#FFFFFF";
  }
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#F8FAFC";
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  if (!/^([0-9a-f]{6}|[0-9a-f]{3})$/i.test(normalized)) {
    return null;
  }
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const num = parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function envTextToObject(text: string): Record<string, string> {
  const env: Record<string, string> = {};
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [key, ...rest] = line.split("=");
      if (!key) return;
      env[key.trim()] = rest.join("=").trim();
    });
  return env;
}

function envObjectToText(env: any): string {
  if (!env || typeof env !== "object") return "";
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value ?? ""}`)
    .join("\n");
}

function argsToString(args: unknown): string {
  if (Array.isArray(args)) {
    return args.filter((item) => typeof item === "string").join(" ");
  }
  if (typeof args === "string") return args;
  return "";
}

function numOrEmpty(value: any): number | "" {
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

function buildPayload(form: FormState) {
  const supervisor = form.supervisor;
  const argsArray = supervisor.command.args.trim()
    ? supervisor.command.args.trim().split(/\s+/)
    : [];
  const envObject = envTextToObject(supervisor.command.envText);
  return {
    notifications: {
      enabled: form.notificationsEnabled,
      telegram: {
        enabled: form.telegram.enabled,
        bot_token: form.telegram.botToken,
        chat_id: form.telegram.chatId,
        parse_mode: form.telegram.parseMode,
        notify_on: form.telegram.notifyOn,
        message_template: form.telegram.messageTemplate,
        extra_instructions: form.telegram.extraInstructions
      },
      discord: {
        enabled: form.discord.enabled,
        webhook_url: form.discord.webhookUrl,
        username: form.discord.username,
        avatar_url: form.discord.avatarUrl,
        notify_on: form.discord.notifyOn,
        message_template: form.discord.messageTemplate
      },
      common: {
        retry_attempts: form.common.retryAttempts,
        timeout_sec: form.common.timeoutSec,
        mute_when_recovering: form.common.muteWhenRecovering,
        include_tags: form.common.includeTags,
        tags: form.common.tags
      }
    },
    polling: {
      interval_sec: form.polling.intervalSec,
      offline_attempts: form.polling.offlineAttempts,
      request_timeout_sec: form.polling.requestTimeoutSec
    },
    alerts: {
      tls_expiry_days: form.alerts.tlsExpiryDays,
      notify_sensitive_exposure: form.alerts.notifySensitiveExposure,
      notify_api_failures: form.alerts.notifyApiFailures,
      notify_server_load: form.alerts.notifyServerLoad
    },
    dashboard: {
      docker_stream: {
        enabled: form.streams.docker.enabled,
        interval_sec: form.streams.docker.intervalSec,
        use_cli: form.streams.docker.useCli,
        default_node: form.streams.docker.defaultNode || null
      },
      databases_stream: {
        enabled: form.streams.databases.enabled,
        interval_sec: form.streams.databases.intervalSec,
        alerts_enabled: form.streams.databases.alertsEnabled,
        backups_enabled: form.streams.databases.backupsEnabled,
        backup_autosave_enabled: form.streams.databases.autoBackupEnabled,
        backup_directory: form.streams.databases.backupDirectory,
        backup_retention: form.streams.databases.backupRetention,
        backup_timeout_sec: form.streams.databases.backupTimeoutSec,
        thresholds: {
          replication_lag_ms: form.streams.databases.replicationLagWarnMs,
          storage_percent: form.streams.databases.storageWarnPercent
        }
      },
      site_history: {
        files_per_site: form.dashboard.siteHistoryFiles
      },
      themes: form.dashboard.themes.map((theme) => ({
        id: theme.id,
        name: theme.name,
        mode: theme.mode,
        primary: theme.primary,
        accent: theme.accent,
        background: theme.background,
        description: theme.description
      })),
      active_theme_id: form.dashboard.activeThemeId
    },
    supervisor: {
      enabled: supervisor.enabled,
      log_directory: supervisor.logDirectory,
      healthcheck: {
        enabled: supervisor.healthcheck.enabled,
        host: supervisor.healthcheck.host,
        port: supervisor.healthcheck.port
      },
      watchdog: {
        enabled: supervisor.watchdog.enabled,
        check_interval_sec: supervisor.watchdog.checkIntervalSec,
        stale_threshold_sec: supervisor.watchdog.staleThresholdSec
      },
      command: {
        name: supervisor.command.name,
        executable: supervisor.command.executable,
        args: argsArray,
        working_dir: supervisor.command.workingDir || null,
        env: envObject,
        user: supervisor.command.user || null,
        group: supervisor.command.group || null,
        resource_limits: {
          memory_mb: supervisor.resourceLimits.memoryMb === "" ? null : supervisor.resourceLimits.memoryMb,
          cpu_seconds: supervisor.resourceLimits.cpuSeconds === "" ? null : supervisor.resourceLimits.cpuSeconds
        },
        resource_monitoring: {
          enabled: supervisor.resources.enabled,
          sample_interval_sec: supervisor.resources.sampleIntervalSec,
          max_memory_mb: supervisor.resources.maxMemoryMb === "" ? null : supervisor.resources.maxMemoryMb,
          max_cpu_percent: supervisor.resources.maxCpuPercent === "" ? null : supervisor.resources.maxCpuPercent,
          memory_leak_restart_mb:
            supervisor.resources.memoryLeakRestartMb === "" ? null : supervisor.resources.memoryLeakRestartMb,
          network_check_host: supervisor.resources.networkCheckHost,
          network_check_timeout_sec: supervisor.resources.networkCheckTimeoutSec
        }
      },
      restart_policy: {
        mode: supervisor.restartPolicy.mode,
        restart_delay_seconds: supervisor.restartPolicy.restartDelaySeconds,
        restart_on_exit_0: supervisor.restartPolicy.restartOnExit0,
        max_restarts_per_minute: supervisor.restartPolicy.maxRestartsPerMinute,
        hang_timeout_seconds: supervisor.restartPolicy.hangTimeoutSeconds,
        hang_cpu_percent_threshold: supervisor.restartPolicy.hangCpuPercentThreshold,
        restart_on_hang: supervisor.restartPolicy.restartOnHang
      }
    }
  };
}

function mapConfigToForm(data?: SettingsResponse | null): FormState {
  const notifications = data?.notifications ?? {};
  const telegram = notifications.telegram ?? {};
  const discord = notifications.discord ?? {};
  const common = notifications.common ?? {};
  const polling = data?.polling ?? {};
  const alerts = data?.alerts ?? {};
  const dashboard = data?.dashboard ?? {};
  const dockerStream = dashboard?.docker_stream ?? {};
  const databasesStream = dashboard?.databases_stream ?? {};
  const dbThresholds = databasesStream?.thresholds ?? {};
  const siteHistory = dashboard?.site_history ?? {};
  const supervisorCfg = data?.supervisor ?? {};
  const supervisorCommand = supervisorCfg?.command ?? {};
  const restartPolicy = supervisorCfg?.restart_policy ?? {};
  const resourceMonitoring =
    supervisorCommand?.resource_monitoring ?? supervisorCommand?.resources ?? {};
  const resourceLimits = supervisorCommand?.resource_limits ?? {};
  const supHealth = supervisorCfg?.healthcheck ?? {};
  const supWatchdog = supervisorCfg?.watchdog ?? {};
  const supArgs = argsToString(supervisorCommand?.args);
  const supEnvText = envObjectToText(supervisorCommand?.env);
  const configThemes = Array.isArray(dashboard?.themes)
    ? (dashboard.themes as any[]).map((theme, index) => ({
        id: theme?.id ?? generateThemeId(),
        name: theme?.name ?? `Тема ${index + 1}`,
        mode: (theme?.mode as ThemeMode) ?? "system",
        primary: theme?.primary ?? THEME_SEEDS[0].primary,
        accent: theme?.accent ?? THEME_SEEDS[0].accent,
        background: theme?.background ?? THEME_SEEDS[0].background,
        description: theme?.description ?? ""
      }))
    : DEFAULT_FORM.dashboard.themes;
  const activeThemeId =
    typeof dashboard?.active_theme_id === "string"
      ? dashboard.active_theme_id
      : configThemes[0]?.id ?? DEFAULT_FORM.dashboard.activeThemeId;

  return {
    notificationsEnabled: notifications.enabled ?? DEFAULT_FORM.notificationsEnabled,
    telegram: {
      enabled: telegram.enabled ?? DEFAULT_FORM.telegram.enabled,
      botToken: telegram.bot_token ?? DEFAULT_FORM.telegram.botToken,
      chatId: telegram.chat_id ?? DEFAULT_FORM.telegram.chatId,
      parseMode: telegram.parse_mode ?? DEFAULT_FORM.telegram.parseMode,
      notifyOn: Array.isArray(telegram.notify_on) && telegram.notify_on.length
        ? (telegram.notify_on as NotifyEvent[])
        : DEFAULT_FORM.telegram.notifyOn,
      messageTemplate: telegram.message_template ?? DEFAULT_FORM.telegram.messageTemplate,
      extraInstructions: telegram.extra_instructions ?? DEFAULT_FORM.telegram.extraInstructions
    },
    discord: {
      enabled: discord.enabled ?? DEFAULT_FORM.discord.enabled,
      webhookUrl: discord.webhook_url ?? DEFAULT_FORM.discord.webhookUrl,
      username: discord.username ?? DEFAULT_FORM.discord.username,
      avatarUrl: discord.avatar_url ?? DEFAULT_FORM.discord.avatarUrl,
      notifyOn: Array.isArray(discord.notify_on) && discord.notify_on.length
        ? (discord.notify_on as NotifyEvent[])
        : DEFAULT_FORM.discord.notifyOn,
      messageTemplate: discord.message_template ?? DEFAULT_FORM.discord.messageTemplate
    },
    common: {
      retryAttempts: common.retry_attempts ?? DEFAULT_FORM.common.retryAttempts,
      timeoutSec: common.timeout_sec ?? DEFAULT_FORM.common.timeoutSec,
      muteWhenRecovering: common.mute_when_recovering ?? DEFAULT_FORM.common.muteWhenRecovering,
      includeTags: common.include_tags ?? DEFAULT_FORM.common.includeTags,
      tags: Array.isArray(common.tags) ? common.tags : DEFAULT_FORM.common.tags
    },
    polling: {
      intervalSec: polling.interval_sec ?? DEFAULT_FORM.polling.intervalSec,
      offlineAttempts: polling.offline_attempts ?? DEFAULT_FORM.polling.offlineAttempts,
      requestTimeoutSec: polling.request_timeout_sec ?? DEFAULT_FORM.polling.requestTimeoutSec
    },
    alerts: {
      tlsExpiryDays: alerts.tls_expiry_days ?? DEFAULT_FORM.alerts.tlsExpiryDays,
      notifySensitiveExposure: alerts.notify_sensitive_exposure ?? DEFAULT_FORM.alerts.notifySensitiveExposure,
      notifyApiFailures: alerts.notify_api_failures ?? DEFAULT_FORM.alerts.notifyApiFailures,
      notifyServerLoad: alerts.notify_server_load ?? DEFAULT_FORM.alerts.notifyServerLoad
    },
    dashboard: {
      siteHistoryFiles: siteHistory.files_per_site ?? DEFAULT_FORM.dashboard.siteHistoryFiles,
      themes: configThemes,
      activeThemeId
    },
    streams: {
      docker: {
        enabled: dockerStream.enabled ?? DEFAULT_FORM.streams.docker.enabled,
        intervalSec: dockerStream.interval_sec ?? DEFAULT_FORM.streams.docker.intervalSec,
        useCli: dockerStream.use_cli ?? DEFAULT_FORM.streams.docker.useCli,
        defaultNode: dockerStream.default_node ?? DEFAULT_FORM.streams.docker.defaultNode
      },
      databases: {
        enabled: databasesStream.enabled ?? DEFAULT_FORM.streams.databases.enabled,
        intervalSec: databasesStream.interval_sec ?? DEFAULT_FORM.streams.databases.intervalSec,
        alertsEnabled: databasesStream.alerts_enabled ?? DEFAULT_FORM.streams.databases.alertsEnabled,
        backupsEnabled: databasesStream.backups_enabled ?? DEFAULT_FORM.streams.databases.backupsEnabled,
        autoBackupEnabled:
          databasesStream.backup_autosave_enabled ?? DEFAULT_FORM.streams.databases.autoBackupEnabled,
        backupDirectory:
          databasesStream.backup_directory ?? DEFAULT_FORM.streams.databases.backupDirectory,
        backupRetention:
          databasesStream.backup_retention ?? DEFAULT_FORM.streams.databases.backupRetention,
        backupTimeoutSec:
          databasesStream.backup_timeout_sec ?? DEFAULT_FORM.streams.databases.backupTimeoutSec,
        replicationLagWarnMs:
          dbThresholds.replication_lag_ms ?? DEFAULT_FORM.streams.databases.replicationLagWarnMs,
        storageWarnPercent:
          dbThresholds.storage_percent ?? DEFAULT_FORM.streams.databases.storageWarnPercent
      }
    },
    supervisor: {
      enabled: supervisorCfg.enabled ?? DEFAULT_FORM.supervisor.enabled,
      logDirectory: supervisorCfg.log_directory ?? supervisorCfg.logDirectory ?? DEFAULT_FORM.supervisor.logDirectory,
      healthcheck: {
        enabled: supHealth.enabled ?? DEFAULT_FORM.supervisor.healthcheck.enabled,
        host: supHealth.host ?? DEFAULT_FORM.supervisor.healthcheck.host,
        port: supHealth.port ?? DEFAULT_FORM.supervisor.healthcheck.port
      },
      watchdog: {
        enabled: supWatchdog.enabled ?? DEFAULT_FORM.supervisor.watchdog.enabled,
        checkIntervalSec:
          supWatchdog.check_interval_sec ??
          supWatchdog.checkIntervalSec ??
          DEFAULT_FORM.supervisor.watchdog.checkIntervalSec,
        staleThresholdSec:
          supWatchdog.stale_threshold_sec ??
          supWatchdog.staleThresholdSec ??
          DEFAULT_FORM.supervisor.watchdog.staleThresholdSec
      },
      command: {
        name: supervisorCfg.name ?? DEFAULT_FORM.supervisor.command.name,
        executable: supervisorCommand.executable ?? DEFAULT_FORM.supervisor.command.executable,
        args: supArgs || DEFAULT_FORM.supervisor.command.args,
        workingDir: supervisorCommand.working_dir ?? supervisorCommand.workingDir ?? DEFAULT_FORM.supervisor.command.workingDir,
        envText: supEnvText,
        user: supervisorCommand.user ?? DEFAULT_FORM.supervisor.command.user,
        group: supervisorCommand.group ?? DEFAULT_FORM.supervisor.command.group
      },
      restartPolicy: {
        mode: restartPolicy.mode ?? DEFAULT_FORM.supervisor.restartPolicy.mode,
        restartDelaySeconds:
          restartPolicy.restart_delay_seconds ??
          restartPolicy.restartDelaySeconds ??
          DEFAULT_FORM.supervisor.restartPolicy.restartDelaySeconds,
        restartOnExit0:
          restartPolicy.restart_on_exit_0 ??
          restartPolicy.restartOnExit0 ??
          DEFAULT_FORM.supervisor.restartPolicy.restartOnExit0,
        maxRestartsPerMinute:
          restartPolicy.max_restarts_per_minute ??
          restartPolicy.maxRestartsPerMinute ??
          DEFAULT_FORM.supervisor.restartPolicy.maxRestartsPerMinute,
        hangTimeoutSeconds:
          restartPolicy.hang_timeout_seconds ??
          restartPolicy.hangTimeoutSeconds ??
          DEFAULT_FORM.supervisor.restartPolicy.hangTimeoutSeconds,
        hangCpuPercentThreshold:
          restartPolicy.hang_cpu_percent_threshold ??
          restartPolicy.hangCpuPercentThreshold ??
          DEFAULT_FORM.supervisor.restartPolicy.hangCpuPercentThreshold,
        restartOnHang:
          restartPolicy.restart_on_hang ??
          restartPolicy.restartOnHang ??
          DEFAULT_FORM.supervisor.restartPolicy.restartOnHang
      },
      resources: {
        enabled: resourceMonitoring.enabled ?? DEFAULT_FORM.supervisor.resources.enabled,
        sampleIntervalSec:
          resourceMonitoring.sample_interval_sec ??
          resourceMonitoring.sampleIntervalSec ??
          DEFAULT_FORM.supervisor.resources.sampleIntervalSec,
        maxMemoryMb: (() => {
          const val = numOrEmpty(resourceMonitoring.max_memory_mb ?? resourceMonitoring.maxMemoryMb);
          return val === "" ? DEFAULT_FORM.supervisor.resources.maxMemoryMb : val;
        })(),
        maxCpuPercent: (() => {
          const val = numOrEmpty(resourceMonitoring.max_cpu_percent ?? resourceMonitoring.maxCpuPercent);
          return val === "" ? DEFAULT_FORM.supervisor.resources.maxCpuPercent : val;
        })(),
        memoryLeakRestartMb: (() => {
          const val = numOrEmpty(
            resourceMonitoring.memory_leak_restart_mb ?? resourceMonitoring.memoryLeakRestartMb
          );
          return val === "" ? DEFAULT_FORM.supervisor.resources.memoryLeakRestartMb : val;
        })(),
        networkCheckHost:
          resourceMonitoring.network_check_host ??
          resourceMonitoring.networkCheckHost ??
          DEFAULT_FORM.supervisor.resources.networkCheckHost,
        networkCheckTimeoutSec:
          resourceMonitoring.network_check_timeout_sec ??
          resourceMonitoring.networkCheckTimeoutSec ??
          DEFAULT_FORM.supervisor.resources.networkCheckTimeoutSec
      },
      resourceLimits: {
        memoryMb: (() => {
          const val = numOrEmpty(resourceLimits.memory_mb ?? resourceLimits.memoryMb);
          return val === "" ? DEFAULT_FORM.supervisor.resourceLimits.memoryMb : val;
        })(),
        cpuSeconds: (() => {
          const val = numOrEmpty(resourceLimits.cpu_seconds ?? resourceLimits.cpuSeconds);
          return val === "" ? DEFAULT_FORM.supervisor.resourceLimits.cpuSeconds : val;
        })()
      }
    },
    notes: DEFAULT_FORM.notes
  };
}
