import { EntityClass } from "../../../src";
import { Album } from "./album";
import { TagType } from "./tag-type";

@EntityClass({
    primaryKey: { name: "id" },
    primitives: {
        typeId: {
            index: true
        }
    },
    references: {
        type: {
            key: "typeId",
            other: () => TagType
        }
    }
})
export class Tag {
    id: number;
    albumId: number;
    album: Album;
    typeId: number;
    type: TagType;
}
