import { EntityClass, Property } from "../../../src";
import { Album } from "./album";
import { SongTag } from "./song-tag";

@EntityClass()
export class Song {
    @Property.Id({ dtoName: "SongId" })
    id: number;

    @Property.Primitive({ dtoName: "SongName" })
    name: string;

    @Property.Key()
    albumId: number;

    @Property.Reference({ key: "albumId", other: () => Album, dtoName: "DerAlbumSpieltSchweissfrei" })
    album: Album;

    @Property.Children({ back: "song", other: () => SongTag, dtoName: "SongTags" })
    tags: SongTag[];

    constructor(args?: Partial<Song>) {
        Object.assign(this, args || {});
    }
}
