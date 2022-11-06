import { EntitySelectionValue, IEntitySchema } from "@entity-space/common";

export function createDefaultExpansion(schema: IEntitySchema): EntitySelectionValue {
    return schema
        .getProperties()
        .filter(property => !schema.findRelation(property.getName()))
        .reduce((acc, property) => ({ ...acc, [property.getName()]: true }), {});
}
