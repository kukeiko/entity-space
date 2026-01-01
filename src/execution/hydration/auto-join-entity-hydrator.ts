import {
    entitiesToCriterion,
    EntityQuery,
    EntityQueryShape,
    EntityRelationProperty,
    EntitySchema,
    EntitySelection,
    isSelectionSubsetOf,
    joinEntities,
    mergeSelections,
    relationToCriterionShape,
} from "@entity-space/elements";
import { isNot, writePath } from "@entity-space/utils";
import { EntityServiceContainer } from "../entity-service-container";
import { describeSourcing } from "../sourcing/functions/describe-sourcing.fn";
import { executeDescribedSourcing } from "../sourcing/functions/execute-described-sourcing.fn";
import { AcceptedEntityHydration, HydrateEntitiesFnInternal } from "./accepted-entity-hydration";
import { EntityHydrator } from "./entity-hydrator";
import { mergeAcceptedEntityHydrations } from "./functions/merge-accepted-entity-hydrations.fn";

export class AutoJoinEntityHydrator extends EntityHydrator {
    constructor(services: EntityServiceContainer) {
        super();
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

    override expand(schema: EntitySchema, openSelection: EntitySelection): false | EntitySelection {
        const openRelations = this.#getOpenEntityProperties(schema, openSelection);

        if (!openRelations.length) {
            return false;
        }

        const requiredSelection = mergeSelections(
            openRelations.map(relation => this.#getRequiredSelectionToHydrateRelation(relation)),
        );

        return requiredSelection;
    }

    override accept(
        schema: EntitySchema,
        availableSelection: EntitySelection,
        openSelection: EntitySelection,
    ): AcceptedEntityHydration | false {
        const openEntityProperties = this.#getOpenEntityProperties(schema, openSelection, availableSelection);

        const acceptedHydrations = openEntityProperties
            .map(relation =>
                this.#toAcceptedEntityHydration(
                    relation,
                    availableSelection,
                    openSelection[relation.getName()] as EntitySelection,
                ),
            )
            .filter(isNot(false));

        if (!acceptedHydrations.length) {
            return false;
        }

        return mergeAcceptedEntityHydrations(acceptedHydrations);
    }

    #getOpenEntityProperties(
        schema: EntitySchema,
        openSelection: EntitySelection,
        availableSelection?: EntitySelection,
    ): EntityRelationProperty[] {
        const open: EntityRelationProperty[] = [];

        for (const [key, value] of Object.entries(openSelection)) {
            if (
                value === true ||
                (availableSelection !== undefined && availableSelection[key]) ||
                !schema.isRelation(key) ||
                !schema.getRelation(key).isJoined()
            ) {
                continue;
            }

            open.push(schema.getRelation(key));
        }

        return open;
    }

    #toAcceptedEntityHydration(
        relation: EntityRelationProperty,
        availableSelection: EntitySelection,
        openSelection: EntitySelection,
    ): AcceptedEntityHydration | false {
        const requiredSelection = this.#getRequiredSelectionToHydrateRelation(relation);

        if (!isSelectionSubsetOf(requiredSelection, availableSelection)) {
            return false;
        }

        const relationQueryShape = new EntityQueryShape(
            relation.getRelatedSchema(),
            openSelection,
            relationToCriterionShape(relation),
        );

        const description = describeSourcing(this.#services, relationQueryShape);

        if (!description) {
            return false;
        }

        const hydrate: HydrateEntitiesFnInternal = async ({ entities, selection, context }) => {
            if (!entities.length) {
                return;
            }

            const criteria = entitiesToCriterion(entities, relation.getJoinFrom(), relation.getJoinTo());

            if (criteria === undefined) {
                // to set default join values
                joinEntities(entities, [], relation);
                return;
            }

            const query = new EntityQuery(
                relation.getRelatedSchema(),
                selection[relation.getName()] as EntitySelection,
                criteria,
            );
            this.#services.getTracing().hydrationQuerySpawned(query);
            const relatedEntities = await executeDescribedSourcing(description, context, query);
            joinEntities(entities, relatedEntities, relation);
        };

        const acceptedSelection: EntitySelection = {
            [relation.getName()]: description.getAvailableSelection(),
        };

        return new AcceptedEntityHydration(acceptedSelection, requiredSelection, hydrate);
    }

    #getRequiredSelectionToHydrateRelation(relation: EntityRelationProperty): EntitySelection {
        const requiredSelection: EntitySelection = {};

        for (const path of relation.getJoinFrom()) {
            writePath(path, requiredSelection, true);
        }

        return requiredSelection;
    }

    override toString(): string {
        // to make debugging easier. should not be relied upon as actual logic
        return `AutoJoin`;
    }
}
