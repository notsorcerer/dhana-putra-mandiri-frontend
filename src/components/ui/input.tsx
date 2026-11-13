import * as React from "react"
import { cn } from "cn"

/** Input mengikuti prototipe lama: padding 10/12, border #c6cfdd, radius 7px. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[41px] w-full min-w-0 rounded-[7px] border border-input bg-white px-3 py-2.5 text-sm text-foreground transition-colors outline-none",
        "placeholder:text-muted-foreground file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "focus-visible:border-[#8da9f1] focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-[#4379ed]/40",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        "aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
