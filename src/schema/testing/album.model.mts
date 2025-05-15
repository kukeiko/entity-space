import { EntityBlueprint } from "../entity-blueprint.mjs";
import { ArtistBlueprint } from "./artist.model.mjs";
import { RecordMetadataBlueprint } from "./record-metadata.model.mjs";

const { register, id, string, number, entity, optional } = EntityBlueprint;

export class AlbumBlueprint {
    namespace = id(String);
    id = id();
    name = string();
    artistId = number();
    artist = entity(ArtistBlueprint, this.artistId, artist => artist.id, { optional });
    metadata = entity(RecordMetadataBlueprint);
}

register(AlbumBlueprint, { name: "album" });

export type Album = EntityBlueprint.Instance<AlbumBlueprint>;
