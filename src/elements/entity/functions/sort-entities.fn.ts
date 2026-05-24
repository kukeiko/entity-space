import { compareValue, readPath } from "@entity-space/utils";
import { Entity } from "../entity";
import { EntitySort } from "../entity-sort";

export function sortEntities(entities: readonly Entity[], sort: EntitySort): Entity[] {
    return entities.slice().sort((entityA, entityB) => {
        for (const property of sort.getProperties()) {
            const a = readPath(property.getPath(), entityA);
            const b = readPath(property.getPath(), entityB);
            const result = compareValue(a, b) * (property.isAscending() ? 1 : -1);

            if (result !== 0) {
                return result;
            }
        }

        return 0;
    });
}
