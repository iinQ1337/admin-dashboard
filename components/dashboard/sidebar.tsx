"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslations } from "@/components/language-provider";
import { cn } from "@/lib/utils";

import { DASHBOARD_NAV_LINKS } from "./nav-links";

type DashboardSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const sidebarStyle = { width: collapsed ? "5.5rem" : "18rem" };

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-border/50 bg-card/70 backdrop-blur-xl transition-[width] duration-300 ease-in-out md:flex"
      )}
      style={sidebarStyle}
    >
      <div
        className={cn(
          "flex h-full w-full flex-col gap-6 transition-all duration-300",
          collapsed ? "p-4" : "p-6"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 transition-all duration-300",
            collapsed ? "justify-center" : "justify-between"
          )}
        >

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggle}
              aria-label={
                collapsed
                  ? t("Развернуть боковую панель", "Expand sidebar")
                  : t("Свернуть боковую панель", "Collapse sidebar")
              }
              aria-pressed={!collapsed}
              aria-expanded={!collapsed}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:text-foreground"
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <nav className="space-y-2">
          {DASHBOARD_NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            const label = t(link.label.ru, link.label.en);
            const description = t(link.description.ru, link.description.en);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex items-start gap-3 rounded-2xl border border-transparent py-3 transition-colors",
                  collapsed ? "justify-center px-2" : "px-4",
                  isActive
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "text-muted-foreground hover:border-border/50 hover:bg-muted/20 hover:text-foreground"
                )}
                >
                  <link.icon
                    className={cn(
                      "mt-0.5 h-4 w-4 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                {collapsed ? (
                  <span className="sr-only">{label}</span>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
        
      </div>
    </aside>
  );
}
