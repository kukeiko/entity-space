import { Class, DeepPartial, isNotFalse } from "@entity-space/utils";
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
import { Entity } from "../common/entity.type";
import { BlueprintInstance } from "../schema/blueprint-instance";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { IEntitySchema } from "../schema/schema.interface";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { any } from "../criteria/criterion/any/any.fn";
import { Criterion } from "../criteria/criterion/criterion";
import { matches, MatchesBagArgument } from "../criteria/criterion/named/matches.fn";
import { never } from "../criteria/criterion/never/never.fn";
import { EntitySet } from "../entity/data-structures/entity-set";
import { createCriterionFromEntities } from "../entity/functions/create-criterion-from-entities.fn";
import { createIdQueryFromEntities } from "../entity/functions/create-id-query-from-entities.fn";
import { normalizeEntities } from "../entity/functions/normalize-entities.fn";
import { IEntityStore } from "../entity/i-entity-store";
import { InMemoryEntityDatabase } from "../entity/in-memory-entity-database";
import { EntityQuery } from "../query/entity-query";
import { QueryPaging } from "../query/query-paging";
import { subtractQueries } from "../query/subtract-queries.fn";
import { EntityQueryBuilder, EntityQueryBuilderArgument } from "./entity-query-builder";
import { EntityQueryTracing } from "./entity-query-tracing";
import { EntityStream } from "./entity-stream";
import { EntityStreamPacket } from "./entity-stream-packet";
import { IEntityStreamInterceptor } from "./i-entity-stream-interceptor";
import { SchemaRelationBasedHydrator } from "./interceptors/schema-relation-based-hydrator";
import { runInterceptors } from "./run-interceptors.fn";
import { ScopedEntityWorkspace } from "./scoped-entity-workspace";

// [todo] move to "execution" folder
export class EntityWorkspace implements IEntityStore, IEntityStreamInterceptor {
    constructor(private readonly tracing: EntityQueryTracing) {}

    private store?: IEntityStore;
    private schemas?: EntitySchemaCatalog;
    private readonly database = new InMemoryEntityDatabase();
    private readonly watchedQueries = new Map<EntityQuery, Subject<Entity[]>>();
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
    async query<T extends Entity = Entity>(query: EntityQuery): Promise<false | EntitySet<T>[]> {
        const sources = [...this.interceptors, new SchemaRelationBasedHydrator(this.tracing, [this])];
        const cachedQueries = this.database.getCachedQueries(query.getEntitySchema());
        const reduced = subtractQueries([query], cachedQueries);
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

    intercept(stream: EntityStream<Entity>): EntityStream<Entity> {
        return merge(
            stream.pipe(map(EntityStreamPacket.withoutRejected), filter(EntityStreamPacket.isNotEmpty)),
            stream.pipe(
                map(EntityStreamPacket.withOnlyRejected),
                filter(EntityStreamPacket.isNotEmpty),
                switchMap(packet =>
                    merge(...packet.getRejectedQueries().map(query => this.query(query))).pipe(
                        filter(isNotFalse),
                        map(payload => of(new EntityStreamPacket({ payload })))
                    )
                ),
                mergeAll()
            )
        );
    }

    // [todo] not reactive yet
    hydrate$<T extends Entity>(
        schema: IEntitySchema<T>,
        entities: T[],
        selection: UnpackedEntitySelection<T>
    ): Observable<T[]> {
        if (!entities.length) {
            return of([]);
        }

        if (!schema) {
            return EMPTY;
        }
        const criteria = createCriterionFromEntities(entities, schema.getKey().getPath());
        const entitySetQuery = new EntityQuery({
            entitySchema: schema,
            criteria,
            // [todo] selection missing
        });

        const hydrationQuery = new EntityQuery({ entitySchema: schema, criteria, selection });
        const cachedQueries = this.database.getCachedQueries(hydrationQuery.getEntitySchema());
        const reduced = subtractQueries([hydrationQuery], cachedQueries);
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
                    return merge(stream, of(new EntityStreamPacket({ payload: [entitySet] })));
                },
            };

            return runInterceptors([kickstartHydrationSource, hydrator], [hydrationQuery]).pipe(
                map(() => {
                    const entities = this.database.querySync(hydrationQuery).getEntities();
                    // [todo] should only trace "resolved" once
                    this.tracing.queryResolved(hydrationQuery, JSON.stringify(entities));
                    return entities;
                })
            ) as Observable<T[]>;
        } else {
            this.tracing.queryGotFullySubtracted(hydrationQuery, cachedQueries, { byLabel: "by cached" });
            const entities = this.database.querySync(hydrationQuery).getEntities();
            this.tracing.queryResolved(hydrationQuery, JSON.stringify(entities));
            return of(entities) as Observable<T[]>;
        }
    }

    query$<T extends Entity>(
        schema: IEntitySchema<T>,
        criterion: Criterion | MatchesBagArgument<T> = any(),
        selection?: UnpackedEntitySelection<T>,
        options: Criterion | MatchesBagArgument<Entity> = never(),
        paging?: { skip?: number; top?: number; from?: number; to?: number }
    ): Observable<T[]> {
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

        const query = new EntityQuery({
            entitySchema: schema,
            criteria: criterion,
            selection: selection,
            options,
            paging: queryPaging,
        });

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

    // [todo] should stay async because at one point i want to make use of service-workers
    // [todo] should not exist at all? (or be private)
    async queryAgainstCache(query: EntityQuery): Promise<Entity[]> {
        return this.database.querySync(query).getEntities();
    }

    queryCacheChanged$(): Observable<EntityQuery[]> {
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

    scope<T extends Entity>(blueprint: Class<T>): ScopedEntityWorkspace<BlueprintInstance<T>> {
        // [todo] to be removed by making schemas not undefined
        if (!this.schemas) {
            throw new Error("this.schemas is falsy");
        }

        const schema = this.schemas.resolve(blueprint);

        return new ScopedEntityWorkspace({ schema, workspace: this });
    }

    from<T extends Entity>(blueprint: Class<T>): EntityQueryBuilder<BlueprintInstance<T>> {
        // [todo] to be removed by making schemas not undefined
        if (!this.schemas) {
            throw new Error("this.schemas is falsy");
        }

        const schema = this.schemas.resolve(blueprint);

        return new EntityQueryBuilder({ schema, workspace: this });
    }

    protected getQueryBuilderParts<T extends Entity = Entity>(schema: IEntitySchema<T>): EntityQueryBuilderArgument<T> {
        return {
            schema,
            workspace: this,
        };
    }
}
