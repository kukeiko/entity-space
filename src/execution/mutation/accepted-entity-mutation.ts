import { Entity, EntityRelationSelection, EntitySchema } from "@entity-space/elements";
import { EntityMutationType } from "./entity-mutation";
import { EntityMutationFn } from "./entity-mutator";
import { EntityChange } from "./structures/entity-change";
import { EntityChangeDependency } from "./structures/entity-change-dependency";

export class AcceptedEntityMutation {
    constructor(
        schema: EntitySchema,
        type: EntityMutationType,
        entities: readonly Entity[],
        acceptedChanges: readonly EntityChange[],
        mutateFn: EntityMutationFn,
        selection: EntityRelationSelection,
        previous?: readonly Entity[],
    ) {
        this.#schema = schema;
        this.#type = type;
        this.#entities = Object.freeze(entities.slice());
        this.#changes = Object.freeze(acceptedChanges.slice());
        this.#mutateFn = mutateFn;
        this.#selection = selection;
        this.#previous = previous;
    }

    readonly #schema: EntitySchema;
    readonly #type: EntityMutationType;
    readonly #entities: readonly Entity[];
    readonly #changes: readonly EntityChange[];
    readonly #mutateFn: EntityMutationFn;
    readonly #selection: EntityRelationSelection;
    readonly #previous?: readonly Entity[];

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getType(): EntityMutationType {
        return this.#type;
    }

    isCreate(): boolean {
        return this.getType() === "create";
    }

    isUpdate(): boolean {
        return this.getType() === "update";
    }

    isDelete(): boolean {
        return this.getType() === "delete";
    }

    isSave(): boolean {
        return this.getType() === "save";
    }

    mutate(entities: Entity[], selection: EntityRelationSelection): Promise<Entity[]> {
        return this.#mutateFn(entities, selection);
    }

    getEntities(): readonly Entity[] {
        return this.#entities.filter(entity => this.#changes.some(change => change.getEntity() === entity));
    }

    getPreviousEntities(): readonly Entity[] {
        return (this.#previous ?? []).filter(entity => this.#changes.some(change => change.getEntity() === entity));
    }

    getChanges(): readonly EntityChange[] {
        return this.#changes;
    }

    getSelection(): EntityRelationSelection {
        return this.#selection;
    }

    getOutboundDependencies(): readonly EntityChangeDependency[] {
        return this.#changes.flatMap(change => change.getOutboundDependencies());
    }

    getInboundDependencies(): readonly EntityChangeDependency[] {
        return this.#changes.flatMap(change => change.getInboundDependencies());
    }

    hasChangesRelatedToDependency(dependency: EntityChangeDependency): boolean {
        return this.#changes.some(change => change.hasEntity(dependency.getEntity()));
    }

    isDependencyOf(other: AcceptedEntityMutation): boolean {
        for (const dependency of other.getOutboundDependencies()) {
            if (this.hasChangesRelatedToDependency(dependency)) {
                return true;
            }
        }

        for (const dependency of this.getInboundDependencies()) {
            if (other.hasChangesRelatedToDependency(dependency)) {
                return true;
            }
        }

        return false;
    }
}
