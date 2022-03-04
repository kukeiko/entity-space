// [todo] can we get rid of the "schemaType" discriminator somehow, and instead
// find an analogue to c# "instance is ITheInterface"?
export interface IPrimitiveSchema {
    readonly schemaType: "primitive";

    getDataType(): "boolean" | "integer" | "number" | "string";
}

export interface IEntitySchemaIndex {
    getName(): string;
    getPath(): string[];
    isUnique(): boolean;
}

export interface IEntitySchemaRelation {
    getFromIndex(): IEntitySchemaIndex;
    getPropertyName(): string;
    getProperty(): IEntitySchemaProperty;
    getRelatedEntitySchema(): IEntitySchema;
    getToIndex(): IEntitySchemaIndex;
}

export interface IEntitySchema {
    readonly schemaType: "entity";

    getAllOf(): IEntitySchema[];
    getAnyOf(): IEntitySchema[];
    getId(): string;
    getIndex(name: string): IEntitySchemaIndex;
    getIndexOrKey(name: string): IEntitySchemaIndex;
    getIndexes(): IEntitySchemaIndex[];
    getIndexesIncludingKey(): IEntitySchemaIndex[];
    getKey(): IEntitySchemaIndex;
    getOneOf(): IEntitySchema[];
    getProperties(): IEntitySchemaProperty[];
    getProperty(path: string): IEntitySchemaProperty;
    getRelation(propertyName: string): IEntitySchemaRelation;
    findRelation(propertyName: string): IEntitySchemaRelation | undefined;
    getRelations(): IEntitySchemaRelation[];
    hasKey(): boolean;
}

export interface IEntitySchemaProperty {
    readonly schemaType: "property";

    getName(): string;
    getUnboxedEntitySchema(): IEntitySchema;
    getUnboxedValueSchema(): IEntitySchema | IPrimitiveSchema;
    getValueSchema(): PropertyValueSchema;
    isReadOnly(): boolean;
    isWriteOnly(): boolean;
}

export interface IDictionarySchema {
    readonly schemaType: "dictionary";

    getItemSchema(): IEntitySchema | IPrimitiveSchema;
}

export interface IArraySchema {
    readonly schemaType: "array";

    getItemSchema(): IEntitySchema | IPrimitiveSchema;
}

// [todo] should this be prefixed with "I" as well?
export type PropertyValueSchema = IArraySchema | IDictionarySchema | IEntitySchema | IPrimitiveSchema;
