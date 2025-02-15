import type { FC } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useDropzone } from "react-dropzone";
import { Button } from "../components/button";
import { dexie } from "../lib/db";

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
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		multiple: false,
		onDrop: async ([files]) => {
			const dataUrl = await fileToDataUrl(files);
			await dexie.images.add({
				filename: files.name,
				dataUrl,
			});
		},
	});

	return (
		<div
			{...getRootProps()}
			className="max-w-5xl cursor-pointer w-full mx-auto flex-1 m-24 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-white"
		>
			<input {...getInputProps()} accept="image/*" />
			{isDragActive && <p>Drop here</p>}
			{!isDragActive && (
				<div className="flex flex-col gap-6 items-center">
					<h1 className="text-2xl font-medium">Choose an image or Drag 'n' Drop.</h1>
					<Button size="lg" className="max-w-fit">Choose a File</Button>
				</div>
			)}
		</div>
	);
};

export const Route = createFileRoute("/")({
	component: Dropzone,
});
