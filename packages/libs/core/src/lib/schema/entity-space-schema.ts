import { JsonSchemaReference, OpenApiSchema, OpenApiSchemaProperty } from "./open-api-schema";

export interface EntitySpaceSchemaKeyObject {
    name?: string;
    path: string | string[];
}

export type EntitySpaceSchemaKey = string | string[] | EntitySpaceSchemaKeyObject;

export interface EntitySpaceSchemaIndexObject_V2 {
    name?: string;
    path?: string | string[];
    unique?: boolean;
    // [todo] this is a feature of indexedDB, and i put it here so i don't forget to investigate if we want to support it
    multiEntry?: boolean;
}

export type EntitySpaceSchemaIndex = true | string | string[] | EntitySpaceSchemaIndexObject_V2;

export interface EntitySpaceSchemaRelationObject_V2 {
    from: string;
    to: string;
}

export type EntitySpaceSchemaRelation = [string, string] | EntitySpaceSchemaRelationObject_V2;

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

export interface EntitySpaceSchemaRelation_Old {
    path: string;
    from: string;
    to: string;
}
