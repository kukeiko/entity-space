import {
    copyEntities,
    Criterion,
    Entity,
    EntityPage,
    EntityQuery,
    EntityQueryParameters,
    EntitySchema,
    EntitySort,
    isHydrated,
    matchesCriterion,
    mergeEntities,
    sortEntities,
} from "@entity-space/elements";
import { isDefined } from "@entity-space/utils";
import { isEqual } from "lodash";
import { Observable, Subject } from "rxjs";
import { EntityQueryExecutionContext } from "../entity-query-execution-context";
import { EntityPagedCache } from "./entity-paged-cache";
import { EntityStoreUniqueIndex } from "./entity-store-unique-index";
import { EntityUnpagedCache } from "./entity-unpaged-cache";

export class EntityStore {
    constructor(schema: EntitySchema) {
        if (!schema.hasId()) {
            throw new Error(`can't create an EntityStore for entity type ${schema.getName()} that has no id defined`);
        }

        this.#schema = schema;
        this.#idIndex = new EntityStoreUniqueIndex(schema.getIdPaths());
    }

    readonly #schema: EntitySchema;
    readonly #idIndex: EntityStoreUniqueIndex;
    readonly #changed = new Subject<EntityQueryExecutionContext | undefined>();
    #unpagedCaches: EntityUnpagedCache[] = [];
    #pagedCaches: EntityPagedCache[] = [];
    #entities: (Entity | undefined)[] = [];

    getAll(): Entity[] {
        return this.#entities.filter(isDefined);
    }

    get(entity: Entity): Entity | undefined {
        const slot = this.#idIndex.get(entity);

        if (slot === undefined) {
            return undefined;
        }

        return this.#entities[slot];
    }

    query(query: EntityQuery): Entity[] {
        const criterion = query.getCriterion();
        const selection = query.getSelection();
        const parameters = query.getParameters();
        const sort = query.getSort();
        const page = query.getPage();

        let applyPaging = false;
        let applyFiltering = false;
        let entities: Entity[] = [];

        if (page === undefined) {
            const cache = this.#getUnpagedCache(parameters);

            if (cache === undefined) {
                return [];
            }

            const ids = cache.getEntities();
            // [todo] ❌ performance regression: we now always map from id to entity, even if parameters is undefined
            entities = ids.map(id => this.get(id)).filter(isDefined);
            applyPaging = page !== undefined;
            applyFiltering = criterion !== undefined;
        } else {
            const unpagedCache = this.#getUnpagedCacheFulfillingCriterion(parameters, criterion);

            if (unpagedCache !== undefined) {
                const ids = unpagedCache.getEntities();
                entities = ids.map(id => this.get(id)).filter(isDefined);
                applyPaging = true;
                applyFiltering = criterion !== undefined;
            } else {
                const cache = this.#getPagedCache(parameters, criterion);

                if (cache === undefined) {
                    return [];
                }

                if (sort === undefined) {
                    throw new Error("invalid query - 'sort' must be defined if 'page' is defined");
                }

                const ids = cache.getPage(sort, page);
                entities = ids.map(id => this.get(id)).filter(isDefined);
            }
        }

        if (applyFiltering && criterion !== undefined) {
            entities = entities.filter(matchesCriterion(criterion));
        }

        if (selection !== undefined) {
            entities = entities.filter(entity => isHydrated(entity, selection));
        }

        if (applyPaging && page !== undefined) {
            const sort = query.getSort();

            if (sort === undefined) {
                throw new Error("invalid query - 'sort' must be defined if 'page' is defined");
            }

            const skip = page.getSkip();
            const top = page.getTop();
            entities = sortEntities(entities, sort).slice(skip, top === undefined ? undefined : skip + top);
        }

        entities = copyEntities(this.#schema, entities);

        return entities;
    }

    upsert(
        entities: readonly Entity[],
        parameters?: EntityQueryParameters,
        criterion?: Criterion,
        sort?: EntitySort,
        page?: EntityPage,
        context?: EntityQueryExecutionContext,
    ): void {
        let madeChanges = this.#upsertToBaseCache(entities);

        // [todo] ❌ implement "madeChanges". see commented out code below
        if (page === undefined) {
            const unpagedCache = this.#getOrCreateUnpagedCache(parameters);
            unpagedCache.addEntities(entities, criterion);
            this.#evictObsoletePagedCaches(parameters, criterion);
        } else if (page !== undefined && sort !== undefined) {
            const pagedCache = this.#getOrCreatePagedCache(parameters, criterion);
            pagedCache.setPage(entities, sort, page);
        }

        // if (parameters !== undefined) {
        //     const previous = this.#parametersCache.get(parameters, paging);
        //     const next = entities.map(entity => entityToId(this.#schema, entity));

        //     if (!isEqual(previous, next)) {
        //         this.#parametersCache.set(
        //             parameters,
        //             entities.map(entity => entityToId(this.#schema, entity)),
        //             paging,
        //         );

        //         madeChanges = true;
        //     }
        // } else if (paging !== undefined) {
        //     const previous = this.#cache.getPage(paging);
        //     const next = entities.map(entity => entityToId(this.#schema, entity));

        //     if (!isEqual(previous, next)) {
        //         this.#cache.setPage(
        //             paging,
        //             entities.map(entity => entityToId(this.#schema, entity)),
        //         );

        //         madeChanges = true;
        //     }
        // }

        if (madeChanges) {
            this.#changed.next(context);
        }
    }

    remove(entity: Entity): void {
        const slot = this.#idIndex.get(entity);

        if (slot === undefined) {
            return;
        }

        this.#entities[slot] = undefined;
        this.#idIndex.delete(entity);
    }

    onChange(): Observable<EntityQueryExecutionContext | undefined> {
        return this.#changed.asObservable();
    }

    clear(): void {
        this.#entities = [];
        this.#idIndex.clear();
    }

    #upsertToBaseCache(entities: readonly Entity[]): boolean {
        let madeChanges = false;

        for (const entity of entities) {
            const slot = this.#idIndex.get(entity);

            if (slot === undefined) {
                this.#idIndex.set(entity, this.#entities.length);
                this.#entities.push(entity);
                madeChanges = true;
            } else {
                const previous = this.#entities[slot]!;

                if (!isEqual(previous, entity)) {
                    this.#entities[slot] = mergeEntities([previous, entity]);
                    madeChanges = true;
                }
            }
        }

        return madeChanges;
    }

