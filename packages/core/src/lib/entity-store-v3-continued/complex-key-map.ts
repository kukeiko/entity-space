import {
    Criterion,
    InSetCriterion,
    inSetTemplate,
    IsValueCriterion,
    isValueTemplate,
    NamedCriteriaTemplate,
    RemapCriterionResult,
} from "@entity-space/criteria";
import { tramplePath, walkPath } from "@entity-space/utils";
import { Entity } from "../entity/entity";

// [todo] EntityStoreIndexV3 returns "this" at get() and set(). should this class too?
export class ComplexKeyMap<E extends Entity = Entity, V = unknown> {
    constructor(paths: string[]) {
        let leadingPaths: string[], lastPath: string;

        if (paths.length === 0) {
            throw new Error("paths is empty");
        } else if (paths.length === 1) {
            leadingPaths = [];
            lastPath = paths[0];
        } else {
            leadingPaths = paths.slice(0, -1);
            lastPath = paths[paths.length - 1];
        }

        this.leadingPaths = leadingPaths;
        this.lastPath = lastPath;

        const bag: Record<string, any> = {};

        for (const path of leadingPaths) {
            tramplePath(path, bag, isValueTemplate());
        }

        tramplePath(lastPath, bag, inSetTemplate());
        this.criterionTemplate = NamedCriteriaTemplate.fromDeepBag(bag);
    }

    private readonly map = new Map<unknown, unknown>();
    private readonly leadingPaths: string[];
    private readonly lastPath: string;
    private readonly criterionTemplate: NamedCriteriaTemplate;

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

    getAll(): V[] {
        let maps = [this.map];

        for (let i = 0; i < this.leadingPaths.length; ++i) {
            let nextMaps: Map<unknown, unknown>[] = [];

            for (const map of maps) {
                for (const value of map.values()) {
                    nextMaps.push(value as Map<unknown, unknown>);
                }
            }

            maps = nextMaps;
        }

        const values: V[] = [];

        for (const map of maps) {
            for (const value of map.values()) {
                values.push(value as V);
            }
        }

        return values;
    }

    getMany(entities: E[]): (V | undefined)[] {
        return entities.map(entity => this.get(entity));
    }

    set(entity: E, value: V, update?: (previous: V, current: V) => V): void {
        let map = this.map;

        for (const path of this.leadingPaths) {
            const key = walkPath(path, entity);
            map = this.getOrSet(map, key, () => new Map());
        }

        const key = walkPath(this.lastPath, entity);

        if (update && map.has(key)) {
            const updated = update(map.get(key) as V, value);

            if (updated !== value) {
                return;
            }

            value = updated;
        }

        map.set(walkPath(this.lastPath, entity), value);
    }

    setMany(entites: E[], values: V[], update?: (previous: V, current: V) => V): void {
        entites.forEach((entity, index) => this.set(entity, values[index], update));
    }

    delete(entity: E): void {
        let map = this.map;

        for (const path of this.leadingPaths) {
            map = this.map.get(walkPath(path, entity)) as Map<unknown, unknown>;
        }

        map.delete(walkPath(this.lastPath, entity));
    }

    getByCriterion(criterion: Criterion): false | { values: V[]; remapped: RemapCriterionResult } {
        const remapped = this.criterionTemplate.remap(criterion);

        if (remapped === false) {
            return false;
        }

        const values: V[] = [];

        for (const criterion of remapped.getCriteria()) {
            let map = this.map;

            if (this.leadingPaths.length > 0) {
                const key: Record<string, any> = {};

                for (const path of this.leadingPaths) {
                    // [todo] shouldn't have to split (to provide string[]), but instead just supply arg of type string
                    const isValueCriterion = criterion.getByPath(path.split(".")) as IsValueCriterion;

                    if (!map.has(isValueCriterion.getValue())) {
                        continue;
                    }

                    map = map.get(isValueCriterion.getValue()) as Map<unknown, unknown>;
                }
            }

            const inSetCriterion = criterion.getByPath(this.lastPath.split(".")) as InSetCriterion;

            for (const criterionValue of inSetCriterion.getValues().values()) {
                if (map.has(criterionValue)) {
                    values.push(map.get(criterionValue) as V);
                }
            }
        }

        return { values, remapped };
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