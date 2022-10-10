import { Entity, EntitySchemaCatalog, IEntitySchema } from "@entity-space/common";
import { normalizeEntities, Query } from "@entity-space/core";
import { isValue, matches } from "@entity-space/criteria";
import { Song, SongBlueprint, SongLocation } from "@entity-space/examples/libs/music-model";
import { FileOnDiskBasedEntitySource } from "@entity-space/node";
import { Injectable } from "@nestjs/common";

@Injectable()
export class DiskDbService {
    constructor(private readonly schemas: EntitySchemaCatalog) {
        this.entitySource = new FileOnDiskBasedEntitySource(this.filePath);
        this.songSchema = schemas.resolve(SongBlueprint);
        this.songLocationSchema = schemas.getSchema("song-location");
    }

    private readonly songSchema: IEntitySchema;
    private readonly songLocationSchema: IEntitySchema;
    private readonly entitySource: FileOnDiskBasedEntitySource;
    private readonly filePath = "./assets/entities.json";

    async getSong(id: number): Promise<Song | undefined> {
        const results = await this.entitySource.query(
            new Query({ entitySchema: this.songSchema, criteria: matches<Song>({ id: isValue(id) }) })
        );

        if (!results) {
            return void 0;
        }

        const entities = results.reduce((acc, value) => [...acc, ...value.getEntities()], [] as Entity[]) as Song[];

        return entities[0];
    }

    async getSongs(): Promise<Song[]> {
        const results = await this.entitySource.query(new Query({ entitySchema: this.songSchema }));

        if (!results) {
            return [];
        }

        return results.reduce((acc, value) => [...acc, ...value.getEntities()], [] as Entity[]) as Song[];
    }

    async createSong(song: Song): Promise<Song> {
        const created = await this.entitySource.create([song], this.songSchema);

        if (created === false) {
            // [todo] was too laze to make return type of this method include "false",
            // and generally not interested in figuring out proper error handling now
            throw new Error("failed to create song");
        }

        return created[0] as Song;
    }

    async getSongLocations(): Promise<SongLocation[]> {
        const results = await this.entitySource.query(new Query({ entitySchema: this.songLocationSchema }));

        if (!results) {
            return [];
        }

        return results.reduce((acc, value) => [...acc, ...value.getEntities()], [] as Entity[]) as SongLocation[];
    }

    async query<T extends Entity>(query: Query): Promise<T[]> {
        const results = await this.entitySource.query(query);

        if (!results) {
            return [];
        }

        return results.reduce((acc, value) => [...acc, ...value.getEntities()], [] as Entity[]) as T[];
    }

    async createEntity<T>(entity: T, schema: IEntitySchema): Promise<T> {
        const normalized = normalizeEntities(schema, [entity]);
        const creatable = normalized.get(schema)[0];

        if (!creatable) {
            throw new Error("normalization failed");
        }

        const created = await this.entitySource.create([creatable], schema);

        if (created === false) {
            // [todo] was too laze to make return type of this method include "false",
            // and generally not interested in figuring out proper error handling now
            throw new Error(`failed to create entity of type "${schema.getId()}"`);
        }

        return created[0] as T;
    }

    async patchEntity<T>(entity: Partial<T>, schema: IEntitySchema): Promise<T> {
        const normalized = normalizeEntities(schema, [entity]);
        const patch = normalized.get(schema)[0];

        if (!patch) {
            throw new Error("normalization failed");
        }

        const patched = await this.entitySource.update([patch], schema);

        if (patched === false) {
            // [todo] was too laze to make return type of this method include "false",
            // and generally not interested in figuring out proper error handling now
            throw new Error(`failed to create entity of type "${schema.getId()}"`);
        }

        return patched[0] as T;
    }
}
