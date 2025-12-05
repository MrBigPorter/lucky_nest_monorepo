import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { cn } from './lib/utils'

const buttonVariants = cva(
    'rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
    {
        variants: {
            variant: {
                primary:
                    'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 border border-transparent',
                secondary:
                    'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-transparent',
                danger:
                    'bg-red-500 text-white shadow-lg shadow-red-500/30 border border-transparent',
                ghost: 'text-gray-500 dark:text-gray-400 bg-transparent',
                outline:
                    'bg-transparent border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200',
            },
            size: {
                default: "px-6 py-3 text-lg",
                sm: 'px-3 py-1.5 text-sm',
                md: 'px-4 py-2',
                lg: 'px-6 py-3 text-lg',
            },
        },
        defaultVariants: {
            variant: "primary",
            size: 'md',
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean
    isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : motion.button

        const motionProps = !asChild
            ? {
                whileHover: { scale: 1.02, filter: 'brightness(1.1)' },
                whileTap: { scale: 0.95 },
                transition: { type: "spring", stiffness: 400, damping: 17 },
            }
            : {}


        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref as any}
                disabled={isLoading || disabled} // loading 时自动禁用
                {...motionProps}
                {...(props as any)}
            >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {children}
            </Comp>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }