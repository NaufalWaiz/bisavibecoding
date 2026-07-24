import * as React from "react"

import { cn } from "@/lib/utils"
import { fieldClasses } from "@/components/ui/input"

/** Textarea memakai token bentuk & fokus yang sama persis dengan Input. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        fieldClasses,
        "flex field-sizing-content min-h-20 px-3.5 py-2.5 text-body leading-relaxed md:text-small",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
