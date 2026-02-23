import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-border/70 bg-card/90 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]", className)} {...props} />;
}
