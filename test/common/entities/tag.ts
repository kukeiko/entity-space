import { Entity } from "../../../src";
import { Album } from "./album";
import { TagType } from "./tag-type";

@Entity({
    name: "Tag",
    primaryKey: { name: "id" },
    primitives: [{
        name: "typeId",
        index: true
    }],
    references: [{
        key: "typeId",
        name: "type",
        other: () => TagType
    }]
})
export class Tag {
    id: number;
    albumId: number;
    album: Album;
    typeId: number;
    type: TagType;
}
