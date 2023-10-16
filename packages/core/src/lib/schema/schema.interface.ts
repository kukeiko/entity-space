import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";

export type PrimitiveSchemaDataType = "boolean" | "integer" | "number" | "string";

export interface IEntitySchemaIndex {
    getName(): string;
    getPaths(): string[];
    isUnique(): boolean;
}

export interface IEntitySchemaRelation {
    getFromPaths() : string[];
    getPropertyName(): string;
    getProperty(): IEntitySchemaProperty;
    getRelatedEntitySchema(): IEntitySchema;
    getToPaths() : string[];
}

export interface IPropertyValueCommonSchema {
    isArray(): this is IArraySchema;
    isDictionary(): this is IDictionarySchema;
    isEntity(): this is IEntitySchema;
    isNullable(): boolean;
    isPrimitive(): this is IPrimitiveSchema;
}

export interface IEntitySchema<T extends Entity = Entity> extends IPropertyValueCommonSchema {
    getAllOf(): IEntitySchema[];
    getAnyOf(): IEntitySchema[];
    getId(): string;
    getIndex(name: string): IEntitySchemaIndex;
    findIndex(name: string): IEntitySchemaIndex | undefined;
    // [todo] every time i come back to working on the project again, i wonder why this method exists
    // and we don't just have getIndex() also return key if found.
    getIndexOrKey(name: string): IEntitySchemaIndex;
    getIndexes(): IEntitySchemaIndex[];
    getIndexesIncludingKey(): IEntitySchemaIndex[];
    getKey(): IEntitySchemaIndex;
    getOneOf(): IEntitySchema[];
    getProperties(): IEntitySchemaProperty[];
    getProperty(path: string): IEntitySchemaProperty;
    // [todo] remove, and instead, getRelation() should search deeply by default
    getRelationDeep(relationPath: string[]): IEntitySchemaRelation;
    getRelation(propertyName: string): IEntitySchemaRelation;
    findRelation(propertyName: string): IEntitySchemaRelation | undefined;
    // [todo] remove, and instead, findRelation() should search deeply by default
    findRelationDeep(relationPath: string[]): IEntitySchemaRelation | undefined;
    getRelations(): IEntitySchemaRelation[];
    hasKey(): boolean;
    createDefault(): T;
    getDefaultSelection(): UnpackedEntitySelection<T>;
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

export interface IPrimitiveSchema extends IPropertyValueCommonSchema {
    getDataType(): PrimitiveSchemaDataType;
    supportsValue(value: unknown): boolean;
}

export interface IArraySchema extends IPropertyValueCommonSchema {
    getItemSchema(): IEntitySchema | IPrimitiveSchema;
}

export interface IDictionarySchema extends IPropertyValueCommonSchema {
    getItemSchema(): IEntitySchema | IPrimitiveSchema;
}

export type IPropertyValueSchema = IArraySchema | IDictionarySchema | IEntitySchema | IPrimitiveSchema;
