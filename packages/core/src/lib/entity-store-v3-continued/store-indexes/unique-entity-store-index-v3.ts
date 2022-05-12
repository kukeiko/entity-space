import { Entity } from "../../entity/entity";
import { createEntityIndexKeyMap } from "../maps/create-entity-index-key-map.fn";
import { IEntityIndexKeyMap } from "../maps/entity-index-key-map";

export class UniqueEntityStoreIndexV3<E extends Entity = Entity> {
    constructor(paths: string[]) {
        this.complexMap = createEntityIndexKeyMap(paths);
    }

    private readonly complexMap: IEntityIndexKeyMap<E, number>;

    get(entity: E): number | undefined {
        return this.complexMap.get(entity);
    }

    set(entity: E, value: number): void {
        this.complexMap.set(entity, value);
    }

    delete(entity: E): this {
        this.complexMap.delete(entity);

        return this;
    }
}
