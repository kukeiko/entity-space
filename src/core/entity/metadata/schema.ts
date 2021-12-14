export interface SchemaIndex {
    // name: string;
    path: string | string[];
    unique?: boolean;
}

export interface SchemaKey {
    // name: "key";
    path: string | string[];
    // unique: true;
}

export interface SchemaPropertyLink {
    from: string;
    to: string;
}

export interface SchemaPropertyStringValueType {
    type: "string";
    format?: "byte" | "binary" | "date" | "date-time" | "password";
}

export interface SchemaPropertyNumberValueType {
    type: "number";
    format: "int32" | "int64" | "float" | "double";
}

export interface SchemaPropertyBooleanValueType {
    type: "boolean";
}

export interface SchemaPropertyReferenceValueType {
    type: "reference";
}

export type SchemaPropertyValueType = SchemaPropertyStringValueType | SchemaPropertyNumberValueType | SchemaPropertyBooleanValueType | SchemaPropertyReferenceValueType;

export interface SchemaProperty {
    type: "boolean" | "number" | "string" | "object";
    model?: string;
    // valueType: SchemaPropertyValueType;
    link?: SchemaPropertyLink;
    array?: boolean;
}

// opan-api formats:
// boolean
// integer	int32	signed 32 bits
// integer	int64	signed 64 bits (a.k.a long)
// number	float
// number	double
// string
// string	byte	base64 encoded characters
// string	binary	any sequence of octets
// string	date	As defined by full-date - RFC3339
// string	date-time	As defined by date-time - RFC3339
// string	password	A hint to UIs to obscure input.

export interface SchemaReference<T = any> {
    $ref: string;
}

export interface Schema {
    // in open-api context, its the uri. in indexeddb, its going to be the object store name.
    // we may want to split it up at some point - let's see.
    name: string;
    key: SchemaKey;
    indexes?: Record<string, SchemaIndex>;
    properties: Record<string, SchemaProperty>;
}
