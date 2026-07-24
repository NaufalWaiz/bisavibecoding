import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Tag berbentuk pill. Varian `success` (sage) dan `warning` (amber) memakai
 * pasangan tint + teks gelap dari token supaya kontrasnya lolos AA.
 */
const badgeVariants = cva(
  [
    "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5",
    "overflow-hidden rounded-full border px-2.5 py-0.5",
    "text-tiny font-medium whitespace-nowrap",
    "transition-warm",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "[&>svg]:pointer-events-none [&>svg]:size-3!",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-brand-soft-border bg-brand-soft text-brand-stronger [a]:hover:bg-brand-soft/70",
        solid: "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-border bg-surface-sunken text-muted-foreground [a]:hover:bg-surface-raised",
        success:
          "border-sage-soft-border bg-sage-soft text-sage-text [a]:hover:bg-sage-soft/70",
        warning:
          "border-amber-soft-border bg-amber-soft text-amber-text [a]:hover:bg-amber-soft/70",
        destructive:
          "border-danger-soft-border bg-danger-soft text-danger [a]:hover:bg-danger-soft/70",
        outline:
          "border-border-strong bg-transparent text-foreground [a]:hover:bg-surface-sunken",
        ghost:
          "border-transparent text-muted-foreground hover:bg-surface-sunken",
        link: "border-transparent text-brand-stronger underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
