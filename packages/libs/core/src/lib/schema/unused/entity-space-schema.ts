import { JsonSchemaReference, OpenApiSchema, OpenApiSchemaProperty } from "./open-api-schema";

export interface EntitySpaceSchemaKeyObject {
    name?: string;
    path: string | string[];
}

export type EntitySpaceSchemaKey = string | string[] | EntitySpaceSchemaKeyObject;

export interface EntitySpaceSchemaIndexObject {
    name?: string;
    path?: string | string[];
    unique?: boolean;
    // [todo] this is a feature of indexedDB, and i put it here so i don't forget to investigate if we want to support it
    multiEntry?: boolean;
}

export type EntitySpaceSchemaIndex = true | string | string[] | EntitySpaceSchemaIndexObject;

export interface EntitySpaceSchemaRelationObject {
    from: string;
    to: string;
}

export type EntitySpaceSchemaRelation = [string, string] | EntitySpaceSchemaRelationObject;

export type EntitySpaceSchemaProperty = OpenApiSchemaProperty & EntitySpaceSchema;

export interface EntitySpaceSchema extends OpenApiSchema {
    allOf?: (JsonSchemaReference | EntitySpaceSchema)[];
    anyOf?: (JsonSchemaReference | EntitySpaceSchema)[];
    indexes?: Record<string, EntitySpaceSchemaIndex>;
    key?: EntitySpaceSchemaKey;
    oneOf?: (JsonSchemaReference | EntitySpaceSchema)[];
    properties?: Record<string, JsonSchemaReference | EntitySpaceSchemaProperty>;
    relations?: Record<string, EntitySpaceSchemaRelation>;
    items?: JsonSchemaReference | EntitySpaceSchema;
}
