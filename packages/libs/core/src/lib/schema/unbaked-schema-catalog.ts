import { DerivedSchemaPropertyKey } from "./derived-schema-property-key";
import { EntitySpaceSchemaProperty, EntitySpaceSchema } from "./entity-space-schema";
import { isJsonSchemaReference } from "./open-api-schema";
import { Schema, SchemaProperty } from "./schema";
import { SchemaCatalog_Interface } from "./schema-catalog";
import { UnbakedSchema } from "./unbaked-schema";
import { UnbakedSchemaProperty } from "./unbaked-schema-property";

export class UnbakedSchemaCatalog implements SchemaCatalog_Interface {
    private schemas: Record<string, UnbakedSchema> = {};
    private schemaProperties: Record<string, UnbakedSchemaProperty> = {};
    private referencedSchemas: Record<string, string[]> = {};

    // [todo] we're expecting a fully built $id, but should probably instead expect
    // a retrievalUri as specified in https://json-schema.org/understanding-json-schema/structuring.html
    addSchema(schema: EntitySpaceSchema): void {
        const $id = schema.$id;

        if ($id === void 0) {
            throw new Error(`can not add a schema without an $id`);
        }

        this.schemas[$id] = new UnbakedSchema(schema, this);
        this.addDerivedSchemas(schema, $id, "allOf");
        this.addDerivedSchemas(schema, $id, "anyOf");
        this.addDerivedSchemas(schema, $id, "oneOf");

        if (schema.properties !== void 0) {
            for (const key in schema.properties) {
                let property = schema.properties[key];
                const $propertyId = `${$id}/properties/${key}`;

                if (isJsonSchemaReference(property)) {
                    this.trackReferencedSchema(property.$ref, $id);
                    property = { $id: $propertyId, allOf: [{ $ref: property.$ref }] };
                }

                this.addSchemaProperty({ ...property, $id: $propertyId });
            }
        }

        if (schema.type === "array" && schema.items !== void 0) {
            if (isJsonSchemaReference(schema.items)) {
                this.trackReferencedSchema(schema.items.$ref, $id);
            } else {
                this.addSchema({ ...schema.items, $id: `${$id}/items` });
            }
        }
    }

    private addSchemaProperty(schema: EntitySpaceSchemaProperty): void {
        const $id = schema.$id;

        if ($id === void 0) {
            throw new Error(`can not add a schema without an $id`);
        }

        this.schemaProperties[$id] = new UnbakedSchemaProperty(schema, this);
        this.addSchema({ ...schema, $id });
    }

    private addDerivedSchemas(schema: EntitySpaceSchema, $id: string, key: DerivedSchemaPropertyKey): void {
        const derivedSchemas = schema[key];

        if (derivedSchemas === void 0) {
            return;
        }

        for (let i = 0; i < derivedSchemas.length; ++i) {
            const allOfSchema = derivedSchemas[i];

            if (isJsonSchemaReference(allOfSchema)) {
                this.trackReferencedSchema(allOfSchema.$ref, $id);
            } else {
                // [todo] i pulled this $id naming convention (that is, using array index brackets) out of my magic hat.
                // no idea how it is to actually be done when conforming to open-api/json-schema specification.
                // need to look into that.
                this.addSchema({ ...allOfSchema, $id: `${$id}/${key}[${i}]` });
            }
        }
    }

    private trackReferencedSchema($id: string, referencedBy$Id: string): void {
        (this.referencedSchemas[$id] ??= []).push(referencedBy$Id);
    }

    getSchema($id: string): Schema {
        if (this.schemaProperties[$id]) {
            return this.schemaProperties[$id];
        }

        const schema = this.schemas[$id];

        if (schema === void 0) {
            throw new Error(`schema not found: ${name}`);
        }

        return schema;
    }

    getSchemaProperty($id: string): SchemaProperty {
        const schema = this.schemaProperties[$id];

        if (schema === void 0) {
            throw new Error(`schema not found: ${$id}`);
        }

        return schema;
    }

    getSchemas(): Schema[] {
        return Object.values(this.schemas);
    }
}
