import { Entity } from "../entity";
import { EntitySchema } from "../schema/entity-schema";

export function sortEntitiesByDefaultSorter(schema: EntitySchema, entities: readonly Entity[]): Entity[] {
    const sorter = schema.getSorter();

    if (sorter) {
        return entities.slice().sort(sorter);
    } else {
        return entities.slice();
    }
}
