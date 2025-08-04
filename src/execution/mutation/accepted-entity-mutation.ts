import { Entity, EntityRelationSelection } from "@entity-space/elements";
import { EntityChange } from "./entity-change";
import { EntityMutationDependency } from "./entity-mutation-dependency";

export class AcceptedEntityMutation {
    constructor(
        entities: readonly Entity[],
        acceptedChanges: readonly EntityChange[],
        dependencies: readonly EntityMutationDependency[],
        mutateFn: (mutation: AcceptedEntityMutation) => Promise<void>, // [todo] ❌ hacky
        selection: EntityRelationSelection,
        previous?: readonly Entity[],
    ) {
        this.#entities = Object.freeze(entities.slice());
        this.#changes = Object.freeze(acceptedChanges.slice());
        this.#dependencies = Object.freeze(dependencies.slice());
        this.#mutateFn = mutateFn;
        this.#selection = selection;
        this.#previous = previous;
    }

    readonly #entities: readonly Entity[];
    readonly #changes: readonly EntityChange[];
    readonly #dependencies: readonly EntityMutationDependency[];
    readonly #mutateFn: (mutation: AcceptedEntityMutation) => Promise<void>;
    readonly #selection: EntityRelationSelection;
    readonly #previous?: readonly Entity[];

    async mutate(): Promise<void> {
        await this.#mutateFn(this);
    }

    getEntities(): readonly Entity[] {
        return this.#entities;
    }

    getContainedRootEntities(): readonly Entity[] {
        return this.#entities.filter(entity => this.#changes.some(change => change.getEntity() === entity));
    }

    getPreviousContainedRootEntities(): readonly Entity[] {
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
