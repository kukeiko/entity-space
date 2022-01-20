import { Expansion } from "../expansion/public";
import { Query } from "../query/public";
import { IEntitySchema } from "../schema/public";
import { Entity } from "./entity";
import { expandRelation } from "./expand-relation.fn";

export function expandEntities(
    schema: IEntitySchema,
    expansion: Expansion,
    entities: Entity[],
    query: (query: Query) => Promise<Entity[]>
): void {
    for (const propertyKey in expansion) {
        const expansionValue = expansion[propertyKey];

        if (expansionValue === void 0) {
            continue;
        }

        const relation = schema.findRelation(propertyKey);

        if (relation !== void 0) {
            expandRelation(entities, relation, query, expansionValue === true ? void 0 : expansionValue);
        } else if (expansionValue !== true) {
            const property = schema.getProperty(propertyKey);
            const referencedItems: Entity[] = [];

            for (const entity of entities) {
                const reference = entity[propertyKey];

                if (Array.isArray(reference)) {
                    referencedItems.push(...reference);
                } else {
                    referencedItems.push(reference);
                }
            }

            const entitySchema = property.getUnboxedEntitySchema();
            expandEntities(entitySchema, expansionValue, referencedItems, query);
        }
    }
}
