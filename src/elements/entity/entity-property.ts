import { Entity } from "./entity";
import { EntityPrimitiveProperty } from "./entity-primitive-property";
import { EntityRelationProperty } from "./entity-relation-property";
import { EntitySchema } from "./entity-schema";

export enum ContainerType {
    Array = "array",
}

function assertValidPropertyContainerType(containerType: ContainerType): void {
    if (!Object.values(ContainerType).some(value => value === containerType)) {
        throw new Error(`${containerType} is not a valid ContainerType`);
    }
}

function assertValidPropertyName(name: string): void {
    if (typeof name !== "string" || !name.length) {
        throw new Error(`${name} is not a valid property name`);
    }
}

export interface EntityPropertyOptions {
    container?: ContainerType;
    optional: boolean;
    nullable: boolean;
    readonly: boolean;
    dtoName: string;
}

export abstract class EntityProperty {
    constructor(name: string, schema: EntitySchema, options: Partial<EntityPropertyOptions> = {}) {
        assertValidPropertyName(name);
        if (options.container) {
            assertValidPropertyContainerType(options.container);
        }

        if (options.dtoName) {
            assertValidPropertyName(options.dtoName);
        }

        this.#schema = schema;
        this.#name = name;
        this.#options = Object.freeze({
            container: options.container,
            optional: options.optional === true,
            nullable: options.nullable === true,
            dtoName: options.dtoName ?? name,
            readonly: options.readonly === true,
        });
    }

    readonly #name: string;
    readonly #options: Readonly<EntityPropertyOptions>;
    readonly #schema: EntitySchema;

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getName(): string {
        return this.#name;
    }

    getNameWithSchema(): string {
        return `${this.#schema.getName()}.${this.getName()}`;
    }

    getDtoNameWithSchema(): string {
        return `${this.#schema.getName()}.${this.getDtoName()}`;
    }

    getDtoName(): string {
        return this.#options.dtoName;
    }

    // [todo] ❌ change to just "isArray()" (remove ContainerType completely)
    isContainer(): boolean {
        return this.#options.container !== undefined;
    }

    isArray(): boolean {
        return this.#options.container === ContainerType.Array;
    }

    isOptional(): boolean {
        return this.#options.optional;
    }

    isNullable(): boolean {
        return this.#options.nullable;
    }

    isReadonly(): boolean {
        return this.#options.readonly;
    }

    abstract isPrimitive(): this is EntityPrimitiveProperty;
    abstract isRelation(): this is EntityRelationProperty;

    readValue(entity: Entity): any {
        return entity[this.getName()];
    }

    writeValue(entity: Entity, value: any): void {
        entity[this.getName()] = value;
    }

    readDtoValue(dto: Entity): any {
        return dto[this.getDtoName()];
    }

    writeDtoValue(dto: Entity, value: any): void {
        dto[this.getDtoName()] = value;
    }
}
