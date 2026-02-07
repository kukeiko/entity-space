import {
    EntityRelationSelection,
    EntitySchema,
    EntitySelection,
    intersectRelationSelection,
    toRelationSelection,
} from "@entity-space/elements";
import { joinPaths, Path, toPath } from "@entity-space/utils";
import { isEmpty, uniq } from "lodash";
import { AcceptedEntityMutation } from "./accepted-entity-mutation";
import { EntityChanges } from "./entity-changes";
import { EntityMutationType } from "./entity-mutation";
import { EntityMutationFn, EntityMutator } from "./entity-mutator";
import { EntityChange } from "./structures/entity-change";

export class ExplicitEntityMutator extends EntityMutator {
    constructor(
        type: EntityMutationType,
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

        const [acceptedChanges, openChanges] = this.#accept(changes, this.#selection, path, true);

        if (!acceptedChanges.length) {
            return [undefined, changes];
        } else {
            const acceptedSelection = intersectRelationSelection(changes.getSelection(path), this.#selection);
            const entities = changes.getEntities(path);
            const previous = changes.getPrevious(path);

            return [
                new AcceptedEntityMutation(
                    this.#schema,
                    this.#type,
                    uniq(entities),
                    acceptedChanges,
                    this.#mutateFn,
                    acceptedSelection,
                    previous ? uniq(previous) : undefined,
                ),
                openChanges,
            ];
        }
    }

    #accept(
        changes: EntityChanges,
        supportedSelection?: EntityRelationSelection,
        path?: Path,
        isRoot?: boolean,
    ): [accepted: EntityChange[], open: EntityChanges | undefined] {
        const entities = changes.getEntities(path);
        const previous = changes.getPrevious(path);

        if (!entities.length && !previous?.length) {
            return [[], changes];
        }

        const schema = changes.getSchema(path);

        let acceptedChanges: EntityChange[] = [];
        let open: EntityChanges | undefined = changes;
        const changeSelection = changes.getSelection(path);

        if (schema.hasId()) {
            [acceptedChanges, open] = changes.subtractChanges(
                this.#type === "save" ? ["create", "update"] : [this.#type],
                schema,
                entities,
            );

            if (previous && open && (this.#type === "delete" || (!isRoot && this.#type === "save"))) {
                const [acceptedDeletionChanges, nextOpen] = open.subtractChanges(["delete"], schema, previous);
                acceptedChanges.push(...acceptedDeletionChanges);
                open = nextOpen;
            }

            if (!acceptedChanges.length) {
                return [[], open];
            }

            if (open === undefined) {
                return [acceptedChanges, undefined];
            }
        }

        let openChanges: EntityChanges | undefined = open;

        if (!isEmpty(changeSelection) && supportedSelection !== undefined) {
            const intersection = intersectRelationSelection(supportedSelection, changeSelection);
            const [relatedChanges, openAfterRelated] = this.#acceptRelated(intersection, open, path);

            acceptedChanges.push(...relatedChanges);
            openChanges = openAfterRelated;
        }

        return [acceptedChanges, openChanges];
    }

    #acceptRelated(
        intersection: EntitySelection,
        changes: EntityChanges,
        path?: Path,
    ): [EntityChange[], EntityChanges | undefined] {
        const entityChanges: EntityChange[] = [];
        let openChanges: EntityChanges | undefined = changes;
        const schema = changes.getSchema(path);

        for (const [key, selected] of Object.entries(toRelationSelection(schema, intersection))) {
            const [relatedRemovedChanges, nextOpenChanges] = this.#accept(
                openChanges,
                isEmpty(selected) ? undefined : selected,
                path === undefined ? toPath(key) : joinPaths([path, key]),
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
