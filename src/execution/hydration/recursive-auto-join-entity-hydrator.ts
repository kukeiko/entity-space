import {
    entitiesToCriterion,
    EntityQuery,
    EntityQueryShape,
    EntityRelationProperty,
    EntitySchema,
    EntitySelection,
    isSelectionSubsetOf,
    joinEntities,
    relationToCriterionShape,
} from "@entity-space/elements";
import { isNot, joinPaths, Path, readPath, toPath, writePath } from "@entity-space/utils";
import { EntityServiceContainer } from "../entity-service-container";
import { describeSourcing } from "../sourcing/functions/describe-sourcing.fn";
import { executeDescribedSourcing } from "../sourcing/functions/execute-described-sourcing.fn";
import { AcceptedEntityHydration, HydrateEntitiesFnInternal } from "./accepted-entity-hydration";
import { EntityHydrator } from "./entity-hydrator";
import { getOpenEntityProperties } from "./functions/get-open-entity-properties.fn";
import { mergeAcceptedEntityHydrations } from "./functions/merge-accepted-entity-hydrations.fn";
import { PathedAcceptedEntityHydration } from "./pathed-accepted-entity-hydration";

function containsRecursiveSelection(selection: EntitySelection): boolean {
    return Object.values(selection).some(value => value === selection);
}

function omitRecursiveJoinSelections(schema: EntitySchema, selection: EntitySelection): EntitySelection {
    const omitted: EntitySelection = {};

    for (const [key, value] of Object.entries(selection)) {
        if (value === selection && schema.getRelation(key).isJoined()) {
            continue;
        }

        omitted[key] = value;
    }

    return omitted;
}

function getFirstSelectionContainingRecursiveOpenEntityProperty(
    schema: EntitySchema,
    availableSelection: EntitySelection,
    openSelection: EntitySelection,
    visited: Set<EntitySelection>,
    path?: Path,
): [Path | undefined, EntitySelection, EntitySelection] | undefined {
    visited.add(openSelection);

    for (const [key, value] of Object.entries(openSelection)) {
        if (value === true || !schema.isRelation(key)) {
            continue;
        } else if (
            schema.getRelation(key).isJoined() &&
            containsRecursiveSelection(value) &&
            !availableSelection[key]
        ) {
            return [path, openSelection, availableSelection];
        } else if (!visited.has(value)) {
            const nextPath = path ? joinPaths([path, key]) : toPath(key);

            const candidate = getFirstSelectionContainingRecursiveOpenEntityProperty(
                schema,
                (availableSelection[key] ?? {}) as EntitySelection,
                value,
                visited,
                nextPath,
            );

            if (candidate !== undefined) {
                return candidate;
            }
        }
    }

    return undefined;
}

export class RecursiveAutoJoinEntityHydrator extends EntityHydrator {
    constructor(services: EntityServiceContainer) {
        super();
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

    override expand(schema: EntitySchema, openSelection: EntitySelection): false | EntitySelection {
        // [todo] ❌ implement
        return false;
    }

    override accept(
        schema: EntitySchema,
        availableSelection: EntitySelection,
        openSelection: EntitySelection,
    ): AcceptedEntityHydration | false {
        const candidate = getFirstSelectionContainingRecursiveOpenEntityProperty(
            schema,
            availableSelection,
            openSelection,
            new Set(),
        );

        if (candidate === undefined) {
            return false;
        }

        const [path, cutOpenSelection, cutAvailableSelection] = candidate;
        const openEntityProperties = getOpenEntityProperties(schema, cutAvailableSelection, cutOpenSelection);

        const acceptedHydrations = openEntityProperties
            .map(relation =>
                this.#toAcceptedEntityHydration(
                    relation,
                    cutAvailableSelection,
                    cutOpenSelection[relation.getName()] as EntitySelection,
                    path,
                ),
            )
            .filter(isNot(false));

        if (!acceptedHydrations.length) {
            return false;
        }

        return mergeAcceptedEntityHydrations(acceptedHydrations);
    }

    // [todo] ❌ copied & adapted from AutoJoinEntityHydrator
    #toAcceptedEntityHydration(
        relation: EntityRelationProperty,
        availableSelection: EntitySelection,
        openSelection: EntitySelection,
        path?: Path,
    ): AcceptedEntityHydration | false {
        const requiredSelection: EntitySelection = {};

        for (const path of relation.getJoinFrom()) {
            writePath(path, requiredSelection, true);
        }

        if (!isSelectionSubsetOf(requiredSelection, availableSelection)) {
            return false;
        }

        const nonRecursiveOpenSelection = omitRecursiveJoinSelections(relation.getRelatedSchema(), openSelection);

        const relationQueryShape = new EntityQueryShape(
            relation.getRelatedSchema(),
            nonRecursiveOpenSelection,
            relationToCriterionShape(relation),
        );

        const description = describeSourcing(this.#services, relationQueryShape);

        if (!description) {
            return false;
        }

        const hydrate: HydrateEntitiesFnInternal = async ({ entities, selection, context }) => {
            while (entities.length) {
                const criteria = entitiesToCriterion(entities, relation.getJoinFrom(), relation.getJoinTo());

                if (criteria === undefined) {
                    // to set default join values
                    joinEntities(entities, [], relation);
                    break;
                }

                const query = new EntityQuery(
                    relation.getRelatedSchema(),
                    selection[relation.getName()] as EntitySelection,
                    criteria,
                );

                this.#services.getTracing().hydrationQuerySpawned(query);
                const relatedEntities = await executeDescribedSourcing(description, context, query);
                joinEntities(entities, relatedEntities, relation);

                entities = readPath(toPath(relation.getName()), entities);
            }
        };

        const acceptedSelection: EntitySelection = {
            [relation.getName()]: description.getAvailableSelection(),
        };
        (acceptedSelection[relation.getName()] as EntitySelection)[relation.getName()] =
            acceptedSelection[relation.getName()];

        return new PathedAcceptedEntityHydration(path, acceptedSelection, requiredSelection, hydrate);
    }

    override toString(): string {
        // to make debugging easier. should not be relied upon as actual logic
        return `RecursiveAutoJoin`;
    }
}
