import { Entity, ExpansionValue } from "@entity-space/common";
import { and, fromDeepBag, NamedCriteria } from "@entity-space/criteria";
import { isNotFalse, writePath } from "@entity-space/utils";
import {
    defaultIfEmpty,
    defer,
    EMPTY,
    filter,
    map,
    merge,
    of,
    raceWith,
    shareReplay,
    switchMap,
    takeLast,
    tap,
} from "rxjs";
import { EntitySet } from "../entity/data-structures/entity-set";
import { createCriterionFromEntities } from "../entity/functions/create-criterion-from-entities.fn";
import { createDefaultExpansion } from "../entity/functions/create-default-expansion.fn";
import { IEntityStore } from "../entity/i-entity-store";
import { InMemoryEntityDatabase } from "../entity/in-memory-entity-database";
import { Expansion } from "../expansion/expansion";
import { mergeQueries } from "../query/merge-queries.fn";
import { Query } from "../query/query";
import { reduceQueries, reduceQueries_v2 } from "../query/reduce-queries.fn";
import { IEntitySchema, IEntitySchemaRelation } from "../schema/schema.interface";
import { EntityHydrationQuery } from "./entity-hydration-query";
import { IEntityHydrator } from "./i-entity-hydrator";
import { IEntitySource } from "./i-entity-source";
import { QueryExecution } from "./query-execution";
import { QueryStream } from "./query-stream";
import { QueryStreamPacket } from "./query-stream-packet";

export class EntitySourceGateway implements IEntitySource, IEntityStore, IEntityHydrator {
    constructor(sources: IEntitySource[] = []) {
        this.sources = sources.slice();
    }

    private sources: IEntitySource[];
    private readonly stores = new Map<string, IEntityStore>();

    addStore(schema: IEntitySchema, store: IEntityStore): void {
        this.stores.set(schema.getId(), store);
    }

    query$<T extends Entity = Entity>(queries: Query[], database: InMemoryEntityDatabase): QueryStream<T> {
        return defer(() => {
            const execution = new QueryExecution({
                sources: this.sources.slice().reverse(),
                targets: queries,
                database,
            });

            return merge(this.startNextSource$<T>(execution));
        });
    }

    hydrate$<T extends Entity>(
        hydrationQuery: EntityHydrationQuery<T>,
        database: InMemoryEntityDatabase
    ): QueryStream<T> {
        const execution = new QueryExecution({
            sources: this.sources.slice().reverse(),
            targets: [hydrationQuery.getQuery()],
            database,
        });

        return this.startHydration$<T>(hydrationQuery, execution);
    }

    private startNextSource$<T>(execution: QueryExecution): QueryStream<T> {
        const source = execution.popSource();

        if (!source) {
            const accepted = execution.getAccepted();

            if (!accepted.length) {
                return of(new QueryStreamPacket<T>({ rejected: execution.getTargets() }));
            }

            const rejected = reduceQueries_v2(execution.getTargets(), accepted);

            if (!rejected) {
                return of(new QueryStreamPacket<T>({ rejected: execution.getTargets() }));
            }

            if (!rejected.length) {
                return EMPTY;
            }

            const hydrationQueries = this.toHydrationQueries<T>(
                execution.getAccepted(),
                rejected,
                execution.getDatabase()
            );

            return merge(...hydrationQueries.map(hq => this.startHydration$(hq, execution))).pipe(
                tap(packet => {
                    // [todo] using "this" because I just don't have anything available here
                    execution.mergePacket(packet, this);
                })
            );
        }

        const sourcePackets$ = source.query$<T>(execution.getOpenTargets(), execution.getDatabase()).pipe(
            tap(packet => {
                execution.mergePacket(packet, source);
            }),
            defaultIfEmpty(new QueryStreamPacket<T>({ rejected: execution.getOpenTargets() })),
            shareReplay()
        );

        const sourceIsFullyPlanned$ = sourcePackets$.pipe(filter(() => execution.isSourceFullyPlanned(source)));
        const sourceEnded$ = sourcePackets$.pipe(takeLast(1));

        // [todo] i think we should be able to just wait for sourceIsFullyPlanned$,
        // which would require emitting packets with rejected queries that have not been properly rejected by the EntitySource
        const startNext$ = sourceEnded$.pipe(
            raceWith(sourceIsFullyPlanned$),
            switchMap(() => merge(this.startNextSource$<T>(execution)))
        );

        const withoutRejected$ = sourcePackets$.pipe(
            map(packet => packet.withoutRejected()),
            filter(packet => !packet.isEmpty())
        );

        return merge(withoutRejected$, startNext$);
    }

    private startHydration$<T>(hydrationQuery: EntityHydrationQuery<T>, execution: QueryExecution): QueryStream<T> {
        const expansion = hydrationQuery.getQuery().getExpansionValue();
        const targets = Object.entries(expansion)
            .map(([key, value]) => this.toHydrateRelationQuery(hydrationQuery.getEntitySet(), key, value))
            .filter(isNotFalse);

        if (!targets.length) {
            return EMPTY;
        }

        return merge(
            ...targets.map(([query, relation]) =>
                this.startRelationHydration$(hydrationQuery, query, relation, execution.getDatabase())
            )
        );
    }

