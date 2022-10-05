import { ExpansionValue } from "@entity-space/common";
import { any, Criterion, fromDeepBag, isValue, matches, MatchesBagArgument } from "@entity-space/criteria";
import { Class, DeepPartial, isDefined, writePath } from "@entity-space/utils";
import { flatMap, flatten, isEqual, xor, xorWith } from "lodash";
import {
    distinctUntilChanged,
    EMPTY,
    filter,
    finalize,
    from,
    lastValueFrom,
    map,
    merge,
    Observable,
    of,
    ReplaySubject,
    startWith,
    Subject,
    switchMap,
    tap,
} from "rxjs";
import { EntityHydrationQuery } from "../execution/entity-hydration-query";
import { IEntityHydrator } from "../execution/i-entity-hydrator";
import { IEntitySource } from "../execution/i-entity-source";
import { mergeQueries } from "../query/merge-queries.fn";
import { Query } from "../query/query";
import { reduceQueries } from "../query/reduce-queries.fn";
import { BlueprintInstance } from "../schema/blueprint-instance";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityQueryTracing } from "../tracing/entity-query-tracing";
import { EntitySet } from "./data-structures/entity-set";
import { Entity } from "./entity";
import { createCriterionFromEntities } from "./functions/create-criterion-from-entities.fn";
import { normalizeEntities } from "./functions/normalize-entities.fn";
import { IEntityStore } from "./i-entity-store";
import { InMemoryEntityDatabase } from "./in-memory-entity-database";

export class Workspace implements IEntityStore {
    constructor(private readonly tracing: EntityQueryTracing) {}

    private source?: IEntitySource;
    private store?: IEntityStore;
    private hydrator?: IEntityHydrator;
    private schemas?: EntitySchemaCatalog;
    private readonly queryCaches = new Map<string, Query[]>();
    private readonly queryCacheChanged = new Subject<Query[]>();
    private readonly database = new InMemoryEntityDatabase();
    private readonly watchedQueries = new Map<Query, Subject<Entity[]>>();

    onQueryCacheChanged(): Observable<Query[]> {
        return this.queryCacheChanged.asObservable();
    }

    // [todo] rename to upsert()?
    // [todo] we allow partials, but types don't reflect that (same @ cache and store)
    add<T>(schema: Class<T>, entities: DeepPartial<BlueprintInstance<T>>[] | DeepPartial<BlueprintInstance<T>>): void;
    add<T extends Entity = Entity>(schema: IEntitySchema, entities: DeepPartial<T>[] | DeepPartial<T>): void;
    add(schema: IEntitySchema | Class, entities: Entity[] | Entity): void {
        schema = this.toSchema(schema);
        // console.log("🆕 add entities", schema.getId(), JSON.stringify(entities));

        if (!Array.isArray(entities)) {
            entities = [entities];
        }

        if (!entities.length) {
            return;
        }

        // [todo] adding the overloads to support both schemas & blueprints caused having to add this "as Entity[]" assertion, no idea why
        const queries = this.database.addEntities(schema, entities as Entity[]);

        for (const query of queries) {
            this.addQueryToCached(query);
        }

        this.emitAllWatchedQueries();
    }

    private emitAllWatchedQueries(): void {
        for (const [watchedQuery, subject] of this.watchedQueries) {
            new Promise(resolve => setTimeout(resolve, 0))
                .then(() => this.queryAgainstCache(watchedQuery))
                .then(value => subject.next(value));
        }
    }

    setSource(source: IEntitySource): void {
        this.source = source;
    }

    setHydrator(hydrator: IEntityHydrator): void {
        this.hydrator = hydrator;
    }

    setStore(store: IEntityStore): void {
        this.store = store;
    }

    setSchemaCatalog(schemas: EntitySchemaCatalog): void {
        this.schemas = schemas;
    }

    private addQueryToCached(query: Query): void {
        const cachedQueries = this.getCachedQueries(query.getEntitySchema());
        this.queryCaches.set(query.getEntitySchema().getId(), mergeQueries(query, ...cachedQueries));
        this.queryCacheChanged.next(flatten(Array.from(this.queryCaches.values())));
    }

