import {
    Entity,
    EntityRelationSelection,
    EntitySchema,
    getEntityDifference,
    isNewEntity,
    isPersistedEntity,
    toEntityPairs,
} from "@entity-space/elements";
import { ComplexKeyMap, readPath, writePath } from "@entity-space/utils";
import { isEmpty } from "lodash";
import { entityHasId } from "../../elements/entity/entity-has-id.fn";
import { EntityChange } from "./entity-change";
import { EntityChanges } from "./entity-changes";
import { EntityMutation, EntityMutationType } from "./entity-mutation";

function getCreated(
    schema: EntitySchema,
    entities: readonly Entity[],
    selection: EntityRelationSelection,
): EntityChange[] {
    if (!entities.length) {
        return [];
    }

    const created: EntityChange[] = [];

    if (schema.hasId()) {
        created.push(
            ...entities
                .filter(entity => isNewEntity(schema, entity))
                .map(entity => new EntityChange("create", schema, entity)),
        );
    }

    for (const [key, selected] of Object.entries(selection)) {
        const relation = schema.getRelation(key);
        const relatedSchema = relation.getRelatedSchema();
        const related = relation.readValues(entities);
        created.push(...getCreated(relatedSchema, related, selected));
    }

    return created;
}

function getUpdated(
    schema: EntitySchema,
    entities: readonly Entity[],
    selection: EntityRelationSelection,
    previousEntities?: readonly Entity[],
): EntityChange[] {
    if (!entities.length) {
        return [];
    }

    const updated: EntityChange[] = [];

    if (schema.hasId()) {
        const updatedEntities = entities.filter(entity => isPersistedEntity(schema, entity));

        if (previousEntities !== undefined) {
            const pairs = toEntityPairs(schema, updatedEntities, previousEntities);

            for (const [current, previous] of pairs) {
                const difference =
                    previous !== undefined ? getEntityDifference(schema, current, previous, selection) : current;

                if (!isEmpty(difference)) {
                    for (const idPath of schema.getIdPaths()) {
                        writePath(idPath, difference, readPath(idPath, current));
                    }

                    updated.push(new EntityChange("update", schema, current, difference));
                }
            }

            const pairedEntities = new Set(pairs.map(pair => pair[0]));

            for (const updatedUnpairedEntity of updatedEntities.filter(entity => !pairedEntities.has(entity))) {
                updated.push(new EntityChange("update", schema, updatedUnpairedEntity));
            }
        } else {
            updated.push(
                ...entities
                    .filter(entity => isPersistedEntity(schema, entity))
                    .map(entity => new EntityChange("update", schema, entity)),
            );
        }
    }

    for (const [key, selected] of Object.entries(selection)) {
        const relation = schema.getRelation(key);
        const relatedSchema = relation.getRelatedSchema();
        const related = relation.readValues(entities);
        const previousRelated = previousEntities ? relation.readValues(previousEntities) : undefined;
        updated.push(...getUpdated(relatedSchema, related, selected, previousRelated));
    }

    return updated;
}

function getMapOfAllEntities(
    schema: EntitySchema,
    entities: readonly Entity[],
    selection: EntityRelationSelection,
    map = new Map<EntitySchema, ComplexKeyMap<Entity, Entity>>(),
): Map<EntitySchema, ComplexKeyMap<Entity, Entity>> {
    for (const entity of entities) {
        if (entityHasId(schema, entity)) {
            if (!map.has(schema)) {
                map.set(schema, new ComplexKeyMap(schema.getIdPaths()));
            }

            map.get(schema)!.set(entity, entity);
        }

        for (const [key, selected] of Object.entries(selection)) {
            const relation = schema.getRelation(key);
            getMapOfAllEntities(relation.getRelatedSchema(), relation.readValueAsArray(entity), selected, map);
        }
    }

    return map;
}

function getRemovedRootEntities(
    schema: EntitySchema,
    current: Map<EntitySchema, ComplexKeyMap<Entity, Entity>>,
    previous: Entity[],
): EntityChange[] {
    const removed: EntityChange[] = [];

    for (const entity of previous) {
        if (entityHasId(schema, entity) && (!current.has(schema) || !current.get(schema)!.has(entity))) {
            removed.push(
                new EntityChange("delete", schema, entity, undefined, removed => {
                    // the reason we mutate the "previous" array is to prevent an entity being deleted multiple times in case of a retry
                    const index = previous.indexOf(removed);

                    if (index < 0) {
                        throw new Error("entity to remove not found");
                    }

                    previous.splice(index, 1);
                }),
            );
        }
    }

    return removed;
}

function getRemovedRelatedEntities(
    schema: EntitySchema,
    current: Map<EntitySchema, ComplexKeyMap<Entity, Entity>>,
    previous: Entity[],
    selection: EntityRelationSelection,
    includeReferences = false,
): EntityChange[] {
    const changes: EntityChange[] = [];

    for (const entity of previous) {
        for (const [key, selected] of Object.entries(selection)) {
            if (
                entityHasId(schema, entity) &&
                current.has(schema) &&
                current.get(schema)!.has(entity) &&
                current.get(schema)!.get(entity)![key] === undefined
            ) {
                // skip if original entity did not explicitly provide a value for the relation
                continue;
            }

            const relation = schema.getRelation(key);
            const value = relation.readValue(entity);

            if (value == null) {
                continue;
            }

            const relatedSchema = relation.getRelatedSchema();

            if (!relation.isEmbedded()) {
                if (relation.isArray() && relation.joinsFromId() && Array.isArray(value)) {
                    // remove any children
                    changes.push(...getRemovedRootEntities(relatedSchema, current, value));
                } else if (includeReferences && !relation.isArray() && relation.joinsToId() && value != null) {
                    // remove any references
                    changes.push(...getRemovedRootEntities(relatedSchema, current, [value]));
                }
            }

            changes.push(
                ...getRemovedRelatedEntities(
                    relatedSchema,
                    current,
                    relation.readValueAsArray(entity),
                    selected,
                    includeReferences,
                ),
            );
        }
    }

    return changes;
}

function getRemoved(
    schema: EntitySchema,
    current: readonly Entity[],
    selection: EntityRelationSelection,
    previous: Entity[],
    includeReferences = false,
): EntityChange[] {
    const currentEntitiesMap = getMapOfAllEntities(schema, current, selection);
    const removedRoots = getRemovedRootEntities(schema, currentEntitiesMap, previous);
    const removedChildren = getRemovedRelatedEntities(
        schema,
        currentEntitiesMap,
        previous,
        selection,
        includeReferences,
    );

    return [...removedRoots, ...removedChildren];
}

export function toEntityChanges(mutation: EntityMutation): EntityChanges | undefined {
    const schema = mutation.getSchema();
    const entities = mutation.getEntities();
    const selection = mutation.getSelection() ?? {};
    const previous = mutation.getPrevious();
    const type: EntityMutationType[] =
        mutation.getType() === "save" ? ["create", "update", "delete"] : [mutation.getType()];
    const changes: EntityChange[] = [];

    if (previous !== undefined && type.includes("delete")) {
        changes.push(...getRemoved(schema, entities, selection, previous, mutation.getType() === "delete"));
    }

    if (type.includes("create")) {
        changes.push(...getCreated(schema, entities, selection));
    }

    if (type.includes("update")) {
        changes.push(...getUpdated(schema, entities, selection, previous));
    }

    return changes.length ? new EntityChanges(schema, selection, changes, entities, previous) : undefined;
}
