import { Entity, EntityRelationSelection, EntitySchema } from "@entity-space/elements";
import { EntityMutationFn, EntityMutatorType } from "../entity-mutator";
import { EntityChange } from "./entity-change";
import { EntityChangeDependency } from "./entity-change-dependency";
import { EntityMutationContext } from "./entity-mutation-context";

export class AcceptedEntityMutation {
    constructor(
        schema: EntitySchema,
        type: EntityMutatorType,
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
    readonly #type: EntityMutatorType;
    readonly #entities: readonly Entity[];
    readonly #changes: readonly EntityChange[];
    readonly #mutateFn: EntityMutationFn;
    readonly #selection: EntityRelationSelection;
    readonly #previous?: readonly Entity[];

    getSchema(): EntitySchema {
        return this.#schema;
    }

    getType(): EntityMutatorType {
        return this.#type;
    }

    isCreate(): boolean {
        return this.getType() === EntityMutatorType.Create;
    }

    isUpdate(): boolean {
        return this.getType() === EntityMutatorType.Update;
    }

    isDelete(): boolean {
        return this.getType() === EntityMutatorType.Delete;
    }

    isSave(): boolean {
        return this.getType() === EntityMutatorType.Save;
    }

    mutate(entities: Entity[], selection: EntityRelationSelection, context: EntityMutationContext): Promise<Entity[]> {
        return this.#mutateFn(entities, selection, context);
    }

    getEntities(): readonly Entity[] {
        return this.#entities.filter(entity => this.includesEntity(entity));
    }

    getPreviousEntities(): readonly Entity[] {
        return (this.#previous ?? []).filter(entity => this.includesEntity(entity));
    }

    getChanges(): readonly EntityChange[] {
        return this.#changes;
    }

    includesEntity(entity: Entity): boolean {
        return this.#changes.some(change => change.getEntity() === entity);
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
