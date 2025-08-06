import {
    cloneSelection,
    Entity,
    EntitySchema,
    EntitySelection,
    mergeSelection,
    mergeSelections,
} from "@entity-space/elements";
import { joinPaths, Path, readPath, toPath, writePath } from "@entity-space/utils";
import { EntityQueryExecutor } from "../entity-query-executor";
import { AcceptedEntityHydration } from "./accepted-entity-hydration";
import { EntityHydrator } from "./entity-hydrator";

function getFirstRecursiveSelection(
    selection: EntitySelection,
    path: string[] = [],
    visited: Set<EntitySelection>,
): [Path | undefined, EntitySelection] | undefined {
    visited.add(selection);

    for (const [key, value] of Object.entries(selection)) {
        if (value === selection) {
            return [path.length ? joinPaths(path) : undefined, selection];
        } else if (value !== true && !visited.has(value)) {
            const candidate = getFirstRecursiveSelection(value, [...path, key], visited);

            if (candidate !== undefined) {
                return candidate;
            }
        }
    }

    return undefined;
}

export class RecursiveEntityHydrator extends EntityHydrator {
    constructor(queryExecutor: EntityQueryExecutor) {
        super();
        this.#queryExecutor = queryExecutor;
    }

    readonly #queryExecutor: EntityQueryExecutor;

    override accept(
        schema: EntitySchema,
        availableSelection: EntitySelection,
        openSelection: EntitySelection,
    ): AcceptedEntityHydration | false {
        // [todo] ❌ we have a test for only 1x recursive selection, need tests for selections where:
        // a) selection has multiple homogeneous recursive entries (think: { branches: { children: *, parent: * } })
        // b) selection has multiple heterogeneous recursive entries (i.e. different schemas)
        // c) case b) but on different levels
        const firstRecursiveSelection = getFirstRecursiveSelection(openSelection, undefined, new Set());

        if (firstRecursiveSelection === undefined) {
            return false;
        }

        const [path, cutOpenSelection] = firstRecursiveSelection;
        const cutAvailableSelection = path
            ? (readPath<EntitySelection>(path, availableSelection) ?? {})
            : availableSelection;
        const relatedSchema = path ? schema.getRelation(path).getRelatedSchema() : schema;

        const recursiveKeys: string[] = [];

        for (const [key, value] of Object.entries(cutOpenSelection)) {
            if (value === true) {
                continue;
            }

            if (value === cutOpenSelection) {
                recursiveKeys.push(key);
            }
        }

        if (!recursiveKeys.length) {
            return false;
        }

        const nonRecursiveOpenSelection = cloneSelection(cutOpenSelection);

        for (const key of recursiveKeys) {
            delete nonRecursiveOpenSelection[key];
        }

        const describedHydration = this.#queryExecutor.describeHydration({
            getSchema() {
                return relatedSchema;
            },
            getAvailableSelection() {
                return cutAvailableSelection;
            },
            getOpenSelection() {
                return nonRecursiveOpenSelection;
            },
            getTargetSelection() {
                return mergeSelection(cutAvailableSelection, nonRecursiveOpenSelection);
            },
        });

        if (describedHydration === false) {
            return false;
        }

        const accepted = describedHydration.getAcceptedSelection();

        for (const key of recursiveKeys) {
            accepted[key] = accepted;
        }

        const required = mergeSelections(
            describedHydration
                .getAcceptedHydrations()
                .flatMap(acceptedHydrations =>
                    acceptedHydrations.map(acceptedHydration => acceptedHydration.getRequiredSelection()),
                ),
        );

        for (const key of recursiveKeys) {
            required[key] = accepted;
        }

        const pathedAcceptedSelection = path ? writePath(path, {} as EntitySelection, accepted) : accepted;
        const pathedRequiredSelection = path ? writePath(path, {} as EntitySelection, required) : required;

        return new AcceptedEntityHydration(
            pathedAcceptedSelection,
            pathedRequiredSelection,
            async (entities, _, context) => {
                entities = path ? readPath(path, entities) : entities;

                await this.#queryExecutor.executeDescribedHydration(
                    entities,
                    availableSelection,
                    describedHydration,
                    context,
                );

                for (const key of recursiveKeys) {
                    let recursiveEntities = readPath<Entity>(toPath(key), entities);

                    while (recursiveEntities.length) {
                        await this.#queryExecutor.executeDescribedHydration(
                            recursiveEntities,
                            availableSelection,
                            describedHydration,
                            context,
                        );

                        recursiveEntities = readPath(toPath(key), recursiveEntities);
                    }
                }
            },
        );
    }

    override toString(): string {
        // to make debugging easier. should not be relied upon as actual logic
        return `Recursive`;
    }
}
