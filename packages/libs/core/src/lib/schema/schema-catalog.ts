import { Schema, SchemaProperty } from "./schema";

export interface SchemaCatalog_Interface {
    getSchema($id: string): Schema;
    getSchemas(): Schema[];
    getSchemaProperty($id: string): SchemaProperty;
}
