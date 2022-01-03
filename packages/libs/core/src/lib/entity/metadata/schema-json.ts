export interface JsonSchemaReference {
    $ref: string;
}

export type OpenApiDataType = "boolean" | "integer" | "number" | "string";

export type OpenApiDataTypeFormat =
    | "int32"
    | "int64"
    | "float"
    | "double"
    | "byte"
    | "binary"
    | "date"
    | "date-time"
    | "password";

export interface OpenApiDiscriminator {
    propertyName: string;
    mapping?: Record<string, string>;
}

export interface OpenApiSchema {
    allOf?: (JsonSchemaReference | OpenApiSchema)[];
    anyOf?: (JsonSchemaReference | OpenApiSchema)[];
    discriminator?: OpenApiDiscriminator;
    format?: OpenApiDataTypeFormat | string;
    items?: JsonSchemaReference | OpenApiSchema;
    nullable?: boolean;
    oneOf?: (JsonSchemaReference | OpenApiSchema)[];
    properties?: Record<string, JsonSchemaReference | OpenApiSchemaProperty>;
    required?: string[];
    type: OpenApiDataType | "object" | "array";
}

export interface OpenApiSchemaProperty extends OpenApiSchema {
    readOnly?: boolean;
    writeOnly?: boolean;
}

export interface EntitySpaceSchema extends OpenApiSchema {
    key?: string | string[];
    indexes?: Record<string, EntitySpaceSchemaIndex>;
    relations?: EntitySpaceSchemaRelation[];
    properties?: Record<string, JsonSchemaReference | EntitySpaceSchemaProperty>;
}

export type EntitySpaceSchemaProperty = OpenApiSchemaProperty & EntitySpaceSchema;

export interface EntitySpaceSchemaIndex {
    path: string[];
    unique?: boolean;
}

export interface EntitySpaceSchemaRelation {
    path: string;
    fromIndexName: string;
    toIndexName: string;
}
