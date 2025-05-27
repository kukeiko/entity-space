import { EntityBlueprint } from "../entity/entity-blueprint";
import { RecordMetadataBlueprint } from "./record-metadata.model";
import { SongBlueprint } from "./song.model";

const { register, id, string, entity, array, optional, nullable, readonly, creatable } = EntityBlueprint;

export class ArtistBlueprint {
    namespace = id(String, { creatable });
    id = id();
    name = string();
    songs = entity(SongBlueprint, [this.namespace, this.id], song => [song.namespace, song.artistId], {
        array,
        optional,
    });
    country = string({ optional, nullable });
    metadata = entity(RecordMetadataBlueprint, { readonly });
}

register(ArtistBlueprint, { name: "artist" });

export type Artist = EntityBlueprint.Instance<ArtistBlueprint>;
