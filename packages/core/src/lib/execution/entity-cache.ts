import { cloneJson, readPath } from "@entity-space/utils";
import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { EntitySet } from "../entity/entity-set";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntitySelection } from "../query/entity-selection";
import { IEntitySchema, IEntitySchemaRelation } from "../schema/schema.interface";
import { IEntityCache } from "./entity-cache.interface";
import { IEntityToolbag } from "./entity-toolbag.interface";
import { EntityStore } from "./store/entity-store";

export class EntityCache implements IEntityCache {
    constructor(private readonly toolbag: IEntityToolbag) {}

    private readonly stores = new Map<string, EntityStore>();
    private readonly cachedQueries = new Map<string, IEntityQuery[]>();

    query<T extends Entity = Entity>(query: IEntityQuery): EntitySet<T> {
        const store = this.getOrCreateStore(query.getEntitySchema());
        const nonRelationalCriterion = this.toolbag
            .getCriteriaTools()
            .omitRelationalCriteria(query.getCriteria(), query.getEntitySchema());

        const parameters = query.getParameters();
        let entities = (
            parameters
                ? store.getByParameters(parameters, nonRelationalCriterion)
                : store.getByCriterion(nonRelationalCriterion)
        ) as T[];

        if (!query.getSelection().isEmpty() && entities.length > 0) {
            // [todo] dirty to do it here?
            // [todo] this way of cloning is quite slow.
            entities = cloneJson(entities);
            this.hydrateEntities(query.getEntitySchema(), query.getSelection(), entities);
            entities = query.getCriteria().filter(entities);
        }

        entities = query.getCriteria().filter(entities);

        return new EntitySet<T>({ query, entities });
    }

    upsert(entitySet: EntitySet<Entity>): void {
        this.addQueryToCached(entitySet.getQuery());
        const entities = cloneJson(entitySet.getEntities());
        const normalized = this.toolbag
            .getEntityTools()
            .normalizeEntities(entitySet.getQuery().getEntitySchema(), entities);
        const parameters = entitySet.getQuery().getParameters();

        for (const schema of normalized.getSchemas()) {
            const normalizedEntities = normalized.get(schema);

            if (schema.getId() === entitySet.getSchema().getId() && parameters) {
                // [todo] dirty & buggy. what if entitySet contains that type on both root & related?
                this.getOrCreateStore(schema).add(normalizedEntities, parameters);
            } else {
                this.getOrCreateStore(schema).add(normalizedEntities);
            }

            if (normalizedEntities.length > 0) {
                const indexQueries = this.toolbag.getQueryTools().createQueriesFromEntities(schema, normalizedEntities);

                for (const indexQuery of indexQueries) {
                    this.addQueryToCached(indexQuery);
                }
            }
        }
    }

    subtractQuery(query: IEntityQuery): IEntityQuery[] | false {
        const cached = this.getCachedQueries(query.getEntitySchema());
        return this.toolbag.getQueryTools().subtractQueries([query], cached);
    }

    subtractQueries(queries: IEntityQuery[]): IEntityQuery[] | false {
        if (!queries.length) {
            return [];
        }

        const schemaIds = new Set(queries.map(query => query.getEntitySchema().getId()));

        if (schemaIds.size > 1) {
            throw new Error(`expected all queries to share the same EntitySchema`);
        }

        const schema = queries[0].getEntitySchema();
        const cached = this.getCachedQueries(schema);

        return this.toolbag.getQueryTools().subtractQueries(queries, cached);
    }

    clear(): void {
        this.stores.clear();
        this.cachedQueries.clear();
    }

    clearBySchema(schema: IEntitySchema): void {
        this.stores.get(schema.getId())?.clear();
        this.cachedQueries.set(schema.getId(), []);
    }

    clearByQuery(query: IEntityQuery): void {
        const entities = this.query(query);
        const store = this.getOrCreateStore(query.getEntitySchema());

        for (const entity of entities.getEntities()) {
            store.remove(entity);
        }

        this.removeQueryFromCached(query);
    }

