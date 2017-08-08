import { Entity } from "../../../src";
import { Album } from "./album";
import { SongTag } from "./song-tag";

@Entity()
export class Song {
    @Entity.PrimaryKey({ dtoName: "SongId" })
    id: number;

    @Entity.Primitive({ dtoName: "SongName" })
    name: string;

    @Entity.ReferenceKey()
    albumId: number;

    @Entity.Reference({ key: "albumId", other: () => Album, dtoName: "DerAlbumSpieltSchweissfrei" })
    album: Album;

    @Entity.Children({ back: "song", other: () => SongTag, dtoName: "SongTags" })
    tags: SongTag[];

    constructor(args?: Partial<Song>) {
        Object.assign(this, args || {});
    }
}
