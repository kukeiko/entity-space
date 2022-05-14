import { Criterion, or } from "@entity-space/criteria";
import { Entity } from "../entity/entity";
import { IEntityType } from "../entity/entity-type.interface";
import { ComplexKeyMap } from "./complex-key-map";
import { EntityStoreCommonIndexV3 } from "./entity-store-common-index-v3";
import { EntityStoreUniqueIndexV3 } from "./entity-store-unique-index-v3";

export class EntityStoreV3 {
    constructor(entityType: IEntityType) {
        this.entityType = entityType;

        for (const index of entityType.getSchema().getIndexesIncludingKey()) {
            if (index.isUnique()) {
                this.uniqueIndexes.set(index.getName(), new EntityStoreUniqueIndexV3(index.getPath()));
            } else {
                this.commonIndexes.set(index.getName(), new EntityStoreCommonIndexV3(index.getPath()));
            }
        }
    }

    private readonly entityType: IEntityType;
    private readonly uniqueIndexes = new Map<string, EntityStoreUniqueIndexV3>();
    private readonly commonIndexes = new Map<string, EntityStoreCommonIndexV3>();
    private entities: (Entity | undefined)[] = [];

    // [todo] indexing needs to be crash safe
    add(entities: Entity[]): void {
        if (this.entityType.getSchema().hasKey()) {
            const key = this.entityType.getSchema().getKey();
            entities = this.dedupeEntities(entities, key.getPath());
            const keyIndex = this.uniqueIndexes.get(key.getName())!;

            for (let entity of entities) {
                const slot = keyIndex.get(entity);

                if (slot === void 0) {
                    this.uniqueIndexes.forEach(index => index.set(entity, this.entities.length));
                    this.commonIndexes.forEach(index => index.add(entity, this.entities.length));
                    this.entities.push(this.mergeEntities(entity));
                } else {
                    const previous = this.entities[slot]!;
                    entity = this.mergeEntities([previous, entity]);
                    this.uniqueIndexes.forEach(index => index.delete(previous).set(entity, slot));
                    this.commonIndexes.forEach(index => index.delete(previous, slot).add(entity, slot));
                }
            }
        } else {
            for (const entity of entities) {
                this.uniqueIndexes.forEach(index => index.set(entity, this.entities.length));
                this.commonIndexes.forEach(index => index.add(entity, this.entities.length));
                this.entities.push(entity);
            }
        }
    }

    get(entity: Entity): Entity | undefined {
        const key = this.entityType.getSchema().getKey();
        const keyIndex = this.uniqueIndexes.get(key.getName())!;
        const slot = keyIndex.get(entity);

        if (slot === void 0) {
            return void 0;
        }

        return this.entities[slot];
    }

    getByCriterion(criterion: Criterion): Entity[] {
        const entities: Entity[] = [];
        const result = this.getSlotsByCriterion(criterion);

        for (const slot of result.values()) {
            entities.push(this.entities[slot]!);
        }

        return entities;
    }

    private getSlotsByCriterion(criterion: Criterion): Set<number> {
        const uniqueIndexes = [...this.uniqueIndexes.values()].sort(
            (a, b) => b.getPaths().length - a.getPaths().length
        );

        const slots = new Set<number>();

        for (const index of uniqueIndexes) {
            const result = index.getByCriterion(criterion);

            if (result === false) {
                continue;
            }

            result.values.forEach(slot => slots.add(slot));
            const open = result.remapped.getOpen();

            if (open.length > 0) {
                if (open.length === 1) {
                    criterion = open[0];
                } else {
                    criterion = or(open);
                }
            } else {
                return slots;
            }
        }

        const commonIndexes = [...this.commonIndexes.values()].sort(
            (a, b) => b.getPaths().length - a.getPaths().length
        );

        for (const index of commonIndexes) {
            const result = index.getByCriterion(criterion);

            if (result === false) {
                continue;
            }

            result.values.forEach(slotSet => slotSet.forEach(slot => slots.add(slot)));
            const open = result.remapped.getOpen();

            if (open.length > 0) {
                if (open.length === 1) {
                    criterion = open[0];
                } else {
                    criterion = or(open);
                }
            } else {
                return slots;
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

        return slots;
    }

    private dedupeEntities(entities: Entity[], keyPaths: string[]): Entity[] {
        const keyMap = new ComplexKeyMap<Entity, Entity>(keyPaths);

        for (const entity of entities) {
            keyMap.set(entity, entity, (previous, current) => this.mergeEntities(previous, current));
        }

        return keyMap.getAll();
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
