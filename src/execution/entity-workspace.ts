import {
    Entity,
    EntityBlueprint,
    EntityQuery,
    EntityQueryParameters,
    getSelectedSchemas,
    unpackSelection,
    whereEntityToCriterion,
    writeRelationJoins,
} from "@entity-space/elements";
import { Class } from "@entity-space/utils";
import { uniqBy } from "lodash";
import {
    concat,
    defer,
    delay,
    filter,
    finalize,
    from,
    map,
    Observable,
    of,
    startWith,
    Subject,
    switchMap,
    tap,
} from "rxjs";
import { EntityCache } from "./cache/entity-cache";
import { EntityHydrationBuilder } from "./entity-hydration-builder";
import { EntityMutationBuilder } from "./entity-mutation-builder";
import { EntityQueryBuilder } from "./entity-query-builder";
import { EntityQueryExecutionContext } from "./entity-query-execution-context";
import { EntityServiceContainer } from "./entity-service-container";
import { HydrateArguments, QueryArguments, QueryCacheOptions } from "./execution-arguments.interface";
import { executeQuery } from "./functions/execute-query.fn";
import { describeHydration } from "./hydration/functions/describe-hydration.fn";
import { executeDescribedHydration } from "./hydration/functions/execute-described-hydration.fn";
import { AcceptedEntityMutation } from "./mutation/accepted-entity-mutation";
import { EntityChanges } from "./mutation/entity-changes";
import { EntityMutation } from "./mutation/entity-mutation";
import { EntityMutator } from "./mutation/entity-mutator";
import { generatePathedMutators } from "./mutation/generate-pathed-mutators.fn";
import { sortAcceptedMutationsByDependency } from "./mutation/sort-accepted-mutations-by-dependency.fn";
import { toEntityChanges } from "./mutation/to-entity-changes.fn";
import { expandSourcedSelection } from "./sourcing/functions/expand-source-selection.fn";
import { toSourcedEntities } from "./sourcing/to-sourced-entities.fn";

