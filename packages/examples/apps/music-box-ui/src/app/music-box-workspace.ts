import { Injectable } from "@angular/core";
import { EntityQueryBuilder, EntityQueryTracing, EntitySchemaCatalog, EntityWorkspace } from "@entity-space/core";
import {
    Artist,
    ArtistBlueprint,
    Song,
    SongBlueprint,
    SongLocationType,
    SongLocationTypeBlueprint,
} from "@entity-space/examples/libs/music-model";
import { MusicBoxClientSideEntityApi } from "./music-box-client-side-entity-api";

@Injectable()
export class MusicBoxWorkspace extends EntityWorkspace {
    constructor(api: MusicBoxClientSideEntityApi, schemas: EntitySchemaCatalog, tracing: EntityQueryTracing) {
        super(tracing);
        this.interceptors = [api];
        this.setStore(api);
        this.setSchemaCatalog(schemas);
    }

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
