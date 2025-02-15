import { IconHistory, IconTrash } from "@tabler/icons-react";
import { createRootRoute, Link, Outlet, useRouter } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useLiveQuery } from "dexie-react-hooks";
import { type FC, useCallback } from "react";
import { Button } from "../components/button";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../components/sheet";
import { dexie } from "../lib/db";

const ImageList: FC = () => {
	const router = useRouter();
	const images = useLiveQuery(() => dexie.images.orderBy("id").toArray(), []);
	const handleClearHistory = useCallback(() => {
		dexie.images.clear();
		router.navigate({ to: "/" });
	}, [router]);

	if (!images) {
		return null;
	}

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button size="icon" className="fixed bottom-4 left-4">
					<IconHistory />
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="w-48 p-2 flex flex-col">
				<SheetHeader className="mb-4">
					<SheetTitle>History</SheetTitle>
				</SheetHeader>
				<div className="flex flex-col gap-4 overflow-y-scroll items-center flex-1">
					{images.map(image => (
						<Link key={image.id} to="/image/$imageId" params={{ imageId: image.id.toString() }}>
							<img src={image.dataUrl} alt={image.filename} className="rounded" />
						</Link>
					))}
				</div>
				<SheetFooter>
					<SheetClose asChild>
						<Button variant="destructive" className="w-full" onClick={handleClearHistory}>
							<IconTrash />
							<span>Clear History</span>
						</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
};

export const Route = createRootRoute({
	component: () => (
		<>
			<div className="min-h-screen flex flex-col w-full">
				<ImageList />
				<Outlet />
			</div>
			{import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
		</>
	),
});
