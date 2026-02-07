import { Entity, EntitySchema } from "@entity-space/elements";
import { EntityMutationType } from "../entity-mutation";
import { EntityChangeDependency } from "./entity-change-dependency";

export abstract class EntityChange {
    constructor(schema: EntitySchema, entity: Entity, dependencies: readonly EntityChangeDependency[]) {
        this.#schema = schema;
        this.#entity = entity;
        this.#dependencies = dependencies;
    }

    readonly #schema: EntitySchema;
    readonly #entity: Entity;
    readonly #dependencies: readonly EntityChangeDependency[];

    abstract isType(types: readonly EntityMutationType[]): boolean;

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getEntity(): Entity {
        return this.#entity;
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
    override isCreate(): this is CreateEntityChange {
        return true;
    }

    override isType(types: readonly EntityMutationType[]): boolean {
        return types.includes("create");
    }

    override toString(): string {
        return `⭐ ${this.getSchema().getName()} ${JSON.stringify(this.getEntity())}`;
    }
}

export class UpdateEntityChange extends EntityChange {
    constructor(
        schema: EntitySchema,
        entity: Entity,
        dependencies: readonly EntityChangeDependency[],
        entities: readonly Entity[],
    ) {
        super(schema, entity, dependencies);
        this.#entities = entities;
    }

    readonly #entities: readonly Entity[];

    getEntities(): readonly Entity[] {
        return this.#entities;
    }

    override hasEntity(entity: Entity): boolean {
        return this.#entities.includes(entity);
    }

    override isUpdate(): this is UpdateEntityChange {
        return true;
    }

    override isType(types: readonly EntityMutationType[]): boolean {
        return types.includes("update");
    }

    override toString(): string {
        return `✏️ ${this.getSchema().getName()} ${JSON.stringify(this.getEntity())}`;
    }
}

export class DeleteEntityChange extends EntityChange {
    override isDelete(): this is DeleteEntityChange {
        return true;
    }

    override isType(types: readonly EntityMutationType[]): boolean {
        return types.includes("delete");
    }

    override toString(): string {
        return `❌ ${this.getSchema().getName()} ${JSON.stringify(this.getEntity())}`;
    }
}
