import { Entity } from "../../../src";
import { Album } from "./album";
import { SongTag } from "./song-tag";

@Entity({
    name: "Song",
    primaryKey: { name: "id" },
    primitives: [{
        name: "name"
    }, {
        name: "albumId",
        index: true
    }],
    references: [{
        keyName: "albumId",
        name: "album",
        otherType: () => Album
    }],
    collections: [{
        backReferenceName: "song",
        name: "tags",
        otherType: () => SongTag
    }]
})
export class Song {
    id: number;
    name: string;
    albumId: number;
    album: Album;
    tags: SongTag[];
}
