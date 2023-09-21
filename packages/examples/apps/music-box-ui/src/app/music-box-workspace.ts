import { Injectable } from "@angular/core";
import { EntityQueryBuilder, EntityWorkspace } from "@entity-space/core";
import {
    Artist,
    ArtistBlueprint,
    Song,
    SongBlueprint,
    SongLocationType,
    SongLocationTypeBlueprint,
} from "@entity-space/examples/libs/music-model";

@Injectable({ providedIn: "root" })
export class MusicBoxWorkspace extends EntityWorkspace {
    fromArtists(): EntityQueryBuilder<Artist> {
        return super.from(ArtistBlueprint);
    }

    fromSongs(): EntityQueryBuilder<Song> {
        return super.from(SongBlueprint);
    }

    fromSongLocationTypes(): EntityQueryBuilder<SongLocationType> {
        return super.from(SongLocationTypeBlueprint);
    }
}
