import { cloneJson, groupBy, isDefined, readPath } from "@entity-space/utils";
import { flatten } from "lodash";
import { Observable, Subject } from "rxjs";
import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/criterion.interface";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { IEntityCriteriaTools } from "../criteria/entity-criteria-tools.interface";
import { EntityQueryTools } from "../query/entity-query-tools";
import { IEntityQueryTools } from "../query/entity-query-tools.interface";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntitySelection } from "../query/entity-selection";
import { QueryPaging } from "../query/query-paging";
import { IEntitySchema, IEntitySchemaRelation } from "../schema/schema.interface";
import { EntitySet } from "./data-structures/entity-set";
import { IEntityDatabase } from "./entity-database.interface";
import { joinEntities } from "./functions/join-entities.fn";
import { normalizeEntities } from "./functions/normalize-entities.fn";
import { EntityStore } from "./store/entity-store";

export class InMemoryEntityDatabase implements IEntityDatabase {
    private readonly stores = new Map<string, EntityStore>();
    private readonly cachedQueries = new Map<string, IEntityQuery[]>();
    private readonly queryCacheChanged = new Subject<IEntityQuery[]>();
    private readonly optionsCache: { options?: ICriterion; paging?: QueryPaging; ids: ICriterion }[] = [];
    private readonly optionsCache_v2: { options: ICriterion; criteria: ICriterion; ids: Entity[] }[] = [];
    private readonly criteriaTools: IEntityCriteriaTools = new EntityCriteriaTools();
    private readonly queryTools: IEntityQueryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });

    queryCacheChanged$(): Observable<IEntityQuery[]> {
        return this.queryCacheChanged.asObservable();
    }

    async query(query: IEntityQuery): Promise<EntitySet> {
        return this.querySync(query);
    }

    // [todo] unused, can be removed
    reduceByCached(query: IEntityQuery): IEntityQuery[] | false {
        const cached = this.getCachedQueries(query.getEntitySchema());
        return this.queryTools.subtractQueries([query], cached);
    }

    // [todo] not used; but i did not want to delete it already.
    // if i don't find a use soonish™ reason to keep it, i should remove it
    reduceManyByCached(queries: IEntityQuery[]): IEntityQuery[] {
        const groupedBySchema = groupBy(queries, query => query.getEntitySchema());

        const reduced: IEntityQuery[] = [];

        for (const [schema, queries] of groupedBySchema.entries()) {
            const result = this.queryTools.subtractQueries(queries, this.getCachedQueries(schema));

            if (!result) {
                reduced.push(...queries);
                continue;
            }

            reduced.push(...result);
        }

        return reduced;
    }

    // [todo] need some tests
    querySync<T extends Entity = Entity>(query: IEntityQuery): EntitySet<T> {
        const store = this.getOrCreateStore(query.getEntitySchema());
        const nonRelationalCriterion = this.criteriaTools.omitRelationalCriteria(
            query.getCriteria(),
            query.getEntitySchema()
        );

        const parameters = query.getParameters();
        let entities = (
            parameters
                ? store.getByParameters(parameters, nonRelationalCriterion)
                : store.getByCriterion(nonRelationalCriterion)
        ) as T[];

        const options = query.getOptions();
        const criteria = query.getCriteria();
        const { isAllCriterion, isNeverCriterion } = this.criteriaTools;

        if (!isNeverCriterion(options) && !isAllCriterion(options)) {
            const match = this.optionsCache_v2.find(
                item => item.options.equivalent(options) && item.criteria.equivalent(criteria)
            );

            if (!match) {
                return new EntitySet<T>({ query, entities: [] });
            } else {
                entities = match.ids.map(id => store.get(id)).filter(isDefined) as T[];
            }
        }

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

    upsertSync(entitySet: EntitySet<Entity>): void {
        this.addQueryToCached(entitySet.getQuery());
        const entities = cloneJson(entitySet.getEntities());
        const normalized = normalizeEntities(entitySet.getQuery().getEntitySchema(), entities);
        const parameters = entitySet.getQuery().getParameters();
        const options = entitySet.getQuery().getOptions();
        const page = entitySet.getQuery().getPaging();
        const criteria = entitySet.getQuery().getCriteria();
        const { isAllCriterion, isNeverCriterion, createCriterionFromEntities, never } = this.criteriaTools;

        if (!isNeverCriterion(options) && !isAllCriterion(options)) {
            const match = this.optionsCache_v2.find(
                item => item.options.equivalent(options) && item.criteria.equivalent(criteria)
            );

            if (match) {
                match.ids = entities;
            } else {
                this.optionsCache_v2.push({ ids: entities, options, criteria });
            }
        }

        if (!isNeverCriterion(options) && !isAllCriterion(options)) {
            if (entitySet.getEntities().length) {
                const key = entitySet.getSchema().getKey();
                const keyCriterion = createCriterionFromEntities(entitySet.getEntities(), key.getPath());
                this.optionsCache.push({ options, paging: page, ids: keyCriterion });
            } else {
                this.optionsCache.push({ options, paging: page, ids: never() });
            }
        }

        for (const schema of normalized.getSchemas()) {
            const normalizedEntities = normalized.get(schema);

            if (schema.getId() === entitySet.getSchema().getId() && parameters) {
                // [todo] dirty & buggy. what if entitySet contains that type on both root & related?
                this.getOrCreateStore(schema).add(normalizedEntities, parameters);
            } else {
                this.getOrCreateStore(schema).add(normalizedEntities);
            }

            if (normalizedEntities.length > 0) {
                const indexQueries = this.queryTools.createQueriesFromEntities(schema, normalizedEntities);

                for (const indexQuery of indexQueries) {
                    this.addQueryToCached(indexQuery);
                }
            }
        }
    }

    async upsert(entitySet: EntitySet<Entity>): Promise<void> {
        this.upsertSync(entitySet);
    }

    clear(): void {
        this.stores.clear();
        this.cachedQueries.clear();
        this.queryCacheChanged.next([]);
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
        const fromIndex = relation.getFromIndex();
        const toIndex = relation.getToIndex();
        const criteria = this.criteriaTools.createCriterionFromEntities(
            entities,
            fromIndex.getPath(),
            toIndex.getPath()
        );
        const query = this.queryTools.createQuery({
            entitySchema: relatedSchema,
            criteria,
            selection: selection ?? relatedSchema.getDefaultSelection(),
        });

        const result = this.querySync(query);

        joinEntities(
            entities,
            result.getEntities(),
            relation.getPropertyName(),
            fromIndex.getPath(),
            toIndex.getPath(),
            isArray
        );
    }

    addQueryToCached(query: IEntityQuery): void {
        const cachedQueries = this.getCachedQueries(query.getEntitySchema());
        this.cachedQueries.set(query.getEntitySchema().getId(), this.queryTools.mergeQueries(query, ...cachedQueries));
        this.queryCacheChanged.next(flatten(Array.from(this.cachedQueries.values())));
    }

    getCachedQueries(schema: IEntitySchema): IEntityQuery[] {
        return this.cachedQueries.get(schema.getId()) ?? [];
    }
}
