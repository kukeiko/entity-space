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
    readonly dependsOn: readonly string[];
    readonly status: EntityChangeStatus;
    readonly error?: unknown;
    readonly errorPath?: string;
}

/** @deprecated Use {@link EntityChange} — planned rows are mutable {@link EntityChange} instances with a key. */
export type PlannedEntityChange = EntityChange;

export class EntityChange {
    constructor(
        schema: EntitySchema,
        entity: Entity,
        type: EntityChangeType,
        dependencies: readonly EntityChangeDependency[],
        options: {
            previous?: Entity;
            path?: Path;
            key?: string;
            batchIndex?: number;
            status?: EntityChangeStatus;
            error?: unknown;
            errorPath?: string;
            dependsOnKeys?: readonly string[];
        } = {},
    ) {
        this.#schema = schema;
        this.#entity = entity;
        this.#type = type;
        this.#dependencies = dependencies;
        this.#previous = options.previous;
        this.#path = options.path;
        this.#key = options.key;
        this.#batchIndex = options.batchIndex;
        this.#status = options.status ?? EntityChangeStatus.Pending;
        this.#error = options.error;
        this.#errorPath = options.errorPath;
        this.#dependsOnKeys = options.dependsOnKeys ? [...options.dependsOnKeys] : [];
    }

    readonly #schema: EntitySchema;
    readonly #entity: Entity;
    readonly #type: EntityChangeType;
    readonly #dependencies: readonly EntityChangeDependency[];
    readonly #previous?: Entity;
    readonly #path?: Path;
    readonly #key?: string;
    readonly #batchIndex?: number;
    #status: EntityChangeStatus;
    #error?: unknown;
    #errorPath?: string;
    #dependsOnKeys: string[];

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

    getDependencies(): readonly EntityChangeDependency[] {
        return this.#dependencies;
    }

    getKey(): string {
        if (this.#key === undefined) {
            throw new Error("the change has not been planned yet");
        }

        return this.#key;
    }

    getBatchIndex(): number {
        if (this.#batchIndex === undefined) {
            throw new Error("the change has not been planned yet");
        }

        return this.#batchIndex;
    }

    getDependsOnKeys(): readonly string[] {
        return this.#dependsOnKeys;
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

    toPlanned(key: string, batchIndex: number): EntityChange {
        return new EntityChange(this.#schema, this.#entity, this.#type, this.#dependencies, {
            previous: this.#previous,
            path: this.#path,
            key,
            batchIndex,
        });
    }

    setDependsOn(dependsOnKeys: readonly string[]): void {
        this.#dependsOnKeys = [...dependsOnKeys];
    }

    setStatus(status: EntityChangeStatus, options: { error?: unknown; errorPath?: string } = {}): void {
        this.#status = status;

        if (status === EntityChangeStatus.Succeeded) {
            this.#error = undefined;
            this.#errorPath = undefined;
            return;
        }

        if (status === EntityChangeStatus.Failed) {
            this.#error = options.error;
            this.#errorPath = options.errorPath;
            return;
        }

        if (options.error !== undefined) {
            this.#error = options.error;
        }

        if (options.errorPath !== undefined) {
            this.#errorPath = options.errorPath;
        }
    }

    toSnapshot(): EntityChangeItem {
        return Object.freeze({
            key: this.getKey(),
            schema: this.getSchema(),
            type: this.getType(),
            entity: this.getEntity(),
            previous:
                this.getType() === EntityChangeType.Delete ? this.getEntity() : (this.getPrevious() as Entity | undefined),
            path: this.getPath(),
            dependsOn: Object.freeze([...this.#dependsOnKeys]),
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
