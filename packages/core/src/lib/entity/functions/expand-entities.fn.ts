import { walkPath } from "@entity-space/utils";
import { ExpansionObject } from "../../expansion/expansion-object";
import { IEntitySchema } from "../../schema";
import { Entity } from "../entity";
import { IEntitySource } from "../entity-source.interface";
import { expandRelation } from "./expand-relation.fn";

export async function expandEntities(
    schema: IEntitySchema,
    expansion: ExpansionObject,
    entities: Entity[],
    source: IEntitySource
): Promise<boolean> {
    const tasks: Promise<boolean>[] = [];

    // [todo] dirty
    const isExpanded = (propertyKey: string): boolean => {
        const first = entities[0];

        if (first === void 0) return false;

        return first[propertyKey] !== void 0;
    };

    for (const propertyKey in expansion) {
        const expansionValue = expansion[propertyKey];

        if (expansionValue === void 0) {
            continue;
        }

        const relation = schema.findRelation(propertyKey);

        if (relation !== void 0 && !isExpanded(relation.getPropertyName())) {
            const task = (async (propertyKey: string) => {
                const result = await expandRelation(
                    entities,
                    relation,
                    source,
                    expansionValue === true ? void 0 : expansionValue
                );

                return result;
            })(propertyKey);

            tasks.push(task);
        } else if (expansionValue !== true) {
            const property = schema.getProperty(propertyKey);
            const referencedItems: Entity[] = [];

            for (const entity of entities) {
                const reference = walkPath<Entity>(propertyKey, entity);

                if (Array.isArray(reference)) {
                    referencedItems.push(...reference);
                } else if (reference) {
                    referencedItems.push(reference);
                }
            }

            const entitySchema = property.getUnboxedEntitySchema();
            const task = (async () => {
                const result = await expandEntities(entitySchema, expansionValue, referencedItems, source);

                return result;
            })();

            tasks.push(task);
        }
    }

    const results = await Promise.all(tasks);

    return !results.every(result => result === false);
}
