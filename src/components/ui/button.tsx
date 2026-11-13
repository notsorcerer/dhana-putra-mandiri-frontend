import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/**
 * Tombol mengikuti prototipe lama (static/app.css):
 * min-height 38px, padding 8/14, radius 7px, teks 13px/600,
 * aksi utama biru #204fce dengan hover #153ca4.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[7px] border border-transparent bg-clip-padding text-[13px] font-semibold leading-[1.4] transition-colors outline-none select-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#4379ed] disabled:pointer-events-none disabled:opacity-65 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[#153ca4]",
        outline:
          "border-border bg-white text-foreground hover:border-[#bac9ed] hover:bg-accent hover:text-accent-foreground",
        secondary:
          "border-border bg-white text-foreground hover:border-[#bac9ed] hover:bg-accent hover:text-accent-foreground",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-[#9b341e] text-white hover:bg-[#7f2a18]",
        link: "bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[38px] px-3.5 py-2",
        xs: "min-h-[32px] gap-1.5 px-2.5 text-[12px]",
        sm: "min-h-[38px] gap-2 px-3.5 py-2 text-[13px]",
        lg: "min-h-[44px] px-4 py-3",
        icon: "size-[38px] p-0",
        "icon-xs": "size-8 p-0",
        "icon-sm": "size-[38px] p-0",
        "icon-lg": "size-10 p-0",
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
