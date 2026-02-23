import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-10 w-full rounded-xl border bg-background/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary", className)} {...props} />;
}