    #getUnpagedCache(parameters?: EntityQueryParameters): EntityUnpagedCache | undefined {
        return this.#unpagedCaches.find(cache => cache.hasEqualParameters(parameters));
    }

    #getOrCreateUnpagedCache(parameters?: EntityQueryParameters): EntityUnpagedCache {
        let unpagedCache = this.#getUnpagedCache(parameters);

        if (unpagedCache === undefined) {
            unpagedCache = new EntityUnpagedCache(parameters);
            this.#unpagedCaches.push(unpagedCache);
        }

        return unpagedCache;
    }

    #getUnpagedCacheFulfillingCriterion(
        parameters?: EntityQueryParameters,
        criterion?: Criterion,
    ): EntityUnpagedCache | undefined {
        return this.#unpagedCaches.find(cache => cache.hasEqualParameters(parameters) && cache.hasCriterion(criterion));
    }

    #getPagedCache(parameters?: EntityQueryParameters, criterion?: Criterion): EntityPagedCache | undefined {
        return this.#pagedCaches.find(
            cache => cache.hasEqualParameters(parameters) && cache.hasEquivalentCriterion(criterion),
        );
    }

    #getOrCreatePagedCache(parameters?: EntityQueryParameters, criterion?: Criterion): EntityPagedCache {
        let pagedCache = this.#getPagedCache(parameters, criterion);

        if (pagedCache === undefined) {
            pagedCache = new EntityPagedCache(parameters, criterion);
            this.#pagedCaches.push(pagedCache);
        }

        return pagedCache;
    }

    #evictObsoletePagedCaches(parameters?: EntityQueryParameters, criterion?: Criterion): void {
        this.#pagedCaches = this.#pagedCaches.filter(pagedCache => {
            if (!pagedCache.hasEqualParameters(parameters)) {
                return true;
            } else if (criterion === undefined) {
                return false;
            } else {
                return pagedCache.hasSubsetCriterion(criterion);
            }
        });
    }
}
