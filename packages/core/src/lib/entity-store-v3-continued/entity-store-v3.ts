import { Entity } from "../entity/entity";
import { IEntityType } from "../entity/entity-type.interface";
import { createEntityIndexKeyMap } from "./maps/create-entity-index-key-map.fn";
import { CommonEntityStoreIndexV3 } from "./store-indexes/common-entity-store-index-v3";
import { UniqueEntityStoreIndexV3 } from "./store-indexes/unique-entity-store-index-v3";

export class EntityStoreV3 {
    constructor(entityType: IEntityType) {
        this.entityType = entityType;

        for (const index of entityType.getSchema().getIndexes()) {
            if (index.isUnique()) {
                this.uniqueIndexes.set(index.getName(), new UniqueEntityStoreIndexV3(index.getPath()));
            } else {
                this.commonIndexes.set(index.getName(), new CommonEntityStoreIndexV3(index.getPath()));
            }
        }
    }

    private readonly entityType: IEntityType;
    private readonly uniqueIndexes = new Map<string, UniqueEntityStoreIndexV3>();
    private readonly commonIndexes = new Map<string, CommonEntityStoreIndexV3>();
    private entities: (Entity | undefined)[] = [];

    add(entities: Entity[]): void {
        if (this.entityType.getSchema().hasKey()) {
            const key = this.entityType.getSchema().getKey();
            entities = this.dedupe(entities, key.getPath());
            const keyIndex = this.uniqueIndexes.get(key.getName())!;

            for (const entity of entities) {
                const slot = keyIndex.get(entity);

                if (slot === void 0) {
                    this.uniqueIndexes.forEach(index => index.set(entity, this.entities.length));
                    this.commonIndexes.forEach(index => index.set(entity, this.entities.length));
                } else {
                    const previous = this.entities[slot]!;
                    this.uniqueIndexes.forEach(index => index.delete(previous).set(entity, slot));
                    this.commonIndexes.forEach(index => index.delete(previous, slot).set(entity, slot));
                }
            }
        } else {
            throw new Error("Case not implemented.");
        }
    }

    private dedupe(entities: Entity[], keyPaths: string[]): Entity[] {
        const deduped: Entity[] = [];
        const keyMap = createEntityIndexKeyMap(keyPaths);

        for (const entity of entities) {
            keyMap.set(entity, entity, (previous, current) => this.mergeEntities([previous, current]));
        }

        return deduped;
    }

    private mergeEntities(...entities: Entity[]): Entity {
        const merged: Entity = {};

        for (const entity of entities) {
            for (const key in entity) {
                const value = entity[key];

                if (value === void 0) {
                    delete merged[key];
                } else if (value !== null && typeof value === "object" && !(value instanceof Date)) {
                    if (typeof merged[key] === "object" && !(value instanceof Date)) {
                        merged[key] = this.mergeEntities(value, merged[key]);
                    } else {
                        merged[key] = value;
                    }
                } else {
                    merged[key] = value;
                }
            }
        }

        return merged;
    }
}
