import { Entity, IEntitySchema } from "@entity-space/common";
import { Criterion, or } from "@entity-space/criteria";
import { ComplexKeyMap } from "../data-structures/complex-key-map";
import { EntityStoreCommonIndex } from "./entity-store-common-index";
import { EntityStoreUniqueIndex } from "./entity-store-unique-index";

export class EntityStore {
    constructor(entitySchema: IEntitySchema) {
        this.entitySchema = entitySchema;

        for (const index of entitySchema.getIndexesIncludingKey()) {
            if (index.isUnique()) {
                this.uniqueIndexes.set(index.getName(), new EntityStoreUniqueIndex(index.getPath()));
            } else {
                this.commonIndexes.set(index.getName(), new EntityStoreCommonIndex(index.getPath()));
            }
        }
    }

    private readonly entitySchema: IEntitySchema;
    private readonly uniqueIndexes = new Map<string, EntityStoreUniqueIndex>();
    private readonly commonIndexes = new Map<string, EntityStoreCommonIndex>();
    private entities: (Entity | undefined)[] = [];

    // [todo] indexing needs to be crash safe (transactional safety)
    add(entities: Entity[]): void {
        if (this.entitySchema.hasKey()) {
            const key = this.entitySchema.getKey();
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
                    entity = this.mergeEntities(previous, entity);
                    this.entities[slot] = entity;
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
        const key = this.entitySchema.getKey();
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
        // [todo] use global mergEntities() instead
        const merged: Entity = {};

        for (const entity of entities) {
            for (const key in entity) {
                const value = entity[key];

                if (value === void 0) {
                    delete merged[key];
                } else if (value !== null && typeof value === "object" && !(value instanceof Date)) {
                    if (typeof merged[key] === "object" && !Array.isArray(value) && !(value instanceof Date)) {
                        merged[key] = this.mergeEntities(merged[key], value);
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
