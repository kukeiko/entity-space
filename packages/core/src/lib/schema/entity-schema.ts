import { EntitySchemaIndex } from "./entity-schema-index";
import { EntitySchemaKey } from "./entity-schema-key";
import { EntitySchemaProperty } from "./entity-schema-property";
import { EntitySchemaRelation } from "./entity-schema-relation";
import {
    IEntitySchema,
    IEntitySchemaIndex,
    IEntitySchemaKey,
    IEntitySchemaProperty,
    IEntitySchemaRelation,
    PropertyValueSchema,
} from "./schema.interface";

export class EntitySchema implements IEntitySchema {
    constructor(id: string) {
        this.id = id;
    }

    private key?: IEntitySchemaKey;

    private readonly allOf: IEntitySchema[] = [];
    private readonly anyOf: IEntitySchema[] = [];
    private readonly id: string;
    private readonly indexes: IEntitySchemaIndex[] = [];
    private readonly oneOf: IEntitySchema[] = [];
    private readonly properties: IEntitySchemaProperty[] = [];
    private readonly relations: IEntitySchemaRelation[] = [];

    readonly schemaType = "entity";

    addAllOf(schema: IEntitySchema): void {
        this.allOf.push(schema);
    }

    addIndex(path: string | string[], options?: { name?: string; unique?: boolean; multiEntry?: boolean }): void {
        const index = new EntitySchemaIndex(this, path, options);
        this.indexes.push(index);
    }

    addProperty(name: string, valueSchema: PropertyValueSchema): void {
        const property = new EntitySchemaProperty(this, name, valueSchema);
        this.properties.push(property);
    }

    addRelation(propertyKey: string, from: string, to: string): void {
        const relation = new EntitySchemaRelation(this, propertyKey, from, to);
        this.relations.push(relation);
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

    getKey(): IEntitySchemaKey {
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

    setKey(path: string | string[]): void {
        this.key = new EntitySchemaKey(this, path);
    }
}