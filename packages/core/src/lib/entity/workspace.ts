import { any, Criterion, fromDeepBag, isValue, matches, MatchesBagArgument } from "@entity-space/criteria";
import { Class, DeepPartial, isDefined, tramplePath } from "@entity-space/utils";
import { flatMap, isEqual, xor, xorWith } from "lodash";
import {
    defaultIfEmpty,
    distinctUntilChanged,
    EMPTY,
    filter,
    finalize,
    from,
    lastValueFrom,
    map,
    Observable,
    of,
    ReplaySubject,
    scan,
    startWith,
    Subject,
    switchMap,
} from "rxjs";
import { ExpansionValue } from "../expansion";
import { IEntityHydrator, IEntitySource, mergeQueries, Query, QueryStreamPacket, reduceQueries } from "../query";
import { IEntitySchema } from "../schema/schema.interface";
import { BlueprintResolver, Instance } from "./blueprint";
import { EntityHydrationQuery, EntitySet } from "./data-structures";
import { Entity } from "./entity";
import { normalizeEntities } from "./functions";
import { createCriterionFromEntities } from "./functions/create-criterion-from-entities.fn";
import { IEntityStore } from "./i-entity-store";
import { InMemoryEntityDatabase } from "./in-memory-entity-database";

export class Workspace implements IEntityStore {
    private source?: IEntitySource;
    private store?: IEntityStore;
    private hydrator?: IEntityHydrator;
    private blueprintResolver?: BlueprintResolver;
    private readonly queryCaches = new Map<string, Query[]>();
    private readonly queryCacheChanged = new Subject<Query[]>();
    // private readonly entityCache = new EntityCache();
    private readonly entityCache = new InMemoryEntityDatabase();
    private readonly watchedQueries = new Map<Query, Subject<Entity[]>>();

    onQueryCacheChanged(): Observable<Query[]> {
        return this.queryCacheChanged.asObservable();
    }

