import {
    Criterion,
    deduplicateEntities,
    Entity,
    EntityQuery,
    EntityQueryShape,
    EntitySchema,
    EntitySelection,
    intersectCriterionWithSelection,
    isHydrated,
    mergeSelections,
    queryToShape,
    selectionToPathedRelatedSchemas,
    subtractSelection,
} from "@entity-space/elements";
import { toPathSegments } from "@entity-space/utils";
import { DescribedEntityQueryExecution } from "./described-entity-query-execution";
import { EntityQueryExecutionContext } from "./entity-query-execution-context";
import { EntityServiceContainer } from "./entity-service-container";
import { AcceptedEntityHydration } from "./hydration/accepted-entity-hydration";
import { AutoJoinEntityHydrator } from "./hydration/auto-join-entity-hydrator";
import { DescribedEntityHydration } from "./hydration/described-entity-hydration";
import { EntityHydrator } from "./hydration/entity-hydrator";
import { PathedEntityHydrator } from "./hydration/pathed-entity-hydrator";
import { RecursiveAutoJoinEntityHydrator } from "./hydration/recursive-auto-join-entity-hydrator";
import { RecursiveEntityHydrator } from "./hydration/recursive-entity-hydrator";
import { AcceptedEntitySourcing } from "./sourcing/accepted-entity-sourcing";
import { DescribedEntitySourcing } from "./sourcing/described-entity-sourcing";
import { EntitySourcingState } from "./sourcing/entity-sourcing-state.interface";

export class EntityQueryExecutor {
    constructor(services: EntityServiceContainer) {
        this.#services = services;
    }

    readonly #services: EntityServiceContainer;

    describeQuery(query: EntityQuery): DescribedEntityQueryExecution | false {
        const queryShape = queryToShape(query);
        const describedSourcing = this.describeSourcing(queryShape);

        if (describedSourcing === false) {
            return false;
        }

        const describedHydration = describedSourcing.getOpenSelection()
            ? this.describeHydration(describedSourcing)
            : undefined;

        if (describedHydration === false) {
            return false;
        }

        return new DescribedEntityQueryExecution(describedSourcing, describedHydration);
    }

    describeSourcing(queryShape: EntityQueryShape): DescribedEntitySourcing | false {
        const acceptedSourcings: AcceptedEntitySourcing[] = [];
        const sources = this.#services.getSourcesFor(queryShape.getSchema());
        let nextQueryShape: EntityQueryShape | undefined = queryShape;

        for (const source of sources) {
            const accepted = source.accept(nextQueryShape);

            if (!accepted) {
                continue;
            }

            acceptedSourcings.push(accepted);
            nextQueryShape = accepted.getReshapedShape().getOpenForCriteria();

            if (!nextQueryShape) {
                break;
            }
        }

        if (!acceptedSourcings.length) {
            return false;
        }

        return new DescribedEntitySourcing(
            queryShape.getSchema(),
            queryShape.getUnpackedSelection(),
            acceptedSourcings,
        );
    }

