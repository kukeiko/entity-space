import {
    addIdSelection,
    assignCreatedIds,
    assignEntitiesUsingIds,
    copyEntity,
    entityHasId,
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
import { EntityQueryTracing } from "../entity-query-tracing";
import { AcceptedEntityMutation } from "./accepted-entity-mutation";
import { EntityChange } from "./entity-change";
import { EntityChanges } from "./entity-changes";
import { EntityMutationType } from "./entity-mutation";
import { EntityMutationDependency } from "./entity-mutation-dependency";
import { EntityMutationFn, EntityMutator } from "./entity-mutator";
import { getCreateDependencies } from "./get-create-dependencies.fn";
import { getDeleteDependencies } from "./get-delete-dependencies.fn";

export class ExplicitEntityMutator extends EntityMutator {
    constructor(
        tracing: EntityQueryTracing,
        type: EntityMutationType,
        schema: EntitySchema,
        mutateFn: EntityMutationFn,
        selection: EntityRelationSelection,
    ) {
        super();
        this.#tracing = tracing;
        this.#type = type;
        this.#schema = schema;
        this.#mutateFn = mutateFn;
        this.#selection = selection;
    }

    readonly #tracing: EntityQueryTracing;
    readonly #type: EntityMutationType;
    readonly #schema: EntitySchema;
    readonly #mutateFn: EntityMutationFn;
    readonly #selection: EntityRelationSelection;

    override accept(
        changes: EntityChanges,
        path?: Path,
    ): [accepted: AcceptedEntityMutation | undefined, open: EntityChanges | undefined] {
        const schema = changes.getSchema(path);

        if (schema.getName() !== this.#schema.getName()) {
            return [undefined, changes];
        }

        const [accepted, open, dependencies] = this.#accept(changes, this.#selection, path, true);

        if (!accepted.length) {
            return [undefined, changes];
        } else {
            const acceptedSelection = intersectRelationSelection(changes.getSelection(path), this.#selection);

            return [
                new AcceptedEntityMutation(
                    changes.getEntities(path),
                    accepted,
                    dependencies,
                    mutation => this.mutate(mutation),
                    acceptedSelection,
                    changes.getPrevious(path),
                ),
                open,
            ];
        }
    }

    override async mutate(mutation: AcceptedEntityMutation): Promise<void> {
        if (this.#type === "create") {
            for (const dependency of mutation.getOutboundDependencies()) {
                this.#tracing.writingDependency(dependency.getType(), dependency.getPath(), true);
                dependency.writeIds(this.#schema, mutation.getContainedRootEntities());
            }

            const creatableSelection = getSelection(this.#schema, mutation.getSelection(), isCreatableEntityProperty);

            const map = new Map(
                mutation.getContainedRootEntities().map(entity => {
                    const copy = copyEntity(
                        this.#schema,
                        entity,
                        creatableSelection,
                        (relation, entity) =>
                            relation.isEmbedded() ||
                            mutation.getChanges().some(change => change.getEntity() === entity),
                    );

                    return [copy, entity];
                }),
            );

            const copies = Array.from(map.keys());
            this.#tracing.dispatchedMutation(this.#schema, this.#type, copies);
            const created = await this.#mutateFn(copies, mutation.getSelection() ?? {});
            assignCreatedIds(this.#schema, mutation.getSelection() ?? {}, mutation.getContainedRootEntities(), created);
            const selection = getSelection(this.#schema, mutation.getSelection() ?? {});
            const originals = Array.from(map.values());
            assignEntitiesUsingIds(this.#schema, selection, originals, created);

            for (const dependency of mutation.getInboundDependencies()) {
                this.#tracing.writingDependency(dependency.getType(), dependency.getPath(), false);
                dependency.writeIds(this.#schema, originals);
            }
        } else if (this.#type === "update") {
            for (const dependency of mutation.getOutboundDependencies()) {
                this.#tracing.writingDependency(dependency.getType(), dependency.getPath(), true);
                dependency.writeIds(this.#schema, mutation.getContainedRootEntities());
            }

            const updatableSelection = addIdSelection(
                this.#schema,
                getSelection(this.#schema, mutation.getSelection(), isUpdatableEntityProperty),
            );

            const map = new Map(
                mutation.getContainedRootEntities().map(entity => {
                    const copy = copyEntity(
                        this.#schema,
                        entity,
                        updatableSelection,
                        (relation, entity) =>
                            relation.isEmbedded() ||
                            mutation.getChanges().some(change => change.getEntity() === entity),
                    );

                    return [copy, entity];
                }),
            );

            const copies = Array.from(map.keys());
            this.#tracing.dispatchedMutation(this.#schema, this.#type, copies);
            const updated = await this.#mutateFn(copies, mutation.getSelection() ?? {});
            const originals = Array.from(map.values());
            const selection = getSelection(this.#schema, mutation.getSelection() ?? {});
            assignEntitiesUsingIds(this.#schema, selection, originals, updated);

            for (const dependency of mutation.getInboundDependencies()) {
                this.#tracing.writingDependency(dependency.getType(), dependency.getPath(), false);
                dependency.writeIds(this.#schema, originals);
            }
        } else if (this.#type === "delete") {
            // [todo] ❌ we need splice the original entities if the user just wants do "delete" (i.e. there is no previous),
            // so that in case of an error (service temporarily unavailable), and some entities have already been deleted successfully,
            // entity-space doesn't try to delete those again.

            const deletableSelection = getSelection(this.#schema, mutation.getSelection());

            const map = new Map(
                mutation.getPreviousContainedRootEntities().map(entity => {
                    const copy = copyEntity(
                        this.#schema,
                        entity,
                        deletableSelection,
                        (relation, entity) =>
                            relation.isEmbedded() ||
                            mutation.getChanges().some(change => change.getEntity() === entity),
                    );

                    return [copy, entity];
                }),
            );

            const copies = Array.from(map.keys());
            this.#tracing.dispatchedMutation(this.#schema, this.#type, copies);
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

                change.removeEntity();
            }
        } else if (this.#type === "save") {
            for (const dependency of mutation.getOutboundDependencies()) {
                this.#tracing.writingDependency(dependency.getType(), dependency.getPath(), true);
                dependency.writeIds(this.#schema, mutation.getContainedRootEntities());
            }

            const savableSelection = addIdSelection(
                this.#schema,
                getSelection(this.#schema, mutation.getSelection(), isSavableEntityProperty),
            );

            const map = new Map(
                mutation.getContainedRootEntities().map(entity => {
                    const copy = copyEntity(this.#schema, entity, savableSelection, undefined, (property, entity) => {
                        if (property.getSchema().isIdProperty(property.getName())) {
                            return true;
                        }

                        return entityHasId(property.getSchema(), entity)
                            ? isUpdatableEntityProperty(property)
                            : isCreatableEntityProperty(property);
                    });

                    return [copy, entity];
                }),
            );

            const copies = Array.from(map.keys());
            this.#tracing.dispatchedMutation(this.#schema, this.#type, copies);
            const saved = await this.#mutateFn(copies, mutation.getSelection() ?? {});
            assignCreatedIds(this.#schema, mutation.getSelection() ?? {}, mutation.getContainedRootEntities(), saved);
            const selection = getSelection(this.#schema, mutation.getSelection() ?? {});
            const originals = Array.from(map.values());
            assignEntitiesUsingIds(this.#schema, selection, originals, saved);

            for (const dependency of mutation.getInboundDependencies()) {
                this.#tracing.writingDependency(dependency.getType(), dependency.getPath(), false);
                dependency.writeIds(this.#schema, originals);
            }

            // [todo] ❓"save" also handles delete, so we need to remove deleted entities as well somehow
        }
    }

    #accept(
        changes: EntityChanges,
        supportedSelection?: EntityRelationSelection,
        path?: Path,
        isRoot?: boolean,
    ): [accepted: EntityChange[], open: EntityChanges | undefined, dependencies: EntityMutationDependency[]] {
        const entities = changes.getEntities(path);
        const schema = changes.getSchema(path);
        let [acceptedChanges, open] = schema.hasId()
            ? changes.subtractChanges(this.#type === "save" ? ["create", "update"] : [this.#type], schema, entities)
            : [[], changes];

        const previous = changes.getPrevious(path);

        if (!entities.length && !previous?.length) {
            return [[], changes, []];
        }

        let dependencies: EntityMutationDependency[] = [];
        const changeSelection = changes.getSelection(path);

        if (previous && open && (this.#type === "delete" || (!isRoot && this.#type === "save"))) {
            const [acceptedDeletionChanges, nextOpen] = schema.hasId()
                ? open.subtractChanges(["delete"], schema, previous)
                : [[], open];
            acceptedChanges.push(...acceptedDeletionChanges);
            open = nextOpen;

            if (acceptedDeletionChanges.length) {
                dependencies.push(
                    ...getDeleteDependencies(
                        schema,
                        acceptedDeletionChanges.map(change => change.getEntity()),
                        changeSelection,
                        supportedSelection,
                    ),
                );
            }
        }

        if (!acceptedChanges.length && schema.hasId()) {
            return [[], open, []];
        }

        if (!isEmpty(changeSelection)) {
            const createChanges = acceptedChanges.filter(
                change => change.getType() === "create" || change.getType() === "update",
            );

            if (createChanges.length) {
                dependencies.push(
                    ...getCreateDependencies(
                        schema,
                        createChanges.map(change => change.getEntity()),
                        changeSelection,
                        supportedSelection,
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
                intersection,
                open,
                path,
            );

            acceptedChanges.push(...relatedChanges);
            dependencies.push(...relatedDependencies);
            openChanges = openAfterRelated;
        }

        return [acceptedChanges, openChanges, dependencies];
    }

    #acceptRelated(
        intersection: EntitySelection,
        changes: EntityChanges,
        path?: Path,
    ): [EntityChange[], EntityMutationDependency[], EntityChanges | undefined] {
        const entityChanges: EntityChange[] = [];
        const dependencies: EntityMutationDependency[] = [];
        let openChanges: EntityChanges | undefined = changes;
        const schema = changes.getSchema(path);

        for (const [key, selected] of Object.entries(toRelationSelection(schema, intersection))) {
            const [relatedRemovedChanges, nextOpenChanges, relatedDependencies] = this.#accept(
                openChanges,
                isEmpty(selected) ? undefined : selected,
                path === undefined ? toPath(key) : joinPaths([path, key]),
            );

            entityChanges.push(...relatedRemovedChanges);
            dependencies.push(...relatedDependencies);
            openChanges = nextOpenChanges;

            if (openChanges === undefined) {
                break;
            }
        }

        return [entityChanges, dependencies, openChanges];
    }
}
