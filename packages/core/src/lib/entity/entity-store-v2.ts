import { Criterion, or } from "@entity-space/criteria";
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

    getByCriterion(criterion: Criterion): Entity[] {
        // indexes that narrow the most come first
        const indexes = this.getIndexes().sort(
            (a, b) => b.getIndex().getSchema().getPath().length - a.getIndex().getSchema().getPath().length
        );

        const slots = new Set<number>();

        for (const index of indexes) {
            const result = index.get(criterion);

            if (result === false) {
                continue;
            }

            for (const value of result.values) {
                slots.add(value);
            }

            const open = result.remapped.getOpen();

            if (open.length === 0) {
                return Array.from(slots).map(slot => this.entities[slot]!); // [todo] assertion
            } else {
                if (open.length === 1) {
                    criterion = result.remapped.getOpen()[0];
                } else {
                    criterion = or(result.remapped.getOpen());
                }
            }
        }

        // if we are here, we couldn't fully rely on using indexes alone.
        // have to make a full scan for the criteria that are still open.
        for (let slot = 0; slot < this.entities.length; ++slot) {
            if (!criterion.matches(this.entities[slot])) {
                continue;
            }

            slots.add(slot);
        }

        return Array.from(slots).map(slot => this.entities[slot]!); // [todo] assertion
    }

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
            const slot = keyIndexValues[i];

            if (slot === void 0) {
                addedEntities.push(entities[i]);
                addedEntitiesKeyIndexValues.push(this.entities.length);
                this.entities.push(entities[i]);
            } else {
                updatedEntities.push(entities[i]);
                updatedOldEntities.push(this.entities[slot]!); // [todo] assertion
                updatedEntitiesKeyIndexValues.push(slot);
                this.entities[slot] = entities[i];
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
