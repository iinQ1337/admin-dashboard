"use client";

import { useEffect, useRef, useState } from "react";
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
  notes: ""
};

type SettingsResponse = {
  notifications?: any;
  polling?: any;
  alerts?: any;
  dashboard?: any;
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

export function SettingsForm() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "success" | "error">("loading");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      setStatus("loading");
      setStatusMessage("Загружаем config.yaml…");
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
        setStatusMessage("Не удалось загрузить config.yaml");
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
    setStatusMessage("Сохраняем настройки…");
    try {
      const payload = buildPayload(form);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(await response.text());
      setStatus("success");
      setStatusMessage("Настройки сохранены в config.yaml");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setStatusMessage("Ошибка при сохранении config.yaml");
    }
  }

  const disabled = status === "loading" || status === "saving";

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Tabs defaultValue="core" className="space-y-6">
        <TabsList className="grid w-full gap-2 rounded-xl bg-muted/40 p-1 sm:grid-cols-2">
          <TabsTrigger value="core" className="rounded-lg">
            Основные параметры
          </TabsTrigger>
          <TabsTrigger value="ui" className="rounded-lg">
            UI · только сайт
          </TabsTrigger>
        </TabsList>
        <TabsContent value="core" className="settings-tab-content">
          <fieldset disabled={disabled} className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" /> Потоки данных
                  </CardTitle>
                  <CardDescription>Интервалы и параметры для /docker и /databases</CardDescription>
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
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" /> Интеграции
              </CardTitle>
              <CardDescription>Telegram / Discord без прямого редактирования config.yaml</CardDescription>
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
                  <Label>События</Label>
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
                  <Label htmlFor="tgTemplate">Шаблон сообщения</Label>
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
                  <Label>События</Label>
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
                <Label htmlFor="discordTemplate">Шаблон сообщения</Label>
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
              <Clock className="h-5 w-5 text-primary" /> Опрос и тайминги
            </CardTitle>
            <CardDescription>Соответствует секции `polling` из config.yaml</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" /> Общие уведомления
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
              <Label>Теги</Label>
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
                {!form.common.tags.length && <p className="text-xs text-muted-foreground">Теги пока не добавлены.</p>}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="prod-eu-west"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                />
                <Button type="button" variant="secondary" onClick={handleAddTag}>
                  Добавить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5 text-primary" /> Триггеры уведомлений
            </CardTitle>
            <CardDescription>Секция `alerts` в config.yaml</CardDescription>
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
        <TabsContent value="ui" className="settings-tab-content">
          <fieldset disabled={disabled} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" /> Настройки графиков
                </CardTitle>
                <CardDescription>
                  Эти параметры влияют только на витрину /admin-dashboard и не задействуются самим мониторингом.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Используется для подбора последних JSON файлов для каждого сайта при построении диаграмм. Можно смело
                  экспериментировать — Python сервис продолжит работать по прежнему.
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
            Значения синхронизируются с секциями `notifications`, `polling`, `alerts` в config.yaml.
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
          {status === "saving" ? "Сохраняем…" : "Сохранить параметры"}
        </Button>
      </div>
    </form>
  );
}

function Field(props: React.ComponentProps<typeof Input> & { label: string }) {
  const { id, label, className, ...rest } = props;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
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
  return (
    <div className="flex items-center gap-3 rounded-full border bg-card/50 px-4 py-1.5 text-sm">
      {label}
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
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border bg-card/50 p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
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
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
      <span>{label}</span>
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
        <p className="text-xs font-normal opacity-80">Нажмите, чтобы выбрать цвет</p>
      </div>
      <input
        type="color"
        ref={inputRef}
        value={normalized}
        onChange={(event) => onChange(event.target.value)}
        className="sr-only"
        aria-label={`Выбрать цвет ${label}`}
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

function buildPayload(form: FormState) {
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
    notes: DEFAULT_FORM.notes
  };
}
