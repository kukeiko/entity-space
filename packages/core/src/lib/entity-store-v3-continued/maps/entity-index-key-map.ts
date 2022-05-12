import { Criterion, RemapCriterionResult } from "@entity-space/criteria";
import { Entity } from "../../entity/entity";

// [todo] im wondering if i can simplify the name. are those maps necessarily containers that
// expect an entity as the key, and that the key paths are expected to be indexes?
// im thinking something like "IComplexKeyMap" could fit.
export interface IEntityIndexKeyMap<E extends Entity = Entity, V = unknown> {
    get(entity: E): V | undefined;
    getByCriterion(criterion: Criterion): V | undefined;
    // getAll() : V[];
    getMany(entities: E[]): (V | undefined)[];
    // getManyByCriterion(criterion: Criterion): V[];
    getManyByCriterion(criterion: Criterion): false | { values: V[]; remapped: RemapCriterionResult };
    // [todo] can't remember which case i thought of where having the "current" parameter would be convenient
    set(entity: E, value: V, update?: (previous: V, current: V) => V): void;
    setMany(entites: E[], values: V[], update?: (previous: V, current: V) => V): void;
    delete(entity: E): void;
}
