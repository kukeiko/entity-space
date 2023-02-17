import { readPath, writePath } from "@entity-space/utils";
import { Entity } from "../../common/entity.type";
import { ICriterion } from "../../criteria/vnext/criterion.interface";
import { EntityCriteriaShapeTools } from "../../criteria/vnext/entity-criteria-shape-tools";
import { EntityCriteriaTools } from "../../criteria/vnext/entity-criteria-tools";
import { EntityCriteriaShape } from "../../criteria/vnext/entity-criteria/entity-criteria-shape";
import { IEqualsCriterion } from "../../criteria/vnext/equals/equals-criterion.interface";
import { IInArrayCriterion } from "../../criteria/vnext/in-array/in-array-criterion.interface";
import { ReshapedCriterion } from "../../criteria/vnext/reshaped-criterion";

// [todo] wanted to move this to utils, and then i noticed we have a dependency to criteria package,
// so we can't really do that. maybe we should have a map implementing getting items by criteria
// as an extending class?
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
        const criteriaTools = new EntityCriteriaTools();
        const shapeTools = new EntityCriteriaShapeTools({ criteriaTools });
        const bag: Record<string, any> = {};

        for (const path of leadingPaths) {
            writePath(path, bag, shapeTools.equals());
        }

        writePath(lastPath, bag, shapeTools.inArray());
        this.criterionTemplate = shapeTools.where(bag);
    }

    private readonly map = new Map<unknown, unknown>();
    private readonly leadingPaths: string[];
    private readonly lastPath: string;
    private readonly criterionTemplate: EntityCriteriaShape<Entity, any>;

    get(entity: E, paths?: string[]): V | undefined {
        let map = this.map;

        let leadingPaths = this.leadingPaths;
        let lastPath = this.lastPath;

        if (paths) {
            leadingPaths = paths.slice(0, -1);
            lastPath = paths[paths.length - 1];
        }

        for (const path of leadingPaths) {
            const key = readPath(path, entity);

            if (!map.has(key)) {
                return void 0;
            }

            map = map.get(key) as Map<unknown, unknown>;
        }

        return map.get(readPath(lastPath, entity)) as V | undefined;
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
            const key = readPath(path, entity);
            map = this.getOrSet(map, key, () => new Map());
        }

        const key = readPath(this.lastPath, entity);

        if (update && map.has(key)) {
            const updated = update(map.get(key) as V, value);

            if (updated === value) {
                return;
            }

            value = updated;
        }

        map.set(readPath(this.lastPath, entity), value);
    }

    setMany(entites: E[], values: V[], update?: (previous: V, current: V) => V): void {
        entites.forEach((entity, index) => this.set(entity, values[index], update));
    }

    delete(entity: E): void {
        let map = this.map;

        for (const path of this.leadingPaths) {
            map = this.map.get(readPath(path, entity)) as Map<unknown, unknown>;
        }

        map.delete(readPath(this.lastPath, entity));
    }

    getByCriterion(criterion: ICriterion): false | { values: V[]; remapped: ReshapedCriterion<ICriterion> } {
        const remapped = this.criterionTemplate.reshape(criterion);

        if (remapped === false) {
            return false;
        }

        const values: V[] = [];

        for (const criterion of remapped.getReshaped()) {
            let map = this.map;

            if (this.leadingPaths.length > 0) {
                const key: Record<string, any> = {};

                for (const path of this.leadingPaths) {
                    // [todo] shouldn't have to split (to provide string[]), but instead just supply arg of type string
                    const isValueCriterion = criterion.getByPath(path.split(".")) as IEqualsCriterion;

                    if (!map.has(isValueCriterion.getValue())) {
                        continue;
                    }

                    map = map.get(isValueCriterion.getValue()) as Map<unknown, unknown>;
                }
            }

            const inSetCriterion = criterion.getByPath(this.lastPath.split(".")) as IInArrayCriterion;

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
