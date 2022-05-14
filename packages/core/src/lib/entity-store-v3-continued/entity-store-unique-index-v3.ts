import { Entity } from "../entity/entity";
import { ComplexKeyMap } from "./complex-key-map";

export class EntityStoreUniqueIndexV3<E extends Entity = Entity> {
    constructor(paths: string[]) {
        this.map = new ComplexKeyMap<E, number>(paths);
    }

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
}
