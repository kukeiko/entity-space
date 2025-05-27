import { Entity } from "@entity-space/elements";
import { ComplexKeyMap, Path } from "@entity-space/utils";

export class EntityStoreUniqueIndex {
    constructor(paths: readonly Path[]) {
        this.#paths = Object.freeze(paths.slice());
        this.#map = new ComplexKeyMap(this.#paths);
    }

    readonly #paths: readonly Path[];
    readonly #map: ComplexKeyMap<Entity, number>;

    get(entity: Entity): number | undefined {
        return this.#map.get(entity);
    }

    set(entity: Entity, value: number): this {
        this.#map.set(entity, value);
        return this;
    }

    delete(entity: Entity): this {
        this.#map.delete(entity);
        return this;
    }

    replace(what: Entity, by: Entity, value: number): this {
        this.delete(what);
        this.set(by, value);
        return this;
    }

    clear(): this {
        this.#map.clear();
        return this;
    }

    getPaths(): readonly Path[] {
        return this.#paths.slice();
    }
}
