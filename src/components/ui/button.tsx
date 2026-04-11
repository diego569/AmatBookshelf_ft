import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                primary: "bg-forest text-white shadow-lg shadow-forest/20 hover:bg-[#15322b]",
                secondary: "bg-white text-forest border border-forest/10 hover:border-forest/30 shadow-sm",
                outline: "bg-transparent text-forest border border-forest/20 hover:bg-forest/5",
                ghost: "bg-transparent text-forest hover:bg-forest/5",
                danger: "bg-white text-red border border-red/20 hover:border-red/40",
                black: "bg-white text-black",
            },
            size: {
                default: "h-14 px-5 py-4",
                sm: "h-10 px-4",
                lg: "h-16 px-8 text-lg",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
