import { Entity } from "../../../src";
import { Album } from "./album";
import { SongTag } from "./song-tag";

@Entity()
export class Song {
    @Entity.PrimaryKey({ alias: "SongId" })
    id: number;

    @Entity.Primitive({ alias: "SongName" })
    name: string;

    @Entity.ReferenceKey()
    albumId: number;

    @Entity.Reference({ key: "albumId", other: () => Album, alias: "DerAlbumSpieltSchweissfrei" })
    album: Album;

    @Entity.Children({ back: "song", other: () => SongTag, alias: "SongTags" })
    tags: SongTag[];

    constructor(args?: Partial<Song>) {
        Object.assign(this, args || {});
    }
}
