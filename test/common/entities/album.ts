import { Entity } from "../../../src";
import { Artist } from "./artist";
import { Song } from "./song";
import { AlbumTag } from "./album-tag";
import { AlbumReview } from "./album-review";

@Entity()
export class Album {
    @Entity.PrimaryKey()
    id: number = null;

    @Entity.Primitive({ index: true })
    name: string = null;

    @Entity.ReferenceKey()
    artistId: number = null;

    @Entity.Reference({ key: "artistId", other: () => Artist })
    artist: Artist = null;

    @Entity.Children({ back: "album", other: () => Song })
    songs: Song[] = [];

    @Entity.Children({ back: "album", other: () => AlbumTag })
    tags: AlbumTag[] = [];

    @Entity.Children({ back: "album", other: () => AlbumReview, virtual: true })
    reviews: AlbumReview[] = [];

    constructor(args?: Partial<Album>) {
        Object.assign(this, args || {});
    }
}
