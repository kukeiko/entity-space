import { Entity } from "../../../src";
import { Artist } from "./artist";
import { Song } from "./song";
import { AlbumTag } from "./album-tag";

@Entity()
export class Album {
    @Entity.PrimaryKey()
    id: number;

    @Entity.Primitive()
    name: string;

    @Entity.ReferenceKey()
    artistId: number;

    @Entity.Reference({ keyName: "artistId", otherType: () => Artist })
    artist: Artist;

    @Entity.Collection({ backReferenceName: "album", otherType: () => Song })
    songs: Song[];

    @Entity.Collection({ backReferenceName: "album", otherType: () => AlbumTag })
    tags: AlbumTag[];
}
