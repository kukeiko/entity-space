import { and, fromDeepBag } from "@entity-space/criteria";
import { tramplePath, walkPath } from "@entity-space/utils";
import { merge, Observable, ReplaySubject } from "rxjs";
import { tap } from "rxjs/operators";
import { Entity, QueriedEntities } from "../../entity";
import { createCriterionFromEntities } from "../../entity/functions/create-criterion-from-entities.fn";
import { joinEntities } from "../../entity/functions/join-entities.fn";
import { Expansion } from "../../expansion/expansion";
import { ExpansionObject } from "../../expansion/expansion-object";
import { IEntitySchemaRelation } from "../../schema";
import { mergeQueries } from "../merge-queries.fn";
import { Query } from "../query";
import { reduceQueries } from "../reduce-queries.fn";
import { IEntityHydrator } from "./i-entity-hydrator";
import { IEntitySource_V2 } from "./i-entity-source-v2";
import { QueryStreamPacket } from "./query-stream-packet";

export class DefaultHydrator implements IEntityHydrator {
    hydrate<T extends Entity = Entity>(
        entities: QueriedEntities<T>[],
        source: IEntitySource_V2
    ): Observable<QueryStreamPacket<T>> {
        const streams: Observable<QueryStreamPacket<T>>[] = [];

        for (const queriedEntities of entities) {
            streams.push(this.hydrateQueriedEntities(queriedEntities, source));
        }

        return merge(...streams);
    }

    private hydrateQueriedEntities<T>(
        queriedEntities: QueriedEntities<T>,
        source: IEntitySource_V2
    ): Observable<QueryStreamPacket<T>> {
        const streams: Observable<QueryStreamPacket<T>>[] = [];
        const expansionObject = queriedEntities.getQuery().getExpansionObject();
        const schema = queriedEntities.getQuery().getEntitySchema();
        const entities = queriedEntities.getEntities();

        for (const propertyKey in expansionObject) {
            const expansionValue = expansionObject[propertyKey];

            if (expansionValue === void 0) {
                continue;
            }

            const relation = schema.findRelation(propertyKey);

            // if (relation !== void 0 && !isExpanded(entities, relation.getPropertyName())) {
            if (relation !== void 0) {
                const expandRelationStream = this.expandRelation(
                    queriedEntities,
                    relation,
                    source,
                    expansionValue === true ? void 0 : expansionValue
                );

                streams.push(expandRelationStream);
            } else if (expansionValue !== true) {
                // [todo] implement
                const property = schema.getProperty(propertyKey);
                const referencedItems: Entity[] = [];
                for (const entity of entities) {
                    const reference = walkPath<Entity>(propertyKey, entity);
                    if (Array.isArray(reference)) {
                        referencedItems.push(...reference);
                    } else if (reference) {
                        referencedItems.push(reference);
                    }
                }

                // const referencedQueriedEntities
                const entitySchema = property.getUnboxedEntitySchema();
                // const task = (async () => {
                //     const result = await expandEntities(
                //         entitySchema,
                //         new Expansion(expansionValue),
                //         referencedItems,
                //         source
                //     );
                //     return result;
                // })();
                // tasks.push(task);
            }
        }

        return merge(...streams);
    }

    private expandRelation<T extends Entity = Entity>(
        queriedEntities: QueriedEntities<T>,
        relation: IEntitySchemaRelation,
        source: IEntitySource_V2,
        expansion?: ExpansionObject
    ): Observable<QueryStreamPacket<T>> {
        const relatedSchema = relation.getRelatedEntitySchema();
        // console.log(relatedSchema.getId());
        // [todo] what about dictionaries?
        const isArray = relation.getProperty().getValueSchema().schemaType === "array";
        const fromIndex = relation.getFromIndex();
        const toIndex = relation.getToIndex();
        const criteria = createCriterionFromEntities(
            queriedEntities.getEntities(),
            fromIndex.getPath(),
            toIndex.getPath()
        );
        const query = new Query(relatedSchema, criteria, expansion ?? {});
        const result: Entity[] = [];
        const accepted: Query<T>[] = [];
        const stream = source.query_v2([query]);

        const foo$ = new ReplaySubject<any>();
        stream
            .pipe(
                tap(packet => {
                    result.push(...packet.getEntitiesFlat());
                    accepted.push(...packet.getAcceptedQueries());
                })
            )
            .subscribe({
                complete: () => {
                    // [todo] see if any deeper expansions have been rejected
                    const rejected = reduceQueries([query], accepted) || [query];
                    let finalRejected: Query<T>[] = [];
                    let finalAccepted: Query<T>[] = [];

                    if (Query.equivalentCriteria(query, ...mergeQueries(...accepted))) {
                        if (rejected.length && accepted.length) {
                            const rejectedExpansion = Expansion.mergeObjects(
                                ...rejected.map(q => q.getExpansionObject())
                            );
                            const trampledRejected = {};
                            tramplePath(relation.getPropertyName(), trampledRejected, rejectedExpansion);
                            finalRejected = [queriedEntities.getQuery().withExpansion(trampledRejected)];
                            const successfulExpansion = Expansion.mergeObjects(
                                ...accepted.map(q => q.getExpansionObject())
                            );
                            const trampledSuccessful = {};
                            tramplePath(relation.getPropertyName(), trampledSuccessful, successfulExpansion);
                            finalAccepted = [queriedEntities.getQuery().withExpansion(trampledSuccessful)];
                        } else if (accepted.length) {
                            finalAccepted = [queriedEntities.getQuery()];
                        } else if (rejected.length) {
                            finalRejected = [queriedEntities.getQuery()];
                        }
                    } else {
                        const queriedQuery = queriedEntities.getQuery();

                        // [todo] epansion missing!
                        for (const acceptedQuery of accepted) {
                            const trampledSuccessful = {};
                            tramplePath(
                                relation.getPropertyName(),
                                trampledSuccessful,
                                acceptedQuery.getExpansionObject()
                            );

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
                            tramplePath(
                                relation.getPropertyName(),
                                trampledRejected,
                                rejectedQuery.getExpansionObject()
                            );

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

                    joinEntities(
                        // [todo] mutating entities within a QueriedEntities
                        queriedEntities.getEntities(),
                        result,
                        relation.getPropertyName(),
                        fromIndex.getPath(),
                        toIndex.getPath(),
                        isArray
                    );

                    foo$.next(
                        new QueryStreamPacket<T>({
                            accepted: finalAccepted,
                            rejected: finalRejected,
                            payload: [new QueriedEntities(queriedEntities.getQuery(), queriedEntities.getEntities())],
                        })
                    );
                    foo$.complete();
                },
            });

        return foo$;
    }
}
