import type { ComponentProps, FC } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { cn } from "~/lib/utils";

export const Select: FC<ComponentProps<typeof SelectPrimitive.Root>> = ({ ...props }) => <SelectPrimitive.Root data-slot="select" {...props} />;

export const SelectGroup: FC<ComponentProps<typeof SelectPrimitive.Group>> = ({ ...props }) => <SelectPrimitive.Group data-slot="select-group" {...props} />;

export const SelectValue: FC<ComponentProps<typeof SelectPrimitive.Value>> = ({ ...props }) => <SelectPrimitive.Value data-slot="select-value" {...props} />;

export const SelectTrigger: FC<ComponentProps<typeof SelectPrimitive.Trigger>> = ({
	className,
	children,
	...props
}) => (
	<SelectPrimitive.Trigger
		data-slot="select-trigger"
		className={cn(
			"border-input data-[placeholder]:text-muted-foreground aria-invalid:border-destructive ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-1 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:focus-visible:ring-0 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>span]:line-clamp-1",
			className,
		)}
		{...props}
	>
		{children}
		<SelectPrimitive.Icon asChild>
			<IconChevronDown className="size-4 opacity-50" />
		</SelectPrimitive.Icon>
	</SelectPrimitive.Trigger>
);

export const SelectScrollUpButton: FC<ComponentProps<typeof SelectPrimitive.ScrollUpButton>> = ({
	className,
	...props
}) => (
	<SelectPrimitive.ScrollUpButton
		data-slot="select-scroll-up-button"
		className={cn(
			"flex cursor-default items-center justify-center py-1",
			className,
		)}
		{...props}
	>
		<IconChevronUp className="size-4" />
	</SelectPrimitive.ScrollUpButton>
);

export const SelectScrollDownButton: FC<ComponentProps<typeof SelectPrimitive.ScrollDownButton>> = ({
	className,
	...props
}) => (
	<SelectPrimitive.ScrollDownButton
		data-slot="select-scroll-down-button"
		className={cn(
			"flex cursor-default items-center justify-center py-1",
			className,
		)}
		{...props}
	>
		<IconChevronDown className="size-4" />
	</SelectPrimitive.ScrollDownButton>
);

export const SelectContent: FC<ComponentProps<typeof SelectPrimitive.Content>> = ({
	className,
	children,
	position = "popper",
	...props
}) => (
	<SelectPrimitive.Portal>
		<SelectPrimitive.Content
			data-slot="select-content"
			className={cn(
				"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md",
				position === "popper"
				&& "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
				className,
			)}
			position={position}
			{...props}
		>
			<SelectScrollUpButton />
			<SelectPrimitive.Viewport
				className={cn(
					"p-1",
					position === "popper"
					&& "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
				)}
			>
				{children}
			</SelectPrimitive.Viewport>
			<SelectScrollDownButton />
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
);

export const SelectLabel: FC<ComponentProps<typeof SelectPrimitive.Label>> = ({
	className,
	...props
}) => (
	<SelectPrimitive.Label
		data-slot="select-label"
		className={cn("px-2 py-1.5 text-sm font-semibold", className)}
		{...props}
	/>
);

export const SelectItem: FC<ComponentProps<typeof SelectPrimitive.Item>> = ({
	className,
	children,
	...props
}) => (
	<SelectPrimitive.Item
		data-slot="select-item"
		className={cn(
			"focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
			className,
		)}
		{...props}
	>
		<span className="absolute right-2 flex size-3.5 items-center justify-center">
			<SelectPrimitive.ItemIndicator>
				<IconCheck className="size-4" />
			</SelectPrimitive.ItemIndicator>
		</span>
		<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
	</SelectPrimitive.Item>
);

export const SelectSeparator: FC<ComponentProps<typeof SelectPrimitive.Separator>> = ({
	className,
	...props
}) => (
	<SelectPrimitive.Separator
		data-slot="select-separator"
		className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
		{...props}
	/>
);
