import { Entity } from "../../../src";
import { Album } from "./album";

@Entity({
    name: "Artist",
    primaryKey: { name: "id", dtoName: "ArtistId" },
    primitives: [{ name: "name" }],
    collections: [{
        backReferenceName: "artist",
        name: "albums",
        otherType: () => Album
    }]
})
export class Artist {
    id: number;
    name: string;
    albums: Album[];
}