    // [todo] T not used yet; need to add it to QueriedEntities
    async query<T extends Entity = Entity>(query: Query): Promise<false | EntitySet<T>[]> {
        if (this.source) {
            const cachedQueries = this.getCachedQueries(query.getEntitySchema());
            const reduced = reduceQueries([query], cachedQueries);
            const queriesAgainstSource = reduced === false ? [query] : reduced;

            if (queriesAgainstSource.length) {
                if (reduced !== false) {
                    this.tracing.queryGotSubtracted(query, cachedQueries, queriesAgainstSource);
                }

                await lastValueFrom(this.source.query$(queriesAgainstSource, this.database));
                queriesAgainstSource.forEach(query => this.addQueryToCached(query));
                this.emitAllWatchedQueries();
            } else {
                this.tracing.queryGotFullySubtracted(query, cachedQueries, { byLabel: "by cached" });
            }
        }

        const entities = (await this.queryAgainstCache(query)) as T[];
        this.tracing.queryResolved(query, `${entities.length}x entit${entities.length === 1 ? "y" : "ies"}`);

        return [new EntitySet({ query, entities })];
    }

    // [todo] not reactive yet
    hydrate$<T>(
        blueprint: Class<T>,
        entities: BlueprintInstance<T>[],
        expansion: ExpansionValue<BlueprintInstance<T>>
    ): Observable<BlueprintInstance<T>[]> {
        if (!entities.length) {
            return of([]);
        }

        if (!this.hydrator) {
            return EMPTY;
        }

        const hydrator = this.hydrator;
        const schema = this.schemas?.resolve(blueprint);

        if (!schema) {
            return EMPTY;
        }

        const criteria = createCriterionFromEntities(entities, schema.getKey().getPath());
        const query = new Query({ entitySchema: schema, criteria, expansion });
        const cachedQueries = this.getCachedQueries(query.getEntitySchema());
        const reduced = reduceQueries([query], cachedQueries);
        const queriesAgainstSource = reduced === false ? [query] : reduced;

        this.tracing.querySpawned(query);

        if (queriesAgainstSource.length) {
            if (reduced) {
                this.tracing.queryGotSubtracted(query, cachedQueries, queriesAgainstSource, { byLabel: "by cached" });
            }

            const hydrationQueries = queriesAgainstSource.map(
                query =>
                    new EntityHydrationQuery<BlueprintInstance<T>>({
                        entitySet: new EntitySet({ query: new Query({ entitySchema: schema, criteria }), entities }),
                        query,
                    })
            );

            return merge(
                ...hydrationQueries.map(hydrationQuery => hydrator.hydrate$(hydrationQuery, this.database))
            ).pipe(
                map(() => {
                    const entities = this.database.querySync(query).getEntities();
                    this.tracing.queryResolved(query, JSON.stringify(entities));
                    return entities;
                })
            ) as Observable<BlueprintInstance<T>[]>;
        } else {
            this.tracing.queryGotFullySubtracted(query, cachedQueries, { byLabel: "by cached" });
            const entities = this.database.querySync(query).getEntities();
            this.tracing.queryResolved(query, JSON.stringify(entities));
            return of(entities) as Observable<BlueprintInstance<T>[]>;
        }
    }

