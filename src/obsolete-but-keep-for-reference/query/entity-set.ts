import { ObjectCriteria } from "../../criteria";
import { Class } from "../../utils";
import { Selection } from "../selection";

export class EntitySet<T = any> {
    constructor(entityType: Class<T>, entities: T[] = []) {
        this.entityType = entityType;
        this._entities = entities.slice();
    }

    readonly entityType: Class<T>;
    private readonly _entities: T[];

    all(): T[] {
        return this._entities.slice();
    }

    where(criteria: ObjectCriteria): T[] {
        return ObjectCriteria.filter(this._entities, criteria);
    }

    select<S extends Selection<T>>(selection: S): Selection.Apply<T, S>[] {
        return [];
    }
}
