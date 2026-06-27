import {
    EntityProperty,
    EntitySchema,
    WhereEntityShapeInstance,
    WherePrimitiveShapeInstance,
} from "@entity-space/elements";
import { ODataArrayCriterion, ODataCriterion } from "./odata";

export function toODataCriterion(
    schema: EntitySchema,
    criterion: WhereEntityShapeInstance,
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
                        criterion: relatedResult as any, // [todo] ❌ dirty
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
    criterion: WherePrimitiveShapeInstance<any, any>,
    path: string[] = [],
): ODataCriterion | undefined {
    if (criterion === undefined) {
        return undefined;
    }

    const dtoName = property.getDtoName();
    const name = path.length ? [...path, dtoName].join("/") : dtoName;

    if (criterion.type === "$inArray") {
        return { property: name, operation: "in", value: criterion.value };
    } else if (criterion.type === "$equals") {
        return { property: name, operation: "eq", value: criterion.value };
    } else if (criterion.type === "$inRange") {
        const from = criterion.value[0];
        const to = criterion.value[1];

        if (from !== undefined && to !== undefined) {
            return {
                combinator: "and",
                criteria: [
                    { property: name, operation: "ge", value: from },
                    { property: name, operation: "le", value: to },
                ],
            };
        } else if (from !== undefined) {
            return {
                property: name,
                operation: "ge",
                value: from,
            };
        } else if (to !== undefined) {
            return {
                property: name,
                operation: "le",
                value: to,
            };
        }
    }

    return undefined;
}
