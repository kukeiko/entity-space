import { isDefined } from "@entity-space/utils";
import { isEqual } from "lodash";
import { Entity } from "../../common/entity.type";
import { ICriterion } from "../../criteria/criterion.interface";
import { EntityCriteriaTools } from "../../criteria/entity-criteria-tools";
import { EntityTools } from "../../entity/entity-tools";
import { IEntitySchema } from "../../schema/schema.interface";
import { EntityStoreCommonIndex } from "./entity-store-common-index";
import { EntityStoreUniqueIndex } from "./entity-store-unique-index";

export class EntityStore {
    constructor(entitySchema: IEntitySchema) {
        this.entitySchema = entitySchema;

        for (const index of entitySchema.getIndexesIncludingKey()) {
            if (index.isUnique()) {
                this.uniqueIndexes.set(index.getName(), new EntityStoreUniqueIndex(index.getPaths()));
            } else {
                this.commonIndexes.set(index.getName(), new EntityStoreCommonIndex(index.getPaths()));
            }
        }
    }

    private readonly entitySchema: IEntitySchema;
    private readonly uniqueIndexes = new Map<string, EntityStoreUniqueIndex>();
    private readonly commonIndexes = new Map<string, EntityStoreCommonIndex>();
    private parametersCache: { parameters: Entity; ids: Entity[] }[] = [];
    private entities: (Entity | undefined)[] = [];
    private readonly entityTools = new EntityTools();
    private readonly criteriaTools = new EntityCriteriaTools();

    getKeyIndex(): EntityStoreUniqueIndex {
        const keyIndex = this.uniqueIndexes.get(this.entitySchema.getKey().getName());

        if (!keyIndex) {
            throw new Error("no key index available");
        }

        return keyIndex;
    }

    clear(): void {
        this.entities = [];
        this.parametersCache = [];
        this.uniqueIndexes.forEach(index => index.clear());
        this.commonIndexes.forEach(index => index.clear());
    }

    // [todo] indexing needs to be crash safe (transactional safety)
    add(entities: Entity[], parameters?: Entity): void {
        if (this.entitySchema.hasKey()) {
            const key = this.entitySchema.getKey();
            entities = this.entityTools.dedupeMergeEntities(entities, key.getPaths());
            const keyIndex = this.getKeyIndex();

            for (let entity of entities) {
                const slot = keyIndex.get(entity);

                if (slot === void 0) {
                    this.uniqueIndexes.forEach(index => index.set(entity, this.entities.length));
                    this.commonIndexes.forEach(index => index.add(entity, this.entities.length));
                    this.entities.push(this.entityTools.copyEntity(entity));
                } else {
                    const previous = this.entities[slot]!;
                    entity = this.entityTools.mergeEntities(previous, entity);
                    this.entities[slot] = entity;
                    this.uniqueIndexes.forEach(index => index.replace(previous, entity, slot));
                    this.commonIndexes.forEach(index => index.replace(previous, entity, slot));
                }
            }
        } else {
            for (const entity of entities) {
                this.uniqueIndexes.forEach(index => index.set(entity, this.entities.length));
                this.commonIndexes.forEach(index => index.add(entity, this.entities.length));
                this.entities.push(entity);
            }
        }

        if (parameters) {
            // [todo] throw error if no id defined; i.e. parameters can't be used if there is no id.
            const key = this.entitySchema.getKey();
            const cache = this.parametersCache.find(cache => isEqual(cache.parameters, parameters));

            if (cache) {
                cache.ids = this.entityTools.dedupeMergeEntities([...cache.ids, ...entities], key.getPaths());
            } else {
                this.parametersCache.push({ ids: entities, parameters });
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

    getByCriterion(criterion: ICriterion): Entity[] {
        const entities: Entity[] = [];
        const result = this.getSlotsByCriterion(criterion);

        for (const slot of result.values()) {
            entities.push(this.entities[slot]!);
        }

        return entities;
    }

    remove(entity: Entity): void {
        const slot = this.getKeyIndex().get(entity);

        if (slot === void 0) {
            return;
        }

        this.entities[slot] = undefined;
        this.uniqueIndexes.forEach(index => index.delete(entity));
        this.commonIndexes.forEach(index => index.delete(entity, slot));
    }

    private getSlotsByCriterion(criterion: ICriterion): Set<number> {
        let open: ICriterion | undefined = criterion;
        const slots = new Set<number>();
        open = this.addSlotsByUniqueIndexes(open, slots);

        if (open === void 0) {
            return slots;
        }

        open = this.addSlotsByCommonIndexes(open, slots);

        if (open === void 0) {
            return slots;
        }

        // if we are here, we couldn't fully rely on using indexes alone.
        // have to make a full scan for the criteria that are still open.
        for (let slot = 0; slot < this.entities.length; ++slot) {
            if (!open.contains(this.entities[slot])) {
                continue;
            }

            slots.add(slot);
        }

        return slots;
    }

    private addSlotsByUniqueIndexes(criterion: ICriterion, slots: Set<number>): ICriterion | undefined {
        const uniqueIndexes = this.sortIndexesByComplexity(this.uniqueIndexes.values());

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
                return void 0;
            }
        }

        return criterion;
    }

    private addSlotsByCommonIndexes(criterion: ICriterion, slots: Set<number>): ICriterion | undefined {
        const commonIndexes = this.sortIndexesByComplexity(this.commonIndexes.values());

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
                return void 0;
            }
        }

        return criterion;
    }

    getByParameters(parameters: Entity, criterion?: ICriterion): Entity[] {
        const cache = this.parametersCache.find(cache => isEqual(cache.parameters, parameters));

        if (!cache) {
            return [];
        }

        const entities = cache.ids.map(id => this.get(id)).filter(isDefined);

        if (criterion) {
            return entities.filter(entity => criterion.contains(entity));
        } else {
            return entities;
        }
    }

    private sortIndexesByComplexity<T extends EntityStoreUniqueIndex | EntityStoreCommonIndex>(
        indexes: Iterable<T>
    ): T[] {
        return [...indexes].sort((a, b) => b.getPaths().length - a.getPaths().length);
    }
}
