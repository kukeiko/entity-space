import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ArraySchema } from "./array-schema";
import { EntitySchemaIndex } from "./entity-schema-index";
import { EntitySchemaKey } from "./entity-schema-key";
import { EntitySchemaProperty } from "./entity-schema-property";
import { EntitySchemaRelation } from "./entity-schema-relation";
import { PrimitiveSchema } from "./primitive-schema";
import {
    IArraySchema,
    IDictionarySchema,
    IEntitySchema,
    IEntitySchemaIndex,
    IEntitySchemaProperty,
    IEntitySchemaRelation,
    IPrimitiveSchema,
    IPropertyValueSchema,
} from "./schema.interface";

// [todo] rename to "EntityTypeSchema"
export class EntitySchema<T extends Entity = Entity> implements IEntitySchema<T> {
    constructor(id: string) {
        this.id = id;
    }

    private key?: IEntitySchemaIndex;

    private readonly allOf: IEntitySchema[] = [];
    private readonly anyOf: IEntitySchema[] = [];
    private readonly id: string;
    private readonly indexes: IEntitySchemaIndex[] = [];
    private readonly oneOf: IEntitySchema[] = [];
    private readonly properties: IEntitySchemaProperty[] = [];
    private readonly relations: IEntitySchemaRelation[] = [];

    createDefault(): T {
        throw new Error("not implemented");
    }

    getDefaultSelection(): UnpackedEntitySelection<T> {
        return this.getProperties()
            .filter(property => property.isRequired())
            .reduce((acc, property) => {
                const valueSchema = property.getValueSchema();

                // [todo] i think i forgot to deal with array & dictionaries,
                // fix should be easy though: just use getUnboxedValueSchema()
                if (valueSchema.isEntity()) {
                    return { ...acc, [property.getName()]: valueSchema.getDefaultSelection() };
                } else {
                    return { ...acc, [property.getName()]: true } as UnpackedEntitySelection<T>;
                }
            }, {} as UnpackedEntitySelection<T>);
    }

    addAllOf(schema: IEntitySchema): this {
        this.allOf.push(schema);
        return this;
    }

    addIndex(path: string | string[], options?: { name?: string; unique?: boolean; multiEntry?: boolean }): this {
        const index = new EntitySchemaIndex(this, path, options);
        this.indexes.push(index);
        return this;
    }

    addProperty(name: string, valueSchema: IPropertyValueSchema, required = false): this {
        const property = new EntitySchemaProperty(this, name, valueSchema, required);
        this.properties.push(property);
        return this;
    }

    addRelationProperty(
        name: string,
        valueSchema: IPropertyValueSchema,
        from: string,
        to: string,
        required = false
    ): this {
        this.addProperty(name, valueSchema, required);
        this.addRelation(name, from, to);
        return this;
    }

    addArray(name: string, valueSchema: IEntitySchema | IPrimitiveSchema): this {
        return this.addProperty(name, new ArraySchema(valueSchema));
    }

    addString(name: string, required = false): this {
        return this.addProperty(name, new PrimitiveSchema("string"), required);
    }

    addInteger(name: string, required = false): this {
        return this.addProperty(name, new PrimitiveSchema("integer"), required);
    }

    addRelation(propertyKey: string, from: string, to: string): this {
        const relation = new EntitySchemaRelation(this, propertyKey, from, to);
        this.relations.push(relation);
        return this;
    }

    findRelation(propertyName: string): IEntitySchemaRelation | undefined {
        return this.getRelations().find(relation => relation.getPropertyName() === propertyName);
    }

    findRelationDeep(relationPath: string[]): IEntitySchemaRelation | undefined {
        const relation = this.findRelation(relationPath[0]);

        if (relation === void 0) {
            const property = this.findProperty(relationPath[0]);

            if (property) {
                const schema = property.getUnboxedValueSchema();
                if (schema.isEntity()) {
                    return schema.findRelationDeep(relationPath.slice(1));
                }
            }

            return undefined;
        } else if (relationPath.length === 1) {
            return relation;
        }

        return relation.getRelatedEntitySchema().findRelationDeep(relationPath.slice(1));
    }

    getAllOf(): IEntitySchema[] {
        return this.allOf.slice();
    }

    getAnyOf(): IEntitySchema[] {
        return this.anyOf.slice();
    }

    getId(): string {
        return this.id;
    }

    getIndex(name: string): IEntitySchemaIndex {
        const index = this.findIndex(name);

        if (index === void 0) {
            throw new Error(`index "${name}" not found on schema ${this.getId()}`);
        }

        return index;
    }

    findIndex(name: string): IEntitySchemaIndex | undefined {
        return this.indexes.find(index => index.getName() === name);
    }

    findProperty(name: string): IEntitySchemaProperty | undefined {
        return this.getProperties().find(property => property.getName() === name);
    }

    getIndexOrKey(name: string): IEntitySchemaIndex {
        if (this.hasKey() && this.getKey().getName() === name) {
            return this.getKey();
        }

        return this.getIndex(name);
    }

    getIndexes(): IEntitySchemaIndex[] {
        return this.indexes.slice();
    }

    getIndexesIncludingKey(): IEntitySchemaIndex[] {
        return [this.getKey(), ...this.getIndexes()];
    }

    getKey(): IEntitySchemaIndex {
        if (this.key === void 0) {
            throw new Error(`no key defined on schema "${this.getId()}"`);
        }

        return this.key;
    }

    getOneOf(): IEntitySchema[] {
        return this.oneOf.slice();
    }

    getProperties(): IEntitySchemaProperty[] {
        // [todo] include those from allOf & merge duplicates
        return this.properties.slice();
    }

    getProperty(name: string): IEntitySchemaProperty {
        const property = this.findProperty(name);

        if (property === void 0) {
            throw new Error(`property "${name}" not found on schema ${this.getId()}`);
        }

        return property;
    }

    getRelationDeep(relationPath: string[]): IEntitySchemaRelation {
        const relation = this.findRelationDeep(relationPath);

        if (relation === void 0) {
            throw new Error(`relation "${relationPath.join(".")}" not found on schema ${this.getId()}`);
        }

        return relation;
    }

    getRelation(propertyKey: string): IEntitySchemaRelation {
        const relation = this.findRelation(propertyKey);

        if (relation === void 0) {
            throw new Error(`relation "${propertyKey}" not found on schema ${this.getId()}`);
        }

        return relation;
    }

    getRelations(): IEntitySchemaRelation[] {
        // [todo] add relations inherited from allOf
        return this.relations.slice();
    }

    hasKey(): boolean {
        return this.key !== void 0;
    }

    setKey(path: string | string[], options?: { name?: string }): this {
        this.key = new EntitySchemaKey(this, path, options);
        return this;
    }

    isArray(): this is IArraySchema {
        return false;
    }

    isDictionary(): this is IDictionarySchema {
        return false;
    }

    isEntity(): this is IEntitySchema {
        return true;
    }

    isPrimitive(): this is IPrimitiveSchema {
        return false;
    }

    isNullable(): boolean {
        return false;
    }
}
