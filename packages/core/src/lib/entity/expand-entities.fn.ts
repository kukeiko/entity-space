import { Expansion, mergeExpansions } from "../expansion/public";
import { IEntitySchema } from "../schema/public";
import { Entity } from "./entity";
import { IEntitySource } from "./entity-source.interface";
import { expandRelation } from "./expand-relation.fn";

export async function expandEntities(
    schema: IEntitySchema,
    expansion: Expansion,
    entities: Entity[],
    source: IEntitySource
): Promise<false | Expansion> {
    const tasks: Promise<false | Expansion>[] = [];

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

                if (result === false) {
                    return false;
                }

                return { [propertyKey]: Object.keys(result).length === 0 ? true : result };
            })(propertyKey);

            tasks.push(task);
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
            const task = (async (propertyKey: string) => {
                const result = await expandEntities(entitySchema, expansionValue, referencedItems, source);

                if (result === false) {
                    return false;
                }

                return { [propertyKey]: Object.keys(result).length === 0 ? true : result };
            })(propertyKey);

            tasks.push(task);
        }
    }

    const results = await Promise.all(tasks);

    // [todo] move somewhere else
    function isNotFalse<T extends false | any>(value: T): value is Exclude<T, false> {
        return value !== false;
    }

    const successfulExpansion = mergeExpansions(...results.filter(isNotFalse));

    // [todo] i think returning false if all in results are false is correct - but not 100% sure
    return results.every(result => result === false) ? false : successfulExpansion;
}
