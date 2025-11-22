"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { MobileNav } from "./mobile-nav";
import { DashboardSidebar } from "./sidebar";

type DashboardShellProps = {
  children: ReactNode;
};

const SIDEBAR_STATE_KEY = "dashboard_sidebar_collapsed";

export function DashboardShell({ children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState<boolean | null>(null);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(SIDEBAR_STATE_KEY);
    setCollapsed(storedValue === "1");
  }, []);

  useEffect(() => {
    if (collapsed === null) return;
    window.localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const resolvedCollapsed = collapsed ?? false;
  const handleToggle = () => {
    setCollapsed((value) => !(value ?? false));
  };

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-b from-background via-background to-muted/10">
      <DashboardSidebar collapsed={resolvedCollapsed} onToggle={handleToggle} />
      <div className="flex flex-1 flex-col">
        <MobileNav />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