    private getOrCreateStore(schema: IEntitySchema): EntityStore {
        let store = this.stores.get(schema.getId());

        if (store === void 0) {
            store = new EntityStore(schema);
            this.stores.set(schema.getId(), store);
        }

        return store;
    }

    private hydrateEntities(schema: IEntitySchema, selection: EntitySelection, entities: Entity[]): void {
        // [todo] dirty
        const isHydrated = (propertyKey: string): boolean => {
            const first = entities[0];

            if (first === void 0) return false;

            return first[propertyKey] !== void 0;
        };

        let selectionValue = selection.getValue();

        for (const propertyKey in selectionValue) {
            const selectionValueProperty = selectionValue[propertyKey];

            if (selectionValueProperty === void 0) {
                continue;
            }

            const relation = schema.findRelation(propertyKey);

            if (relation !== void 0 && !isHydrated(relation.getPropertyName())) {
                this.hydrateRelation(
                    entities,
                    relation,
                    selectionValueProperty === true ? void 0 : selectionValueProperty
                );
            } else if (selectionValueProperty !== true) {
                const property = schema.getProperty(propertyKey);
                const referencedItems: Entity[] = [];

                for (const entity of entities) {
                    const reference = readPath<Entity>(propertyKey, entity);

                    if (Array.isArray(reference)) {
                        referencedItems.push(...reference);
                    } else if (reference) {
                        referencedItems.push(reference);
                    }
                }

                const entitySchema = property.getUnboxedEntitySchema();
                this.hydrateEntities(
                    entitySchema,
                    new EntitySelection({ schema: entitySchema, value: selectionValueProperty }),
                    referencedItems
                );
            }
        }
    }

    private hydrateRelation(
        entities: Entity[],
        relation: IEntitySchemaRelation,
        selection?: UnpackedEntitySelection
    ): void {
        const relatedSchema = relation.getRelatedEntitySchema();
        // [todo] what about dictionaries?
        const isArray = relation.getProperty().getValueSchema().isArray();
        const fromPaths = relation.getFromPaths();
        const toPaths = relation.getToPaths();

        if (fromPaths.length !== toPaths.length) {
            throw new Error(
                `can't hydrate relation "${relation.getPropertyName()}" (type: ${relatedSchema.getId()}): length of paths between from & to index are not equal (from: "${fromPaths.join(
                    ","
                )}", to: "${toPaths.join(", ")}")`
            );
        }

        const criteria = this.toolbag.getCriteriaTools().createCriterionFromEntities(entities, fromPaths, toPaths);
        const query = this.toolbag.getQueryTools().createQuery({
            entitySchema: relatedSchema,
            criteria,
            selection: selection ?? relatedSchema.getDefaultSelection(),
        });

        const result = this.query(query);

        this.toolbag
            .getEntityTools()
            .joinEntities(
                entities,
                result.getEntities(),
                relation.getPropertyName(),
                fromPaths,
                toPaths,
                isArray,
                relation.getProperty().getValueSchema().isNullable()
            );
    }

    private addQueryToCached(query: IEntityQuery): void {
        const cachedQueries = this.getCachedQueries(query.getEntitySchema());
        const nextCachedQueries = this.toolbag.getQueryTools().mergeQueries(query, ...cachedQueries);
        this.cachedQueries.set(query.getEntitySchema().getId(), nextCachedQueries);
    }

    private removeQueryFromCached(query: IEntityQuery): void {
        const cachedQueries = this.getCachedQueries(query.getEntitySchema());
        const nextCachedQueries = this.toolbag.getQueryTools().subtractQueries(cachedQueries, [query]);

        if (!nextCachedQueries) {
            return;
        }

        this.cachedQueries.set(query.getEntitySchema().getId(), nextCachedQueries);
    }

    private getCachedQueries(schema: IEntitySchema): IEntityQuery[] {
        return this.cachedQueries.get(schema.getId()) ?? [];
    }
}
