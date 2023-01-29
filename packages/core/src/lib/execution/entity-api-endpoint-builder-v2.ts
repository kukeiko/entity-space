import { Entity, IEntitySchema } from "@entity-space/common";
import { ICriterionShape } from "../criteria/templates/criterion-shape.interface";

// [todo] accidentally committed this file
type AddFieldsArgument<T> = {
    [K in keyof T]?: ICriterionShape;
};

interface SchemaDefined<T> {
    schema: IEntitySchema;
    filtersBy<F extends AddFieldsArgument<T>>(fields: F): RequiredFieldsDefined<T, F>;
    // loadsAll() :
}

interface RequiredFieldsDefined<T, R> {}

export class EntityApiEndpointBuilder_V2 {
    forSchema<T extends Entity>(schema: IEntitySchema<T>): any {}
}
