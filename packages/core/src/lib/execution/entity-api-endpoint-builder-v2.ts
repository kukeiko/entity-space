import { IEntitySchema } from "@entity-space/common";
import { ICriterionTemplate } from "@entity-space/criteria";

// [todo] accidentally committed this file
type AddFieldsArgument<T> = {
    [K in keyof T]?: ICriterionTemplate;
};

interface SchemaDefined<T> {
    schema: IEntitySchema;
    filtersBy<F extends AddFieldsArgument<T>>(fields: F): RequiredFieldsDefined<T, F>;
    // loadsAll() :
}

interface RequiredFieldsDefined<T, R> {}

export class EntityApiEndpointBuilder_V2 {
    forSchema<T>(schema: IEntitySchema<T>): any {}
}
