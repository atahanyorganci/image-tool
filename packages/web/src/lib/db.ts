import Dexie, { type EntityTable } from "dexie";

export interface Image {
	id: number;
	filename: string;
	dataUrl: string;
}

const db = new Dexie("ImageDatabase") as Dexie & {
	images: EntityTable<Image, "id">;
};

db.version(1).stores({
	images: "++id, filename, data",
});

export { db };
