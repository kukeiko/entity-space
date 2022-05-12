import { Criterion, RemapCriterionResult } from "@entity-space/criteria";
import { Entity } from "../../entity/entity";
import { IEntityIndexKeyMap } from "./entity-index-key-map";
import { walkPath } from "./walk-path.fn";

export class TwoPathsEntityIndexKeyMap<E extends Entity = Entity, V = unknown> implements IEntityIndexKeyMap<E, V> {
    constructor(pathOne: string, pathTwo: string) {
        this.pathOne = pathOne;
        this.pathTwo = pathTwo;
    }

    private readonly map = new Map<unknown, Map<unknown, V>>();
    private readonly pathOne: string;
    private readonly pathTwo: string;

    get(entity: E): V | undefined {
        const keyOne = walkPath(this.pathOne, entity);
        const map = this.map.get(keyOne);

        if (map === void 0) {
            return void 0;
        }

        const keyTwo = walkPath(this.pathTwo, entity);

        return map.get(keyTwo);
    }

    // getAll(): V[] {
    //     const values: V[] = [];

    //     this.map.forEach(value => values.push(...Array.from(value.values())));

    //     return values;
    // }

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
        const keyOne = walkPath(this.pathOne, entity);
        const map = this.map.get(keyOne) ?? this.map.set(keyOne, new Map()).get(keyOne)!;
        const keyTwo = walkPath(this.pathTwo, entity);

        if (update && map.has(keyTwo)) {
            value = update(map.get(keyTwo)!, value);
        }

        map.set(keyTwo, value);
    }

    setMany(entites: E[], values: V[], update?: (previous: V, current: V) => V): void {
        entites.forEach((entity, index) => this.set(entity, values[index], update));
    }

    delete(entity: E): void {
        const keyOne = walkPath(this.pathOne, entity);
        const map = this.map.get(keyOne);

        if (!map) {
            return;
        }

        map.delete(walkPath(this.pathTwo, entity));
    }
}
