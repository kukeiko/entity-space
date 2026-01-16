import { uniqBy } from "lodash";
import { EntityChange } from "../entity-change";
import { EntityChanges } from "../entity-changes";
import { EntityMutation, EntityMutationType } from "../entity-mutation";
import { getCreateChanges } from "./get-create-changes.fn";
import { getDeleteChanges } from "./get-delete-changes.fn";
import { getUpdateChanges } from "./get-update-changes.fn";

export function toEntityChanges(mutation: EntityMutation): EntityChanges | undefined {
    const schema = mutation.getSchema();
    const entities = mutation.getEntities();
    const selection = mutation.getSelection() ?? {};
    const previous = mutation.getPrevious();
    const type: EntityMutationType[] =
        mutation.getType() === "save" ? ["create", "update", "delete"] : [mutation.getType()];
    const changes: EntityChange[] = [];

    if (previous !== undefined && type.includes("delete")) {
        const deleted = uniqBy(
            getDeleteChanges(schema, entities, selection, previous, mutation.getType() === "delete"),
            change => change.getEntity(),
        );
        changes.push(...deleted);
    }

    if (type.includes("create")) {
        const created = uniqBy(getCreateChanges(schema, entities, selection), change => change.getEntity());
        changes.push(...created);
    }

    if (type.includes("update")) {
        const updated = uniqBy(getUpdateChanges(schema, entities, selection, previous), change => change.getEntity());
        changes.push(...updated);
    }

    return changes.length ? new EntityChanges(schema, selection, changes, entities, previous) : undefined;
}
