import { Criterion, RemapCriterionResult } from "@entity-space/criteria";
import { walkPath } from "@entity-space/utils";
import { Entity } from "../entity/entity";

// [todo] EntityStoreIndexV3 returns "this" at get() and set(). should this class too?
export class ComplexKeyMap<E extends Entity = Entity, V = unknown> {
    constructor(paths: string[]) {
        if (paths.length === 0) {
            throw new Error("paths is empty");
        } else if (paths.length === 1) {
            this.leadingPaths = [];
            this.lastPath = paths[0];
        } else {
            this.leadingPaths = paths.slice(0, 1);
            this.lastPath = paths[paths.length - 1];
        }
    }

    private readonly map = new Map<unknown, unknown>();
    private readonly leadingPaths: string[];
    private readonly lastPath: string;

    get(entity: E): V | undefined {
        let map = this.map;

        for (const path of this.leadingPaths) {
            const key = walkPath(path, entity);

            if (!map.has(key)) {
                return void 0;
            }

            map = map.get(key) as Map<unknown, unknown>;
        }

        return map.get(walkPath(this.lastPath, entity)) as V | undefined;
    }

    getMany(entities: E[]): (V | undefined)[] {
        return entities.map(entity => this.get(entity));
    }

    getByCriterion(criterion: Criterion): V | undefined {
        throw new Error("Method not implemented.");
    }

    getManyByCriterion(criterion: Criterion): false | { values: V[]; remapped: RemapCriterionResult<Criterion> } {
        throw new Error("Method not implemented.");
    }

    set(entity: E, value: V, update?: (previous: V, current: V) => V): void {
        let map = this.map;

        for (const path of this.leadingPaths) {
            const key = walkPath(path, entity);
            map = this.getOrSet(map, key, () => new Map());
        }

        const key = walkPath(this.lastPath, entity);

        if (update && map.has(key)) {
            value = update(map.get(key) as V, value);

            if (value === value) {
                return;
            }
        }

        map.set(walkPath(this.lastPath, entity), value);
    }

    setMany(entites: E[], values: V[], update?: (previous: V, current: V) => V): void {
        entites.forEach((entity, index) => this.set(entity, values[index], update));
    }

    delete(entity: E): void {
        throw new Error("Method not implemented.");
    }

    private getOrSet<K, V>(map: Map<K, any>, key: K, createValue: () => V): V {
        if (!map.has(key)) {
            const value = createValue();
            map.set(key, value);

            return value;
        }

        return map.get(key)!;
    }
}
