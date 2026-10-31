"use client";
import type { ComponentProps } from "react";
import { ChatView } from "@/features/search-feedback";
export function AssistantPage(props: ComponentProps<typeof ChatView>) {
  return <ChatView {...props} />;
}
