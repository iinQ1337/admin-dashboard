"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { MobileNav } from "./mobile-nav";
import { DashboardSidebar } from "./sidebar";

type DashboardShellProps = {
  children: ReactNode;
};

const SIDEBAR_STATE_KEY = "dashboard_sidebar_collapsed";

function getInitialSidebarState() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(SIDEBAR_STATE_KEY) === "1";
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState<boolean>(getInitialSidebarState);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-b from-background via-background to-muted/10">
      <DashboardSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className="flex flex-1 flex-col">
        <MobileNav />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
