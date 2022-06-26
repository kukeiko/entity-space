import { Entity } from "../entity";
import { EntitySchemaIndex } from "./entity-schema-index";
import { EntitySchemaKey } from "./entity-schema-key";
import { EntitySchemaProperty } from "./entity-schema-property";
import { EntitySchemaRelation } from "./entity-schema-relation";
import { ArraySchema, PrimitiveSchema } from "./property-value";
import {
    IEntitySchema,
    IEntitySchemaIndex,
    IEntitySchemaProperty,
    IEntitySchemaRelation,
    IPrimitiveSchema,
    PropertyValueSchema,
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

    readonly schemaType = "entity";

    addAllOf(schema: IEntitySchema): this {
        this.allOf.push(schema);
        return this;
    }

    addIndex(path: string | string[], options?: { name?: string; unique?: boolean; multiEntry?: boolean }): this {
        const index = new EntitySchemaIndex(this, path, options);
        this.indexes.push(index);
        return this;
    }

    addProperty(name: string, valueSchema: PropertyValueSchema): this {
        const property = new EntitySchemaProperty(this, name, valueSchema);
        this.properties.push(property);
        return this;
    }

    addArray(name: string, valueSchema: IEntitySchema | IPrimitiveSchema): this {
        return this.addProperty(name, new ArraySchema(valueSchema));
    }

    addString(name: string): this {
        return this.addProperty(name, new PrimitiveSchema("string"));
    }

    addRelation(propertyKey: string, from: string, to: string): this {
        const relation = new EntitySchemaRelation(this, propertyKey, from, to);
        this.relations.push(relation);
        return this;
    }

    findRelation(propertyName: string): IEntitySchemaRelation | undefined {
        return this.getRelations().find(relation => relation.getPropertyName() === propertyName);
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
        const index = this.indexes.find(index => index.getName() === name);

        if (index === void 0) {
            throw new Error(`index "${name}" not found on schema ${this.getId()}`);
        }

        return index;
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
            throw new Error(`there is no key defined on schema ${this.getId()}`);
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
        const property = this.getProperties().find(property => property.getName() === name);

        if (property === void 0) {
            throw new Error(`property "${name}" not found on schema ${this.getId()}`);
        }

        return property;
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
}
