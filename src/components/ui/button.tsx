import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all active:scale-[0.98] whitespace-nowrap select-none transition-colors disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:border-border [&_svg]:shrink-0 [&_svg]:size-5",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground border border-primary hover:bg-primary/85",
        secondary: "bg-mint-100 text-accent-foreground border border-transparent hover:bg-mint-200",
        outline: "bg-card text-foreground border border-ink/15 hover:border-ink/40",
        ghost: "bg-transparent text-foreground hover:bg-muted border border-transparent",
        destructive: "bg-destructive text-destructive-foreground border border-destructive hover:opacity-95",
        success: "bg-vivid-strong text-primary-foreground border border-vivid-strong hover:bg-vivid",
        whatsapp: "bg-vivid-strong text-primary-foreground border border-vivid-strong hover:bg-vivid",
        link: "text-primary underline underline-offset-4 decoration-2 px-0 min-h-0",
      },
      size: {
        default: "min-h-12 px-5 text-base",
        lg: "min-h-14 px-7 text-lg",
        icon: "size-12 p-0",
        sm: "min-h-12 px-3 text-base",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, block, asChild, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...(!asChild ? { type: type ?? "button" } : {})}
      {...props}
    />
  );
}
