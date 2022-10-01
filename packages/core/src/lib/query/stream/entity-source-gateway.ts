import { and, fromDeepBag } from "@entity-space/criteria";
import { isNotFalse, tramplePath } from "@entity-space/utils";
import {
    defaultIfEmpty,
    defer,
    EMPTY,
    filter,
    lastValueFrom,
    map,
    merge,
    of,
    raceWith,
    scan,
    shareReplay,
    switchMap,
    takeLast,
    tap,
} from "rxjs";
import { createDefaultExpansion, Entity, EntityHydrationQuery, EntitySet, IEntityStore } from "../../entity";
import { IEntitySource } from "../../entity/entity-source.interface";
import { createCriterionFromEntities } from "../../entity/functions/create-criterion-from-entities.fn";
import { InMemoryEntityDatabase } from "../../entity/in-memory-entity-database";
import { Expansion, ExpansionValue } from "../../expansion";
import { IEntitySchema, IEntitySchemaRelation } from "../../schema";
import { mergeQueries } from "../merge-queries.fn";
import { Query } from "../query";
import { reduceQueries, reduceQueries_v2 } from "../reduce-queries.fn";
import { IEntityHydrator } from "./i-entity-hydrator";
import { IEntitySource_V2 } from "./i-entity-source-v2";
import { QueryExecution } from "./query-execution";
import { QueryStream } from "./query-stream";
import { QueryStreamPacket } from "./query-stream-packet";

export class EntitySourceGateway implements IEntitySource_V2, IEntitySource, IEntityStore, IEntityHydrator {
    constructor(sources: IEntitySource_V2[] = []) {
        this.sources = sources.slice();
    }

    private sources: IEntitySource_V2[];
    private readonly stores = new Map<string, IEntityStore>();

    addStore(schema: IEntitySchema, store: IEntityStore): void {
        this.stores.set(schema.getId(), store);
    }

    async query(query: Query): Promise<false | EntitySet<Entity>[]> {
        // [todo] cache should be an arg. then again, this method might become obsolete anyway soon™
        const cache = new InMemoryEntityDatabase();
        const mergedPacket = await lastValueFrom(
            this.query_v2([query], cache).pipe(scan(QueryStreamPacket.concat), defaultIfEmpty(new QueryStreamPacket()))
        );

        if (!mergedPacket.getAcceptedQueries().length) {
            return false;
        }

        const result = cache.querySync(query);

        return result ? [result] : result;
    }

    query_v2<T extends Entity = Entity>(queries: Query[], database: InMemoryEntityDatabase): QueryStream<T> {
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

        const sourcePackets$ = source.query_v2<T>(execution.getOpenTargets(), execution.getDatabase()).pipe(
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
        const expansion = hydrationQuery.getQuery().getExpansionObject();
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

    // [todo] simplify this mess
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
                let finalRejected: Query[] = [];
                let finalAccepted: Query[] = [];

                // [todo] should not check for equivalency, but instead if accepted criteria are a superset
                if (Query.equivalentCriteria(relationQuery, ...mergeQueries(...accepted))) {
                    if (rejected.length && accepted.length) {
                        const rejectedExpansion = Expansion.mergeValues(...rejected.map(q => q.getExpansionObject()));
                        const trampledRejected = {};
                        tramplePath(relation.getPropertyName(), trampledRejected, rejectedExpansion);
                        finalRejected = [hydrationQuery.getQuery().withExpansion(trampledRejected)];
                        const successfulExpansion = Expansion.mergeValues(...accepted.map(q => q.getExpansionObject()));
                        const trampledSuccessful = {};
                        tramplePath(relation.getPropertyName(), trampledSuccessful, successfulExpansion);
                        finalAccepted = [hydrationQuery.getQuery().withExpansion(trampledSuccessful)];
                    } else if (accepted.length) {
                        finalAccepted = [hydrationQuery.getQuery()];
                    } else if (rejected.length) {
                        finalRejected = [hydrationQuery.getQuery()];
                    }
                } else {
                    const queriedQuery = hydrationQuery.getQuery();

                    for (const acceptedQuery of accepted) {
                        const trampledSuccessful = {};
                        tramplePath(relation.getPropertyName(), trampledSuccessful, acceptedQuery.getExpansionObject());

                        const addToFinalAccepted = new Query(
                            queriedQuery.getEntitySchema(),
                            and(
                                queriedQuery.getCriteria(),
                                fromDeepBag({ [relation.getPropertyName()]: acceptedQuery.getCriteria() })
                            ),
                            trampledSuccessful
                        );

                        finalAccepted.push(addToFinalAccepted);
                    }

                    for (const rejectedQuery of rejected) {
                        const trampledRejected = {};
                        tramplePath(relation.getPropertyName(), trampledRejected, rejectedQuery.getExpansionObject());

                        const addToFinalRejected = new Query(
                            queriedQuery.getEntitySchema(),
                            and(
                                queriedQuery.getCriteria(),
                                fromDeepBag({ [relation.getPropertyName()]: rejectedQuery.getCriteria() })
                            ),
                            trampledRejected
                        );

                        finalRejected.push(addToFinalRejected);
                    }
                }

                return new QueryStreamPacket<T>({
                    accepted: finalAccepted,
                    rejected: finalRejected,
                });
            })
        );
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

        const intersectedWithoutDehydrated = Expansion.omitFromNamedCriteria(
            intersectedCriterion,
            rejected.getExpansion()
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
