import {
    EntityBlueprint,
    EntityQuery,
    EntityQueryParameters,
    unpackSelection,
    whereEntityToCriterion,
} from "@entity-space/elements";
import { Class } from "@entity-space/utils";
import { concat, defer, delay, finalize, from, map, Observable, of, switchMap } from "rxjs";
import { EntityCache } from "./cache/entity-cache";
import { EntityHydrationBuilder } from "./entity-hydration-builder";
import { EntityMutationBuilder } from "./entity-mutation-builder";
import { EntityQueryBuilder } from "./entity-query-builder";
import { EntityQueryExecutionContext } from "./entity-query-execution-context";
import { EntityQueryExecutor } from "./entity-query-executor";
import { EntityServiceContainer } from "./entity-service-container";
import { HydrateArguments, QueryArguments, QueryCacheOptions } from "./execution-arguments.interface";
import { EntityMutationExecutor } from "./mutation/entity-mutation-executor";
import { MutationOperation } from "./mutation/mutation-operation";
import { toSourcedEntities } from "./sourcing/to-sourced-entities.fn";

export class EntityWorkspace {
    constructor(services: EntityServiceContainer) {
        this.#services = services;
        this.#executor = new EntityQueryExecutor(services);
        this.#mutationExecutor = new EntityMutationExecutor(services);
    }

    readonly #services: EntityServiceContainer;
    readonly #executor: EntityQueryExecutor;
    readonly #mutationExecutor: EntityMutationExecutor;

    for<T>(blueprint: Class<T>): EntityHydrationBuilder<EntityBlueprint.Instance<T>> {
        return new EntityHydrationBuilder(blueprint, args => this.#hydrate$(args));
    }

    from<T>(blueprint: Class<T>): EntityQueryBuilder<EntityBlueprint.Instance<T>> {
        const schema = this.#services.getCatalog().getSchemaByBlueprint(blueprint);
        return new EntityQueryBuilder(schema, args => this.#query$(args));
    }

    in<T>(blueprint: Class<T>): EntityMutationBuilder<T> {
        const schema = this.#services.getCatalog().getSchemaByBlueprint(blueprint);
        return new EntityMutationBuilder(schema, operation => this.#mutate(operation));
    }

    #query$<T>(args: QueryArguments): Observable<T[]> {
        return defer(() => {
            const schema = args.schema;
            const criteria = args.where ? whereEntityToCriterion(args.where) : undefined;
            const selection = unpackSelection(schema, args.select ?? {});
            const parameters = args.parameters
                ? new EntityQueryParameters(
                      this.#services.getCatalog().getSchemaByBlueprint(args.parameters.blueprint),
                      args.parameters.value,
                  )
                : undefined;

            const query = new EntityQuery(schema, selection, criteria, parameters);
            const cacheOptions = this.#toCacheOptions(args.cache);
            const cacheKey = cacheOptions ? cacheOptions.key : undefined;
            const loadFreshDelay = cacheOptions === false ? 0 : (cacheOptions.refreshDelay ?? 0);
            this.#services.getTracing().querySpawned(query);

            let stream$: Observable<T[]>;

            if (cacheOptions === false) {
                stream$ = this.#loadFromSource$<T>(query);
            } else if (!cacheOptions.refresh) {
                stream$ = this.#loadFromCacheAndSource$<T>(query, cacheKey);
            } else {
                stream$ = this.#loadFromCacheThenRefreshFromSource$<T>(query, cacheKey, loadFreshDelay);
            }

            return stream$.pipe(
                finalize(() => {
                    this.#services.getTracing().queryResolved(query);
                }),
            );
        });
    }

    #loadFromSource$<T>(query: EntityQuery): Observable<T[]> {
        const cache = new EntityCache();
        const context = new EntityQueryExecutionContext(cache, { loadFromSource: true });

        return defer(() => {
            return this.#executor.executeQuery<T>(query, context);
        });
    }

    #loadFromCacheAndSource$<T>(query: EntityQuery, cacheKey: unknown): Observable<T[]> {
        const cache = this.#services.getOrCreateCacheBucket(cacheKey);
        const context = new EntityQueryExecutionContext(cache, { loadFromSource: true, readFromCache: true });

        return defer(() => {
            return this.#executor.executeQuery<T>(query, context);
        });
    }

    #loadFromCacheThenRefreshFromSource$<T>(
        query: EntityQuery,
        cacheKey: unknown,
        refreshDelay: number,
    ): Observable<T[]> {
        const cache = this.#services.getOrCreateCacheBucket(cacheKey);

        return concat(
            defer(() => {
                const context = new EntityQueryExecutionContext(cache, { loadFromSource: false, readFromCache: true });
                return this.#executor.executeQuery<T>(query, context);
            }),
            defer(() => {
                return of(undefined).pipe(
                    delay(refreshDelay),
                    switchMap(() => {
                        const context = new EntityQueryExecutionContext(cache, {
                            loadFromSource: true,
                            readFromCache: false,
                        });

                        return this.#executor.executeQuery<T>(query, context);
                    }),
                );
            }),
        );
    }

    #hydrate$<T>(args: HydrateArguments): Observable<T[]> {
        return defer(() => {
            const schema = this.#services.getCatalog().getSchemaByBlueprint(args.blueprint);
            const sourcedEntities = toSourcedEntities(schema, args.entities, unpackSelection(schema, args.select));
            const cacheOptions = this.#toCacheOptions(args.cache);
            const cacheKey = cacheOptions ? cacheOptions.key : undefined;
            const cache = this.#services.getOrCreateCacheBucket(cacheKey);
            const hydrationDescription = this.#executor.describeHydration(sourcedEntities);

            if (!hydrationDescription) {
                throw new Error("no idea how to hydrate that");
            }

            const context = new EntityQueryExecutionContext(cache, {
                readFromCache: cacheOptions !== false,
                loadFromSource: true,
            });

            return from(
                this.#executor.executeDescribedHydration(
                    args.entities,
                    sourcedEntities.getAvailableSelection(),
                    hydrationDescription,
                    context,
                ),
            ).pipe(
                map(() => {
                    return args.entities as T[];
                }),
            );
        });
    }

    async #mutate<T>(operation: MutationOperation): Promise<T[]> {
        // [todo] validate entities in each operation before we do anything
        // for (const operation of operations) {
        // [todo] map entities to omit properties not needed, for example for create:
        // - readonly ids (keep writable readonly ids)
        // - other readonly properties
        // - relations not specified in selection
        /**
         * [artist + songs]
         * 1) create artist
         * 2) assign artistId to songs
         * 3) create songs
         */
        /**
         * [artist + country + songs]
         * 1) create country
         * 2) assign countryId to artist
         * 3) create artist
         * 4) assign artistId to songs
         * 5) create songs
         */
        /**
         * [artist + country + songs + songs.country] (songs.country doesn't exist, need a proper example)
         * 1) create country
         * 2) assign countryId to artist
         * 3) create artist
         * 4) assign artistId to songs
         * 5) create song countries which were not created for artist
         * 6) assign song country id
         * 7) create songs
         */
        /**
         * [artist + albums + songs + songs.album]
         * => hmm!
         */
        // }

        return this.#mutationExecutor.executeMutation(operation);
    }

    #toCacheOptions(options?: QueryCacheOptions | boolean): QueryCacheOptions | false {
        if (options === true) {
            return {};
        } else if (options === false || options === undefined) {
            return false;
        } else {
            return options;
        }
    }
}
