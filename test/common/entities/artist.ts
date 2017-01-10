import { Entity } from "../../../src";
import { Album } from "./album";

@Entity({
    name: "Artist",
    primaryKey: { name: "id" },
    primitives: [{ name: "name" }],
    collections: [{
        back: "artist",
        name: "albums",
        other: () => Album
    }]
})
export class Artist {
    id: number = null;

    @Entity.Primitive()
    age: number = null;
    name: string = null;
    albums: Album[] = [];

    constructor(args?: Partial<Artist>) {
        Object.assign(this, args || {});
    }
}
