import type { ComponentProps, FC } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { IconX } from "@tabler/icons-react";
import { cn } from "~/lib/utils";

export const Dialog = DialogPrimitive.Root;

export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogPortal = DialogPrimitive.Portal;

export const DialogClose = DialogPrimitive.Close;

const DialogOverlay: FC<ComponentProps<typeof DialogPrimitive.Overlay>> = ({ className, ...props }) => (
	<DialogPrimitive.Overlay
		className={cn(
			"fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
			className,
		)}
		{...props}
	/>
);

export const DialogContent: FC<ComponentProps<typeof DialogPrimitive.Content>> = ({ className, children, ...props }) => (
	<DialogPortal>
		<DialogOverlay />
		<DialogPrimitive.Content
			className={cn(
				"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
				className,
			)}
			{...props}
		>
			{children}
			<DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm text-card-foreground opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-card-foreground">
				<IconX className="h-4 w-4" />
				<span className="sr-only">Close</span>
			</DialogPrimitive.Close>
		</DialogPrimitive.Content>
	</DialogPortal>
);

export const DialogHeader: FC<ComponentProps<"div">> = ({ className, ...props }) => (
	<div
		className={cn(
			"flex flex-col space-y-1.5 text-card-foreground text-center sm:text-left",
			className,
		)}
		{...props}
	/>
);

export const DialogFooter: FC<ComponentProps<"div">> = ({ className, ...props }) => (
	<div
		className={cn(
			"flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
			className,
		)}
		{...props}
	/>
);

export const DialogTitle: FC<ComponentProps<typeof DialogPrimitive.Title>> = ({ className, ...props }) => (
	<DialogPrimitive.Title
		className={cn(
			"text-lg font-semibold leading-none tracking-tight",
			className,
		)}
		{...props}
	/>
);

export const DialogDescription: FC<ComponentProps<typeof DialogPrimitive.Description>> = ({ className, ...props }) => (
	<DialogPrimitive.Description
		className={cn("text-sm text-card-foreground", className)}
		{...props}
	/>
);
