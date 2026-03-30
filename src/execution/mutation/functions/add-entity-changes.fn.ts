import {
    Entity,
    entityHasId,
    EntityMap,
    EntityRelationProperty,
    EntityRelationSelection,
    EntitySchema,
    isNewEntity,
    isPersistedEntity,
    relationEntries,
    toEntityMap,
} from "@entity-space/elements";
import { EntityChangesBuilder } from "../entity-changes-builder";
import { EntityMutationType } from "../entity-mutation";

function addDeleteChanges(
    builder: EntityChangesBuilder,
    schema: EntitySchema,
    selection: EntityRelationSelection,
    next: EntityMap,
    previous: readonly Entity[],
    relation?: EntityRelationProperty,
    relationValueIsDefined?: boolean,
): void {
    for (const previousEntity of previous) {
        let nextEntity: Entity | undefined;

        if (schema.hasId() && entityHasId(schema, previousEntity)) {
            nextEntity = next.getEntity(schema, previousEntity);

            if (
                nextEntity === undefined &&
                (relation === undefined || (relation.isInbound() && relationValueIsDefined))
            ) {
                builder.addDelete(schema, previousEntity);
            }
        }

        for (const [relation, relatedSchema, relatedSelection] of relationEntries(schema, selection)) {
            const nextHasDefinedRelationValue =
                (nextEntity !== undefined && relation.hasValue(nextEntity)) || nextEntity === undefined;
            const related = relation.readValueAsArray(previousEntity);

            addDeleteChanges(
                builder,
                relatedSchema,
                relatedSelection,
                next,
                related,
                relation,
                nextHasDefinedRelationValue,
            );
        }
    }
}

// [todo] ❓ consider extracting addPrevious() logic out of this function
function addCreateAndUpdateChanges(
    builder: EntityChangesBuilder,
    schema: EntitySchema,
    selection: EntityRelationSelection,
    entities: readonly Entity[],
    type: readonly EntityMutationType[],
    previous?: readonly Entity[],
): void {
    if (schema.hasId()) {
        if (type.includes("update")) {
            for (const updatable of entities.filter(entity => isPersistedEntity(schema, entity))) {
                builder.addUpdate(schema, updatable);
            }
        }

        if (type.includes("create")) {
            for (const creatable of entities.filter(entity => isNewEntity(schema, entity))) {
                builder.addCreate(schema, creatable);
            }
        }

        if (type.includes("update") || type.includes("delete")) {
            if (previous !== undefined) {
                for (const entity of previous.filter(entity => entityHasId(schema, entity))) {
                    builder.addPrevious(schema, entity);
                }
            }
        }
    }

    for (const [relation, relatedSchema, selected] of relationEntries(schema, selection)) {
        const related = relation.readValuesFlat(entities);
        const previousRelated = previous !== undefined ? relation.readValuesFlat(previous) : undefined;

        if (!related.length && (previousRelated === undefined || !previousRelated.length)) {
            continue;
        }

        addCreateAndUpdateChanges(builder, relatedSchema, selected, related, type, previousRelated);
    }
}

export function addEntityChanges(
    builder = new EntityChangesBuilder(),
    schema: EntitySchema,
    selection: EntityRelationSelection,
    entities: readonly Entity[],
    type: readonly EntityMutationType[],
    previous?: readonly Entity[],
): void {
    if (type.includes("create") || type.includes("update")) {
        addCreateAndUpdateChanges(builder, schema, selection, entities, type, previous);
    }

    if (previous !== undefined && type.includes("delete")) {
        // [todo] ❓ should duplicates be merged during toEntityMap()?
        const current = toEntityMap(schema, selection, entities);
        addDeleteChanges(builder, schema, selection, current, previous);
    }
}
