import { Criterion, RemapCriterionResult } from "@entity-space/criteria";
import { Entity } from "../../entity/entity";
import { IEntityIndexKeyMap } from "./entity-index-key-map";
import { walkPath } from "./walk-path.fn";

export class OnePathEntityIndexKeyMap<E extends Entity = Entity, V = unknown> implements IEntityIndexKeyMap<E, V> {
    constructor(path: string) {
        this.path = path;
    }

    private readonly map = new Map<unknown, V>();
    private readonly path: string;

    get(entity: E): V | undefined {
        const key = walkPath(this.path, entity);

        return this.map.get(key);
    }

    // getAll(): V[] {
    //     return Array.from(this.map.values());
    // }

    getMany(entities: E[]): (V | undefined)[] {
        return entities.map(entity => this.get(entity));
    }

    getByCriterion(criterion: Criterion): V | undefined {
        // why does this one return V | undefined, and "getManyByCriterion" includes a remapped criterion?
        // probably because i thought "it can only return 1 entity - there is no case for a leftover criterion"
        // that would be used to access another index.
        // but that might not be actually true. in any case, getManyByCriterion() is the more important method
        // anyway, as querying multiple entities is the more common use case, so maybe i should start there.
        throw new Error("Method not implemented.");
    }

    getManyByCriterion(criterion: Criterion): false | { values: V[]; remapped: RemapCriterionResult<Criterion> } {
        throw new Error("Method not implemented.");
    }

    set(entity: E, value: V, update?: (previous: V, current: V) => V): void {
        const key = walkPath(this.path, entity);

        if (update && this.map.has(key)) {
            value = update(this.map.get(key)!, value);
        }

        this.map.set(key, value);
    }

    setMany(entites: E[], values: V[], update?: (previous: V, current: V) => V): void {
        entites.forEach((entity, index) => this.set(entity, values[index], update));
    }

    delete(entity: E): void {
        this.map.delete(walkPath(this.path, entity));
    }
}
