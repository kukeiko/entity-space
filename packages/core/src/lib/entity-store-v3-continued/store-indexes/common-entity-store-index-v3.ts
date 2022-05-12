import { Entity } from "../../entity/entity";
import { createEntityIndexKeyMap } from "../maps/create-entity-index-key-map.fn";
import { IEntityIndexKeyMap } from "../maps/entity-index-key-map";

export class CommonEntityStoreIndexV3<E extends Entity = Entity> {
    constructor(paths: string[]) {
        this.complexMap = createEntityIndexKeyMap(paths);
    }

    private readonly complexMap: IEntityIndexKeyMap<E, Set<number>>;

    get(entity: E): Set<number> | undefined {
        return this.complexMap.get(entity);
    }

    set(entity: E, value: number): void {
        this.complexMap.set(entity, new Set([value]), previous => previous.add(value));
    }

    delete(entity: E, slot: number): this {
        this.complexMap.get(entity)?.delete(slot);
        
        return this;
    }
}
