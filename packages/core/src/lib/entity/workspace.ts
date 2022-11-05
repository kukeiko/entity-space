import { BlueprintInstance, Entity, EntitySchemaCatalog, ExpansionValue, IEntitySchema } from "@entity-space/common";
import { any, Criterion, fromDeepBag, isValue, matches, MatchesBagArgument, never } from "@entity-space/criteria";
import { Class, DeepPartial, isDefined, isNotFalse, writePath } from "@entity-space/utils";
import { flatMap, isEqual, xor, xorWith } from "lodash";
import {
    distinctUntilChanged,
    EMPTY,
    filter,
    finalize,
    from,
    lastValueFrom,
    map,
    merge,
    mergeAll,
    Observable,
    of,
    ReplaySubject,
    startWith,
    Subject,
    switchMap,
    tap,
} from "rxjs";
import { IEntityStreamInterceptor } from "../execution/i-entity-stream-interceptor";
import { SchemaRelationBasedHydrator } from "../execution/interceptors/schema-relation-based-hydrator";
import { QueryStream } from "../execution/query-stream";
import { QueryStreamPacket } from "../execution/query-stream-packet";
import { runInterceptors } from "../execution/run-interceptors.fn";
import { Query } from "../query/query";
import { QueryPaging } from "../query/query-paging";
import { reduceQueries } from "../query/reduce-queries.fn";
import { EntityQueryTracing } from "../tracing/entity-query-tracing";
import { EntitySet } from "./data-structures/entity-set";
import { createCriterionFromEntities } from "./functions/create-criterion-from-entities.fn";
import { createIdQueryFromEntities } from "./functions/create-id-query-from-entities.fn";
import { normalizeEntities } from "./functions/normalize-entities.fn";
import { IEntityStore } from "./i-entity-store";
import { InMemoryEntityDatabase } from "./in-memory-entity-database";

export class Workspace implements IEntityStore, IEntityStreamInterceptor {
    constructor(private readonly tracing: EntityQueryTracing) {}

    private store?: IEntityStore;
    private schemas?: EntitySchemaCatalog;
    private readonly database = new InMemoryEntityDatabase();
    private readonly watchedQueries = new Map<Query, Subject<Entity[]>>();
    interceptors: IEntityStreamInterceptor[] = [];

    // [todo] rename to upsert()?
    // [todo] we allow partials, but types don't reflect that (same @ cache and store)
    async add<T>(
        schema: Class<T>,
        entities: DeepPartial<BlueprintInstance<T>>[] | DeepPartial<BlueprintInstance<T>>
    ): Promise<void>;
    async add<T extends Entity = Entity>(
        schema: IEntitySchema,
        entities: DeepPartial<T>[] | DeepPartial<T>
    ): Promise<void>;
    async add(schema: IEntitySchema | Class, entities: Entity[] | Entity): Promise<void> {
        schema = this.toSchema(schema);
        // console.log("🆕 add entities", schema.getId(), JSON.stringify(entities));

        if (!Array.isArray(entities)) {
            entities = [entities];
        }

        if (!entities.length) {
            return;
        }

        await this.database.upsert(
            new EntitySet({
                // [todo] adding the overloads to support both schemas & blueprints caused having to add this "as Entity[]" assertion, no idea why
                query: createIdQueryFromEntities(schema, entities as Entity[]),
                entities: entities as Entity[],
            })
        );

        this.emitAllWatchedQueries();
    }

    private emitAllWatchedQueries(): void {
        for (const [watchedQuery, subject] of this.watchedQueries) {
            new Promise(resolve => setTimeout(resolve, 0))
                .then(() => this.queryAgainstCache(watchedQuery))
                .then(value => subject.next(value));
        }
    }

    setStore(store: IEntityStore): void {
        this.store = store;
    }

    setSchemaCatalog(schemas: EntitySchemaCatalog): void {
        this.schemas = schemas;
    }

    // [todo] T not used yet; need to add it to QueriedEntities
    async query<T extends Entity = Entity>(query: Query): Promise<false | EntitySet<T>[]> {
        const sources = [...this.interceptors, new SchemaRelationBasedHydrator(this.tracing, [this])];
        const cachedQueries = this.database.getCachedQueries(query.getEntitySchema());
        const reduced = reduceQueries([query], cachedQueries);
        const queriesAgainstSource = reduced === false ? [query] : reduced;

        if (queriesAgainstSource.length) {
            if (reduced) {
                this.tracing.queryGotSubtracted(query, cachedQueries, queriesAgainstSource);
            }

            await lastValueFrom(
                runInterceptors(sources, queriesAgainstSource).pipe(
                    switchMap(packet => {
                        if (!packet.getPayload().length) {
                            return of(packet);
                        }

                        // [todo] prevent upserting entities that are loaded from the database we'Re upserting to
                        // (which should currently happen as we pass this workspace as a source to the hydrator)
                        return merge(...packet.getPayload().map(entitySet => this.database.upsert(entitySet)));
                    })
                )
            );
            queriesAgainstSource.forEach(query => this.database.addQueryToCached(query));
            this.emitAllWatchedQueries();
        } else {
            this.tracing.queryGotFullySubtracted(query, cachedQueries, { byLabel: "by cached" });
        }

        const entities = (await this.queryAgainstCache(query)) as T[];
        this.tracing.queryResolved(query, `${entities.length}x entit${entities.length === 1 ? "y" : "ies"}`);

        return [new EntitySet({ query, entities })];
    }

