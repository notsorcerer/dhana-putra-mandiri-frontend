import * as React from "react"
import { cn } from "cn"

/** Textarea mengikuti prototipe lama (static/app.css): min-height 80px, padding 10/12, border #c6cfdd, radius 7px, background white. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[80px] w-full rounded-[7px] border border-[#c6cfdd] bg-white px-3 py-2.5 text-[14px] text-foreground resize-y transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-[#8da9f1] focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-[#4379ed]/40 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
