import {
    Entity,
    entityHasId,
    EntityMap,
    EntityRelationSelection,
    EntitySchema,
    isNewEntity,
    isPersistedEntity,
    relationEntries,
    toEntityMap,
} from "@entity-space/elements";
import { joinPaths, Path } from "@entity-space/utils";
import { EntityChangesBuilder } from "../entity-changes-builder";
import { EntityMutation } from "../structures/entity-mutation";

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
    doDelete = false,
): void {
    for (const previousEntity of previous) {
        let nextEntity: Entity | undefined;

        if (schema.hasId() && entityHasId(schema, previousEntity)) {
            nextEntity = next.getEntity(schema, previousEntity);

            if (nextEntity === undefined && doDelete) {
                builder.addDelete(schema, previousEntity);
            }
        }

        for (const [relation, relatedSchema, relatedSelection] of relationEntries(schema, selection)) {
            let doDeleteRelated =
                relation.isJoined() &&
                relation.isInbound() &&
                (nextEntity === undefined || relation.hasValue(nextEntity));
            const related = relation.readValueAsArray(previousEntity);
            addDeleteChanges(builder, relatedSchema, relatedSelection, next, related, doDeleteRelated);
        }
    }
}

function addRootDeleteChanges(
    builder: EntityChangesBuilder,
    schema: EntitySchema,
    next: EntityMap,
    previous: readonly Entity[],
): void {
    addDeleteChanges(builder, schema, {}, next, previous, true);
}

function addInboundRelationDeleteChanges(
    builder: EntityChangesBuilder,
    schema: EntitySchema,
    next: EntityMap,
    previous: readonly Entity[],
    selection: EntityRelationSelection,
): void {
    addDeleteChanges(builder, schema, selection, next, previous, false);
}

export function addEntityChanges(builder: EntityChangesBuilder, mutation: EntityMutation): void {
    const schema = mutation.getSchema();
    const entities = mutation.getEntities();
    const selection = mutation.getSelection() ?? {};
    const previous = mutation.getPrevious();

    if (mutation.isSave() || mutation.isSync()) {
        addCreateChanges(builder, schema, selection, entities);
        addUpdateChanges(builder, schema, selection, entities, previous);
    }

    if (previous !== undefined) {
        // [todo] ❓ should duplicates be merged during toEntityMap()?
        const next = toEntityMap(schema, selection, entities);
        addInboundRelationDeleteChanges(builder, schema, next, previous, selection);

        if (mutation.isDelete() || mutation.isSync()) {
            addRootDeleteChanges(builder, schema, next, previous);
        }
    }
}
