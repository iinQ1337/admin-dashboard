import fs from "fs/promises";
import path from "path";
import YAML from "yaml";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const CONFIG_PATH = path.resolve(process.cwd(), "../config.yaml");
const DEFAULT_LIGHT_FOREGROUND = "222.2 47.4% 11.2%";
const DEFAULT_DARK_FOREGROUND = "210 40% 98%";

type DashboardTheme = {
  id: string;
  name: string;
  mode: "light" | "dark" | "system";
  primary: string;
  accent: string;
  background: string;
  description?: string;
};

export const metadata: Metadata = {
  title: "Service Health Dashboard",
  description: "Живая админ панель для мониторинга Python-сервиса без базы данных"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const activeTheme = await loadActiveDashboardTheme();
  const bodyStyle = activeTheme ? buildThemeStyle(activeTheme) : undefined;
  const providerTheme = activeTheme?.mode ?? "system";

  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={cn("min-h-screen bg-background font-sans antialiased theme-transition", inter.className)}
        data-theme-id={activeTheme?.id ?? undefined}
        data-theme-mode={activeTheme?.mode ?? undefined}
        style={bodyStyle}
      >
        <ThemeProvider attribute="class" defaultTheme={providerTheme} enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

async function loadActiveDashboardTheme(): Promise<DashboardTheme | null> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const config = YAML.parse(raw) ?? {};
    const themes: DashboardTheme[] = Array.isArray(config?.dashboard?.themes)
      ? config.dashboard.themes
      : [];
    if (!themes.length) {
      return null;
    }
    const activeId: string | undefined =
      typeof config.dashboard?.active_theme_id === "string"
        ? config.dashboard.active_theme_id
        : undefined;
    const activeTheme = themes.find((theme) => theme.id === activeId) ?? themes[0];
    return activeTheme;
  } catch {
    return null;
  }
}

function buildThemeStyle(theme: DashboardTheme): CSSProperties {
  const vars: Record<string, string> = {};

  const primary = hexToHsl(theme.primary);
  const accent = hexToHsl(theme.accent);
  const background = hexToHsl(theme.background);
  const primaryForeground = getForegroundHsl(theme.primary);
  const accentForeground = getForegroundHsl(theme.accent);
  const backgroundForeground = getForegroundHsl(theme.background);

  if (primary) {
    vars["--primary"] = primary;
    vars["--ring"] = primary;
    vars["--primary-foreground"] = primaryForeground;
  }
  if (accent) {
    vars["--accent"] = accent;
    vars["--accent-foreground"] = accentForeground;
  }
  if (background) {
    vars["--background"] = background;
    vars["--card"] = background;
    vars["--popover"] = background;
    vars["--secondary"] = background;
    vars["--muted"] = background;
    vars["--border"] = background;
    vars["--input"] = background;
  }
  vars["--foreground"] = backgroundForeground;
  vars["--card-foreground"] = backgroundForeground;
  vars["--popover-foreground"] = backgroundForeground;
  vars["--secondary-foreground"] = backgroundForeground;
  vars["--muted-foreground"] = backgroundForeground;
  vars["--destructive-foreground"] = backgroundForeground;

  return vars as CSSProperties;
}

function hexToHsl(hex: string): string | undefined {
  const rgb = hexToRgb(hex);
  if (!rgb) return undefined;
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

function getForegroundHsl(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return DEFAULT_DARK_FOREGROUND;
  const { l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return l > 60 ? DEFAULT_LIGHT_FOREGROUND : DEFAULT_DARK_FOREGROUND;
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

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h /= 6;
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100
  };
}
