import { Entity } from "@entity-space/elements";
import { partition } from "lodash";
import { EntityChange, EntityChangeType } from "../structures/entity-change";
import { EntityChanges } from "../structures/entity-changes";

export function subtractChanges(
    from: EntityChanges,
    types: readonly EntityChangeType[],
    entities: readonly Entity[],
): [changes: EntityChange[], open: EntityChanges | undefined] {
    const [subtracted, open] = partition(
        from.getChanges(),
        change => change.isType(types) && entities.includes(change.getEntity()),
    );

    return [subtracted, open.length ? from.with({ changes: open }) : undefined];
}
