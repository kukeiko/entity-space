import { ExpansionValue } from "@entity-space/common";
import { IEntitySchema } from "../../schema/schema.interface";

export function createDefaultExpansion(schema: IEntitySchema): ExpansionValue {
    return schema
        .getProperties()
        .filter(property => !schema.findRelation(property.getName()))
        .reduce((acc, property) => ({ ...acc, [property.getName()]: true }), {});
}
