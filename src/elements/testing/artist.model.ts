import { EntityBlueprint } from "../entity/entity-blueprint";
import { RecordMetadataBlueprint } from "./record-metadata.model";
import { SongBlueprint } from "./song.model";
import { TagBlueprint } from "./tag.model";

const { register, id, string, entity, array, optional, nullable, readonly, creatable } = EntityBlueprint;

export class ArtistBlueprint {
    namespace = id(String, { creatable });
    id = id();
    name = string();
    songs = entity(SongBlueprint, [this.namespace, this.id], song => [song.namespace, song.artistId], {
        array,
        optional,
    });
    longestSong = entity(SongBlueprint, { optional });
    songTags = entity(TagBlueprint, { optional, array });
    country = string({ optional, nullable });
    title = string({ optional });
    metadata = entity(RecordMetadataBlueprint, { readonly });
}

register(ArtistBlueprint, { name: "artist" });

export type ArtistCreatable = EntityBlueprint.Creatable<ArtistBlueprint>;
export type ArtistUpdatable = EntityBlueprint.Updatable<ArtistBlueprint>;
export type ArtistSavable = EntityBlueprint.Savable<ArtistBlueprint>;
export type Artist = EntityBlueprint.Instance<ArtistBlueprint>;