    private startRelationHydration$<T>(
        hydrationQuery: EntityHydrationQuery<T>,
        relationQuery: Query,
        relation: IEntitySchemaRelation,
        database: InMemoryEntityDatabase
    ): QueryStream<T> {
        const execution = new QueryExecution({
            sources: this.sources.slice().reverse(),
            database,
            targets: [relationQuery],
        });

        return this.startNextSource$(execution).pipe(
            defaultIfEmpty(new QueryStreamPacket<T>({ rejected: [relationQuery] })),
            takeLast(1),
            map(() => {
                const accepted = execution.getAccepted();
                // [todo] see if any deeper expansions have been rejected
                // [update] is this comment still relevant?
                const rejected = reduceQueries([relationQuery], accepted) || [relationQuery];
                const [finalAccepted, finalRejected] = this.toMappedAcceptedAndRejectedQueries({
                    accepted,
                    hydrationQuery,
                    rejected,
                    relation,
                    relationQuery,
                });

                return new QueryStreamPacket<T>({
                    accepted: finalAccepted,
                    rejected: finalRejected,
                });
            })
        );
    }

    // [todo] simplify this mess
    private toMappedAcceptedAndRejectedQueries({
        accepted,
        rejected,
        hydrationQuery,
        relationQuery,
        relation,
    }: {
        accepted: Query[];
        rejected: Query[];
        hydrationQuery: EntityHydrationQuery;
        relationQuery: Query;
        relation: IEntitySchemaRelation;
    }): [Query[], Query[]] {
        // [todo] should not check for equivalency, but instead if accepted criteria are a superset
        if (Query.equivalentCriteria(relationQuery, ...mergeQueries(...accepted))) {
            if (rejected.length && accepted.length) {
                return [
                    [
                        hydrationQuery
                            .getQuery()
                            .withExpansion(
                                writePath(
                                    relation.getPropertyName(),
                                    {},
                                    Expansion.mergeValues(...accepted.map(q => q.getExpansionValue()))
                                )
                            ),
                    ],
                    [
                        hydrationQuery
                            .getQuery()
                            .withExpansion(
                                writePath(
                                    relation.getPropertyName(),
                                    {},
                                    Expansion.mergeValues(...rejected.map(q => q.getExpansionValue()))
                                )
                            ),
                    ],
                ];
            } else if (accepted.length) {
                return [[hydrationQuery.getQuery()], []];
            } else if (rejected.length) {
                return [[], [hydrationQuery.getQuery()]];
            } else {
                return [[], []];
            }
        } else {
            return [
                accepted.map(acceptedQuery =>
                    hydrationQuery
                        .getQuery()
                        .withCriteria(
                            and(
                                hydrationQuery.getQuery().getCriteria(),
                                fromDeepBag({ [relation.getPropertyName()]: acceptedQuery.getCriteria() })
                            )
                        )
                        .withExpansion(writePath(relation.getPropertyName(), {}, acceptedQuery.getExpansionValue()))
                ),
                rejected.map(rejectedQuery =>
                    hydrationQuery
                        .getQuery()
                        .withCriteria(
                            and(
                                hydrationQuery.getQuery().getCriteria(),
                                fromDeepBag({ [relation.getPropertyName()]: rejectedQuery.getCriteria() })
                            )
                        )
                        .withExpansion(writePath(relation.getPropertyName(), {}, rejectedQuery.getExpansionValue()))
                ),
            ];
        }
    }

    private toHydrateRelationQuery(
        entitySet: EntitySet,
        key: string,
        expansionValue: ExpansionValue[string]
    ): false | [Query, IEntitySchemaRelation] {
        if (expansionValue === void 0) {
            return false;
        }

        const relation = entitySet.getQuery().getEntitySchema().findRelation(key);

        if (relation === void 0) {
            return false;
        }

        const relatedSchema = relation.getRelatedEntitySchema();

        const criteria = createCriterionFromEntities(
            entitySet.getEntities(),
            relation.getFromIndex().getPath(),
            relation.getToIndex().getPath()
        );

        const relatedExpansion = expansionValue === true ? createDefaultExpansion(relatedSchema) : expansionValue;

        return [new Query(relatedSchema, criteria, relatedExpansion), relation];
    }

    private toHydrationQueries<T>(
        accepted: Query[],
        rejected: Query[],
        database: InMemoryEntityDatabase
    ): EntityHydrationQuery<T>[] {
        return rejected.reduce(
            (hydrationQueries, rejectedQuery) => [
                ...hydrationQueries,
                ...accepted
                    .map(acceptedQuery => this.intersectCriteriaOmitExpansion(acceptedQuery, rejectedQuery))
                    .filter(isNotFalse)
                    .map(dehydratedEntitiesQuery => database.querySync<T>(dehydratedEntitiesQuery))
                    .map(
                        entitySet =>
                            new EntityHydrationQuery<T>({
                                entitySet,
                                query: rejectedQuery,
                            })
                    ),
            ],
            [] as EntityHydrationQuery<T>[]
        );
    }

    private intersectCriteriaOmitExpansion(accepted: Query, rejected: Query): false | Query {
        const intersectedCriterion = rejected.getCriteria().intersect(accepted.getCriteria());

        if (!intersectedCriterion) {
            return false;
        }

        const intersectedWithoutDehydrated = NamedCriteria.omitExpansion(
            intersectedCriterion,
            rejected.getExpansion().getValue()
        );

        return accepted.withCriteria(intersectedWithoutDehydrated);
    }

    async create(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]> {
        return this.findStore(schema)?.create(entities, schema) ?? false;
    }

    async update(entities: Entity[], schema: IEntitySchema): Promise<false | Entity[]> {
        return this.findStore(schema)?.update(entities, schema) ?? false;
    }

    async delete(entities: Entity[], schema: IEntitySchema): Promise<boolean> {
        return this.findStore(schema)?.delete(entities, schema) ?? false;
    }

    private findStore(schema: IEntitySchema): IEntityStore | undefined {
        return this.stores.get(schema.getId());
    }
}
