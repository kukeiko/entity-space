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
import { AcceptedEntityHydration, HydrateEntitiesFunction } from "./accepted-entity-hydration";
import { EntityHydrator } from "./entity-hydrator";

export class AutoJoinableEntityHydrator extends EntityHydrator {
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
        const openEntityProperties = this.#getOpenEntityProperties(schema, availableSelection, openSelection);

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

        return this.#mergeAcceptedEntityHydrations(acceptedHydrations);
    }

    #getOpenEntityProperties(
        schema: EntitySchema,
        availableSelection: EntitySelection,
        openSelection: EntitySelection,
    ): EntityRelationProperty[] {
        const open: EntityRelationProperty[] = [];

        for (const [key, value] of Object.entries(openSelection)) {
            if (
                value === true ||
                availableSelection[key] ||
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
        selection: EntitySelection,
    ): AcceptedEntityHydration | false {
        const requiredSelection: EntitySelection = {};

        for (const path of relation.getJoinFrom()) {
            writePath(path, requiredSelection, true);
        }

        if (!isSelectionSubsetOf(requiredSelection, availableSelection)) {
            return false;
        }

        const relationQueryShape = new EntityQueryShape(
            relation.getRelatedSchema(),
            selection,
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
            const query = new EntityQuery(
                relation.getRelatedSchema(),
                selection[relation.getName()] as EntitySelection,
                criteria,
            );
            const relatedEntities = await this.#queryExecutor.executeDescribedSourcing(description, context, query);
            joinEntities(entities, relatedEntities, relation);
        };

        const acceptedSelection: EntitySelection = {
            [relation.getName()]: description.getAvailableSelection(),
        };

        return new AcceptedEntityHydration(acceptedSelection, requiredSelection, hydrate);
    }

    #mergeAcceptedEntityHydrations(hydrations: AcceptedEntityHydration[]): AcceptedEntityHydration {
        const acceptedSelection = mergeSelections(hydrations.map(hydration => hydration.getAcceptedSelection()));
        const requiredSelection = mergeSelections(hydrations.map(hydration => hydration.getRequiredSelection()));

        return new AcceptedEntityHydration(acceptedSelection, requiredSelection, async (entities, _, context) => {
            await Promise.all(hydrations.map(hydrator => hydrator.hydrateEntities(entities, context)));
        });
    }
}
