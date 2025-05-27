import { Entity } from "@entity-space/elements";
import { isEqual } from "lodash";

interface CacheEntry {
    parameters: Entity;
    value: Entity[];
}

export class ParametersCache {
    #cache: CacheEntry[] = [];

    get(parameters: Entity): Entity[] | undefined {
        return this.#findEntry(parameters)?.value;
    }

    set(parameters: Entity, value: Entity[]): void {
        const entry = this.#findEntry(parameters);

        if (!entry) {
            this.#cache.push({ parameters, value });
        } else {
            entry.value = value;
        }
    }

    #findEntry(parameters: Entity): CacheEntry | undefined {
        return this.#cache.find(entry => isEqual(entry.parameters, parameters));
    }
}
