import { EntityBlueprint } from "../../entity/entity-blueprint";
import { RecordMetadataBlueprint } from "../common/record-metadata.model";
import { ArtistBlueprint } from "./artist.model";
import { SongBlueprint } from "./song.model";

const { register, id, string, number, entity, array } = EntityBlueprint;

export class AlbumBlueprint {
    namespace = id(String);
    id = id();
    name = string();
    artistId = number();
    artist = entity(ArtistBlueprint, this.artistId, artist => artist.id);
    songs = entity(SongBlueprint, [this.namespace, this.id], song => [song.namespace, song.albumId], { array });
    metadata = entity(RecordMetadataBlueprint);
}

register(AlbumBlueprint, { name: "albums" });

export type Album = EntityBlueprint.Type<AlbumBlueprint>;
