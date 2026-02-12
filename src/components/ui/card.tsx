import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "bg-white rounded-3xl border border-forest/5 shadow-soft",
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

export { Card }
