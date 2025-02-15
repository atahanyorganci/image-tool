import Dexie, { type EntityTable } from "dexie";

export interface Image {
	id: number;
	filename: string;
	dataUrl: string;
}

const dexie = new Dexie("ImageDatabase") as Dexie & {
	images: EntityTable<Image, "id">;
};

dexie.version(1).stores({
	images: "++id, filename, data",
});

export { dexie };
