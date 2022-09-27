import { HttpClient } from "@angular/common/http";
import {
    BlueprintResolver,
    Entity,
    EntityController,
    EntityControllerEndpoint,
    Expansion,
    ExpansionObject,
    IEntitySchema,
    IEntityStore,
    SchemaCatalog,
} from "@entity-space/core";
import { anyTemplate, inSetTemplate, isValueTemplate, namedTemplate } from "@entity-space/criteria";
import { Artist, ArtistBlueprint, Song, SongBlueprint, SongLocation } from "@entity-space/examples/libs/music-model";
import { firstValueFrom } from "rxjs";

export class MusicBoxClientSideEntityController extends EntityController implements IEntityStore {
    constructor(
        private readonly http: HttpClient,
        private readonly blueprints: BlueprintResolver,
        private readonly schemas: SchemaCatalog
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
        return this.addEndpoint(
            new EntityControllerEndpoint({
                schema: this.blueprints.resolve(ArtistBlueprint),
                template: anyTemplate(),
                expansion: new Expansion<ExpansionObject<Artist>>({ id: true, name: true }),
                invoke: _ => this.http.get<Artist[]>("api/artists"),
            })
        );
    }

    withGetAllSongs(): this {
        return this.addEndpoint(
            new EntityControllerEndpoint({
                schema: this.blueprints.resolve(SongBlueprint),
                template: anyTemplate(),
                expansion: new Expansion<ExpansionObject<Song>>({
                    id: true,
                    artistId: true,
                    duration: true,
                    locations: true,
                    name: true,
                }),
                invoke: _ => this.http.get<Song[]>(`api/songs`),
            })
        );
    }

    withGetSongById(): this {
        return this.addEndpoint(
            new EntityControllerEndpoint({
                schema: this.blueprints.resolve(SongBlueprint),
                template: namedTemplate({ id: isValueTemplate(Number) }),
                expansion: new Expansion<ExpansionObject<Song>>({
                    id: true,
                    artistId: true,
                    duration: true,
                    locations: true,
                    name: true,
                }),
                invoke: query => this.http.get<Song>(`api/songs/${query.getCriteria().getBag().id.getValue()}`),
            })
        );
    }

    withGetSongLocationsBySongId(): this {
        return this.addEndpoint(
            new EntityControllerEndpoint({
                schema: this.schemas.getSchema("song-location"),
                template: namedTemplate({ songId: inSetTemplate(Number) }),
                expansion: new Expansion<ExpansionObject<SongLocation>>({
                    id: true,
                    path: true,
                    songId: true,
                    songLocationType: true,
                    url: true,
                }),
                invoke: query =>
                    this.http.get<SongLocation[]>(`api/song-locations`, {
                        params: { songId: Array.from(query.getCriteria().getBag().songId.getValues()).join(",") },
                    }),
            })
        );
    }
}
