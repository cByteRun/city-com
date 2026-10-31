"use client";
import { type Item } from "@/entities/feedback";
import { type Action, type Notify } from "@/shared/api";
import { useState } from "react";
import { Button } from "@/shared/ui";
export function DeleteFeedback({
  item,
  busy,
  action,
  notify,
  onClose,
}: {
  item: Item;
  busy: boolean;
  action: Action;
  notify: Notify;
  onClose: () => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  return (
    <div className="delete-record">
      {deleteConfirm ? (
        <>
          <p>Удалить обращение и его текст из системы?</p>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              const r = await action({ action: "delete", id: item.id });
              if (r) {
                onClose();
                notify("Запись удалена");
              }
            }}
          >
            Подтвердить удаление
          </Button>
          <Button onClick={() => setDeleteConfirm(false)}>Отмена</Button>
        </>
      ) : (
        <button className="danger-link" onClick={() => setDeleteConfirm(true)}>
          Удалить запись по запросу
        </button>
      )}
    </div>
  );
}
