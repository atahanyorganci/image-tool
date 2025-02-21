import { IconHistory, IconTrash } from "@tabler/icons-react";
import { createRootRoute, Link, Outlet, useRouter } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useLiveQuery } from "dexie-react-hooks";
import { type FC, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { db } from "../lib/db";

const ImageList: FC = () => {
	const router = useRouter();
	const images = useLiveQuery(() => db.images.orderBy("id").toArray(), []);
	const handleClearHistory = useCallback(() => {
		db.images.clear();
		router.navigate({ to: "/" });
	}, [router]);

	if (!images) {
		return null;
	}

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button size="icon" className="fixed bottom-4 left-4 z-10">
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
			<ImageList />
			<div className="h-screen w-screen flex flex-col items-center justify-center p-4">
				<Outlet />
			</div>
			{import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
		</>
	),
});
