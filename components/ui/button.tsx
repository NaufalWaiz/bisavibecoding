import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Tombol. Semua warna/radius/bayangan diambil dari token di `globals.css`.
 * Primer = terracotta solid; sekunder = outline hangat.
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-lg border border-transparent bg-clip-padding",
    "font-medium whitespace-nowrap select-none",
    "transition-warm outline-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-55",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        // `after`: kilau tipis yang menyapu saat hover — mikro-interaksi, bukan pesta.
        default:
          "relative overflow-hidden bg-primary text-primary-foreground shadow-warm-brand hover:bg-brand-stronger hover:-translate-y-px active:translate-y-0 after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:transition-transform after:duration-700 hover:after:translate-x-full",
        outline:
          "border-border-strong bg-surface text-foreground shadow-warm-xs hover:border-brand hover:bg-brand-soft hover:text-brand-stronger aria-expanded:border-brand aria-expanded:bg-brand-soft",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-surface-raised aria-expanded:bg-surface-raised",
        ghost:
          "text-muted-foreground hover:bg-brand-soft hover:text-brand-stronger aria-expanded:bg-brand-soft aria-expanded:text-brand-stronger",
        destructive:
          "border-danger-soft-border bg-danger-soft text-danger hover:bg-danger hover:text-destructive-foreground",
        link: "text-brand-stronger underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 text-small",
        xs: "h-7 rounded-md px-2.5 text-tiny",
        sm: "h-9 px-3.5 text-small",
        lg: "h-12 px-6 text-body",
        icon: "size-10",
        "icon-xs": "size-7 rounded-md",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