    intercept(stream: QueryStream<Entity>): QueryStream<Entity> {
        return merge(
            stream.pipe(map(QueryStreamPacket.withoutRejected), filter(QueryStreamPacket.isNotEmpty)),
            stream.pipe(
                map(QueryStreamPacket.withOnlyRejected),
                filter(QueryStreamPacket.isNotEmpty),
                switchMap(packet =>
                    merge(...packet.getRejectedQueries().map(query => this.query(query))).pipe(
                        filter(isNotFalse),
                        map(payload => of(new QueryStreamPacket({ payload })))
                    )
                ),
                mergeAll()
            )
        );
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
        const schema = this.schemas?.resolve(blueprint);

        if (!schema) {
            return EMPTY;
        }
        const criteria = createCriterionFromEntities(entities, schema.getKey().getPath());
        const entitySetQuery = new Query({
            entitySchema: schema,
            criteria,
            // [todo] expansion missing
        });

        const hydrationQuery = new Query({ entitySchema: schema, criteria, expansion });
        const cachedQueries = this.database.getCachedQueries(hydrationQuery.getEntitySchema());
        const reduced = reduceQueries([hydrationQuery], cachedQueries);
        const queriesAgainstSource = reduced === false ? [hydrationQuery] : reduced;

        this.tracing.querySpawned(hydrationQuery);
        if (queriesAgainstSource.length) {
            if (reduced) {
                this.tracing.queryGotSubtracted(hydrationQuery, cachedQueries, queriesAgainstSource, {
                    byLabel: "by cached",
                });
            }

            const hydrator = new SchemaRelationBasedHydrator(this.tracing, [this]);
            const entitySet = new EntitySet({ entities, query: entitySetQuery });
            const kickstartHydrationSource: IEntityStreamInterceptor = {
                intercept(stream) {
                    return merge(stream, of(new QueryStreamPacket({ payload: [entitySet] })));
                },
            };

            return runInterceptors([kickstartHydrationSource, hydrator], [hydrationQuery]).pipe(
                map(() => {
                    const entities = this.database.querySync(hydrationQuery).getEntities();
                    // [todo] should only trace "resolved" once
                    this.tracing.queryResolved(hydrationQuery, JSON.stringify(entities));
                    return entities;
                })
            ) as Observable<BlueprintInstance<T>[]>;
        } else {
            this.tracing.queryGotFullySubtracted(hydrationQuery, cachedQueries, { byLabel: "by cached" });
            const entities = this.database.querySync(hydrationQuery).getEntities();
            this.tracing.queryResolved(hydrationQuery, JSON.stringify(entities));
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
        expansion?: ExpansionValue<BlueprintInstance<T>>,
        options?: MatchesBagArgument<Entity>,
        paging?: { skip?: number; top?: number; from?: number; to?: number }
    ): Observable<BlueprintInstance<T>[]>;
    query$<T extends Entity>(
        schema: IEntitySchema | Class<T>,
        criterion: any = any(),
        expansion: ExpansionValue<T> = {},
        options: any = never(),
        paging?: { skip?: number; top?: number; from?: number; to?: number }
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

        if (!(options instanceof Criterion)) {
            if (Object.keys(options).length) {
                options = matches(options);
            } else {
                options = never();
            }
        }

        let queryPaging: QueryPaging | undefined;

        if (paging) {
            if (paging.from || paging.to) {
                queryPaging = new QueryPaging({ sort: [], from: paging.from, to: paging.to });
            } else {
                const skip = paging?.skip ?? 0;
                const top = paging?.top;

                if (skip || top) {
                    queryPaging = new QueryPaging({
                        sort: [],
                        from: skip,
                        to: top ? top + skip : void 0,
                    });
                }
            }
        }

        const query = new Query({ entitySchema: schema, criteria: criterion, expansion, options, paging: queryPaging });

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

    queryCacheChanged$(): Observable<Query[]> {
        return this.database.queryCacheChanged$();
    }

    async create<T extends Entity>(entities: T[], schema: IEntitySchema): Promise<false | T[]> {
        const result = (await this.store?.create(entities, schema)) ?? false;

        if (result === false) {
            return false;
        }

        await this.database.upsert(
            new EntitySet({
                query: createIdQueryFromEntities(schema, result),
                entities: result as T[],
            })
        );

        this.emitAllWatchedQueries();

        return result as T[];
    }

    async update<T extends Entity>(entities: DeepPartial<T>[], schema: IEntitySchema): Promise<false | T[]> {
        const result = (await this.store?.update(entities, schema)) ?? false;

        if (result === false) {
            return false;
        }

        await this.database.upsert(
            new EntitySet({
                query: createIdQueryFromEntities(schema, entities),
                entities,
            })
        );

        this.emitAllWatchedQueries();

        return result as T[];
    }

    delete(entities: Entity[], schema: IEntitySchema): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    clear(): void {
        this.database.clear();
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
