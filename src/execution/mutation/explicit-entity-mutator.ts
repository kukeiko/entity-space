import {
    assignCreatedIds,
    assignEntitiesUsingIds,
    copyEntity,
    Entity,
    EntityRelationSelection,
    EntitySchema,
    EntitySelection,
    getSelection,
    intersectRelationSelection,
    isCreatableEntityProperty,
    isSavableEntityProperty,
    isUpdatableEntityProperty,
    toEntityPairs,
    toRelationSelection,
} from "@entity-space/elements";
import { joinPaths, Path, toPath } from "@entity-space/utils";
import { isEmpty } from "lodash";
import { entityHasId } from "../../elements/entity/entity-has-id.fn";
import { AcceptedEntityMutation } from "./accepted-entity-mutation";
import { EntityChange } from "./entity-change";
import { EntityChanges } from "./entity-changes";
import { EntityMutationType } from "./entity-mutation";
import { EntityMutationDependency } from "./entity-mutation-dependency";
import { EntityMutationFn, EntityMutator } from "./entity-mutator";

export class ExplicitEntityMutator extends EntityMutator {
    constructor(
        type: EntityMutationType,
        schema: EntitySchema,
        mutateFn: EntityMutationFn,
        selection?: EntityRelationSelection,
    ) {
        super();
        this.#type = type;
        this.#schema = schema;
        this.#mutateFn = mutateFn;
        this.#selection = selection;
    }

    readonly #type: EntityMutationType;
    readonly #schema: EntitySchema;
    readonly #mutateFn: EntityMutationFn;
    readonly #selection?: EntityRelationSelection;

    override accept(
        schema: EntitySchema,
        entities: readonly Entity[],
        changes: EntityChanges,
        selection?: EntityRelationSelection,
        previous?: readonly Entity[],
    ): [accepted: AcceptedEntityMutation | undefined, open: EntityChanges | undefined] {
        if (schema.getName() !== this.#schema.getName()) {
            return [undefined, changes];
        }

        const [accepted, open, dependencies] = this.#accept(
            this.#schema,
            entities,
            changes,
            selection,
            this.#selection,
            undefined,
            previous,
            true,
        );

        if (!accepted.length) {
            return [undefined, changes];
        } else {
            const acceptedSelection =
                selection !== undefined && this.#selection !== undefined
                    ? intersectRelationSelection(selection, this.#selection)
                    : undefined;

            return [
                new AcceptedEntityMutation(
                    entities,
                    accepted,
                    dependencies,
                    mutation => this.mutate(mutation),
                    acceptedSelection,
                    previous,
                ),
                open,
            ];
        }
    }

