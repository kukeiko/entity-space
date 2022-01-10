import { EntitySpaceSchemaProperty } from "./entity-space-schema";
import { Schema, SchemaProperty } from "./schema";
import { SchemaCatalog_Interface } from "./schema-catalog";
import { UnbakedSchemaBase } from "./unbaked-schema.base";

export class UnbakedSchemaProperty extends UnbakedSchemaBase implements SchemaProperty {
    constructor(schema: EntitySpaceSchemaProperty, catalog: SchemaCatalog_Interface) {
        super(schema, catalog);
    }

    getType(): string {
        if (this.schema.type === void 0) {
            // [todo] dirty!
            const nominalSchema = this.getNominalSchema();
            if (nominalSchema !== this) {
                return nominalSchema.getType();
            }
        }

        return super.getType();
    }

    getPropertyName(): string {
        // [todo] dirty?
        const parts = this.getSchemaId().split(",");
        return parts[parts.length - 1];
    }

    isNavigable(): boolean {
        return this.getType() === "object";
    }

    getProperty(name: string): SchemaProperty {
        const nominalSchema = this.getNominalSchema();

        // [todo] dirty
        if (nominalSchema !== this) {
            return nominalSchema.getProperty(name);
        }

        return super.getProperty(name);
    }

    // [todo] if is SchemaProperty, and there is no extra properties, and there is exactly one allOf():
    // return getNominalSchemaId() of that allOf() derived schema
    // [todo] is "Nominal" correct terminology here?
    getNominalSchemaId(): string {
        const hasCustomProperties = Object.keys(this.schema.properties ?? {}).length > 0;
        const derivesExactlyOneAllOf = (this.schema.allOf ?? []).length === 1;
        const derivesFromNoOther = [...(this.schema.anyOf ?? []), ...(this.schema.oneOf ?? [])].length === 0;

        if (!hasCustomProperties && derivesExactlyOneAllOf && derivesFromNoOther) {
            const derivedAllOf = this.getAllOf()[0];

            return derivedAllOf.getSchemaId();
        }

        return this.getSchemaId();
    }

    getNominalSchema(): Schema {
        const hasCustomProperties = Object.keys(this.schema.properties ?? {}).length > 0;
        const derivesExactlyOneAllOf = (this.schema.allOf ?? []).length === 1;
        const derivesFromNoOther = [...(this.schema.anyOf ?? []), ...(this.schema.oneOf ?? [])].length === 0;

        if (!hasCustomProperties && derivesExactlyOneAllOf && derivesFromNoOther) {
            const derivedAllOf = this.getAllOf()[0];

            return derivedAllOf;
        }

        return this;
    }
}