    // [todo] rename to upsert()?
    // [todo] we allow partials, but types don't reflect that (same @ cache and store)
    add<T>(schema: Class<T>, entities: DeepPartial<Instance<T>>[] | DeepPartial<Instance<T>>): void;
    add<T extends Entity = Entity>(schema: IEntitySchema, entities: DeepPartial<T>[] | DeepPartial<T>): void;
    add(schema: IEntitySchema | Class, entities: Entity[] | Entity): void {
        schema = this.toSchema(schema);
        console.log("🆕 add entities", schema.getId(), JSON.stringify(entities));

        if (!Array.isArray(entities)) {
            entities = [entities];
        }

        // [todo] adding the overloads to support both schemas & blueprints caused having to add this "as Entity[]" assertion, no idea why
        const queries = this.entityCache.addEntities(schema, entities as Entity[]);

        for (const query of queries) {
            this.addExecutedQuery(query);
        }

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

    setBlueprintResolver(resolver: BlueprintResolver): void {
        this.blueprintResolver = resolver;
    }

    private addExecutedQuery(query: Query): void {
        const executedQueries = this.getCachedQueries(query.getEntitySchema());
        const merged = mergeQueries(query, ...executedQueries);
        this.queryCaches.set(query.getEntitySchema().getId(), merged);

        const allQueriesInCache: Query[] = [];

        for (const [_, queries] of this.queryCaches) {
            allQueriesInCache.push(...queries);
        }

        this.queryCacheChanged.next(allQueriesInCache);
    }

    private async loadUncachedIntoCache(query: Query): Promise<void> {
        const cachedQueries = this.getCachedQueries(query.getEntitySchema());
        const reduced = reduceQueries([query], cachedQueries);
        const entities: Entity[] = [];
        const queriesAgainstSource = reduced === false ? [query] : reduced;

        // [todo] call in parallel
        for (const queryAgainstSource of queriesAgainstSource) {
            const result = await this.loadFromSource(queryAgainstSource);

            if (result === false) {
                console.warn(
                    "encountered a query that could not be executed against source",
                    queriesAgainstSource.join(",")
                );
                continue;
            }

            for (const queried of result) {
                entities.push(...queried.getEntities());
            }

            // [todo] should it not be queryAgainstSource?
            // if not, move out of loop
            // [todo] actually, maybe it should be result[i].getQuery()?
            // this.addExecutedQuery(query);
            // [todo] for now i decided caching queryAgainstSource, as that fixes the issue in products example
            // where you execute criteria = any, expansion = reviews, and since the controller endpoint doesn't
            // support any expansion, we don't get reviews back, but we cache it as if we had, so a subsequent
            // call using e.g. minRating = 3 won't have reviews included
            this.addExecutedQuery(queryAgainstSource);
        }

        if (entities.length > 0) {
            this.add(query.getEntitySchema(), entities);
        }
    }

    private async loadFromSource(query: Query): Promise<false | EntitySet[]> {
        if (!this.source) {
            return false;
        }

        const cache = new InMemoryEntityDatabase();
        const mergedPacket = await lastValueFrom(
            this.source
                .query$([query], cache)
                .pipe(scan(QueryStreamPacket.concat), defaultIfEmpty(new QueryStreamPacket()))
        );

        if (!mergedPacket.getAcceptedQueries().length) {
            return false;
        }

        const result = cache.querySync(query);

        return result ? [result] : result;
    }

    // [todo] T not used yet; need to add it to QueriedEntities
    async query<T extends Entity = Entity>(query: Query): Promise<false | EntitySet<T>[]> {
        await this.loadUncachedIntoCache(query);
        const entities = (await this.queryAgainstCache(query)) as T[];

        return [new EntitySet({ query, entities })];
    }

    // [todo] not reactive yet
    hydrate$<T>(
        blueprint: Class<T>,
        entities: Instance<T>[],
        expansion: ExpansionValue<Instance<T>>
    ): Observable<Instance<T>[]> {
        if (!this.hydrator) {
            return EMPTY;
        }

        const schema = this.blueprintResolver?.resolve(blueprint);

        if (!schema) {
            return EMPTY;
        }

        const criteria = createCriterionFromEntities(entities, schema.getKey().getPath());
        const query = new Query(schema, criteria, expansion);
        const database = new InMemoryEntityDatabase();
        database.addEntities(schema, entities);

        const hydrationQuery = new EntityHydrationQuery<Instance<T>>({
            entitySet: new EntitySet({ query: new Query(schema, criteria), entities }),
            query,
        });

        return this.hydrator.hydrate$(hydrationQuery, database).pipe(
            map(() => {
                return database.querySync(query).getEntities();
            })
        ) as Observable<Instance<T>[]>;
    }

    query$<T extends Entity>(
        schema: IEntitySchema,
        criterion?: Criterion | MatchesBagArgument<T>,
        expansion?: ExpansionValue<T>
    ): Observable<T[]>;
    query$<T extends Entity>(
        schema: Class<T>,
        criterion?: MatchesBagArgument<T>,
        expansion?: ExpansionValue<Instance<T>>
    ): Observable<Instance<T>[]>;
    query$<T extends Entity>(
        schema: IEntitySchema | Class<T>,
        criterion: any = any(),
        expansion: ExpansionValue<T> = {}
    ): Observable<T[]> {
        if (!("getId" in schema)) {
            const resolvedSchema = this.blueprintResolver?.resolve(schema);

            if (!resolvedSchema) {
                throw new Error(`failed to resolve blueprint to schema for type ${schema.name}`);
            }

            schema = resolvedSchema;
        }

        if (!(criterion instanceof Criterion)) {
            criterion = matches(criterion);
        }

        const query = new Query(schema, criterion, expansion);
        // const subject = new Subject<Entity[]>();
        const subject = new ReplaySubject<Entity[]>(1);

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
                    finalize(() => {
                        console.log(`🧹 clean up query ${query}`);
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
        expansion?: ExpansionValue<Instance<T>>
    ): Observable<Instance<T>>;
    queryOneByKey$<T extends Entity>(
        schema: IEntitySchema | Class<T>,
        key: number | string,
        expansion: ExpansionValue<T> = {}
    ): Observable<T> {
        if (!("getId" in schema)) {
            const resolvedSchema = this.blueprintResolver?.resolve(schema);

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
        tramplePath(keyPath[0], bag, isValue(key));

        return this.query$(schema, fromDeepBag(bag), expansion).pipe(
            map(result => result[0]),
            filter(isDefined)
        );
    }

    // [todo] remove any
    // [todo] should stay async because at one point i want to make use of service-workers
    // [todo] should not exist at all? (or be private)
    async queryAgainstCache(query: Query): Promise<Entity[]> {
        const result = await this.entityCache.query(query);

        if (result === false) {
            return [];
        }

        return result.map(queried => queried.getEntities()).reduce((acc, value) => [...acc, ...value], []);
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
        this.entityCache.clear();
        this.queryCacheChanged.next([]);
    }

    private getCachedQueries(schema: IEntitySchema): Query[] {
        let cache = this.queryCaches.get(schema.getId());

        if (cache === void 0) {
            cache = [];
            this.queryCaches.set(schema.getId(), cache);
        }

        return cache;
    }

    private toSchema(schema: IEntitySchema | Class): IEntitySchema {
        if (!("getId" in schema)) {
            const resolvedSchema = this.blueprintResolver?.resolve(schema);

            if (!resolvedSchema) {
                throw new Error(`failed to resolve blueprint to schema for type ${schema.name}`);
            }

            return resolvedSchema;
        }

        return schema;
    }
}
