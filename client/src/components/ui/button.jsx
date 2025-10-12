import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[rgb(var(--color-ring))] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] shadow hover:bg-[rgb(var(--color-primary))]/90",
        destructive:
          "bg-[rgb(var(--color-destructive))] text-[rgb(var(--color-destructive-foreground))] shadow-sm hover:bg-[rgb(var(--color-destructive))]/90",
        outline:
          "border border-[rgb(var(--color-input))] bg-transparent shadow-sm hover:bg-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent-foreground))]",
        secondary:
          "bg-[rgb(var(--color-secondary))] text-[rgb(var(--color-secondary-foreground))] shadow-sm hover:bg-[rgb(var(--color-secondary))]/80",
        ghost: "hover:bg-[rgb(var(--color-accent))] hover:text-[rgb(var(--color-accent-foreground))]",
        link: "text-[rgb(var(--color-primary))] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
