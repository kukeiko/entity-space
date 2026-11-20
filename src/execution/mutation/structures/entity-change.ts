import { Entity, EntitySchema } from "@entity-space/elements";
import { Path } from "@entity-space/utils";
import { EntityChangeDependency } from "./entity-change-dependency";

export const EntityChangeType = {
    Create: "create",
    Update: "update",
    Delete: "delete",
} as const;

export type EntityChangeType = (typeof EntityChangeType)[keyof typeof EntityChangeType];

export const EntityChangeStatus = {
    Pending: "pending",
    Running: "running",
    Succeeded: "succeeded",
    Failed: "failed",
    Blocked: "blocked",
    Cancelled: "cancelled",
} as const;

export type EntityChangeStatus = (typeof EntityChangeStatus)[keyof typeof EntityChangeStatus];

/**
 * Snapshot of a single planned entity change, as exposed to consumers for rendering previews and live status.
 * The referenced entities are owned by the changeset and must not be modified.
 */
export interface EntityChangeItem<T extends Entity = Entity> {
    /** Stable across retries: built from schema, change type and (possibly temporary) Id. */
    readonly key: string;
    readonly schema: EntitySchema;
    readonly type: EntityChangeType;
    readonly entity: T;
    readonly previous?: T;
    readonly path?: Path;
    readonly status: EntityChangeStatus;
    readonly error?: unknown;
    readonly errorPath?: string;
}

export class EntityChange {
    constructor(
        schema: EntitySchema,
        entity: Entity,
        type: EntityChangeType,
        dependencies: readonly EntityChangeDependency[],
        key: string,
        options: {
            previous?: Entity;
            path?: Path;
        } = {},
    ) {
        this.#schema = schema;
        this.#entity = entity;
        this.#type = type;
        this.#dependencies = dependencies;
        this.#key = key;
        this.#previous = options.previous;
        this.#path = options.path;
    }

    readonly #schema: EntitySchema;
    readonly #entity: Entity;
    readonly #type: EntityChangeType;
    readonly #dependencies: readonly EntityChangeDependency[];
    readonly #previous?: Entity;
    readonly #path?: Path;
    readonly #key: string;
    #status: EntityChangeStatus = EntityChangeStatus.Pending;
    #error?: unknown;
    #errorPath?: string;

    getType(): EntityChangeType {
        return this.#type;
    }

    isType(types: readonly EntityChangeType[]): boolean {
        return types.includes(this.#type);
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

    isCreate(): boolean {
        return this.#type === EntityChangeType.Create;
    }

    isUpdate(): boolean {
        return this.#type === EntityChangeType.Update;
    }

    isDelete(): boolean {
        return this.#type === EntityChangeType.Delete;
    }

    getOutboundDependencies(): EntityChangeDependency[] {
        return this.#dependencies.filter(dependency => dependency.isOutbound());
    }

    getInboundDependencies(): EntityChangeDependency[] {
        return this.#dependencies.filter(dependency => dependency.isInbound());
    }

    getKey(): string {
        return this.#key;
    }

    getStatus(): EntityChangeStatus {
        return this.#status;
    }

    getError(): unknown | undefined {
        return this.#error;
    }

    getErrorPath(): string | undefined {
        return this.#errorPath;
    }

    isSettled(): boolean {
        return this.#status !== EntityChangeStatus.Pending && this.#status !== EntityChangeStatus.Running;
    }

    setStatus(status: EntityChangeStatus, options: { error?: unknown; errorPath?: string } = {}): void {
        this.#status = status;

        if (status === EntityChangeStatus.Succeeded) {
            this.#error = undefined;
            this.#errorPath = undefined;
        } else if (status === EntityChangeStatus.Failed) {
            this.#error = options.error;
            this.#errorPath = options.errorPath;
        } else {
            if (options.error !== undefined) {
                this.#error = options.error;
            }

            if (options.errorPath !== undefined) {
                this.#errorPath = options.errorPath;
            }
        }
    }

    toSnapshot(): EntityChangeItem {
        return Object.freeze({
            key: this.getKey(),
            schema: this.getSchema(),
            type: this.getType(),
            entity: this.getEntity(),
            previous:
                this.getType() === EntityChangeType.Delete
                    ? this.getEntity()
                    : (this.getPrevious() as Entity | undefined),
            path: this.getPath(),
            status: this.#status,
            error: this.#error,
            errorPath: this.#errorPath,
        });
    }

    toString(): string {
        const name = this.getSchema().getName();
        const entity = JSON.stringify(this.getEntity());

        switch (this.#type) {
            case EntityChangeType.Create:
                return `🆕 ${name} ${entity}`;
            case EntityChangeType.Update:
                return `✏️ ${name} ${entity}`;
            case EntityChangeType.Delete:
                return `❌ ${name} ${entity}`;
        }
    }
}
