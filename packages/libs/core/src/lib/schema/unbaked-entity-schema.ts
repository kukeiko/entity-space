import { splitOne } from "@entity-space/utils";
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
        if (!Array.isArray(path)) {
            path = [path];
        }

        const index = new UnbakedEntitySchemaIndex(this, path, options);
        this.indexes.push(index);
    }

    addProperty(name: string, valueSchema: PropertyValueSchema): void {
        const property = new UnbakedEntitySchemaProperty(this, name, valueSchema);
        this.properties.push(property);
    }

    addRelation(path: string, from: string, to: string): void {
        const relation = new UnbakedEntitySchemaRelation(this, path, from, to);
        this.relations.push(relation);
    }

    findRelation(path: string): EntitySchemaRelation | undefined {
        return this.getRelations().find(relation => relation.getPath() === path);
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

    getProperty(path: string): EntitySchemaProperty {
        const [name, remaining] = splitOne(path, ".");
        const property = this.getLocalProperty(name);

        if (remaining === void 0) {
            return property;
        }

        return property.getUnboxedEntitySchema().getProperty(remaining);
    }

    private getLocalProperty(name: string): EntitySchemaProperty {
        const property = this.getProperties().find(property => property.getName() === name);

        if (property === void 0) {
            throw new Error(`property "${name}" not found on schema ${this.getId()}`);
        }

        return property;
    }

    getRelation(path: string): EntitySchemaRelation {
        const relation = this.relations.find(relation => relation.getPath() === path);

        if (relation === void 0) {
            throw new Error(`relation "${path}" not found on schema ${this.getId()}`);
        }

        return relation;
    }

    getRelations(): EntitySchemaRelation[] {
        // [todo] add relations inherited from allOf
        // [todo] what about relations that exist on properties that refere to non-normalized entities?
        return this.relations.slice();
    }

    hasKey(): boolean {
        return this.key !== void 0;
    }

    setKey(path: string | string[]): void {
        if (!Array.isArray(path)) {
            path = [path];
        }

        this.key = new UnbakedEntitySchemaKey(this, path);
    }
}
