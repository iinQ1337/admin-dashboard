"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { DASHBOARD_NAV_LINKS } from "./nav-links";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-20 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-2 overflow-x-auto">
        {DASHBOARD_NAV_LINKS.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-transparent bg-muted/40 text-muted-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
