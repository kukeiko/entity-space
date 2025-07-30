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
    constructor(name: string, options: Partial<EntityPropertyOptions> = {}) {
        assertValidPropertyName(name);

        if (options.container) {
            assertValidPropertyContainerType(options.container);
        }

        if (options.dtoName) {
            assertValidPropertyName(options.dtoName);
        }

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

    getName(): string {
        return this.#name;
    }

    getDtoName(): string {
        return this.#options.dtoName;
    }

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
}
