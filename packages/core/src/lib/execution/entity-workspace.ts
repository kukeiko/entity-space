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
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/criterion.interface";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { EntityWhere, IEntityCriteriaTools } from "../criteria/entity-criteria-tools.interface";
import { EntitySet } from "../entity/data-structures/entity-set";
import { IEntityStore } from "../entity/entity-store.interface";
import { normalizeEntities } from "../entity/functions/normalize-entities.fn";
import { InMemoryEntityDatabase } from "../entity/in-memory-entity-database";
import { EntityQueryTools } from "../query/entity-query-tools";
import { IEntityQueryTools } from "../query/entity-query-tools.interface";
import { IEntityQuery } from "../query/entity-query.interface";
import { EntityBlueprintInstance } from "../schema/entity-blueprint-instance.type";
import { EntitySchemaCatalog } from "../schema/entity-schema-catalog";
import { IEntitySchema } from "../schema/schema.interface";
import { EntityQueryBuilder, EntityQueryBuilderArgument } from "./entity-query-builder";
import { EntityQueryTracing } from "./entity-query-tracing";
import { EntityStream } from "./entity-stream";
import { IEntityStreamInterceptor } from "./entity-stream-interceptor.interface";
import { EntityStreamPacket } from "./entity-stream-packet";
import { SchemaRelationBasedHydrator } from "./interceptors/schema-relation-based-hydrator";
import { runInterceptors } from "./run-interceptors.fn";
import { ScopedEntityWorkspace } from "./scoped-entity-workspace";

// [todo] move to "execution" folder
export class EntityWorkspace implements IEntityStore, IEntityStreamInterceptor {
    constructor(private readonly tracing: EntityQueryTracing) {}

    private store?: IEntityStore;
    private schemas?: EntitySchemaCatalog;
    private readonly database = new InMemoryEntityDatabase();
    private readonly watchedQueries = new Map<IEntityQuery, Subject<Entity[]>>();
    interceptors: IEntityStreamInterceptor[] = [];
    private readonly criteriaTools: IEntityCriteriaTools = new EntityCriteriaTools();
    private readonly queryTools: IEntityQueryTools = new EntityQueryTools({ criteriaTools: this.criteriaTools });

    // [todo] rename to upsert()?
    // [todo] we allow partials, but types don't reflect that (same @ cache and store)
    async add<T>(
        schema: Class<T>,
        entities: DeepPartial<EntityBlueprintInstance<T>>[] | DeepPartial<EntityBlueprintInstance<T>>
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
                query: this.queryTools.createIdQueryFromEntities(schema, entities as Entity[]),
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
    async query<T extends Entity = Entity>(query: IEntityQuery): Promise<false | EntitySet<T>[]> {
        const sources = [...this.interceptors, new SchemaRelationBasedHydrator(this.tracing, [this])];
        const cachedQueries = this.database.getCachedQueries(query.getEntitySchema());
        const subtracted = this.queryTools.subtractQueries([query], cachedQueries);
        const queriesAgainstSource = subtracted === false ? [query] : subtracted;

        if (queriesAgainstSource.length) {
            if (subtracted) {
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
        const criteria = this.criteriaTools.createCriterionFromEntities(entities, schema.getKey().getPaths());
        const entitySetQuery = this.queryTools.createQuery({
            entitySchema: schema,
            criteria,
            // [todo] selection missing
        });

        const hydrationQuery = this.queryTools.createQuery({ entitySchema: schema, criteria, selection });
        const cachedQueries = this.database.getCachedQueries(hydrationQuery.getEntitySchema());
        const subtracted = this.queryTools.subtractQueries([hydrationQuery], cachedQueries);
        const queriesAgainstSource = subtracted === false ? [hydrationQuery] : subtracted;

        this.tracing.querySpawned(hydrationQuery);
        if (queriesAgainstSource.length) {
            if (subtracted) {
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
        criterion: ICriterion | EntityWhere<T> = this.criteriaTools.all(),
        selection?: UnpackedEntitySelection<T>,
        parameters?: Entity
    ): Observable<T[]> {
        if (!this.criteriaTools.isCriterion(criterion)) {
            criterion = this.criteriaTools.where(criterion);
        }

        const query = this.queryTools.createQuery({
            entitySchema: schema,
            // [todo] type assertion
            criteria: criterion as ICriterion,
            selection: selection,
            parameters,
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
    async queryAgainstCache(query: IEntityQuery): Promise<Entity[]> {
        return this.database.querySync(query).getEntities();
    }

    queryCache$(): Observable<IEntityQuery[]> {
        return this.database.getQueryCache$();
    }

    async create<T extends Entity>(entities: T[], schema: IEntitySchema): Promise<false | T[]> {
        const result = (await this.store?.create(entities, schema)) ?? false;

        if (result === false) {
            return false;
        }

        await this.database.upsert(
            new EntitySet({
                query: this.queryTools.createIdQueryFromEntities(schema, result),
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
                query: this.queryTools.createIdQueryFromEntities(schema, entities),
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

    scope<T extends Entity>(blueprint: Class<T>): ScopedEntityWorkspace<EntityBlueprintInstance<T>> {
        // [todo] to be removed by making schemas not undefined
        if (!this.schemas) {
            throw new Error("this.schemas is falsy");
        }

        const schema = this.schemas.resolve(blueprint);

        return new ScopedEntityWorkspace({ schema, workspace: this });
    }

    from<T extends Entity>(blueprint: Class<T>): EntityQueryBuilder<EntityBlueprintInstance<T>> {
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
