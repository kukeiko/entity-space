import { EntityClass, Property } from "../../../src";
import { Artist } from "./artist";
import { Song } from "./song";
import { AlbumTag } from "./album-tag";
import { AlbumReview } from "./album-review";

@EntityClass()
export class Album {
    @Property.Id()
    id: number = null;

    @Property.Primitive({ index: true })
    name: string = null;

    @Property.Key()
    artistId: number = null;

    @Property.Reference({ key: "artistId", other: () => Artist })
    artist: Artist = null;

    @Property.Children({ back: "album", other: () => Song })
    songs: Song[] = [];

    @Property.Children({ back: "album", other: () => AlbumTag })
    tags: AlbumTag[] = [];

    @Property.Children({ back: "album", other: () => AlbumReview, virtual: true })
    reviews: AlbumReview[] = [];

    constructor(args?: Partial<Album>) {
        Object.assign(this, args || {});
    }
}
