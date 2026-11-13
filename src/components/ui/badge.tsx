import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/**
 * Badge = `.pill` prototipe lama: radius 4px, teks 11px/650,
 * padding 3/8, latar abu netral.
 */
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-[4px] border border-transparent px-2 py-[3px] text-[11px] font-[650] whitespace-nowrap transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#4379ed] [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-[#eff2f7] text-[#4c5b70] [a]:hover:bg-[#e6ebf3]",
        secondary: "bg-[#eff2f7] text-[#4c5b70] [a]:hover:bg-[#e6ebf3]",
        destructive: "bg-[#fff0e5] text-[#a64720] [a]:hover:bg-[#fbe3d3]",
        outline: "border-border bg-transparent text-foreground",
        ghost: "bg-transparent text-muted-foreground",
        link: "bg-transparent p-0 text-primary underline-offset-4 hover:underline",
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
