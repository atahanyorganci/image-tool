import { createFileRoute, getRouteApi, redirect } from "@tanstack/react-router";
import { dexie } from "../lib/db";

const routeApi = getRouteApi("/image/$imageId");

export const Route = createFileRoute("/image/$imageId")({
	loader: async ({ params: { imageId } }) => {
		const image = await dexie.images.where("id").equals(Number(imageId)).first();
		if (!image) {
			throw redirect({ to: "/" });
		}
		return image;
	},
	component: () => {
		const { dataUrl, filename } = routeApi.useLoaderData();
		return (
			<div className="flex-1 flex items-center justify-center">
				<img src={dataUrl} alt={filename} />
			</div>
		);
	},
});
