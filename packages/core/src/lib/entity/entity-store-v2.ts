import { Criterion, or } from "@entity-space/criteria";
import { Entity } from "./entity";
import { EntityStoreIndexV2 } from "./entity-store-index-v2";
import { IEntityType } from "./entity-type.interface";

export class EntityStoreV2 {
    constructor(entityType: IEntityType) {
        this.entityType = entityType;

        for (const index of entityType.getIndexes()) {
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

    /**
     * [todo] deal with potential duplicates in given entities array.
     * currently happens w/ product example because sloppy implementation,
     * but nevertheless a good thing to have happened because checking for duplicates
     * here and correctly applying them makes entity-space more robust to user error.
     * so basically make a user error into a feature.
     */
    upsert(entities: Entity[]): void {
        const keyIndexName = this.entityType.getSchema().getKey().getName();
        const keyIndexStore = this.getIndex(keyIndexName);
        const slotsValues = keyIndexStore.getIndex().readValues(entities);
        const slots = keyIndexStore.readByValues(slotsValues);
        const addedEntities: Entity[] = [];
        const addedEntitiesSlots: number[] = [];
        const updatedEntities: Entity[] = [];
        const updatedOldEntities: Entity[] = [];
        const updatedEntitiesSlots: number[] = [];
        const duplicatesMap = new Map();

        for (let i = 0; i < slots.length; ++i) {
            let slot = slots[i];

            if (slot === void 0) {
                const slotValues = slotsValues[i];
                let map = duplicatesMap;

                for (let e = 0; e < slotValues.length - 1; ++e) {
                    const slotValue = slotValues[e];
                    map = map.get(slotValue) ?? map.set(slotValue, new Map()).get(slotValue);
                }

                if (!map.has(slotValues[slotValues.length - 1])) {
                    addedEntities.push(entities[i]);
                    addedEntitiesSlots.push(this.entities.length);
                    map.set(slotValues[slotsValues.length - 1], this.entities.length);
                    this.entities.push(entities[i]);
                } else {
                    slot = map.get(slotValues[slotValues.length - 1]) as number;
                    updatedEntities.push(entities[i]);
                    updatedOldEntities.push(this.entities[slot]!); // [todo] assertion
                    updatedEntitiesSlots.push(slot);
                    this.entities[slot] = entities[i];
                }
            } else {
                updatedEntities.push(entities[i]);
                updatedOldEntities.push(this.entities[slot]!); // [todo] assertion
                updatedEntitiesSlots.push(slot);
                this.entities[slot] = entities[i];
            }
        }

        const indexStores = this.getIndexes();

        for (const indexStore of indexStores) {
            if (indexStore === keyIndexStore) {
                indexStore.insert(addedEntities, addedEntitiesSlots);
            } else {
                indexStore.insert(addedEntities, addedEntitiesSlots);
                indexStore.remove(updatedOldEntities, updatedEntitiesSlots);
                indexStore.insert(updatedEntities, updatedEntitiesSlots);
            }
        }
    }

    upsert_v2(entities: Entity[]) : void {

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

    private copyEntity(entity: Entity): Entity {
        return this.mergeEntities([entity]);
    }

    private mergeEntities(...entities: Entity[]): Entity {
        const merged: Entity = {};

        for (const entity of entities) {
            for (const key in entity) {
                const value = entity[key];

                if (value === void 0) {
                    delete merged[key];
                } else if (value !== null && typeof value === "object") {
                    if (typeof merged[key] === "object") {
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
