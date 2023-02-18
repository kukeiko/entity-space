import { Entity } from "../../common/entity.type";
import { ICriterion } from "../../criteria/criterion.interface";
import { ReshapedCriterion } from "../../criteria/reshaped-criterion";
import { ComplexKeyMap } from "../data-structures/complex-key-map";

export class EntityStoreUniqueIndex<E extends Entity = Entity> {
    constructor(paths: string[]) {
        this.paths = paths;
        this.map = new ComplexKeyMap<E, number>(paths);
    }

    private readonly paths: string[];
    private readonly map: ComplexKeyMap<E, number>;

    get(entity: E): number | undefined {
        return this.map.get(entity);
    }

    set(entity: E, value: number): void {
        this.map.set(entity, value);
    }

    delete(entity: E): this {
        this.map.delete(entity);

        return this;
    }

    getByCriterion(criterion: ICriterion): false | { values: number[]; remapped: ReshapedCriterion<ICriterion> } {
        return this.map.getByCriterion(criterion);
    }

    getPaths(): string[] {
        return this.paths.slice();
    }
}
