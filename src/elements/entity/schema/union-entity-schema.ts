import { Path, toPathSegments } from "@entity-space/utils";
import { Entity } from "../entity";
import { ConcreteEntitySchema } from "./concrete-entity-schema";
import { EntityComputedProperties } from "./entity-computed-properties";
import { EntityPrimitiveProperty } from "./entity-primitive-property";
import { EntityProperty } from "./entity-property";
import { EntityRelationProperty } from "./entity-relation-property";
import { EntitySchema } from "./entity-schema";

function createName(schemas: readonly EntitySchema[]): string {
    return schemas.map(schema => schema.getName()).join("-");
}

function getIdPaths(schemas: readonly EntitySchema[]): readonly Path[] {
    const [first, ...others] = schemas;
    const idPaths = first.getIdPaths();
    const idPathsHash = idPaths.join(":");

    if (!others.every(schema => schema.getIdPaths().join(":") === idPathsHash)) {
        throw new Error(`id paths across all schemas in a union must be equal`);
    }

    return idPaths;
}

function assertIsEqualPrimitive(a: EntityPrimitiveProperty, b: EntityPrimitiveProperty): void {
    // [todo] ❌ add equality checking
    // throw new Error(`primitive "${a.getName()}" is not equal across all schemas in the union`);
}

function getPrimitives(schemas: readonly EntitySchema[]): Record<string, EntityPrimitiveProperty> {
    const primitives: Record<string, EntityPrimitiveProperty> = {};

    for (const schema of schemas) {
        for (const primitive of schema.getPrimitives()) {
            // [todo] ❌ figure out what to do with the discriminators, as they are different for each concrete schema.
            // we could create an enumeration property?
            const existing = primitives[primitive.getName()];

            if (existing === undefined) {
                primitives[primitive.getName()] = primitive;
            } else {
                assertIsEqualPrimitive(existing, primitive);
            }
        }
    }

    return primitives;
}

function assertIsEqualRelation(a: EntityRelationProperty, b: EntityRelationProperty): void {
    // [todo] ❌ add equality checking
    // throw new Error(`relation "${a.getName()}" is not equal across all schemas in the union`);
}

function getRelations(schemas: readonly EntitySchema[]): Record<string, EntityRelationProperty> {
    const relations: Record<string, EntityRelationProperty> = {};

    for (const schema of schemas) {
        for (const relation of schema.getRelations()) {
            const existing = relations[relation.getName()];

            if (existing === undefined) {
                relations[relation.getName()] = relation;
            } else {
                assertIsEqualRelation(existing, relation);
            }
        }
    }

    return relations;
}

export class UnionEntitySchema implements EntitySchema {
    constructor(
        schemas: readonly EntitySchema[],
        options?: { name?: string; sorter?: (a: Entity, b: Entity) => number },
    ) {
        this.#name = options?.name ?? createName(schemas);
        // [todo] ❌ assert that each concrete schema has a discriminator
        this.#schemas = Object.freeze(schemas.slice());
        this.#sorter = options?.sorter;
        this.#idPaths = getIdPaths(schemas);
        this.#primitives = getPrimitives(schemas);
        this.#relations = getRelations(schemas);
    }

    readonly #name: string;
    readonly #schemas: readonly EntitySchema[];
    readonly #idPaths: readonly Path[];
    readonly #primitives: Record<string, EntityPrimitiveProperty>;
    readonly #relations: Record<string, EntityRelationProperty>;
    readonly #sorter?: (a: Entity, b: Entity) => number;

    getName(): string {
        return this.#name;
    }

    getSorter(): ((a: Entity, b: Entity) => number) | undefined {
        return this.#sorter;
    }

    hasId(): boolean {
        return this.#idPaths.length > 0;
    }

    hasCompositeId(): boolean {
        return this.#idPaths.length > 1;
    }

    getIdPaths(): readonly Path[] {
        return this.#idPaths;
    }

    getLeadingIdPaths(): readonly Path[] {
        return this.#idPaths.slice(0, -1);
    }

    getLastIdPath(): Path {
        if (!this.hasId()) {
            throw new Error(`schema ${this.#name} has no id defined`);
        }

        return this.#idPaths.at(-1)!;
    }

    hasProperty(name: string): boolean {
        return name in this.#primitives || name in this.#relations;
    }

    hasIdProperty(name: string): boolean {
        return this.#idPaths.some(path => path.toString() === name);
    }

    isIdProperty(property: EntityProperty): boolean {
        return this.hasIdProperty(property.getName());
    }

    isPrimitive(name: string): boolean {
        return name in this.#primitives;
    }

    getPrimitive(name: string | Path): EntityPrimitiveProperty {
        if (typeof name === "string") {
            this.#assertIsProperty(name);

            if (!this.isPrimitive(name)) {
                throw new Error(`${this.#name}.${name} is not a primitive property`);
            }

            return this.#primitives[name];
        } else {
            let schema: EntitySchema = this;

            for (const segment of toPathSegments(name).slice(0, -1)) {
                schema = schema.getRelation(segment).getRelatedSchema();
            }

            return schema.getPrimitive(toPathSegments(name).at(-1)!);
        }
    }

    isRelation(name: string): boolean {
        return name in this.#relations;
    }

    getRelation(name: string | Path): EntityRelationProperty {
        if (typeof name === "string") {
            this.#assertIsProperty(name);

            if (!this.isRelation(name)) {
                throw new Error(`${this.#name}.${name} is not a relation property`);
            }

            return this.#relations[name];
        } else {
            let schema: EntitySchema = this;

            for (const segment of toPathSegments(name).slice(0, -1)) {
                schema = schema.getRelation(segment).getRelatedSchema();
            }

            return schema.getRelation(toPathSegments(name).at(-1)!);
        }
    }

    getRelations(): EntityRelationProperty[] {
        return Object.values(this.#relations);
    }

    getProperty(key: string): EntityProperty {
        this.#assertIsProperty(key);
        return this.#primitives[key] || this.#relations[key];
    }

    getProperties(): EntityProperty[] {
        return [...Object.values(this.#primitives), ...Object.values(this.#relations)];
    }

    getPrimitives(): EntityPrimitiveProperty[] {
        return Object.values(this.#primitives);
    }

    getPropertyRecord(filter?: (property: EntityProperty) => boolean): Record<string, EntityProperty> {
        const propertyEntries = (filter ? this.getProperties().filter(filter) : this.getProperties()).map(property => [
            property.getName(),
            property,
        ]);

        return Object.fromEntries(propertyEntries);
    }

    getComputedProperties(): readonly EntityComputedProperties[] {
        return this.#schemas.flatMap(schema => schema.getComputedProperties());
    }

    getSchemas(): readonly ConcreteEntitySchema[] {
        return this.#schemas.flatMap(schema => schema.getSchemas());
    }

    #assertIsProperty(name: string): void {
        if (!this.isPrimitive(name) && !this.isRelation(name)) {
            throw new Error(`property ${this.#name}.${name} does not exist`);
        }
    }
}
