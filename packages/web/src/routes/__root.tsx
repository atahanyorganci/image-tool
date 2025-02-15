import type { FC } from "react";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useLiveQuery } from "dexie-react-hooks";
import { dexie } from "../lib/db";

const ImageList: FC = () => {
	const images = useLiveQuery(() => dexie.images.orderBy("id").toArray(), []);

	if (!images) {
		return null;
	}

	return (
		<div className="flex flex-col flex-wrap gap-2 p-2 overflow-y-scroll absolute top-0 left-0">
			{images.map(image => (
				<Link key={image.id} to="/image/$imageId" params={{ imageId: image.id.toString() }}>
					<img src={image.dataUrl} alt={image.filename} className="w-32 h-auto rounded-md" />
				</Link>
			))}
		</div>
	);
};

export const Route = createRootRoute({
	component: () => (
		<>
			<div className="min-h-screen flex flex-col w-full">
				<ImageList />
				<Outlet />
			</div>
			<TanStackRouterDevtools />
		</>
	),
});
