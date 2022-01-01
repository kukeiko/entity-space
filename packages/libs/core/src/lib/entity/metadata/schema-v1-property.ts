import { SchemaProperty } from "./schema";

export type SchemaPropertyTypeV1 = "boolean" | "number" | "string" | "object";

// formats taken from open-api
export type SchemaPropertyFormatV1 =
    | "int32"
    | "int64"
    | "float"
    | "double"
    | "byte"
    | "binary"
    | "date"
    | "date-time"
    | "password";

export type NavigableSchemaPropertyV1 = SchemaPropertyV1 & Required<Pick<SchemaPropertyV1, "model">>;
export type ExpandableSchemaPropertyV1 = SchemaPropertyV1 & Required<Pick<SchemaPropertyV1, "link" | "model">>;

export interface SchemaPropertyLinkV1 {
    from: string;
    to: string;
}

export interface SchemaPropertyOptionsArgumentV1 {
    array?: boolean;
    link?: SchemaPropertyLinkV1;
    format?: SchemaPropertyFormatV1;
    model?: string;
}

export class SchemaPropertyV1 implements SchemaProperty {
    constructor(name: string, type: SchemaPropertyTypeV1, options?: SchemaPropertyOptionsArgumentV1) {
        this.name = name;
        this.type = type;
        this.format = options?.format;
        this.link = options?.link;
        this.array = options?.array ?? false;
        this.model = options?.model;
    }

    getPropertyName(): string {
        return this.name;
    }

    getType(): string {
        return this.type;
    }

    readonly name: string;
    readonly type: SchemaPropertyTypeV1;
    readonly format?: SchemaPropertyFormatV1;
    readonly link?: SchemaPropertyLinkV1;
    readonly model?: string;
    readonly array: boolean;

    isNavigable(): this is NavigableSchemaPropertyV1 {
        return SchemaPropertyV1.isNavigable(this);
    }

    static isNavigable(property: SchemaPropertyV1): property is NavigableSchemaPropertyV1 {
        return property.model !== void 0;
    }

    isExpandable(): this is ExpandableSchemaPropertyV1 {
        return SchemaPropertyV1.isExpandable(this);
    }

    static isExpandable(property: SchemaPropertyV1): property is ExpandableSchemaPropertyV1 {
        return property.link !== void 0 && property.model !== void 0;
    }
}
