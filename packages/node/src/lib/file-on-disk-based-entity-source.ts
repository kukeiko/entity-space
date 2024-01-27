import {
    Entity,
    EntityCriteriaTools,
    EntityQueryTools,
    EntitySet,
    IEntityQuery,
    IEntitySchema,
} from "@entity-space/core";
import { toMap } from "@entity-space/utils";
import { constants } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";

// [todo] sloppily written, mostly considers happy paths only. just good enough to quickly continue working on example apps.
// export class FileOnDiskBasedEntitySource implements IEntityStore {
export class FileOnDiskBasedEntitySource {
    constructor(filePath: string) {
        this.filePath = filePath;
    }

    private readonly filePath: string;
    private readonly criteriaTools = new EntityCriteriaTools();
    private readonly queryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });

    async query(query: IEntityQuery): Promise<false | EntitySet[]> {
        const { where, inArray } = this.criteriaTools.toDestructurable();
        const { createQuery } = this.queryTools.toDestructurable();

        const entitiesFromFile = await this.loadEntitiesFromFile(query.getEntitySchema());
        const entities = query.getCriteria().filter(entitiesFromFile);
        const ids = entities.map(entity => entity["id"]);
        const actualQuery = createQuery({
            entitySchema: query.getEntitySchema(),
            criteria: where({ id: inArray(ids) }),
        });
        const result = new EntitySet({ query: actualQuery, entities });

        return [result];
    }

    async create(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]> {
        const current = await this.loadEntitiesFromFile(schema);
        // [todo] support pks with other names & also composite pks
        let nextId = (current.sort((a, b) => b["id"] - a["id"])[0]?.["id"] ?? 0) + 1;

        for (const entity of entities) {
            entity["id"] = nextId++;
            current.push(entity);
        }

        await this.writeEntitiesToFile(current, schema);

        return entities;
    }

    async update(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]> {
        const current = await this.loadEntitiesFromFile(schema);
        const currentById = toMap(current, entity => entity["id"]);
        const updated: Entity[] = [];

        for (const patchableEntity of entities) {
            const id = patchableEntity["id"];

            if (!id) {
                console.warn("cant update entity, id was falsy", patchableEntity);
                continue;
            }

            const currentEntity = currentById.get(id);

            if (!currentEntity) {
                console.warn("cant update entity, did not find existing match", patchableEntity);
                continue;
            }

            // [todo] use mergeEntities(), need to extract it out of entity-store (or entity-cache? cant remember now)
            for (const key in patchableEntity) {
                currentEntity[key] = patchableEntity[key];
            }

            updated.push(currentEntity);
        }

        await this.writeEntitiesToFile(current, schema);

        return updated;
    }

    async delete(entities: Entity[], schema: IEntitySchema): Promise<boolean> {
        return false;
    }

    private async writeEntitiesToFile(entities: Entity[], schema: IEntitySchema): Promise<void> {
        const file = await this.loadFile();
        file[schema.getId()] = entities;
        await writeFile(this.filePath, JSON.stringify(file, void 0, 4));
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
