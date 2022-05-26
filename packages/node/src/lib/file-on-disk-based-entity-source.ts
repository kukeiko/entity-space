import { Entity, IEntitySchema, IEntitySource, IEntityStore, QueriedEntities, Query } from "@entity-space/core";
import { inSet, matches } from "@entity-space/criteria";
import { constants } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";

export class FileOnDiskBasedEntitySource implements IEntitySource, IEntityStore {
    constructor(filePath: string) {
        this.filePath = filePath;
    }

    private readonly filePath: string;

    async query(query: Query): Promise<false | QueriedEntities[]> {
        const entities = query.getCriteria().filter(await this.loadEntitiesFromFile(query.getEntitySchema()));
        const ids = entities.map(entity => entity["id"]);
        const actualQuery = new Query(query.getEntitySchema(), matches({ id: inSet(ids) }));
        const result = new QueriedEntities(actualQuery, entities);

        return [result];
    }

    async create(entities: Entity[], schema: IEntitySchema): Promise<Entity[]> {
        const current = await this.loadEntitiesFromFile(schema);
        let nextId = (current.sort((a, b) => b["id"] - a["id"])[0]?.["id"] ?? 0) + 1;

        for (const entity of entities) {
            entity["id"] = nextId++;
            current.push(entity);
        }

        await this.writeEntitiesToFile(current, schema);

        return entities;
    }

    private async writeEntitiesToFile(entities: Entity[], schema: IEntitySchema): Promise<void> {
        const file = await this.loadFile();
        file[schema.getId()] = entities;
        await writeFile(this.filePath, JSON.stringify(file));
    }

    private async loadEntitiesFromFile(schema: IEntitySchema): Promise<Entity[]> {
        const file = await this.loadFile();
        const entities = file[schema.getId()] ?? [];

        return entities;
    }

    private async loadFile(): Promise<Record<string, Entity[]>> {
        try {
            await access(this.filePath, constants.F_OK);
        } catch {
            await writeFile(this.filePath, "{}");
        }

        const fileContents = await readFile(this.filePath);
        const file = JSON.parse(fileContents.toString()) as Record<string, Entity[]>;

        return file;
    }
}
