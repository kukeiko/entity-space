import { isPrimitiveType, Primitive } from "@entity-space/utils";
import { EntityProperty, EntityPropertyOptions } from "./entity-property";

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
        primitive: Primitive,
        options: Partial<EntityPrimitivePropertyOptions & EntityPropertyOptions> = {},
    ) {
        super(name, options);

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
}
