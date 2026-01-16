import { EntityRelationSelection, EntitySchema } from "@entity-space/elements";
import { Path } from "@entity-space/utils";
import { EntityChange } from "../entity-change";
import { EntityMutationDependency } from "../entity-mutation-dependency";
import { getCreateDependencies } from "./get-create-dependencies.fn";
import { getDeleteDependencies } from "./get-delete-dependencies.fn";

export function getMutationDependencies(
    schema: EntitySchema,
    changes: readonly EntityChange[],
    required: EntityRelationSelection,
    supported?: EntityRelationSelection,
    path?: Path,
): EntityMutationDependency[] {
    const createdEntities = changes.filter(change => change.isCreateOrUpdate()).map(change => change.getEntity());
    const deletedEntities = changes.filter(change => change.isDelete()).map(change => change.getEntity());

    return [
        ...getCreateDependencies(schema, createdEntities, required, supported, path),
        ...getDeleteDependencies(schema, deletedEntities, required, supported, path),
    ];
}
