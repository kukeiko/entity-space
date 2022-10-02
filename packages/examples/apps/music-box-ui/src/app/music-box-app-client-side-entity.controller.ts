import { HttpClient } from "@angular/common/http";
import { Entity, EntityApi, IEntitySchema, IEntityStore, EntitySchemaCatalog } from "@entity-space/core";
import { inSetTemplate, isValueTemplate } from "@entity-space/criteria";
import { Artist, ArtistBlueprint, Song, SongBlueprint, SongLocation } from "@entity-space/examples/libs/music-model";
import { firstValueFrom } from "rxjs";

export class MusicBoxClientSideEntityController extends EntityApi implements IEntityStore {
    constructor(
        private readonly http: HttpClient,

        private readonly schemas: EntitySchemaCatalog
    ) {
        super();
    }

    create(entities: Entity[], schema: IEntitySchema<Entity>): Promise<false | Entity[]> {
        switch (schema.getId()) {
            case "song-location":
                return Promise.all(
                    (entities as SongLocation[]).map(entity =>
                        firstValueFrom(this.http.post<SongLocation>(`api/song-locations`, entity))
                    )
                );
        }

        throw new Error(`create() not implemented for schema ${schema.getId()}`);
    }

    update(entities: Entity[], schema: IEntitySchema<Entity>): Promise<false | Entity[]> {
        switch (schema.getId()) {
            case "song":
                return Promise.all(
                    (entities as Song[]).map(entity =>
                        firstValueFrom(this.http.patch<Song>(`api/songs/${entity.id}`, entity))
                    )
                );

            case "song-location":
                return Promise.all(
                    (entities as SongLocation[]).map(entity =>
                        firstValueFrom(this.http.patch<SongLocation>(`api/song-locations/${entity.id}`, entity))
                    )
                );
        }

        throw new Error(`update() not implemented for schema ${schema.getId()}`);
    }

    delete(entities: Entity[], schema: IEntitySchema<Entity>): Promise<boolean> {
        throw new Error(`delete() not implemented for schema ${schema.getId()}`);
    }

    withGetAllArtists(): this {
        return this.addEndpoint(this.schemas.resolve(ArtistBlueprint), builder =>
            builder.supportsExpansion({ id: true, name: true }).isLoadedBy(() => this.http.get<Artist[]>("api/artists"))
        );
    }

    withGetAllSongs(): this {
        return this.addEndpoint(this.schemas.resolve(SongBlueprint), builder =>
            builder
                .supportsExpansion({ id: true, artistId: true, duration: true, name: true })
                .isLoadedBy(() => this.http.get<Song[]>("api/songs"))
        );
    }

    withGetSongById(): this {
        return this.addEndpoint(this.schemas.resolve(SongBlueprint), builder =>
            builder
                .requiresFields({ id: isValueTemplate(Number) })
                .supportsExpansion({ id: true, artistId: true, duration: true, locations: true, name: true })
                .isLoadedBy(({ criterion, expansion }) =>
                    this.http.get<Song>(`api/songs/${criterion.getBag().id.getValue()}`)
                )
        );
    }

    withGetSongLocationsBySongId(): this {
        return this.addEndpoint(this.schemas.getSchema<SongLocation>("song-location"), builder =>
            builder
                .requiresFields({ songId: inSetTemplate(Number) })
                .supportsExpansion({ id: true, path: true, songId: true, songLocationType: true, url: true })
                .isLoadedBy(({ criterion }) =>
                    this.http.get<SongLocation[]>("api/song-locations", {
                        params: { songId: Array.from(criterion.getBag().songId.getValues()).join(",") },
                    })
                )
        );
    }
}
