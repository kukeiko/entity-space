import { EntitySpaceSchema } from "./entity-space-schema";
import { Schema } from "./schema";
import { SchemaCatalog_Interface } from "./schema-catalog";
import { UnbakedSchemaBase } from "./unbaked-schema.base";

export class UnbakedSchema extends UnbakedSchemaBase implements Schema {
    constructor(schema: EntitySpaceSchema, catalog: SchemaCatalog_Interface) {
        super(schema, catalog);
    }
}
