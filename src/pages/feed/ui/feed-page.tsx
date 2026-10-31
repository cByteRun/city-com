"use client";
import type { ComponentProps } from "react";
import { Feed } from "@/widgets/feedback-feed";
export function FeedPage(props: ComponentProps<typeof Feed>) {
  return <Feed {...props} />;
}
