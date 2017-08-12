import { EntityClass } from "../../../src";
import { Album } from "./album";
import { Tag } from "./tag";

@EntityClass({
    name: "AlbumTag",
    primaryKey: { name: "id" },
    primitives: {
        albumId: { index: true },
        tagId: { index: true }
    },
    references: {
        album: { key: "albumId", other: () => Album },
        tag: { key: "tagId", other: () => Tag }
    }
})
export class AlbumTag {
    id: number;
    albumId: number;
    album: Album;
    tagId: number;
    tag: Tag;
}
