"use client";
import { type Item } from "@/entities/feedback";
import { type User } from "@/entities/session";
import { type Action } from "@/shared/api";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/shared/ui";
export function PrivateFeedbackText({
  item,
  user,
  busy,
  action,
}: {
  item: Item;
  user: User;
  busy: boolean;
  action: Action;
}) {
  const [privateText, setPrivateText] = useState("");
  return (
    <>
      <LockKeyhole size={17} />
      <p>
        {privateText ||
          "Приватное обращение. В общих дашбордах доступна только агрегированная информация."}
      </p>
      {["admin", "analyst"].includes(user.role) && !privateText && (
        <Button
          size="sm"
          disabled={busy}
          onClick={async () => {
            const r = await action({
              action: "private",
              id: item.id,
            });
            if (r) setPrivateText(r.text || "");
          }}
        >
          Открыть обезличенный текст
        </Button>
      )}
    </>
  );
}
