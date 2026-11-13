"use client"

import * as React from "react"
import { cn } from "cn"
import { Label as LabelPrimitive } from "radix-ui"

/** Label form prototipe lama: 13px, tebal 600, jarak 6px ke kontrol. */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-[13px] font-semibold leading-none select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
