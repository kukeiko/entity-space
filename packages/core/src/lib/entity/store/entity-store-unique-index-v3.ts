import { Criterion, RemapCriterionResult } from "@entity-space/criteria";
import { ComplexKeyMap } from "../complex-key-map";
import { Entity } from "../entity";

export class EntityStoreUniqueIndexV3<E extends Entity = Entity> {
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

    getByCriterion(criterion: Criterion): false | { values: number[]; remapped: RemapCriterionResult<Criterion> } {
        return this.map.getByCriterion(criterion);
    }

    getPaths(): string[] {
        return this.paths.slice();
    }
}
