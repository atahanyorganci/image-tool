import type { FC } from "react";
import React from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./button";

const Dropzone: FC = () => {
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		multiple: false,
		onDrop: (files) => {
			console.log(files);
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

const App: FC = () => (
	<div className="bg-background text-foreground min-h-screen flex flex-col w-full">
		<Dropzone />
	</div>
);

export default App;
