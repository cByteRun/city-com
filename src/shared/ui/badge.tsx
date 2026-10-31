"use client";
import { type ReactNode } from "react";
export function Badge({
  children,
  kind = "neutral",
}: {
  children: ReactNode;
  kind?: string;
}) {
  return (
    <span className={`badge badge-${kind}`}>
      <span />
      {children}
    </span>
  );
}
