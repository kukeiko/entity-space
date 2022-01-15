import {
    EntitySchema,
    EntitySchemaIndex,
    EntitySchemaKey,
    EntitySchemaProperty,
    EntitySchemaRelation,
    PropertyValueSchema,
} from "./schema";
import { UnbakedEntitySchemaIndex } from "./unbaked-entity-schema-index";
import { UnbakedEntitySchemaKey } from "./unbaked-entity-schema-key";
import { UnbakedEntitySchemaProperty } from "./unbaked-entity-schema-property";
import { UnbakedEntitySchemaRelation } from "./unbaked-entity-schema-relation";

export class UnbakedEntitySchema implements EntitySchema {
    constructor(id: string) {
        this.id = id;
    }

    private key?: EntitySchemaKey;

    private readonly allOf: EntitySchema[] = [];
    private readonly anyOf: EntitySchema[] = [];
    private readonly id: string;
    private readonly indexes: EntitySchemaIndex[] = [];
    private readonly oneOf: EntitySchema[] = [];
    private readonly properties: EntitySchemaProperty[] = [];
    private readonly relations: EntitySchemaRelation[] = [];

    readonly schemaType = "entity";

    addAllOf(schema: EntitySchema): void {
        this.allOf.push(schema);
    }

    addIndex(path: string | string[], options?: { name?: string; unique?: boolean; multiEntry?: boolean }): void {
        const index = new UnbakedEntitySchemaIndex(this, path, options);
        this.indexes.push(index);
    }

    addProperty(name: string, valueSchema: PropertyValueSchema): void {
        const property = new UnbakedEntitySchemaProperty(this, name, valueSchema);
        this.properties.push(property);
    }

    addRelation(propertyKey: string, from: string, to: string): void {
        const relation = new UnbakedEntitySchemaRelation(this, propertyKey, from, to);
        this.relations.push(relation);
    }

    findRelation(propertyName: string): EntitySchemaRelation | undefined {
        return this.getRelations().find(relation => relation.getPropertyName() === propertyName);
    }

    getAllOf(): EntitySchema[] {
        return this.allOf.slice();
    }

    getAnyOf(): EntitySchema[] {
        return this.anyOf.slice();
    }

    getId(): string {
        return this.id;
    }

    getIndex(name: string): EntitySchemaIndex {
        const index = this.indexes.find(index => index.getName() === name);

        if (index === void 0) {
            throw new Error(`index "${name}" not found on schema ${this.getId()}`);
        }

        return index;
    }

    getIndexOrKey(name: string): EntitySchemaIndex {
        if (this.hasKey() && this.getKey().getName() === name) {
            return this.getKey();
        }

        return this.getIndex(name);
    }

    getIndexes(): EntitySchemaIndex[] {
        return this.indexes.slice();
    }

    getIndexesIncludingKey(): EntitySchemaIndex[] {
        return [this.getKey(), ...this.getIndexes()];
    }

    getKey(): EntitySchemaKey {
        if (this.key === void 0) {
            throw new Error(`there is no key defined on schema ${this.getId()}`);
        }

        return this.key;
    }

    getOneOf(): EntitySchema[] {
        return this.oneOf.slice();
    }

    getProperties(): EntitySchemaProperty[] {
        // [todo] include those from allOf & merge duplicates
        return this.properties.slice();
    }

    getProperty(name: string): EntitySchemaProperty {
        const property = this.getProperties().find(property => property.getName() === name);

        if (property === void 0) {
            throw new Error(`property "${name}" not found on schema ${this.getId()}`);
        }

        return property;
    }

    getRelation(propertyKey: string): EntitySchemaRelation {
        const relation = this.findRelation(propertyKey);

        if (relation === void 0) {
            throw new Error(`relation "${propertyKey}" not found on schema ${this.getId()}`);
        }

        return relation;
    }

    getRelations(): EntitySchemaRelation[] {
        // [todo] add relations inherited from allOf
        return this.relations.slice();
    }

    hasKey(): boolean {
        return this.key !== void 0;
    }

    setKey(path: string | string[]): void {
        this.key = new UnbakedEntitySchemaKey(this, path);
    }
}
