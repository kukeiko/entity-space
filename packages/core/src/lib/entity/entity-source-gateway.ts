import { Query } from "../query/query";
import { IEntitySchema } from "../schema";
import { QueriedEntities } from "./data-structures/queried-entities";
import { Entity } from "./entity";
import { IEntitySource } from "./entity-source.interface";
import { expandEntities } from "./functions/expand-entities.fn";
import { IEntityStore } from "./i-entity-store";

export class EntitySourceGateway implements IEntitySource, IEntityStore {
    private readonly sources = new Map<string, IEntitySource>();
    private readonly stores = new Map<string, IEntityStore>();

    addSource(schema: IEntitySchema, source: IEntitySource): void {
        this.sources.set(schema.getId(), source);
    }

    addStore(schema: IEntitySchema, store: IEntityStore): void {
        this.stores.set(schema.getId(), store);
    }

    async query(query: Query): Promise<false | QueriedEntities[]> {
        const source = this.findSource(query.getEntitySchema());

        if (source === void 0) {
            return false;
        }

        const result = await source.query(query);

        if (result === false) {
            return false;
        }

        const results: QueriedEntities[] = [];

        for (const queried of result) {
            const effectiveQuery = queried.getQuery();
            const openExpansion = effectiveQuery.getExpansion().reduce_alt(query.getExpansion());
            const entities = queried.getEntities();

            if (entities.length > 0 && !openExpansion.isEmpty()) {
                await expandEntities(query.getEntitySchema(), openExpansion.getObject(), entities, this);
            }

            results.push(
                new QueriedEntities(
                    new Query(query.getEntitySchema(), effectiveQuery.getCriteria(), query.getExpansion()),
                    entities
                )
            );
        }

        return results;
    }

    async create(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]> {
        return this.findStore(schema)?.create(entities, schema) ?? false;
    }

    async update(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]> {
        return this.findStore(schema)?.update(entities, schema) ?? false;
    }

    async delete(entities: Entity[], schema: IEntitySchema): Promise<boolean> {
        return this.findStore(schema)?.delete(entities, schema) ?? false;
    }

    private findSource(schema: IEntitySchema): IEntitySource | undefined {
        return this.sources.get(schema.getId());
    }

    private findStore(schema: IEntitySchema): IEntityStore | undefined {
        return this.stores.get(schema.getId());
    }
}
