"use client";
import { t, useLocale } from "@/shared/i18n";

import { type Action } from "@/shared/api";
import { Button } from "@/shared/ui";
import { Loader2, Activity } from "lucide-react";
export function EvaluateQuality({
  busy,
  canEdit,
  action,
}: {
  busy: boolean;
  canEdit: boolean;
  action: Action;
}) {
  useLocale();
  return (
    <Button
      variant="default"
      disabled={busy || !canEdit}
      onClick={() => action({ action: "evaluate" })}
    >
      {busy ? <Loader2 size={14} className="spin" /> : <Activity size={14} />}{" "}
      {t("Запустить проверку")}
    </Button>
  );
}
