import { Entity } from "../../../src";
import { Album } from "./album";
import { Tag } from "./tag";

@Entity({
    name: "AlbumTag",
    primaryKey: { name: "id" },
    primitives: [{
        name: "albumId",
        index: true
    }, {
        name: "tagId",
        index: true
    }],
    references: [{
        keyName: "albumId",
        name: "album",
        otherType: () => Album
    }, {
        keyName: "tagId",
        name: "tag",
        otherType: () => Tag
    }]
})
export class AlbumTag {
    id: number;
    albumId: number;
    album: Album;
    tagId: number;
    tag: Tag;
}
