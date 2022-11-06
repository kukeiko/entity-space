import { Entity } from "../entity.type";
import { UnfoldedEntitySelection } from "../unfolded-entity-selection.type";

export type PrimitiveSchemaDataType = "boolean" | "integer" | "number" | "string";

// [todo] can we get rid of the "schemaType" discriminator somehow, and instead
// find an analogue to c# "instance is ITheInterface"?
export interface IPrimitiveSchema {
    readonly schemaType: "primitive";

    getDataType(): PrimitiveSchemaDataType;
}

export interface IEntitySchemaIndex {
    getName(): string;
    // [todo] consider renaming to "getPaths()". i was surprised it is not already named this way.
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

export interface IEntitySchema<T extends Entity = Entity> {
    readonly schemaType: "entity";
    getAllOf(): IEntitySchema[];
    getAnyOf(): IEntitySchema[];
    getId(): string;
    getIndex(name: string): IEntitySchemaIndex;
    // [todo] every time i come back to working on the project again, i wonder why this method exists
    // and we don't just have getIndex() also return key if found.
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
    createDefault(): T;
    getDefaultSelection(): UnfoldedEntitySelection;
}

export interface IEntitySchemaProperty {
    readonly schemaType: "property";

    getName(): string;
    getUnboxedEntitySchema(): IEntitySchema;
    getUnboxedValueSchema(): IEntitySchema | IPrimitiveSchema;
    getValueSchema(): IPropertyValueSchema;
    isReadOnly(): boolean;
    isWriteOnly(): boolean;
    isRequired(): boolean;
}

export interface IDictionarySchema {
    readonly schemaType: "dictionary";

    getItemSchema(): IEntitySchema | IPrimitiveSchema;
}

export interface IArraySchema {
    readonly schemaType: "array";

    getItemSchema(): IEntitySchema | IPrimitiveSchema;
}

export type IPropertyValueSchema = IArraySchema | IDictionarySchema | IEntitySchema | IPrimitiveSchema;
