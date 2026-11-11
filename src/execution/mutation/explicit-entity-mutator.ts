import {
    Entity,
    EntityRelationSelection,
    EntitySchema,
    EntitySelection,
    intersectRelationSelection,
    toRelationSelection,
} from "@entity-space/elements";
import { joinPaths, Path, readPath, toPathSegments } from "@entity-space/utils";
import { isEmpty, uniq } from "lodash";
import { EntityMutationFn, EntityMutator, EntityMutatorType } from "./entity-mutator";
import { subtractChanges } from "./functions/subtract-changes.fn";
import { AcceptedEntityMutation } from "./structures/accepted-entity-mutation";
import { EntityChange, EntityChangeType } from "./structures/entity-change";
import { EntityChanges } from "./structures/entity-changes";

export class ExplicitEntityMutator extends EntityMutator {
    constructor(
        type: EntityMutatorType,
        schema: EntitySchema,
        mutateFn: EntityMutationFn,
        selection: EntityRelationSelection,
    ) {
        super();
        this.#type = type;
        this.#schema = schema;
        this.#mutateFn = mutateFn;
        this.#selection = selection;
    }

    readonly #type: EntityMutatorType;
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

        const [acceptedChanges, openChanges] = this.#accept(changes, this.#selection, path, true);

        if (!acceptedChanges.length) {
            return [undefined, changes];
        }

        const acceptedSelection = intersectRelationSelection(changes.getSelection(path), this.#selection);
        const entities = changes.getEntities(path);
        const previous = changes.getPrevious(path);

        const acceptedMutation = new AcceptedEntityMutation(
            this.#schema,
            this.#type,
            uniq(entities),
            acceptedChanges,
            this.#mutateFn,
            acceptedSelection,
            previous ? uniq(previous) : undefined,
        );

        return [acceptedMutation, openChanges];
    }

    #accept(
        changes: EntityChanges,
        supportedSelection?: EntityRelationSelection,
        path?: Path,
        isRoot?: boolean,
        scope?: PreviousScope,
    ): [accepted: EntityChange[], open: EntityChanges | undefined] {
        const entities = changes.getEntities(path);
        const previous = scope
            ? readPath<Entity>(relativePath(scope.path, path), scope.roots)
            : changes.getPrevious(path);

        if (!entities.length && !previous?.length) {
            return [[], changes];
        }

        const schema = changes.getSchema(path);
        const changeSelection = changes.getSelection(path);
        let acceptedChanges: EntityChange[] = [];
        let open: EntityChanges | undefined = changes;

        if (schema.hasId()) {
            [acceptedChanges, open] = subtractChanges(
                changes,
                this.#type === EntityMutatorType.Save
                    ? [EntityChangeType.Create, EntityChangeType.Update]
                    : [this.#type],
                entities,
            );

            if (
                previous &&
                open &&
                (this.#type === EntityMutatorType.Delete || (!isRoot && this.#type === EntityMutatorType.Save))
            ) {
                const [acceptedDeletionChanges, nextOpen] = subtractChanges(open, [EntityMutatorType.Delete], previous);
                acceptedChanges.push(...acceptedDeletionChanges);
                open = nextOpen;
            }

            if (!acceptedChanges.length || open === undefined) {
                return [acceptedChanges, open];
            }

            if (isRoot) {
                scope = { path, roots: this.#getAcceptedPrevious(schema, acceptedChanges, changes.getPrevious(path)) };
            }
        }

        let openChanges: EntityChanges | undefined = open;

        if (!isEmpty(changeSelection) && supportedSelection !== undefined) {
            const intersection = intersectRelationSelection(supportedSelection, changeSelection);
            const [relatedChanges, openAfterRelated] = this.#acceptRelated(intersection, open, path, scope);
            acceptedChanges.push(...relatedChanges);
            openChanges = openAfterRelated;
        }

        return [acceptedChanges, openChanges];
    }

    /**
     * The previous entities of the accepted root changes, so that related deletions are only accepted for entities
     * that belong to roots this mutator is dispatched with.
     */
    #getAcceptedPrevious(schema: EntitySchema, accepted: EntityChange[], previous: readonly Entity[]): Entity[] {
        const toKey = (entity: Entity) => JSON.stringify(schema.getIdPaths().map(path => readPath(path, entity)));
        const acceptedKeys = new Set(accepted.map(change => toKey(change.getEntity())));

        return previous.filter(entity => acceptedKeys.has(toKey(entity)));
    }

    #acceptRelated(
        intersection: EntitySelection,
        changes: EntityChanges,
        path?: Path,
        scope?: PreviousScope,
    ): [EntityChange[], EntityChanges | undefined] {
        const entityChanges: EntityChange[] = [];
        const schema = changes.getSchema(path);
        let openChanges: EntityChanges | undefined = changes;

        for (const [key, selected] of Object.entries(toRelationSelection(schema, intersection))) {
            const [relatedRemovedChanges, nextOpenChanges] = this.#accept(
                openChanges,
                isEmpty(selected) ? undefined : selected,
                joinPaths([path, key]),
                false,
                scope,
            );

            entityChanges.push(...relatedRemovedChanges);
            openChanges = nextOpenChanges;

            if (openChanges === undefined) {
                break;
            }
        }

        return [entityChanges, openChanges];
    }
}

interface PreviousScope {
    path?: Path;
    roots: readonly Entity[];
}

function relativePath(from: Path | undefined, to: Path | undefined): Path | undefined {
    const segments = toPathSegments(to!).slice(from ? toPathSegments(from).length : 0);
    return segments.length ? joinPaths(segments) : undefined;
}
