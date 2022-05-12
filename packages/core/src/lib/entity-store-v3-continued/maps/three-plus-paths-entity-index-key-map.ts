import { Criterion, RemapCriterionResult } from "@entity-space/criteria";
import { ICompositeKeyMap } from "../../entity/composite-key-map/composite-key-map.interface";
import { NestedKeyNestedMapCompositeKeyMap } from "../../entity/composite-key-map/nested-key-nested-map-composite-key-map";
import { Entity } from "../../entity/entity";
import { IEntityIndexKeyMap } from "./entity-index-key-map";
import { walkPath } from "./walk-path.fn";

export class ThreeOrMorePathsEntityIndexKeyMap<E extends Entity = Entity, V = unknown>
    implements IEntityIndexKeyMap<E, V>
{
    constructor(leadingPaths: string[], lastPath: string) {
        this.leadingPaths = leadingPaths;
        this.lastPath = lastPath;
        this.map = new NestedKeyNestedMapCompositeKeyMap(leadingPaths);
    }

    private readonly map: ICompositeKeyMap<E, Map<unknown, V>, any>;
    private readonly leadingPaths: string[];
    private readonly lastPath: string;

    get(entity: E): V | undefined {
        const map = this.map.get(entity);

        if (map === void 0) {
            return void 0;
        }

        const key = walkPath(this.lastPath, entity);

        return map.get(key);
    }

    // getAll(): V[] {
    //     throw new Error("Method not implemented.");
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
        throw new Error("Method not implemented.");
    }

    setMany(entites: E[], values: V[], update?: (previous: V, current: V) => V): void {
        entites.forEach((entity, index) => this.set(entity, values[index], update));
    }
    delete(entity: E): void {
        throw new Error("Method not implemented.");
    }
}
