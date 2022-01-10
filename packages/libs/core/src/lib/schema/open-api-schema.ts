export interface JsonSchemaReference {
    $ref: string;
}

export function isJsonSchemaReference(value: any): value is JsonSchemaReference {
    return value != null ? typeof value.$ref === "string" : false;
}

export type OpenApiSchemaType = "array" | "boolean" | "integer" | "number" | "object" | "string";

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
    $id?: string;
    allOf?: (JsonSchemaReference | OpenApiSchema)[];
    anyOf?: (JsonSchemaReference | OpenApiSchema)[];
    discriminator?: OpenApiDiscriminator;
    format?: OpenApiDataTypeFormat | string;
    items?: JsonSchemaReference | OpenApiSchema;
    nullable?: boolean;
    oneOf?: (JsonSchemaReference | OpenApiSchema)[];
    properties?: Record<string, JsonSchemaReference | OpenApiSchemaProperty>;
    required?: string[];
    type?: OpenApiSchemaType;
}

export interface OpenApiSchemaProperty extends OpenApiSchema {
    readOnly?: boolean;
    writeOnly?: boolean;
}

// export interface OpenApiSchemaArrayProperty extends OpenApiSchemaProperty {
//     type: "array";
//     items: JsonSchemaReference | OpenApiSchema;
// }
