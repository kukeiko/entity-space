// [todo] can we get rid of the "schemaType" discriminator somehow, and instead
// find an analogue to c# "instance is ITheInterface"?
export interface PrimitiveSchema {
    readonly schemaType: "primitive";

    getDataType(): "boolean" | "integer" | "number" | "string";
}

export interface EntitySchemaKey extends EntitySchemaIndex {}

export interface EntitySchemaIndex {
    getName(): string;
    getPath(): string[];
    isUnique(): boolean;
}

export interface EntitySchemaRelation {
    getFromIndex(): EntitySchemaIndex;
    getPropertyName(): string;
    getProperty(): EntitySchemaProperty;
    getRelatedEntitySchema(): EntitySchema;
    getToIndex(): EntitySchemaIndex;
}

export interface EntitySchema {
    readonly schemaType: "entity";

    getAllOf(): EntitySchema[];
    getAnyOf(): EntitySchema[];
    getId(): string;
    getIndex(name: string): EntitySchemaIndex;
    getIndexOrKey(name: string): EntitySchemaIndex;
    getIndexes(): EntitySchemaIndex[];
    getIndexesIncludingKey(): EntitySchemaIndex[];
    getKey(): EntitySchemaKey;
    getOneOf(): EntitySchema[];
    getProperties(): EntitySchemaProperty[];
    getProperty(path: string): EntitySchemaProperty;
    getRelation(propertyName: string): EntitySchemaRelation;
    findRelation(propertyName: string): EntitySchemaRelation | undefined;
    getRelations(): EntitySchemaRelation[];
    hasKey(): boolean;
}

export interface EntitySchemaProperty {
    readonly schemaType: "property";

    getName(): string;
    getUnboxedEntitySchema(): EntitySchema;
    getUnboxedValueSchema(): EntitySchema | PrimitiveSchema;
    getValueSchema(): PropertyValueSchema;
    isReadOnly(): boolean;
    isWriteOnly(): boolean;
}

export interface DictionarySchema {
    readonly schemaType: "dictionary";

    getItemSchema(): EntitySchema | PrimitiveSchema;
}

export interface ArraySchema {
    readonly schemaType: "array";

    getItemSchema(): EntitySchema | PrimitiveSchema;
}

export type PropertyValueSchema = ArraySchema | DictionarySchema | EntitySchema | PrimitiveSchema;
