"use client";
import { t, useLocale } from "@/shared/i18n";

import { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  useLocale();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay" />
        <Dialog.Content className="sheet-content">
          <div className="sheet-heading">
            <Dialog.Title>{t(title)}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label={t("Закрыть")}>
              <X size={19} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {t("Детали и действия по городскому обращению")}
          </Dialog.Description>
          {t(children)}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
