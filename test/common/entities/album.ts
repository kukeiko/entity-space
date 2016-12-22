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

    @Entity.Reference({ key: "artistId", other: () => Artist })
    artist: Artist;

    @Entity.Collection({ back: "album", other: () => Song })
    songs: Song[];

    @Entity.Collection({ back: "album", other: () => AlbumTag })
    tags: AlbumTag[];
}
