import { Entity, EntitySchema } from "@entity-space/elements";
import { Path } from "@entity-space/utils";
import { EntityChangeDependency } from "./entity-change-dependency";

export const EntityChangeType = {
    Create: "create",
    Update: "update",
    Delete: "delete",
} as const;

export type EntityChangeType = (typeof EntityChangeType)[keyof typeof EntityChangeType];

export abstract class EntityChange {
    constructor(
        schema: EntitySchema,
        entity: Entity,
        dependencies: readonly EntityChangeDependency[],
        options: { previous?: Entity; path?: Path } = {},
    ) {
        this.#schema = schema;
        this.#entity = entity;
        this.#dependencies = dependencies;
        this.#previous = options.previous;
        this.#path = options.path;
    }

    readonly #schema: EntitySchema;
    readonly #entity: Entity;
    readonly #dependencies: readonly EntityChangeDependency[];
    readonly #previous?: Entity;
    readonly #path?: Path;

    abstract getType(): EntityChangeType;

    isType(types: readonly EntityChangeType[]): boolean {
        return types.includes(this.getType());
    }

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getEntity(): Entity {
        return this.#entity;
    }

    getPrevious(): Entity | undefined {
        return this.#previous;
    }

    getPath(): Path | undefined {
        return this.#path;
    }

    hasEntity(entity: Entity): boolean {
        return this.#entity === entity;
    }

    isCreate(): this is CreateEntityChange {
        return false;
    }

    isUpdate(): this is UpdateEntityChange {
        return false;
    }

    isDelete(): this is DeleteEntityChange {
        return false;
    }

    getOutboundDependencies(): EntityChangeDependency[] {
        return this.#dependencies.filter(dependency => dependency.isOutbound());
    }

    getInboundDependencies(): EntityChangeDependency[] {
        return this.#dependencies.filter(dependency => dependency.isInbound());
    }
}

export class CreateEntityChange extends EntityChange {
    override getType(): EntityChangeType {
        return EntityChangeType.Create;
    }

    override isCreate(): this is CreateEntityChange {
        return true;
    }

    override toString(): string {
        return `🆕 ${this.getSchema().getName()} ${JSON.stringify(this.getEntity())}`;
    }
}

export class UpdateEntityChange extends EntityChange {
    override getType(): EntityChangeType {
        return EntityChangeType.Update;
    }

    override isUpdate(): this is UpdateEntityChange {
        return true;
    }

    override toString(): string {
        return `✏️ ${this.getSchema().getName()} ${JSON.stringify(this.getEntity())}`;
    }
}

export class DeleteEntityChange extends EntityChange {
    override getType(): EntityChangeType {
        return EntityChangeType.Delete;
    }

    override isDelete(): this is DeleteEntityChange {
        return true;
    }

    override toString(): string {
        return `❌ ${this.getSchema().getName()} ${JSON.stringify(this.getEntity())}`;
    }
}
