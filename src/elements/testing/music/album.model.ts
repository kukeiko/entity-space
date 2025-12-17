import { EntityBlueprint } from "../../entity/entity-blueprint";
import { ArtistBlueprint } from "./artist.model";
import { RecordMetadataBlueprint } from "../common/record-metadata.model";

const { register, id, string, number, entity } = EntityBlueprint;

export class AlbumBlueprint {
    namespace = id(String);
    id = id();
    name = string();
    artistId = number();
    artist = entity(ArtistBlueprint, this.artistId, artist => artist.id);
    metadata = entity(RecordMetadataBlueprint);
}

register(AlbumBlueprint, { name: "album" });

export type Album = EntityBlueprint.Instance<AlbumBlueprint>;
