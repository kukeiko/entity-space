import { EntityBlueprint } from "../entity-blueprint.mjs";
import { AlbumBlueprint } from "./album.model.mjs";
import { ArtistBlueprint } from "./artist.model.mjs";
import { RecordMetadataBlueprint } from "./record-metadata.model.mjs";

const { register, id, string, number, entity, optional } = EntityBlueprint;

export class SongBlueprint {
    namespace = id(String);
    id = id();
    name = string();
    duration = number();
    artistId = number();
    artist = entity(ArtistBlueprint, [this.namespace, this.artistId], artist => [artist.namespace, artist.id], {
        optional,
    });
    albumId = number();
    album = entity(AlbumBlueprint, [this.namespace, this.albumId], album => [album.namespace, album.id], { optional });
    metadata = entity(RecordMetadataBlueprint);
}

register(SongBlueprint, { name: "song", sort: (a, b) => a.name.localeCompare(b.name) });

export type Song = EntityBlueprint.Instance<SongBlueprint>;
