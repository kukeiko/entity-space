import {
    Criterion,
    Entity,
    EntityQueryParameters,
    isEqualParameters,
    OrCriterion,
    subtractCriterion,
} from "@entity-space/elements";

export class EntityUnpagedCache {
    constructor(parameters?: EntityQueryParameters) {
        this.#parameters = parameters;
    }

    readonly #parameters?: EntityQueryParameters;
    #entities: Entity[] = [];
    #hasAll = false;
    #criteria: Criterion[] = [];

    hasEqualParameters(parameters?: EntityQueryParameters): boolean {
        return isEqualParameters(this.#parameters, parameters);
    }

    hasCriterion(criterion?: Criterion): boolean {
        if (this.#hasAll) {
            return true;
        } else if (criterion === undefined) {
            return false;
        } else {
            // [todo] ❌ hack because I am focused on something else right now
            const hack = new OrCriterion(this.#criteria);
            return subtractCriterion(criterion, hack) === true;
        }
    }

    addEntities(entities: readonly Entity[], criterion?: Criterion): void {
        // [todo] ❌ map entities to objects only containing ids
        if (criterion === undefined) {
            // [todo] ❌ trace evicted entities
            this.#entities = [...entities];
            this.#criteria = [];
            this.#hasAll = true;
        } else {
            // [todo] ❌ need to deduplicate
            this.#entities = [...this.#entities, ...entities];
            // [todo] ❌ need method "mergeCriteria()"
            this.#criteria.push(criterion);
            this.#hasAll = false;
        }
    }

    getEntities(): readonly Entity[] {
        return this.#entities;
    }
}
