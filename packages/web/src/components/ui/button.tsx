/* eslint-disable react-refresh/only-export-components */
import type { ComponentProps, FC } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
				destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
				outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
				secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 rounded-md px-3 text-xs",
				lg: "h-10 rounded-md px-8",
				icon: "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	leftIcon?: React.ElementType<{ className?: string }, "svg">;
	rightIcon?: React.ElementType<{ className?: string }, "svg">;
}

const Button: FC<ButtonProps> = ({ className, children, variant, size, asChild = false, leftIcon: LeftIcon, rightIcon: RightIcon, ...props }) => {
	const Comp = asChild ? Slot : "button";
	const left = LeftIcon ? <LeftIcon /> : null;
	const right = RightIcon ? <RightIcon /> : null;

	return (
		<Comp
			type="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		>
			{left}
			{children}
			{right}
		</Comp>
	);
};
Button.displayName = "Button";

export { Button, buttonVariants };
