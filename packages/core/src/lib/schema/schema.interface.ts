import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";

export type PrimitiveSchemaDataType = "boolean" | "integer" | "number" | "string";

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
    getDefaultSelection(): UnpackedEntitySelection<T>;
    isArray(): this is IArraySchema;
    isDictionary(): this is IDictionarySchema;
    isEntity(): this is IEntitySchema;
    isPrimitive(): this is IPrimitiveSchema;
    isNullable(): boolean;
}

export interface IEntitySchemaProperty {
    getName(): string;
    getUnboxedEntitySchema(): IEntitySchema;
    getUnboxedValueSchema(): IEntitySchema | IPrimitiveSchema;
    getValueSchema(): IPropertyValueSchema;
    isReadOnly(): boolean;
    isWriteOnly(): boolean;
    isRequired(): boolean;
}

export interface IPrimitiveSchema {
    getDataType(): PrimitiveSchemaDataType;
    isArray(): this is IArraySchema;
    isDictionary(): this is IDictionarySchema;
    isEntity(): this is IEntitySchema;
    isPrimitive(): this is IPrimitiveSchema;
    isNullable(): boolean;
    supportsValue(value: unknown): boolean;
}

export interface IArraySchema {
    getItemSchema(): IEntitySchema | IPrimitiveSchema;
    isArray(): this is IArraySchema;
    isDictionary(): this is IDictionarySchema;
    isEntity(): this is IEntitySchema;
    isPrimitive(): this is IPrimitiveSchema;
    isNullable(): boolean;
}

export interface IDictionarySchema {
    getItemSchema(): IEntitySchema | IPrimitiveSchema;
    isArray(): this is IArraySchema;
    isDictionary(): this is IDictionarySchema;
    isEntity(): this is IEntitySchema;
    isPrimitive(): this is IPrimitiveSchema;
    isNullable(): boolean;
}

export type IPropertyValueSchema = IArraySchema | IDictionarySchema | IEntitySchema | IPrimitiveSchema;