    describeHydration(sourcing: EntitySourcingState): DescribedEntityHydration | false {
        const schema = sourcing.getSchema();
        const targetSelection = sourcing.getTargetSelection();
        let availableSelection = sourcing.getAvailableSelection();
        let openSelection = sourcing.getOpenSelection();

        if (openSelection === undefined) {
            throw new Error("openSelection was unexpectedly undefined");
        }

        const acceptedHydrations: AcceptedEntityHydration[][] = [];
        const hydrators = [
            new RecursiveAutoJoinEntityHydrator(this, this.#services.getTracing()),
            new RecursiveEntityHydrator(this),
            ...this.#getHydratorsForSchema(schema),
            ...this.#getHydratorsForSelection(schema, targetSelection),
        ];

        while (true) {
            const currentAcceptedHydrations: AcceptedEntityHydration[] = [];

            for (const hydrator of hydrators) {
                const accepted = hydrator.accept(schema, availableSelection, openSelection);

                if (accepted === false) {
                    continue;
                }

                currentAcceptedHydrations.push(accepted);
                const nextOpenSelection = subtractSelection(openSelection, accepted.getAcceptedSelection());
                this.#services
                    .getTracing()
                    .hydratorAcceptedSelection(
                        hydrator,
                        openSelection,
                        accepted.getAcceptedSelection(),
                        nextOpenSelection,
                    );

                if (nextOpenSelection === false) {
                    throw new Error("bad hydrator implementation");
                } else if (nextOpenSelection === true) {
                    openSelection = {};
                    break;
                } else {
                    openSelection = nextOpenSelection;
                }
            }

            if (!currentAcceptedHydrations.length) {
                break;
            }

            acceptedHydrations.push(currentAcceptedHydrations);

            if (!Object.keys(openSelection).length) {
                break;
            }

            availableSelection = mergeSelections(
                currentAcceptedHydrations.map(acceptedHydration => acceptedHydration.getAcceptedSelection()),
            );
        }

        if (Object.keys(openSelection).length) {
            return false;
        }

        return new DescribedEntityHydration(acceptedHydrations);
    }

    async executeQuery<T>(query: EntityQuery, context: EntityQueryExecutionContext): Promise<T[]> {
        const description = this.describeQuery(query);

        if (description === false) {
            throw new Error(`no suitable sources found to execute query ${query}`);
        }

        return (await this.executeDescribed(description, context, query)) as T[];
    }

    async executeDescribed(
        description: DescribedEntityQueryExecution,
        context: EntityQueryExecutionContext,
        query: EntityQuery,
    ): Promise<Entity[]> {
        let entities = await this.executeDescribedSourcing(description.getDescribedSourcing(), context, query);
        const describedHydration = description.getDescribedHydration();

        if (!describedHydration) {
            return entities;
        }

        entities = await this.executeDescribedHydration(
            entities,
            description.getDescribedSourcing().getAvailableSelection(),
            describedHydration,
            context,
            query.getCriterion(),
        );

        entities = entities.filter(entity => isHydrated(entity, query.getSelection()));

        return entities;
    }

    async executeDescribedSourcing(
        sourcingDescription: DescribedEntitySourcing,
        context: EntityQueryExecutionContext,
        query: EntityQuery,
    ): Promise<Entity[]> {
        const sourcings = sourcingDescription.getAcceptedSourcings();
        const nestedEntities = await Promise.all(sourcings.map(sourcing => sourcing.sourceEntities(query, context)));
        let entities = nestedEntities.flat();

        if (sourcings.length > 1 && query.getSchema().hasId()) {
            entities = deduplicateEntities(query.getSchema(), entities);
        }

        const criterion = query.getCriterion();

        if (criterion) {
            const withoutDehydrated = intersectCriterionWithSelection(
                criterion,
                sourcingDescription.getAvailableSelection(),
            );
            entities = entities.filter(entity => withoutDehydrated.contains(entity));
        }

        if (query.getParameters() === undefined) {
            const sorter = query.getSchema().getSorter();

            if (sorter) {
                entities.sort(sorter);
            }
        }

        return entities;
    }

    async executeDescribedHydration(
        entities: Entity[],
        initialAvailableSelection: EntitySelection,
        hydrationDescription: DescribedEntityHydration,
        context: EntityQueryExecutionContext,
        criterion?: Criterion,
    ): Promise<Entity[]> {
        let availableSelection = initialAvailableSelection;

        for (const acceptedHydrations of hydrationDescription.getAcceptedHydrations()) {
            await Promise.all(
                acceptedHydrations.map(acceptedHydration => acceptedHydration.hydrateEntities(entities, context)),
            );

            availableSelection = mergeSelections([
                availableSelection,
                ...acceptedHydrations.map(acceptedHydration => acceptedHydration.getAcceptedSelection()),
            ]);

            if (criterion) {
                const withoutDehydrated = intersectCriterionWithSelection(criterion, availableSelection);
                entities = entities.filter(entity => withoutDehydrated.contains(entity));
            }
        }

        return entities;
    }

    #getHydratorsForSchema(schema: EntitySchema): EntityHydrator[] {
        const explicit = this.#services.getExplicitHydratorsFor(schema);

        // [todo] ❌ shouldn't the explicit ones come first so that user-defined hydrators take precedence?
        return [new AutoJoinEntityHydrator(this, this.#services.getTracing()), ...explicit];
    }

    #getHydratorsForSelection(schema: EntitySchema, selection: EntitySelection): EntityHydrator[] {
        return selectionToPathedRelatedSchemas(schema, selection)
            .sort(([pathA], [pathB]) => toPathSegments(pathA).length - toPathSegments(pathB).length)
            .flatMap(([path, pathedSchema]) =>
                this.#getHydratorsForSchema(pathedSchema).map(
                    hydrator => new PathedEntityHydrator(hydrator, schema, path, pathedSchema),
                ),
            );
    }
}
