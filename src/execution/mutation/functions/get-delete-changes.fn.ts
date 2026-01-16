import { Entity, EntityRelationSelection, EntitySchema, entityHasId } from "@entity-space/elements";
import { ComplexKeyMap } from "@entity-space/utils";
import { EntityChange } from "../entity-change";

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
    const removedEntities = previous.filter(
        entity => entityHasId(schema, entity) && (!current.has(schema) || !current.get(schema)!.has(entity)),
    );

    return removedEntities.map(entity => {
        const removeFn = (removed: Entity) => {
            // the reason we mutate the "previous" array is to prevent an entity being deleted multiple times in case of a retry
            const index = previous.indexOf(removed);

            if (index < 0) {
                throw new Error("entity to remove not found");
            }

            previous.splice(index, 1);
        };

        return new EntityChange("delete", schema, entity, undefined, removeFn);
    });
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
                // skip if current entity did not explicitly provide a value for the relation
                continue;
            }

            const relation = schema.getRelation(key);
            const value = relation.readValue(entity);

            if (value == null) {
                continue;
            }

            const relatedSchema = relation.getRelatedSchema();

            if (!relation.isEmbedded()) {
                if (relation.isArray() && Array.isArray(value) && relation.isInbound()) {
                    // remove any children
                    changes.push(...getRemovedRootEntities(relatedSchema, current, value));
                } else if (includeReferences && !relation.isArray() && relation.isOutbound()) {
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

export function getDeleteChanges(
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
