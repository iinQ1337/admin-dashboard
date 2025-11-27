"use client";

import { useState } from "react";
import { Settings, Settings2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { useTranslations } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { ConfigEditorDialog } from "./config-editor-dialog";

export function DashboardActions() {
  const t = useTranslations();
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);

  const openEditor = () => setEditorOpen(true);
  const closeEditor = () => setEditorOpen(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings2 className="h-4 w-4" /> {t("Настройки", "Settings")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="gap-2"
              onSelect={(event) => {
                event.preventDefault();
                openEditor();
              }}
            >
              <Pencil className="h-4 w-4" /> {t("Редактировать config.yaml", "Edit config.yaml")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              onSelect={(event) => {
                event.preventDefault();
                router.push("/settings");
              }}
            >
              <Settings className="h-4 w-4" /> {t("Открыть настройки", "Open settings")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ModeToggle />
      </div>
      <ConfigEditorDialog open={editorOpen} onClose={closeEditor} />
    </>
  );
}
