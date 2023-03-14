import { Entity } from "../../common/entity.type";
import { ICriterion } from "../../criteria/criterion.interface";
import { EntityCriteriaTools } from "../../criteria/entity-criteria-tools";
import { QueryPaging } from "../../query/query-paging";
import { IEntitySchema } from "../../schema/schema.interface";
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
    private readonly optionsCache: { options: ICriterion; ids: Entity[] }[] = [];
    private entities: (Entity | undefined)[] = [];
    private readonly criteriaTools = new EntityCriteriaTools();

    getKeyIndex(): EntityStoreUniqueIndex {
        const keyIndex = this.uniqueIndexes.get(this.entitySchema.getKey().getName());

        if (!keyIndex) {
            throw new Error("no key index available");
        }

        return keyIndex;
    }

    // [todo] indexing needs to be crash safe (transactional safety)
    add(entities: Entity[], options?: ICriterion, page?: QueryPaging): void {
        if (this.entitySchema.hasKey()) {
            const key = this.entitySchema.getKey();
            entities = this.dedupeEntities(entities, key.getPath());
            const keyIndex = this.getKeyIndex();

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

        // [todo] seems to be unused
        if (options) {
            const match = this.optionsCache.find(item => item.options.equivalent(options));

            if (match) {
                match.ids = entities;
            } else {
                this.optionsCache.push({ ids: entities, options });
            }
        }
    }

    get(entity: Entity): Entity | undefined {
        const slot = this.getKeyIndex().get(entity);

        if (slot === void 0) {
            return void 0;
        }

        return this.entities[slot];
    }

    getByCriterion(criterion: ICriterion, options?: ICriterion, page?: QueryPaging): Entity[] {
        const entities: Entity[] = [];
        const result = this.getSlotsByCriterion(criterion, options, page);

        for (const slot of result.values()) {
            entities.push(this.entities[slot]!);
        }

        return entities;
    }

    private getSlotsByCriterion(criterion: ICriterion, options?: ICriterion, page?: QueryPaging): Set<number> {
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
            const open = result.reshaped.getOpen();

            if (open.length > 0) {
                if (open.length === 1) {
                    criterion = open[0];
                } else {
                    criterion = this.criteriaTools.or(open);
                }
            } else {
                return slots;
            }
        }

        // most narrowing indexes first to potentially increase performance
        const commonIndexes = [...this.commonIndexes.values()].sort(
            (a, b) => b.getPaths().length - a.getPaths().length
        );

        for (const index of commonIndexes) {
            const result = index.getByCriterion(criterion);

            if (result === false) {
                continue;
            }

            result.values.forEach(slotSet => slotSet.forEach(slot => slots.add(slot)));
            const open = result.reshaped.getOpen();

            if (open.length > 0) {
                if (open.length === 1) {
                    criterion = open[0];
                } else {
                    criterion = this.criteriaTools.or(open);
                }
            } else {
                return slots;
            }
        }

        // if we are here, we couldn't fully rely on using indexes alone.
        // have to make a full scan for the criteria that are still open.
        for (let slot = 0; slot < this.entities.length; ++slot) {
            if (!criterion.contains(this.entities[slot])) {
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
