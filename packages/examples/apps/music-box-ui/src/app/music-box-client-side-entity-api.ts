import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Entity, EntityApi, EntitySpaceServices, IEntitySchema, IEntityStore } from "@entity-space/core";
import {
    Artist,
    ArtistBlueprint,
    SearchSongsBlueprint,
    Song,
    SongBlueprint,
    SongLocation,
    SongLocationTypeBlueprint,
} from "@entity-space/examples/libs/music-model";
import { isDefined } from "@entity-space/utils";
import { firstValueFrom } from "rxjs";

@Injectable({ providedIn: "root" })
export class MusicBoxClientSideEntityApi extends EntityApi implements IEntityStore {
    constructor(private readonly http: HttpClient, private readonly services: EntitySpaceServices) {
        super(services.getTracing());
    }

    withGetAllArtists(): this {
        return this.addEndpoint(this.services.getCatalog().resolve(ArtistBlueprint), builder =>
            builder.supportsSelection({ id: true, name: true }).isLoadedBy(() => this.http.get<Artist[]>("api/artists"))
        );
    }

    withGetAllSongs(): this {
        return this.addEndpoint(this.services.getCatalog().resolve(SongBlueprint), builder =>
            builder
                .where({ $optional: { artistId: [Number] } })
                .supportsSelection({ id: true, artistId: true, duration: true, name: true })
                .isLoadedBy(({ criteria: { artistId } }) => {
                    let params = new HttpParams({});

                    if (artistId) {
                        // [todo] artistId can be array that contains "undefined", seems wrong
                        params = params.set("artistId", artistId.filter(isDefined).join(","));
                    }

                    return this.http.get<Song[]>("api/songs", { params });
                })
        );
    }

    withSearchSongs(): this {
        return this.addEndpoint(this.services.getCatalog().resolve(SongBlueprint), builder =>
            builder
                .where({ $optional: { artistId: [Number] } })
                .supportsSelection({ id: true, artistId: true, duration: true, name: true })
                .requiresParameters(this.services.getCatalog().resolve(SearchSongsBlueprint))
                .isLoadedBy(({ criteria: { artistId }, parameters: { searchText } }) => {
                    let params = new HttpParams({});
                    params = params.set("searchText", searchText);

                    if (artistId) {
                        // [todo] artistId can be array that contains "undefined", seems wrong
                        params = params.set("artistId", artistId.filter(isDefined).join(","));
                    }

                    return this.http.get<Song[]>("api/songs", { params });
                })
        );
    }

    withGetSongById(): this {
        return this.addEndpoint(this.services.getCatalog().resolve(SongBlueprint), builder =>
            builder
                .where({ id: Number })
                .supportsSelection({
                    id: true,
                    artistId: true,
                    duration: true,
                    locations: { id: true, songId: true, songLocationType: true, url: true },
                    name: true,
                })
                .isLoadedBy(({ criteria: { id } }) => this.http.get<Song>(`api/songs/${id}`))
        );
    }

    withGetSongLocationsBySongId(): this {
        return this.addEndpoint(this.services.getCatalog().getSchema<SongLocation>("song-location"), builder =>
            builder
                .where({ songId: [Number] })
                .supportsSelection({ id: true, path: true, songId: true, songLocationType: true, url: true })
                .isLoadedBy(({ criteria: { songId } }) => {
                    return this.http.get<SongLocation[]>("api/song-locations", {
                        params: { songId: songId.join(",") },
                    });
                })
        );
    }

    withGetAllSongLocationTypes(): this {
        return this.addEndpoint(this.services.getCatalog().resolve(SongLocationTypeBlueprint), builder =>
            builder.supportsSelection({ id: true, name: true }).isLoadedBy(() => [
                { id: "web", name: "Web" },
                { id: "local", name: "Local" },
            ])
        );
    }

    create(entities: Entity[], schema: IEntitySchema<Entity>): Promise<false | Entity[]> {
        switch (schema.getId()) {
            case "song-location":
                return Promise.all(
                    (entities as SongLocation[]).map(entity =>
                        firstValueFrom(this.http.post<SongLocation>(`api/song-locations`, entity))
                    )
                );

            case "song":
                return Promise.all(
                    (entities as Song[]).map(entity => firstValueFrom(this.http.post<Song>(`api/songs`, entity)))
                );

            case "artist":
                return Promise.all(
                    (entities as Artist[]).map(entity => firstValueFrom(this.http.post<Artist>(`api/artists`, entity)))
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

            case "artist":
                return Promise.all(
                    (entities as Artist[]).map(entity =>
                        firstValueFrom(this.http.patch<Artist>(`api/artists/${entity.id}`, entity))
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
}
