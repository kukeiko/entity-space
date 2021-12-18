export type SchemaPropertyType = "boolean" | "number" | "string" | "object";

// formats taken from open-api
export type SchemaPropertyFormat =
    | "int32"
    | "int64"
    | "float"
    | "double"
    | "byte"
    | "binary"
    | "date"
    | "date-time"
    | "password";

export type NavigableSchemaProperty = SchemaProperty & Required<Pick<SchemaProperty, "model">>;
export type ExpandableSchemaProperty = SchemaProperty & Required<Pick<SchemaProperty, "link" | "model">>;

export interface SchemaPropertyLink {
    from: string;
    to: string;
}

export interface SchemaPropertyOptionsArgument {
    array?: boolean;
    link?: SchemaPropertyLink;
    format?: SchemaPropertyFormat;
    model?: string;
}

export class SchemaProperty {
    constructor(name: string, type: SchemaPropertyType, options?: SchemaPropertyOptionsArgument) {
        this.name = name;
        this.type = type;
        this.format = options?.format;
        this.link = options?.link;
        this.array = options?.array ?? false;
        this.model = options?.model;
    }

    readonly name: string;
    readonly type: SchemaPropertyType;
    readonly format?: SchemaPropertyFormat;
    readonly link?: SchemaPropertyLink;
    readonly model?: string;
    readonly array: boolean;

    isNavigable(): this is NavigableSchemaProperty {
        return SchemaProperty.isNavigable(this);
    }

    static isNavigable(property: SchemaProperty): property is NavigableSchemaProperty {
        return property.model !== void 0;
    }

    isExpandable(): this is ExpandableSchemaProperty {
        return SchemaProperty.isExpandable(this);
    }

    static isExpandable(property: SchemaProperty): property is ExpandableSchemaProperty {
        return property.link !== void 0 && property.model !== void 0;
    }
}
