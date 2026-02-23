import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("w-full rounded-xl border bg-background/50 p-3 text-sm outline-none focus:ring-2 focus:ring-primary", className)} {...props} />;
}
