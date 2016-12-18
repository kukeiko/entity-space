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
        keyName: "tagId",
        name: "tag",
        otherType: () => Tag
    }, {
        keyName: "songId",
        name: "song",
        otherType: () => Song
    }]
})
export class SongTag {
    id: number;
    songId: number;
    song: Song;
    tagId: number;
    tag: Tag;
}
