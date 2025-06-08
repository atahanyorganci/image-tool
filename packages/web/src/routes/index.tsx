import type { FC } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useDropzone } from "react-dropzone";
import { Button } from "../components/ui/button";
import { db } from "../lib/db";

function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
			}
			else {
				reject(new Error("Expected a string."));
			}
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

const Dropzone: FC = () => {
	const router = useRouter();
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		multiple: false,
		onDrop: async ([files]) => {
			const dataUrl = await fileToDataUrl(files);
			const id = await db.images.add({ filename: files.name, dataUrl });
			router.navigate({ to: "/image/$imageId", params: { imageId: id.toString() } });
		},
	});

	return (
		<div
			{...getRootProps()}
			className="flex w-full max-w-5xl flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white lg:mx-auto"
		>
			<input {...getInputProps()} accept="image/*" />
			{isDragActive && <p>Drop here</p>}
			{!isDragActive && (
				<div className="flex flex-col items-center gap-6">
					<h1 className="text-center text-xl font-medium md:text-2xl">Choose an image or Drag 'n' Drop.</h1>
					<Button size="lg" className="max-w-fit">Choose a File</Button>
				</div>
			)}
		</div>
	);
};

export const Route = createFileRoute("/")({
	component: Dropzone,
});
