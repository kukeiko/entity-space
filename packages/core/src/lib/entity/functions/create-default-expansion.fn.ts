import { ExpansionValue } from "../../expansion";
import { IEntitySchema } from "../../schema";

export function createDefaultExpansion(schema: IEntitySchema): ExpansionValue {
    return schema
        .getProperties()
        .filter(property => !schema.findRelation(property.getName()))
        .reduce((acc, property) => ({ ...acc, [property.getName()]: true }), {});
}
