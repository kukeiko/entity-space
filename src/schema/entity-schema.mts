import { assertValidPaths, Path, Primitive, toPathSegments } from "@entity-space/utils";
import { EntityPrimitiveProperty, EntityPrimitivePropertyOptions } from "./entity-primitive-property.mjs";
import { EntityProperty, EntityPropertyOptions } from "./entity-property.mjs";
import {
    EntityRelationProperty,
    EntityRelationPropertyOptions,
    RelationshipType,
} from "./entity-relation-property.mjs";
import { Entity } from "./entity.mjs";

export class EntitySchema {
    constructor(name: string) {
        this.#name = name;
    }

    readonly #name: string;
    readonly #primitives: Record<string, EntityPrimitiveProperty> = {};
    readonly #relations: Record<string, EntityRelationProperty> = {};
    #idPaths: readonly Path[] = [];
    #sorter?: (a: Entity, b: Entity) => number;

    getName(): string {
        return this.#name;
    }

    setSorter(sorter: (a: Entity, b: Entity) => number): this {
        this.#sorter = sorter;
        return this;
    }

    getSorter(): ((a: Entity, b: Entity) => number) | undefined {
        return this.#sorter;
    }

    setId(idPaths: Path[]): this {
        assertValidPaths(idPaths);
        idPaths.forEach(idPath => this.#assertIsValidIdPath(idPath));
        this.#idPaths = Object.freeze(idPaths.slice());
        return this;
    }

    hasId(): boolean {
        return this.#idPaths.length > 0;
    }

    getIdPaths(): readonly Path[] {
        return this.#idPaths;
    }

    addPrimitive(
        name: string,
        primitive: Primitive,
        options?: Partial<EntityPropertyOptions & EntityPrimitivePropertyOptions>,
    ): this {
        if (name in this.#primitives) {
            throw new Error(`primitive ${name} already exists`);
        }

        if (name in this.#relations) {
            throw new Error(`${name} already exists as a relation`);
        }

        this.#primitives[name] = new EntityPrimitiveProperty(name, primitive, options);
        return this;
    }

    isPrimitive(name: string): boolean {
        return name in this.#primitives;
    }

    getPrimitive(name: string): EntityPrimitiveProperty {
        this.#assertIsProperty(name);

        if (!this.isPrimitive(name)) {
            throw new Error(`${name} is not a primitive property`);
        }

        return this.#primitives[name];
    }

    addRelation(
        name: string,
        schema: EntitySchema,
        options?: Partial<EntityPropertyOptions & EntityRelationPropertyOptions>,
    ): this {
        if (name in this.#relations) {
            throw new Error(`relation ${name} already exists`);
        }

        if (name in this.#primitives) {
            throw new Error(`${name} already exists as a primitive`);
        }

        if (options?.relationshipType === RelationshipType.Joined) {
            (options?.joinFrom ?? []).forEach(path => this.#assertIsValidJoinFromPath(path));
            (options?.joinTo ?? []).forEach(path => this.#assertIsValidJoinToPath(schema, path));
            this.#assertCompatibleJoinPaths(options?.joinFrom ?? [], options?.joinTo ?? [], schema);
        }

        this.#relations[name] = new EntityRelationProperty(name, schema, options);
        return this;
    }

    isRelation(name: string): boolean {
        return name in this.#relations;
    }

    getRelation(name: string): EntityRelationProperty {
        this.#assertIsProperty(name);

        if (!this.isRelation(name)) {
            throw new Error(`${name} is not a relation property`);
        }

        return this.#relations[name];
    }

    getRelations(): EntityRelationProperty[] {
        return Object.values(this.#relations);
    }

    getProperties(): EntityProperty[] {
        return [...Object.values(this.#primitives), ...Object.values(this.#relations)];
    }

    #assertIsProperty(name: string): void {
        if (!this.isPrimitive(name) && !this.isRelation(name)) {
            throw new Error(`property ${name} does not exist`);
        }
    }

    #assertIsValidIdPath(path: Path): void {
        const segments = toPathSegments(path);
        let schema: EntitySchema = this;

        for (const segment of segments.slice(0, -1)) {
            const entity = this.getRelation(segment);

            if (!entity.isEmbedded()) {
                throw new Error(
                    `id path ${this.getName()}.${path} crosses relation boundary ${schema.getName()}.${segment} that is not embedded`,
                );
            } else if (entity.isContainer()) {
                throw new Error(`expected relation ${schema.getName()}.${segment} to not be a container`);
            }

            schema = entity.getRelatedSchema();
        }

        const name = segments[segments.length - 1];
        const primitive = schema.getPrimitive(name);

        if (primitive.isContainer()) {
            throw new Error(`expected primitive ${schema.getName()}.${name} to not be a container`);
        } else if (primitive.isOptional()) {
            throw new Error(`id path ${this.getName()}.${path} points to an optional property`);
        }
    }

    #assertIsValidJoinFromPath(path: Path): void {
        const segments = toPathSegments(path);
        let schema: EntitySchema = this;

        for (const segment of segments.slice(0, -1)) {
            const entity = this.getRelation(segment);

            if (entity.isContainer()) {
                throw new Error(`expected relation ${schema.getName()}.${segment} to not be a container`);
            }

            schema = entity.getRelatedSchema();
        }

        const name = segments[segments.length - 1];

        if (schema.getPrimitive(name).isContainer()) {
            throw new Error(`expected primitive ${schema.getName()}.${name} to not be a container`);
        }
    }

    #assertIsValidJoinToPath(schema: EntitySchema, path: Path): void {
        const segments = toPathSegments(path);

        for (const segment of segments.slice(0, -1)) {
            const entity = schema.getRelation(segment);

            if (entity.isContainer()) {
                throw new Error(`expected relation ${schema.getName()}.${segment} to not be a container`);
            }

            schema = entity.getRelatedSchema();
        }

        const name = segments[segments.length - 1];

        if (schema.getPrimitive(name).isContainer()) {
            throw new Error(`expected primitive ${schema.getName()}.${name} to not be a container`);
        }
    }

    #assertCompatibleJoinPaths(joinFrom: readonly Path[], joinTo: readonly Path[], toSchema: EntitySchema): void {
        if (joinFrom.length !== joinTo.length) {
            throw new Error(`joinFrom & joinTo must have the same length`);
        }

        for (let i = 0; i < joinFrom.length; ++i) {
            const fromPath = joinFrom[i];
            const toPath = joinTo[i];
            let fromSchema: EntitySchema = this;

            for (const segment of toPathSegments(fromPath).slice(0, -1)) {
                fromSchema = fromSchema.getRelation(segment).getRelatedSchema();
            }

            for (const segment of toPathSegments(toPath).slice(0, -1)) {
                toSchema = toSchema.getRelation(segment).getRelatedSchema();
            }

            const fromPrimitive = fromSchema.getPrimitive(toPathSegments(fromPath).at(-1)!);
            const toPrimitive = toSchema.getPrimitive(toPathSegments(toPath).at(-1)!);

            if (fromPrimitive.getPrimitiveType() !== toPrimitive.getPrimitiveType()) {
                throw new Error(`incompatible primitive types between join paths`);
            }
        }
    }
}
