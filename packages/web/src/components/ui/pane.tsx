/* eslint-disable react-refresh/only-export-components */
import { IconX } from "@tabler/icons-react";
import { type ComponentProps, createContext, type FC, useContext, useMemo, useState } from "react";
import { cn } from "~/lib/utils";
import { Button, type ButtonProps } from "./button";

export interface PaneContextValue {
	isOpen: boolean;
	close: () => void;
}

const PaneContext = createContext<PaneContextValue | null>(null);

export function usePaneContext(): PaneContextValue {
	const context = useContext(PaneContext);
	if (!context) {
		throw new Error("usePaneContext must be used within a Pane");
	}
	return context;
}

export interface PaneProps extends ComponentProps<"div">, Partial<PaneContextValue> {}

export const Pane: FC<PaneProps> = ({ className, isOpen, close, ...props }) => {
	const [activeState, setActiveState] = useState(false);
	const value = useMemo(() => ({
		isOpen: isOpen ?? activeState,
		close: close ?? (() => setActiveState(false)),
	}), [isOpen, close, activeState]);

	return (
		<PaneContext value={value}>
			<div className={cn("fixed z-50 right-0 h-full flex items-center pointer-events-none", className)} {...props} />
		</PaneContext>
	);
};

export const PaneContent: FC<ComponentProps<"div">> = ({ className, ...props }) => {
	const { isOpen: active } = usePaneContext();

	return (
		<div
			data-state={active ? "open" : "closed"}
			className={cn("relative gap-4 bg-card text-card-foreground p-4 transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out inset-y-0 rounded-l-lg shadow-lg border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right flex-col hidden data-[state=open]:flex pointer-events-auto", className)}
			{...props}
		/>
	);
};

export const PaneClose: FC<Omit<ButtonProps, "onClick">> = ({ className, ...props }) => {
	const { close } = usePaneContext();
	return (
		<Button size="icon" className="absolute top-4 right-4 border-0 shadow-none" onClick={() => close()} {...props}>
			<IconX />
		</Button>
	);
};