    query$<T extends Entity>(
        schema: IEntitySchema,
        criterion?: Criterion | MatchesBagArgument<T>,
        expansion?: ExpansionValue<T>
    ): Observable<T[]>;
    query$<T extends Entity>(
        schema: Class<T>,
        criterion?: MatchesBagArgument<T>,
        expansion?: ExpansionValue<BlueprintInstance<T>>
    ): Observable<BlueprintInstance<T>[]>;
    query$<T extends Entity>(
        schema: IEntitySchema | Class<T>,
        criterion: any = any(),
        expansion: ExpansionValue<T> = {}
    ): Observable<T[]> {
        if (!("getId" in schema)) {
            const resolvedSchema = this.schemas?.resolve(schema);

            if (!resolvedSchema) {
                throw new Error(`failed to resolve blueprint to schema for type ${schema.name}`);
            }

            schema = resolvedSchema;
        }

        if (!(criterion instanceof Criterion)) {
            criterion = matches(criterion);
        }

        const query = new Query({ entitySchema: schema, criteria: criterion, expansion });
        // const subject = new Subject<Entity[]>();
        const subject = new ReplaySubject<Entity[]>(1);

        this.tracing.querySpawned(query);

        return from(this.query(query)).pipe(
            switchMap(result => {
                if (result === false) {
                    return of([]);
                }

                // const keySchema = query.getEntitySchema().getKey();
                const entities = flatMap(result, x => x.getEntities());

                // [todo] also track:
                // - related entities
                // - newly added entities that fit the criteria
                // const trackedCriterion = createCriterionFromEntities(entities, keySchema.getPath());

                // [todo] remove subject once no longer subscribed to
                this.watchedQueries.set(
                    query,
                    // new Query(query.getEntitySchema(), trackedCriterion, query.getExpansionValue()),
                    subject
                );

                return subject.asObservable().pipe(
                    startWith(entities),
                    distinctUntilChanged((a, b) => {
                        const normalizedA = normalizeEntities(query.getEntitySchema(), a);
                        const normalizedB = normalizeEntities(query.getEntitySchema(), b);

                        const differentFoundSchemas = xor(
                            normalizedA
                                .getSchemas()
                                .filter(schema => normalizedA.get(schema).length > 0)
                                .map(schema => schema.getId()),
                            normalizedB
                                .getSchemas()
                                .filter(schema => normalizedA.get(schema).length > 0)
                                .map(schema => schema.getId())
                        );

                        if (differentFoundSchemas.length > 0) {
                            return false;
                        }

                        for (const schema of normalizedA.getSchemas()) {
                            const diff = xorWith(normalizedA.get(schema), normalizedB.get(schema), isEqual);

                            if (diff.length > 0) {
                                return false;
                            }
                        }

                        // debugger;

                        // return isEqual(a, b);
                        const equal = xorWith(a, b, isEqual);

                        if (equal.length > 0) {
                            console.log("not equal", a, b);
                        }

                        return equal.length == 0;
                    }),
                    tap(() => this.tracing.reactiveQueryEmitted(query)),
                    finalize(() => {
                        this.tracing.reactiveQueryDisposed(query);
                        this.watchedQueries.delete(query);
                    })
                ) as any as Observable<T[]>;
            })
        );
    }

    queryOneByKey$<T extends Entity>(
        schema: IEntitySchema,
        key: number | string,
        expansion?: ExpansionValue<T>
    ): Observable<T>;
    queryOneByKey$<T>(
        schema: Class<T>,
        key: number | string,
        expansion?: ExpansionValue<BlueprintInstance<T>>
    ): Observable<BlueprintInstance<T>>;
    queryOneByKey$<T extends Entity>(
        schema: IEntitySchema | Class<T>,
        key: number | string,
        expansion: ExpansionValue<T> = {}
    ): Observable<T> {
        if (!("getId" in schema)) {
            const resolvedSchema = this.schemas?.resolve(schema);

            if (!resolvedSchema) {
                throw new Error(`failed to resolve blueprint to schema for type ${schema.name}`);
            }

            schema = resolvedSchema;
        }

        const keyPath = schema.getKey().getPath();

        if (keyPath.length > 1) {
            throw new Error("composite keys not yet supported");
        }

        const bag: Record<string, any> = {};
        writePath(keyPath[0], bag, isValue(key));

        return this.query$(schema, fromDeepBag(bag), expansion).pipe(
            map(result => result[0]),
            filter(isDefined)
        );
    }

    // [todo] should stay async because at one point i want to make use of service-workers
    // [todo] should not exist at all? (or be private)
    async queryAgainstCache(query: Query): Promise<Entity[]> {
        return this.database.querySync(query).getEntities();
    }

    async create<T extends Entity>(entities: T[], schema: IEntitySchema): Promise<false | T[]> {
        const result = (await this.store?.create(entities, schema)) ?? false;

        if (result === false) {
            return false;
        }

        this.add(schema, result);

        return result as T[];
    }

    async update<T extends Entity>(entities: DeepPartial<T>[], schema: IEntitySchema): Promise<false | T[]> {
        const result = (await this.store?.update(entities, schema)) ?? false;

        if (result === false) {
            return false;
        }

        this.add(schema, result);

        return result as T[];
    }

    delete(entities: Entity[], schema: IEntitySchema): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    clear(): void {
        this.queryCaches.clear();
        this.database.clear();
        this.queryCacheChanged.next([]);
    }

    private getCachedQueries(schema: IEntitySchema): Query[] {
        return this.queryCaches.get(schema.getId()) ?? [];
    }

    private toSchema(schema: IEntitySchema | Class): IEntitySchema {
        if (!("getId" in schema)) {
            const resolvedSchema = this.schemas?.resolve(schema);

            if (!resolvedSchema) {
                throw new Error(`failed to resolve blueprint to schema for type ${schema.name}`);
            }

            return resolvedSchema;
        }

        return schema;
    }
}
