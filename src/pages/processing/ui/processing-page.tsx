"use client";
import type { ComponentProps } from "react";
import { Processing } from "@/features/ingest-feedback";
export function ProcessingPage(props: ComponentProps<typeof Processing>) {
  return <Processing {...props} />;
}