    override async mutate(mutation: AcceptedEntityMutation): Promise<void> {
        if (this.#type === "create") {
            for (const dependency of mutation.getOutboundDependencies()) {
                console.log(`⚡ writing outbound dependency: ${dependency.getType()} ${dependency.getPath()}`);
                dependency.writeIds(this.#schema, mutation.getContainedRootEntities());
            }

            // [todo] ⏰ instead, map each EntityChange to a copy and keep them as a pair
            const map = new Map(
                mutation.getContainedRootEntities().map(entity => {
                    // [todo] ⏰ we need to copy over only creatable properties
                    const copy = copyEntity(
                        this.#schema,
                        entity,
                        mutation.getSelection(),
                        isCreatableEntityProperty,
                        (_, entity) => mutation.getChanges().some(change => change.getEntity() === entity),
                    );

                    return [copy, entity];
                }),
            );

            const copies = Array.from(map.keys());
            const created = await this.#mutateFn(copies, mutation.getSelection() ?? {});
            // const pairs = toEntityPairs(this.#schema, copies, created);

            // for (const [copy, created] of pairs) {
            //     if (created === undefined) {
            //         throw new Error("no created match found");
            //     }

            //     const original = map.get(copy)!;

            //     // [todo] ❌ we're only assigning ids on root entities, need to also do it for related entities
            //     for (const idPath of this.#schema.getIdPaths()) {
            //         writePath(idPath, original, readPath(idPath, created));
            //     }
            // }
            assignCreatedIds(this.#schema, mutation.getSelection() ?? {}, mutation.getContainedRootEntities(), created);
            const selection = getSelection(this.#schema, undefined, mutation.getSelection() ?? {});
            const originals = Array.from(map.values());
            assignEntitiesUsingIds(this.#schema, selection, originals, created);

            for (const dependency of mutation.getInboundDependencies()) {
                console.log(`⚡ writing inbound dependency: ${dependency.getType()} ${dependency.getPath()}`);
                dependency.writeIds(this.#schema, originals);
            }
        } else if (this.#type === "update") {
            for (const dependency of mutation.getOutboundDependencies()) {
                console.log(`⚡ writing outbound dependency: ${dependency.getType()} ${dependency.getPath()}`);
                dependency.writeIds(this.#schema, mutation.getContainedRootEntities());
            }

            const map = new Map(
                mutation.getContainedRootEntities().map(entity => {
                    // [todo] ⏰ need to copy over ids as well
                    const copy = copyEntity(
                        this.#schema,
                        entity,
                        mutation.getSelection(),
                        isUpdatableEntityProperty,
                        (_, entity) => mutation.getChanges().some(change => change.getEntity() === entity),
                        true,
                    );

                    return [copy, entity];
                }),
            );

            const copies = Array.from(map.keys());
            const updated = await this.#mutateFn(copies, mutation.getSelection() ?? {});
            const originals = Array.from(map.values());
            const selection = getSelection(this.#schema, undefined, mutation.getSelection() ?? {});
            assignEntitiesUsingIds(this.#schema, selection, originals, updated);

            for (const dependency of mutation.getInboundDependencies()) {
                console.log(`⚡ writing inbound dependency: ${dependency.getType()} ${dependency.getPath()}`);
                dependency.writeIds(this.#schema, originals);
            }
        } else if (this.#type === "delete") {
            // [todo] ❌ we need splice the original entities if the user just wants do "delete" (i.e. there is no previous),
            // so that in case of an error (service temporarily unavailable), and some entities have already been deleted successfully,
            // entity-space doesn't try to delete those again.
            const map = new Map(
                mutation.getPreviousContainedRootEntities().map(entity => {
                    const copy = copyEntity(
                        this.#schema,
                        entity,
                        mutation.getSelection(),
                        undefined,
                        (_, entity) => mutation.getChanges().some(change => change.getEntity() === entity),
                        true,
                    );

                    return [copy, entity];
                }),
            );

            const copies = Array.from(map.keys());
            const deleted = await this.#mutateFn(copies, mutation.getSelection() ?? {});
            const originals = Array.from(map.values());

            for (const [current, previous] of toEntityPairs(this.#schema, originals, deleted)) {
                if (!previous) {
                    throw new Error("failed to find deleted match");
                }

                const change = mutation.getChanges().find(change => change.getEntity() === current);

                if (!change) {
                    throw new Error("failed to find deletion change");
                }

                // [todo] ❓ figure out if it is fine to not iterate over possible children
                change.removeEntity();
            }
        } else if (this.#type === "save") {
            for (const dependency of mutation.getOutboundDependencies()) {
                console.log(`⚡ writing outbound dependency: ${dependency.getType()} ${dependency.getPath()}`);
                dependency.writeIds(this.#schema, mutation.getContainedRootEntities());
            }

            const map = new Map(
                mutation.getContainedRootEntities().map(entity => {
                    const copy = copyEntity(
                        this.#schema,
                        entity,
                        mutation.getSelection(),
                        isSavableEntityProperty,
                        (_, entity) => mutation.getChanges().some(change => change.getEntity() === entity),
                        true,
                    );

                    return [copy, entity];
                }),
            );

            const copies = Array.from(map.keys());
            const saved = await this.#mutateFn(copies, mutation.getSelection() ?? {});
            assignCreatedIds(this.#schema, mutation.getSelection() ?? {}, mutation.getContainedRootEntities(), saved);
            const selection = getSelection(this.#schema, undefined, mutation.getSelection() ?? {});
            const originals = Array.from(map.values());
            assignEntitiesUsingIds(this.#schema, selection, originals, saved);
            // [todo] ❓ i think "save" will also handle delete, so we need to do that somehow here as well.
            // [todo] ⏰ write dependencies
            for (const dependency of mutation.getInboundDependencies()) {
                console.log(`⚡ writing inbound dependency: ${dependency.getType()} ${dependency.getPath()}`);
                dependency.writeIds(this.#schema, originals);
            }
        }
    }

    #accept(
        schema: EntitySchema,
        entities: readonly Entity[],
        changes: EntityChanges,
        changeSelection?: EntityRelationSelection,
        supportedSelection?: EntityRelationSelection,
        path?: Path,
        previous?: readonly Entity[],
        isRoot?: boolean,
    ): [accepted: EntityChange[], open: EntityChanges | undefined, dependencies: EntityMutationDependency[]] {
        let [acceptedChanges, open] = schema.hasId()
            ? changes.subtractChanges(this.#type === "save" ? ["create", "update"] : [this.#type], schema, entities)
            : [[], changes];

        if (previous && open && (this.#type === "delete" || (!isRoot && this.#type === "save"))) {
            const [acceptedDeletionChanges, nextOpen] = schema.hasId()
                ? open.subtractChanges(["delete"], schema, previous)
                : [[], open];
            acceptedChanges.push(...acceptedDeletionChanges);
            open = nextOpen;
        }

        if (!acceptedChanges.length && schema.hasId()) {
            return [[], undefined, []];
        }

        let dependencies: EntityMutationDependency[] = [];

        if (changeSelection !== undefined) {
            const createChanges = acceptedChanges.filter(
                change => change.getType() === "create" || change.getType() === "update",
            );

            if (createChanges.length) {
                dependencies.push(
                    ...this.#getCreateDependencies(
                        schema,
                        createChanges.map(change => change.getEntity()),
                        changeSelection,
                        supportedSelection,
                        path,
                    ),
                );
            }
        }

        if (open === undefined) {
            return [acceptedChanges, undefined, dependencies];
        }

        let openChanges: EntityChanges | undefined = open;

        if (changeSelection !== undefined && supportedSelection !== undefined) {
            const intersection = intersectRelationSelection(supportedSelection, changeSelection);
            const [relatedChanges, relatedDependencies, openAfterRelated] = this.#acceptRelated(
                schema,
                intersection,
                entities,
                changeSelection,
                open,
                path,
                previous,
            );

            acceptedChanges.push(...relatedChanges);
            dependencies.push(...relatedDependencies);
            openChanges = openAfterRelated;
        }

        return [acceptedChanges, openChanges, dependencies];
    }

    #acceptRelated(
        schema: EntitySchema,
        intersection: EntitySelection,
        entities: readonly Entity[],
        changeSelection: EntityRelationSelection,
        changes: EntityChanges,
        path?: Path,
        previous?: readonly Entity[],
    ): [EntityChange[], EntityMutationDependency[], EntityChanges | undefined] {
        const entityChanges: EntityChange[] = [];
        const dependencies: EntityMutationDependency[] = [];
        let openChanges: EntityChanges | undefined = changes;

        for (const [key, selected] of Object.entries(toRelationSelection(schema, intersection))) {
            const relation = schema.getRelation(key);
            const [relatedRemovedChanges, nextOpenChanges, relatedDependencies] = this.#accept(
                relation.getRelatedSchema(),
                entities.flatMap(entity => relation.readValueAsArray(entity)),
                openChanges,
                isEmpty(changeSelection[key]) ? undefined : changeSelection[key],
                isEmpty(selected) ? undefined : selected,
                path === undefined ? toPath(key) : joinPaths([path, key]),
                previous ? previous.flatMap(entity => relation.readValueAsArray(entity)) : undefined,
            );

            if (relatedRemovedChanges) {
                entityChanges.push(...relatedRemovedChanges);
            }

            dependencies.push(...relatedDependencies);
            openChanges = nextOpenChanges;

            if (openChanges === undefined) {
                break;
            }
        }

        return [entityChanges, dependencies, openChanges];
    }

    #getCreateDependencies(
        schema: EntitySchema,
        entities: readonly Entity[],
        required: EntityRelationSelection,
        supported?: EntityRelationSelection,
        path?: Path,
    ): EntityMutationDependency[] {
        const dependencies = Object.entries(required).flatMap(([key, selected]) => {
            const relation = schema.getRelation(key);

            if (relation.isEmbedded()) {
                const related = entities.flatMap(entity => relation.readValueAsArray(entity));

                return this.#getCreateDependencies(
                    relation.getRelatedSchema(),
                    related,
                    selected,
                    supported?.[key],
                    path === undefined ? toPath(key) : joinPaths([path, key]),
                );
            } else if (supported === undefined || supported[key] === undefined) {
                if (relation.joinsFromId() && relation.joinsToId()) {
                    throw new Error(
                        "unsupported: trying to create dependency to a created relation that joins both from & to an id",
                    );
                }

                const relatedSchema = relation.getRelatedSchema();
                const relatedCreatable = entities.flatMap(entity =>
                    relation.readValueAsArray(entity).filter(entity => !entityHasId(relatedSchema, entity)),
                );

                const dependencies: EntityMutationDependency[] = [];

                if (relatedCreatable.length) {
                    dependencies.push(
                        new EntityMutationDependency(
                            "create",
                            relatedSchema,
                            relatedCreatable,
                            relation.joinsToId(),
                            path === undefined ? toPath(key) : joinPaths([path, key]),
                        ),
                    );
                }

                const relatedUpdatable = entities.flatMap(entity =>
                    relation.readValueAsArray(entity).filter(entity => entityHasId(relatedSchema, entity)),
                );

                if (relatedUpdatable.length) {
                    dependencies.push(
                        new EntityMutationDependency(
                            "update",
                            relatedSchema,
                            relatedUpdatable,
                            relation.joinsToId(),
                            path === undefined ? toPath(key) : joinPaths([path, key]),
                        ),
                    );
                }

                return dependencies;
            } else {
                return [];
            }
        });

        return dependencies;
    }
}
