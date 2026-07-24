import * as React from "react"

import { cn } from "@/lib/utils"

/** Input: border lembut token, radius 10px, focus ring aksen terracotta. */
const fieldClasses = [
  "w-full min-w-0 rounded-lg border border-border bg-surface text-foreground",
  "shadow-warm-xs transition-warm outline-none",
  "placeholder:text-muted-foreground/80",
  "hover:border-border-strong",
  "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60",
  "aria-invalid:border-danger aria-invalid:ring-[3px] aria-invalid:ring-danger/20",
].join(" ")

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldClasses,
        "h-10 px-3.5 py-2 text-body md:text-small",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-small file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input, fieldClasses }
