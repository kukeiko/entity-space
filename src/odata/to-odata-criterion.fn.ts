import { EntityProperty, EntitySchema, WhereEntity, WherePrimitive } from "@entity-space/elements";
import { isDefined, isPrimitive } from "@entity-space/utils";
import { ODataArrayCriterion, ODataCriterion } from "./odata";

export function toODataCriterion(
    schema: EntitySchema,
    criterion: WhereEntity,
    path: string[] = [],
): ODataCriterion | undefined {
    if (criterion === undefined) {
        return undefined;
    }

    const oDataCriterion: ODataCriterion = { combinator: "and", criteria: [] };

    for (const [key, value] of Object.entries(criterion)) {
        if (schema.isPrimitive(key)) {
            const property = schema.getPrimitive(key);
            const result = primitiveToODataCriterion(property, value as any, path);

            if (result !== undefined) {
                oDataCriterion.criteria.push(result);
            }
        } else if (schema.isRelation(key)) {
            const relation = schema.getRelation(key);
            const dtoName = relation.getDtoName();

            if (relation.isArray()) {
                const name = path.length ? [...path, dtoName].join("/") : dtoName;
                const relatedResult = toODataCriterion(relation.getRelatedSchema(), value);

                if (relatedResult !== undefined) {
                    const result: ODataArrayCriterion = {
                        operation: "any",
                        property: name,
                        criterion: relatedResult,
                    };

                    oDataCriterion.criteria.push(result);
                }
            } else {
                const result = toODataCriterion(relation.getRelatedSchema(), value, [...path, dtoName]);

                if (result !== undefined) {
                    oDataCriterion.criteria.push(result);
                }
            }
        }
    }

    if (oDataCriterion.criteria.length === 1) {
        return oDataCriterion.criteria[0];
    }

    return oDataCriterion;
}

function primitiveToODataCriterion(
    property: EntityProperty,
    criterion: WherePrimitive,
    path: string[] = [],
): ODataCriterion | undefined {
    if (criterion === undefined) {
        return undefined;
    }

    const dtoName = property.getDtoName();
    const name = path.length ? [...path, dtoName].join("/") : dtoName;

    if (isPrimitive(criterion)) {
        if (criterion === undefined) {
            return undefined;
        }

        return { property: name, operation: "eq", value: criterion };
    } else if (Array.isArray(criterion) && criterion.every(isPrimitive)) {
        const value = criterion.filter(isDefined);

        if (!value.length) {
            return undefined;
        }

        return { property: name, operation: "in", value };
    }

    if (criterion.$inArray !== undefined) {
        const value = criterion.$inArray.filter(isDefined);

        if (!value.length) {
            return undefined;
        }

        return { property: name, operation: "in", value };
    } else if (criterion.$notInArray !== undefined) {
        const value = criterion.$notInArray.filter(isDefined);

        if (!value.length) {
            return undefined;
        }

        return { property: name, operation: "not-in", value };
    } else if (criterion.$equals !== undefined) {
        return { property: name, operation: "eq", value: criterion.$equals };
    } else if (criterion.$notEquals !== undefined) {
        return { property: name, operation: "ne", value: criterion.$notEquals };
    } else if (criterion.$inRange !== undefined) {
        const from = criterion.$inRange[0];
        const to = criterion.$inRange[1];

        if (from !== undefined && to !== undefined) {
            return {
                combinator: "and",
                criteria: [
                    { property: name, operation: "ge", value: from },
                    { property: name, operation: "le", value: to },
                ],
            };
        } else if (from !== undefined) {
            return { property: name, operation: "ge", value: from };
        } else if (to !== undefined) {
            return { property: name, operation: "le", value: to };
        }
    }

    return undefined;
}
