import {
    Criterion,
    deduplicateEntities,
    Entity,
    EntityQueryParameters,
    EntitySchema,
    isEqualParameters,
    OrCriterion,
    subtractCriterion,
} from "@entity-space/elements";

export class EntityUnpagedCache {
    constructor(schema: EntitySchema, parameters?: EntityQueryParameters) {
        this.#schema = schema;
        this.#parameters = parameters;
    }

    readonly #schema: EntitySchema;
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
            this.#entities = deduplicateEntities(this.#schema, [...this.#entities, ...entities]);
            // [todo] ❌ need method "mergeCriteria()"
            this.#criteria.push(criterion);
            this.#hasAll = false;
        }
    }

    getEntities(): readonly Entity[] {
        return this.#entities;
    }
}
