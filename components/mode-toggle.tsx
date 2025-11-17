"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const ICON_VARIANTS = {
  initial: { rotate: -15, opacity: 0, scale: 0.95 },
  animate: { rotate: 0, opacity: 1, scale: 1 },
  exit: { rotate: 15, opacity: 0, scale: 0.95 },
  transition: { duration: 0.2 }
};

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const currentTheme = theme ?? "system";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-border/80">
          <AnimatePresence mode="wait" initial={false}>
            {theme === "dark" ? (
              <motion.span key="moon" {...ICON_VARIANTS}>
                <Moon className="h-4 w-4" />
              </motion.span>
            ) : (
              <motion.span key="sun" {...ICON_VARIANTS}>
                <Sun className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
          <span className="sr-only">Переключить тему</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Тема</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={currentTheme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">Светлая</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Тёмная</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">Системная</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
