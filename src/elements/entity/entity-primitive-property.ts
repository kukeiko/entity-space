import { isPrimitiveType, Primitive } from "@entity-space/utils";
import { Entity } from "./entity";
import { EntityProperty, EntityPropertyOptions } from "./entity-property";
import { EntitySchema } from "./entity-schema";

export function isEntityPrimitiveProperty(value: unknown): value is EntityPrimitiveProperty {
    return value instanceof EntityPrimitiveProperty;
}

export interface EntityPrimitivePropertyOptions {
    unique: boolean;
    creatable: boolean;
}

export class EntityPrimitiveProperty extends EntityProperty {
    constructor(
        name: string,
        schema: EntitySchema,
        primitive: Primitive,
        options: Partial<EntityPrimitivePropertyOptions & EntityPropertyOptions> = {},
    ) {
        super(name, schema, options);

        if (!isPrimitiveType(primitive)) {
            throw new Error(`${primitive} is not a Primitive`);
        }

        this.#primitive = primitive;
        this.#options = Object.freeze({
            unique: options.unique === true,
            creatable: options.creatable === true,
        });
    }

    readonly #primitive: Primitive;
    readonly #options: Readonly<EntityPrimitivePropertyOptions>;

    getPrimitiveType(): Primitive {
        return this.#primitive;
    }

    isString(): boolean {
        return this.#primitive === String;
    }

    isCreatable(): boolean {
        return this.#options.creatable;
    }

    isUnique(): boolean {
        return this.#options.unique;
    }

    getDefaultValue(): ReturnType<Primitive> | ReturnType<Primitive>[] {
        if (this.isArray()) {
            return [];
        } else {
            return this.#primitive();
        }
    }

    copyValueOf(entity: Entity): ReturnType<Primitive> | ReturnType<Primitive>[] {
        const value = entity[this.getName()];

        if (value == null || !this.isArray()) {
            return value;
        } else {
            return (value as ReturnType<Primitive>[]).slice();
        }
    }
}
