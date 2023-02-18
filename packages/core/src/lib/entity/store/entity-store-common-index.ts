import { Entity } from "../../common/entity.type";
import { ICriterion } from "../../criteria/criterion.interface";
import { ReshapedCriterion } from "../../criteria/reshaped-criterion";
import { ComplexKeyMap } from "../data-structures/complex-key-map";

export class EntityStoreCommonIndex<E extends Entity = Entity> {
    constructor(paths: string[]) {
        this.paths = paths;
        this.map = new ComplexKeyMap<E, Set<number>>(paths);
    }

    private readonly paths: string[];
    private readonly map: ComplexKeyMap<E, Set<number>>;

    get(entity: E): Set<number> | undefined {
        return this.map.get(entity);
    }

    add(entity: E, value: number): void {
        this.map.set(entity, new Set([value]), previous => previous.add(value));
    }

    delete(entity: E, slot: number): this {
        this.map.get(entity)?.delete(slot);

        return this;
    }

    getByCriterion(criterion: ICriterion): false | { values: Set<number>[]; reshaped: ReshapedCriterion<ICriterion> } {
        return this.map.getByCriterion(criterion);
    }

    getPaths(): string[] {
        return this.paths.slice();
    }
}
