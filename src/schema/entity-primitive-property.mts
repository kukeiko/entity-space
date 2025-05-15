import { isPrimitiveType, Primitive } from "@entity-space/utils";
import { EntityProperty, EntityPropertyOptions } from "./entity-property.mjs";

export function isEntityPrimitiveProperty(value: unknown): value is EntityPrimitiveProperty {
    return value instanceof EntityPrimitiveProperty;
}

export interface EntityPrimitivePropertyOptions {
    unique: boolean;
    readonly: boolean;
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
        this.#options = {
            readonly: Boolean(options.readonly),
            unique: Boolean(options.unique),
        };
    }

    readonly #primitive: Primitive;
    readonly #options: EntityPrimitivePropertyOptions;

    getPrimitiveType(): Primitive {
        return this.#primitive;
    }

    isReadonly(): boolean {
        return this.#options.readonly;
    }

    isUnique(): boolean {
        return this.#options.unique;
    }
}
