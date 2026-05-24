import {
    Criterion,
    Entity,
    EntityPage,
    EntityQueryParameters,
    EntitySort,
    isEqualParameters,
    isEquivalentCriterion,
    slicePage,
    subtractCriterion,
} from "@entity-space/elements";
import { isDefined } from "@entity-space/utils";

interface EntityPagedCacheEntry {
    sort: EntitySort;
    cache: (Entity | undefined)[];
}

export class EntityPagedCache {
    constructor(parameters?: EntityQueryParameters, criterion?: Criterion) {
        this.#parameters = parameters;
        this.#criterion = criterion;
    }

    readonly #parameters?: EntityQueryParameters;
    readonly #criterion?: Criterion;
    #paged: EntityPagedCacheEntry[] = [];
    #unpaged: readonly Entity[] | undefined = undefined;

    hasEqualParameters(parameters?: EntityQueryParameters): boolean {
        return isEqualParameters(this.#parameters, parameters);
    }

    hasSupersetCriterion(criterion?: Criterion): boolean {
        if (this.#criterion === undefined) {
            return true;
        } else if (criterion === undefined) {
            return false;
        }

        return subtractCriterion(criterion, this.#criterion) === true;
    }

    hasSubsetCriterion(criterion?: Criterion): boolean {
        if (criterion === undefined) {
            return this.#criterion === undefined;
        } else if (this.#criterion !== undefined) {
            return subtractCriterion(this.#criterion, criterion) === true;
        } else {
            return false;
        }
    }

    hasEquivalentCriterion(criterion?: Criterion): boolean {
        return isEquivalentCriterion(this.#criterion, criterion);
    }

    hasAllPages(): boolean {
        return this.#unpaged !== undefined;
    }

    getAll(): readonly Entity[] {
        return this.#unpaged ?? [];
    }

    getAllPages(): readonly Entity[] {
        return this.#paged.flatMap(entry => entry.cache.filter(isDefined));
    }

    getPage(sort: EntitySort, page: EntityPage): readonly Entity[] {
        const entry = this.#findEntry(sort);

        if (entry === undefined) {
            return [];
        }

        return slicePage(entry.cache, page).filter(isDefined);
    }

    setAll(entities: readonly Entity[]): void {
        // [todo] ❌ map entities to objects only containing ids
        this.#unpaged = entities;
        this.#paged = [];
    }

    setPage(entities: readonly Entity[], sort: EntitySort, page: EntityPage): void {
        // [todo] ❌ map entities to objects only containing ids
        let entry = this.#findEntry(sort);

        if (!entry) {
            entry = { sort, cache: [] };
            this.#paged.push(entry);
        }

        const offset = page.getSkip();

        for (let i = 0; i < entities.length; i++) {
            entry.cache[i + offset] = entities[i];
        }
    }

    #findEntry(sort: EntitySort): EntityPagedCacheEntry | undefined {
        return this.#paged.find(entry => entry.sort.equals(sort));
    }
}
