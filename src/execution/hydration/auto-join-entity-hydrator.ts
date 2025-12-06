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
import { EntityQueryExecutor } from "../entity-query-executor";
import { EntityQueryTracing } from "../entity-query-tracing";
import { AcceptedEntityHydration, HydrateEntitiesFunction } from "./accepted-entity-hydration";
import { EntityHydrator } from "./entity-hydrator";
import { mergeAcceptedEntityHydrations } from "./functions/merge-accepted-entity-hydrations.fn";

export class AutoJoinEntityHydrator extends EntityHydrator {
    constructor(queryExecutor: EntityQueryExecutor, tracing: EntityQueryTracing) {
        super();
        this.#queryExecutor = queryExecutor;
        this.#tracing = tracing;
    }

    readonly #queryExecutor: EntityQueryExecutor;
    readonly #tracing: EntityQueryTracing;

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

        const description = this.#queryExecutor.describeSourcing(relationQueryShape);

        if (!description) {
            return false;
        }

        const hydrate: HydrateEntitiesFunction = async (entities, selection, context) => {
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
            this.#tracing.hydrationQuerySpawned(query);
            const relatedEntities = await this.#queryExecutor.executeDescribedSourcing(description, context, query);
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
