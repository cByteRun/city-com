"use client";
import { useLocale, getLocale } from "@/shared/i18n";

import { Button } from "@/shared/ui";
import { ArrowDownToLine } from "lucide-react";
export function ExportControls({ query }: { query: Record<string, string> }) {
  useLocale();
  function exportData(format: string) {
    const link = document.createElement("a");
    link.href =
      "/api/export?" +
      new URLSearchParams({ ...query, format, locale: getLocale() });
    link.download = `citycom.${format}`;
    link.click();
  }
  return (
    <div className="export-group">
      <Button onClick={() => exportData("csv")}>
        <ArrowDownToLine size={13} /> CSV
      </Button>
      <Button onClick={() => exportData("xlsx")}>XLSX</Button>
      <Button onClick={() => exportData("pdf")}>PDF</Button>
    </div>
  );
}
