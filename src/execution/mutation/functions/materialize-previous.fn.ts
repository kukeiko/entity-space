import { Entity, entityHasId, EntityRelationSelection, EntitySchema, relationEntries } from "@entity-space/elements";
import { ComplexKeyMap } from "@entity-space/utils";
import { CommittedEntities } from "../committed-entities";
import { EntityChangeStatus, PlannedEntityChange } from "../structures/entity-change";

/**
 * Builds the entities known to be persisted after executing changes, in the shape of the previous entities:
 * - next entities whose changes succeeded (or that had no changes) are taken as they are now
 * - next entities whose changes did not succeed are taken from the previous entities (or the committed record),
 *   and left out entirely if their persisted state is unknown (e.g. a failed create)
 * - previous entities missing from the next entities are kept, unless they have been deleted
 */
export function materializePrevious(
    schema: EntitySchema,
    selection: EntityRelationSelection,
    next: readonly Entity[],
    previous: readonly Entity[],
    items: readonly PlannedEntityChange[],
    committed: CommittedEntities,
): Entity[] {
    const itemsByEntity = new Map<Entity, PlannedEntityChange[]>();

    for (const item of items) {
        itemsByEntity.set(item.getEntity(), [...(itemsByEntity.get(item.getEntity()) ?? []), item]);
    }

    const nextIndex = new Map<EntitySchema, ComplexKeyMap<Entity, Entity[]>>();
    indexEntities(schema, selection, next, nextIndex);
    const memo = new Map<Entity, Entity>();

    const isCurrent = (entity: Entity): boolean =>
        (itemsByEntity.get(entity) ?? []).every(item => item.getStatus() === EntityChangeStatus.Succeeded);

    const materialize = (
        schema: EntitySchema,
        selection: EntityRelationSelection,
        next: readonly Entity[] | undefined,
        previous: readonly Entity[],
    ): Entity[] => {
        if (!schema.hasId()) {
            return structuredClone((next ?? previous).slice());
        }

        const materialized: Entity[] = [];
        const previousById = new ComplexKeyMap<Entity, Entity>(schema.getIdPaths());
        const matchedPrevious = new Set<Entity>();

        for (const entity of previous.filter(entity => entityHasId(schema, entity))) {
            if (!previousById.has(entity)) {
                previousById.set(entity, entity);
            }
        }

        for (const entity of next ?? []) {
            if (!entityHasId(schema, entity)) {
                continue;
            }

            const previousEntity = previousById.get(entity);

            if (previousEntity !== undefined) {
                matchedPrevious.add(previousEntity);
            }

            const memoized = memo.get(entity);

            if (memoized !== undefined) {
                materialized.push(memoized);
                continue;
            }

            const state = isCurrent(entity)
                ? (itemsByEntity.has(entity) ? entity : (previousEntity ?? committed.get(schema, entity) ?? entity))
                : (previousEntity ?? committed.get(schema, entity));

            if (state === undefined) {
                continue;
            }

            const node = materializeRelations(schema, selection, structuredClone(state), entity, previousEntity);
            memo.set(entity, node);
            materialized.push(node);
        }

        for (const entity of previous) {
            if (matchedPrevious.has(entity) || committed.isDeleted(schema, entity) || isPersistedElsewhere(schema, entity)) {
                continue;
            }

            materialized.push(materializeRelations(schema, selection, structuredClone(entity), undefined, entity));
        }

        return materialized;
    };

    const materializeRelations = (
        schema: EntitySchema,
        selection: EntityRelationSelection,
        node: Entity,
        next: Entity | undefined,
        previous: Entity | undefined,
    ): Entity => {
        for (const [relation, relatedSchema, selected] of relationEntries(schema, selection)) {
            if (!relation.isJoined()) {
                continue;
            }

            const nextValue = next === undefined ? undefined : relation.readValue(next);
            const previousValue = previous === undefined ? undefined : relation.readValue(previous);

            if (nextValue === undefined && previousValue === undefined) {
                delete node[relation.getName()];
                continue;
            }

            const related = materialize(
                relatedSchema,
                selected,
                nextValue === undefined ? undefined : next === undefined ? [] : relation.readValueAsArray(next),
                previous === undefined ? [] : relation.readValueAsArray(previous),
            );

            node[relation.getName()] = relation.isArray() ? related : (related[0] ?? null);
        }

        return node;
    };

    const isPersistedElsewhere = (schema: EntitySchema, entity: Entity): boolean => {
        const candidates = nextIndex.get(schema)?.get(entity);
        return candidates !== undefined && candidates.some(isCurrent);
    };

    return materialize(schema, selection, next, previous);
}

function indexEntities(
    schema: EntitySchema,
    selection: EntityRelationSelection,
    entities: readonly Entity[],
    index: Map<EntitySchema, ComplexKeyMap<Entity, Entity[]>>,
): void {
    if (!entities.length) {
        return;
    }

    if (schema.hasId()) {
        let map = index.get(schema);

        if (map === undefined) {
            map = new ComplexKeyMap(schema.getIdPaths());
            index.set(schema, map);
        }

        for (const entity of entities.filter(entity => entityHasId(schema, entity))) {
            map.set(entity, [...(map.get(entity) ?? []), entity]);
        }
    }

    for (const [relation, relatedSchema, selected] of relationEntries(schema, selection)) {
        indexEntities(relatedSchema, selected, relation.readValuesFlat(entities), index);
    }
}
