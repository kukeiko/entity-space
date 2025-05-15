import { EntityBlueprint } from "../entity-blueprint.mjs";
import { RecordMetadataBlueprint } from "./record-metadata.model.mjs";
import { SongBlueprint } from "./song.model.mjs";

const { register, id, number, string, entity, array, optional, nullable } = EntityBlueprint;

export class ArtistBlueprint {
    namespace = id(String);
    id = id();
    name = string();
    songs = entity(SongBlueprint, [this.namespace, this.id], song => [song.namespace, song.artistId], {
        array,
        optional,
    });
    country = string({ optional, nullable });
    metadata = entity(RecordMetadataBlueprint);
}

register(ArtistBlueprint, { name: "artist" });

export type Artist = EntityBlueprint.Instance<ArtistBlueprint>;

export class ArtistRequestBlueprint {
    page = number({ optional });
    pageSize = number({ optional });
}

register(ArtistRequestBlueprint, { name: "artist-request" });

export type ArtistRequest = EntityBlueprint.Instance<ArtistRequestBlueprint>;
