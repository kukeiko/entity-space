import { Criterion } from "@entity-space/criteria";
import { Entity } from "./entity";
import { EntityStoreIndexV2 } from "./entity-store-index-v2";
import { IEntityType } from "./entity-type.interface";

export class EntityStoreV2 {
    constructor(entityType: IEntityType) {
        this.entityType = entityType;

        for (const index of entityType.getIndexes()) {
            console.log("create", index.getSchema().getName());
            this.indexStores.set(index.getSchema().getName(), new EntityStoreIndexV2(index));
        }
    }

    private readonly entityType: IEntityType;
    private readonly indexStores = new Map<string, EntityStoreIndexV2>();
    private entities: (Entity | undefined)[] = [];

    getEntities(criterion: Criterion): Entity[] {
        return [];
    }

    upsert(entities: Entity[]): void {
        const keyIndexName = this.entityType.getSchema().getKey().getName();
        const keyIndexStore = this.getIndex(keyIndexName);
        const keyIndexValues = keyIndexStore.read(entities);
        const addedEntities: Entity[] = [];
        const addedEntitiesKeyIndexValues: number[] = [];
        const updatedEntities: Entity[] = [];
        const updatedOldEntities: Entity[] = [];
        const updatedEntitiesKeyIndexValues: number[] = [];

        for (let i = 0; i < keyIndexValues.length; ++i) {
            const keyIndexValue = keyIndexValues[i];

            if (keyIndexValue === void 0) {
                addedEntities.push(entities[i]);
                addedEntitiesKeyIndexValues.push(this.entities.length + i);
            } else {
                updatedEntities.push(entities[i]);
                updatedOldEntities.push(this.entities[keyIndexValue]!); // [todo] assertion
                updatedEntitiesKeyIndexValues.push(keyIndexValue);
            }
        }

        const indexStores = this.getIndexes();

        for (const indexStore of indexStores) {
            if (indexStore === keyIndexStore) {
                indexStore.insert(addedEntities, addedEntitiesKeyIndexValues);
            } else {
                indexStore.insert(addedEntities, addedEntitiesKeyIndexValues);
                indexStore.remove(updatedOldEntities, updatedEntitiesKeyIndexValues);
                indexStore.insert(updatedEntities, updatedEntitiesKeyIndexValues);
            }
        }

        this.entities.push(...addedEntities);
    }

    getIndex(name: string): EntityStoreIndexV2 {
        const index = this.indexStores.get(name);

        if (index === void 0) {
            throw new Error(`index store '${name}' not found`);
        }

        return index;
    }

    getIndexes(): EntityStoreIndexV2[] {
        return Array.from(this.indexStores.values());
    }
}
