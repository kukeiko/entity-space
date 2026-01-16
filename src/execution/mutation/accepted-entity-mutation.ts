import { Entity, EntityRelationSelection, EntitySchema } from "@entity-space/elements";
import { EntityChange } from "./entity-change";
import { EntityMutationType } from "./entity-mutation";
import { EntityMutationDependency } from "./entity-mutation-dependency";
import { EntityMutationFn } from "./entity-mutator";

export class AcceptedEntityMutation {
    constructor(
        schema: EntitySchema,
        type: EntityMutationType,
        entities: readonly Entity[],
        acceptedChanges: readonly EntityChange[],
        dependencies: readonly EntityMutationDependency[],
        mutateFn: EntityMutationFn,
        selection: EntityRelationSelection,
        previous?: readonly Entity[],
    ) {
        this.#schema = schema;
        this.#type = type;
        this.#entities = Object.freeze(entities.slice());
        this.#changes = Object.freeze(acceptedChanges.slice());
        this.#dependencies = Object.freeze(dependencies.slice());
        this.#mutateFn = mutateFn;
        this.#selection = selection;
        this.#previous = previous;
    }

    readonly #schema: EntitySchema;
    readonly #type: EntityMutationType;
    readonly #entities: readonly Entity[];
    readonly #changes: readonly EntityChange[];
    readonly #dependencies: readonly EntityMutationDependency[];
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

    getDependencies(): readonly EntityMutationDependency[] {
        return this.#dependencies;
    }

    getOutboundDependencies(): readonly EntityMutationDependency[] {
        return this.#dependencies.filter(dependency => dependency.isOutbound());
    }

    getInboundDependencies(): readonly EntityMutationDependency[] {
        return this.#dependencies.filter(dependency => dependency.isInbound());
    }

    hasChangesRelatedToDependency(dependency: EntityMutationDependency): boolean {
        return this.#changes.some(
            change =>
                change.getType() === dependency.getType() &&
                change.getSchema().getName() === dependency.getSchema().getName() &&
                dependency.getEntities().includes(change.getEntity()),
        );
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
