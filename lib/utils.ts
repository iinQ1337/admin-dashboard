import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, maximumFractionDigits = 1) {
  return Intl.NumberFormat("ru-RU", { maximumFractionDigits }).format(value);
}

export function formatPercent(success: number, total: number) {
  if (!total) return "0%";
  const percent = (success / total) * 100;
  return `${percent.toFixed(1)}%`;
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(1)} ${sizes[i]}`;
}

export function getResponseStatus(status: number) {
  if (status >= 500) return "error";
  if (status >= 400) return "warning";
  return "ok";
}
