import { EntityClass } from "../../../src";
import { Song } from "./song";
import { Tag } from "./tag";

@EntityClass({
    name: "SongTag",
    primaryKey: { name: "id" },
    primitives: {
        tagId: {
            index: true
        },
        songId: {
            index: true
        }
    },
    references: {
        tag: {
            key: "tagId",
            other: () => Tag
        },
        song: {
            key: "songId",
            other: () => Song
        }
    }
})
export class SongTag {
    id: number;
    songId: number;
    song: Song;
    tagId: number;
    tag: Tag;

    constructor(args?: Partial<SongTag>) {
        Object.assign(this, args || {});
    }
}
