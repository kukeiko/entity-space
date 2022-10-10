import { ExpansionValue, IEntitySchema } from "@entity-space/common";

export function createDefaultExpansion(schema: IEntitySchema): ExpansionValue {
    return schema
        .getProperties()
        .filter(property => !schema.findRelation(property.getName()))
        .reduce((acc, property) => ({ ...acc, [property.getName()]: true }), {});
}
