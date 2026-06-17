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
import { joinPaths, Path } from "@entity-space/utils";
import { EntityChangesBuilder } from "../entity-changes-builder";
import { EntityMutationType } from "../entity-mutation";

function addCreateChanges(
    builder: EntityChangesBuilder,
    schema: EntitySchema,
    selection: EntityRelationSelection,
    entities: readonly Entity[],
): void {
    if (schema.hasId()) {
        for (const creatable of entities.filter(entity => isNewEntity(schema, entity))) {
            builder.addCreate(schema, creatable);
        }
    }

    for (const [relation, relatedSchema, selected] of relationEntries(schema, selection)) {
        const related = relation.readValuesFlat(entities);

        if (!related.length) {
            continue;
        }

        addCreateChanges(builder, relatedSchema, selected, related);
    }
}

function addUpdateChanges(
    builder: EntityChangesBuilder,
    schema: EntitySchema,
    selection: EntityRelationSelection,
    entities: readonly Entity[],
    previous?: readonly Entity[],
    path?: Path,
): void {
    if (schema.hasId()) {
        for (const updatable of entities.filter(entity => isPersistedEntity(schema, entity))) {
            builder.addUpdate(schema, path, selection, updatable);
        }

        if (previous !== undefined) {
            for (const entity of previous.filter(entity => entityHasId(schema, entity))) {
                builder.addPrevious(schema, path, selection, entity);
            }
        }
    }

    for (const [relation, relatedSchema, selected] of relationEntries(schema, selection)) {
        const related = relation.readValuesFlat(entities);
        const previousRelated = previous !== undefined ? relation.readValuesFlat(previous) : undefined;

        if (!related.length && (previousRelated === undefined || !previousRelated.length)) {
            continue;
        }

        addUpdateChanges(
            builder,
            relatedSchema,
            selected,
            related,
            previousRelated,
            joinPaths([path, relation.getName()]),
        );
    }
}

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

export function addEntityChanges(
    builder = new EntityChangesBuilder(),
    schema: EntitySchema,
    selection: EntityRelationSelection,
    entities: readonly Entity[],
    type: readonly EntityMutationType[],
    previous?: readonly Entity[],
): void {
    if (type.includes("create")) {
        addCreateChanges(builder, schema, selection, entities);
    }

    if (type.includes("update")) {
        addUpdateChanges(builder, schema, selection, entities, previous);
    }

    if (previous !== undefined && type.includes("delete")) {
        // [todo] ❓ should duplicates be merged during toEntityMap()?
        const current = toEntityMap(schema, selection, entities);
        addDeleteChanges(builder, schema, selection, current, previous);
    }
}