export class EntityWorkspace {
    constructor(services: EntityServiceContainer) {
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

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

    getOrCreateCacheBucket(key: unknown): EntityCache {
        return this.#services.getOrCreateCacheBucket(key);
    }

    destroyCache(key: unknown): void {
        return this.#services.destroyCache(key);
    }

    upsertToCache<B>(blueprint: Class<B>, entity: EntityBlueprint.Type<B>, cacheKey?: unknown): void {
        const cache = this.#services.getOrCreateCacheBucket(cacheKey);
        const schema = this.#services.getCatalog().getSchemaByBlueprint(blueprint);
        cache.upsert(schema, [entity]);
    }

    #query$<T>({
        schema,
        cache,
        isLoading$,
        parameters: parametersArg,
        select,
        where,
    }: QueryArguments): Observable<T[]> {
        return defer(() => {
            const criteria = where ? whereEntityToCriterion(where) : undefined;
            const selection = unpackSelection(schema, select ?? {});
            const parameters = parametersArg
                ? new EntityQueryParameters(
                      this.#services.getCatalog().getSchemaByBlueprint(parametersArg.blueprint),
                      parametersArg.value,
                  )
                : undefined;

            const query = new EntityQuery(schema, selection, criteria, parameters);
            const cacheOptions = this.#toCacheOptions(cache);
            const cacheKey = cacheOptions ? cacheOptions.key : undefined;
            const loadFreshDelay = cacheOptions === false ? 0 : (cacheOptions.refreshDelay ?? 0);
            this.#services.getTracing().querySpawned(query);
            let stream$: Observable<T[]>;

            if (cacheOptions === false) {
                stream$ = this.#loadFromSource$<T>(query, isLoading$);
            } else {
                const cache = this.#services.getOrCreateCacheBucket(cacheKey);
                const reactiveAdditionalBlueprints =
                    typeof cacheOptions.reactive === "object" ? cacheOptions.reactive.additionalBlueprints : undefined;

                const reload$ = cacheOptions.reactive
                    ? this.#getReactiveReloadTrigger(query, cache, reactiveAdditionalBlueprints)
                    : of(undefined);
                let load$: Observable<T[]>;

                if (!cacheOptions.refresh) {
                    load$ = this.#loadFromCacheAndSource$<T>(query, cache, isLoading$);
                } else {
                    load$ = this.#loadFromCacheThenRefreshFromSource$<T>(query, cache, loadFreshDelay, isLoading$);
                }

                stream$ = reload$.pipe(switchMap(() => load$));
            }

            return stream$.pipe(
                finalize(() => {
                    this.#services.getTracing().queryResolved(query);
                }),
            );
        });
    }

    #loadFromSource$<T>(query: EntityQuery, isLoading$?: Subject<boolean>): Observable<T[]> {
        const cache = new EntityCache();
        const context = new EntityQueryExecutionContext(query, cache, { loadFromSource: true });

        return defer(() => {
            isLoading$?.next(true);

            return executeQuery<T>(this.#services, query, context);
        }).pipe(finalize(() => isLoading$?.next(false)));
    }

    #loadFromCacheAndSource$<T>(
        query: EntityQuery,
        cache: EntityCache,
        isLoading$?: Subject<boolean>,
    ): Observable<T[]> {
        const context = new EntityQueryExecutionContext(query, cache, {
            loadFromSource: true,
            readFromCache: true,
            writeToCache: true,
        });

        return defer(() => {
            isLoading$?.next(true);
            return executeQuery<T>(this.#services, query, context);
        }).pipe(finalize(() => isLoading$?.next(false)));
    }

    #loadFromCacheThenRefreshFromSource$<T>(
        query: EntityQuery,
        cache: EntityCache,
        refreshDelay = 0,
        isLoading$?: Subject<boolean>,
    ): Observable<T[]> {
        return concat(
            defer(() => {
                if (!cache.subtractByCache(query)) {
                    refreshDelay = 0;
                }

                const context = new EntityQueryExecutionContext(query, cache, {
                    loadFromSource: false,
                    readFromCache: true,
                });
                return executeQuery<T>(this.#services, query, context);
            }),
            defer(() => {
                return of(undefined).pipe(
                    delay(refreshDelay),
                    switchMap(() => {
                        isLoading$?.next(true);
                        const context = new EntityQueryExecutionContext(query, cache, {
                            loadFromSource: true,
                            readFromCache: false,
                            writeToCache: true,
                        });

                        return executeQuery<T>(this.#services, query, context);
                    }),
                    finalize(() => {
                        isLoading$?.next(false);
                    }),
                );
            }),
        );
    }

    #hydrate$<T>(args: HydrateArguments): Observable<T[]> {
        return defer(() => {
            const schema = this.#services.getCatalog().getSchemaByBlueprint(args.blueprint);
            const sourcedEntities = toSourcedEntities(schema, args.entities, unpackSelection(schema, args.select));

            if (sourcedEntities.getOpenSelection() === undefined) {
                return of(args.entities as T[]);
            }

            const cacheOptions = this.#toCacheOptions(args.cache);
            const cacheKey = cacheOptions ? cacheOptions.key : undefined;
            const cache = this.#services.getOrCreateCacheBucket(cacheKey);
            const hydrationDescription = describeHydration(this.#services, sourcedEntities);

            if (!hydrationDescription) {
                throw new Error("no idea how to hydrate that");
            }

            // [todo] ❌ this is a fake query - just to temporarily satisfy the context requiring a query.
            // not yet sure how to solve this, as I want a context to always have a query attached.
            const query = new EntityQuery(schema, {});

            const context = new EntityQueryExecutionContext(query, cache, {
                readFromCache: cacheOptions !== false,
                loadFromSource: true,
            });

            return from(
                executeDescribedHydration(
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

    async #mutate(mutation: EntityMutation): Promise<Entity[]> {
        writeRelationJoins(mutation.getSchema(), mutation.getEntities(), mutation.getSelection() ?? {});
        const entityChanges = toEntityChanges(mutation);

        if (entityChanges === undefined) {
            return mutation.getEntities();
        }

        const mutators: EntityMutator[] = [
            ...this.#services.getExplicitMutatorsFor(mutation.getSchema()),
            ...generatePathedMutators(this.#services, mutation.getSchema(), mutation.getSelection() ?? {}),
        ];
        let nextEntityChanges: EntityChanges | undefined = entityChanges;
        const allAccepted: AcceptedEntityMutation[] = [];

        for (const mutator of mutators) {
            const [accepted, open] = mutator.accept(nextEntityChanges, undefined);

            if (accepted === undefined) {
                continue;
            }

            allAccepted.push(accepted);
            nextEntityChanges = open;

            if (nextEntityChanges === undefined) {
                break;
            }
        }

        if (nextEntityChanges !== undefined) {
            throw new Error("not all mutations have been accepted");
        }

        for (const mutation of sortAcceptedMutationsByDependency(allAccepted)) {
            await mutation.mutate();
        }

        return mutation.getEntities();
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

    #getReactiveReloadTrigger(
        query: EntityQuery,
        cache: EntityCache,
        additionalBlueprints?: readonly Class[],
    ): Observable<void> {
        const expandedSelection = expandSourcedSelection(this.#services, query.getSchema(), query.getSelection());
        let selectedSchemas = getSelectedSchemas(query.getSchema(), expandedSelection);

        if (additionalBlueprints?.length) {
            const additionalSchemas = additionalBlueprints.map(blueprint =>
                this.#services.getCatalog().getSchemaByBlueprint(blueprint),
            );

            selectedSchemas = uniqBy([...selectedSchemas, ...additionalSchemas], schema => schema.getName());
        }

        return cache.onChanges(selectedSchemas).pipe(
            filter(change => change?.getQuery() !== query),
            tap(() => this.#services.getTracing().reissuedReactiveQuery(query)),
            map(() => undefined),
            startWith(undefined),
        );
    }
}
