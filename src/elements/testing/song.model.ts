import { EntityBlueprint } from "../entity/entity-blueprint";
import { AlbumBlueprint } from "./album.model";
import { ArtistBlueprint } from "./artist.model";
import { RecordMetadataBlueprint } from "./record-metadata.model";
import { SongTagBlueprint } from "./song-tag.model";
import { TagBlueprint } from "./tag.model";

const { register, id, string, number, entity, array, optional, creatable } = EntityBlueprint;

export class SongBlueprint {
    namespace = id(String, { creatable });
    id = id();
    name = string();
    duration = number();
    artistId = number();
    artist = entity(ArtistBlueprint, [this.namespace, this.artistId], artist => [artist.namespace, artist.id]);
    albumId = number();
    album = entity(AlbumBlueprint, [this.namespace, this.albumId], album => [album.namespace, album.id]);
    metadata = entity(RecordMetadataBlueprint);
    tagIds = string({ array, optional });
    tags = entity(TagBlueprint, this.tagIds, tag => tag.id, { array });
    songTags = entity(SongTagBlueprint, this.id, songTag => songTag.songId, { array });
}

register(SongBlueprint, { name: "song", sort: (a, b) => a.name.localeCompare(b.name) });

export type Song = EntityBlueprint.Instance<SongBlueprint>;
