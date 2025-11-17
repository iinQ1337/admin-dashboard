import type { LucideIcon } from "lucide-react";
import { Boxes, Database, LayoutDashboard } from "lucide-react";

export type DashboardNavLink = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV_LINKS: DashboardNavLink[] = [
  {
    label: "Обзор",
    href: "/",
    description: "Главная панель и ключевые виджеты",
    icon: LayoutDashboard
  },
  {
    label: "Базы данных",
    href: "/databases",
    description: "Репликация, бэкапы и задержки",
    icon: Database
  },
  {
    label: "Docker",
    href: "/docker",
    description: "Контейнеры, узлы и последние события",
    icon: Boxes
  },
  {
    label: "Queue Monitoring",
    href: "/queues",
    description: "Мониторинг очередей задач и рабочих процессов",
    icon: Boxes
  }
];
