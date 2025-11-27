import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import { Boxes, Database, LayoutDashboard, Terminal, AlarmClock } from "lucide-react";

export type TranslatedText = {
  ru: string;
  en: string;
};

export type DashboardNavLink = {
  label: TranslatedText;
  href: Route;
  description: TranslatedText;
  icon: LucideIcon;
};

export const DASHBOARD_NAV_LINKS: DashboardNavLink[] = [
  {
    label: { ru: "Обзор", en: "Overview" },
    href: "/",
    description: { ru: "Главная панель и ключевые виджеты", en: "Main dashboard and key widgets" },
    icon: LayoutDashboard
  },
  {
    label: { ru: "Базы данных", en: "Databases" },
    href: "/databases",
    description: { ru: "Репликация, бэкапы и задержки", en: "Replication, backups, and lag" },
    icon: Database
  },
  {
    label: { ru: "Docker", en: "Docker" },
    href: "/docker",
    description: { ru: "Контейнеры, узлы и последние события", en: "Containers, nodes, and cluster events" },
    icon: Boxes
  },
  {
    label: { ru: "Очереди", en: "Queue Monitoring" },
    href: "/queues",
    description: { ru: "Мониторинг очередей задач и рабочих процессов", en: "Queues, workers, and task pipelines" },
    icon: AlarmClock
  },
  {
    label: { ru: "Supervisor", en: "Supervisor" },
    href: "/supervisor",
    description: { ru: "Запуски внешних процессов и их логи", en: "External processes and their logs" },
    icon: Terminal
  }
];
