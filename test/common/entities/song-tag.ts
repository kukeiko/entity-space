import { Entity } from "../../../src";
import { Song } from "./song";
import { Tag } from "./tag";

@Entity({
    name: "SongTag",
    primaryKey: { name: "id" },
    primitives: [{
        name: "tagId",
        index: true
    }, {
        name: "songId",
        index: true
    }],
    references: [{
        key: "tagId",
        name: "tag",
        other: () => Tag
    }, {
        key: "songId",
        name: "song",
        other: () => Song
    }]
})
export class SongTag {
    id: number;
    songId: number;
    song: Song;
    tagId: number;
    tag: Tag;
}
