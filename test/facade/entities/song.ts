import { EntityClass, Property } from "../../../src";
import { Album } from "./album";
import { SongTag } from "./song-tag";

@EntityClass()
export class Song {
    @Property.Id()
    id: number = null;

    @Property.Primitive()
    name: string = null;

    @Property.Key()
    albumId: number = null;

    @Property.Reference({ key: "albumId", other: () => Album })
    album: Album = null;

    @Property.Children({ back: "song", other: () => SongTag })
    tags: SongTag[] = [];

    constructor(args?: Partial<Song>) {
        Object.assign(this, args || {});
    }
}
