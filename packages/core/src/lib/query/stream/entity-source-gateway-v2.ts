import { flatMap, flatten } from "lodash";
import {
    concatAll,
    defaultIfEmpty,
    EMPTY,
    filter,
    finalize,
    lastValueFrom,
    map,
    merge,
    mergeAll,
    Observable,
    of,
    ReplaySubject,
    scan,
    shareReplay,
    Subject,
    switchMap,
    takeUntil,
    tap,
} from "rxjs";
import { Entity, mergeEntities, QueriedEntities } from "../../entity";
import { IEntitySource } from "../../entity/entity-source.interface";
import { Query } from "../query";
import { reduceQueries } from "../reduce-queries.fn";
import { IEntityHydrator } from "./i-entity-hydrator";
import { IEntitySource_V2 } from "./i-entity-source-v2";
import { QueryStream } from "./query-stream";
import { QueryStreamPacket } from "./query-stream-packet";

export class EntitySourceGateway_V2 implements IEntitySource_V2, IEntitySource {
    constructor(sources: IEntitySource_V2[] = [], hydrators: IEntityHydrator[] = []) {
        this.sources = sources.slice();
        this.hydrators = hydrators.slice();
    }

    private sources: IEntitySource_V2[];
    private hydrators: IEntityHydrator[];

    async query(query: Query): Promise<false | QueriedEntities<Entity>[]> {
        const mergedPacket = await lastValueFrom(
            this.query_v2([query]).pipe(scan(QueryStreamPacket.merge), defaultIfEmpty(new QueryStreamPacket()))
        );

        if (!mergedPacket.getAcceptedQueries().length) {
            return false;
        }

        const entities = flatMap(mergedPacket.getPayload(), payload => payload.getEntities());
        const clientSideFilteredEntities = query.getCriteria().filter(entities);
        const merged = mergeEntities(query.getEntitySchema(), clientSideFilteredEntities);

        return [new QueriedEntities(query, merged)];
    }

    query_v2<T extends Entity = Entity>(queries: Query<T>[]): QueryStream<T> {
        const sourceStreams = new ReplaySubject<QueryStream<T>>();
        const sources = this.sources.slice().reverse();
        const closed$ = new ReplaySubject<void>();
        const streams$ = new ReplaySubject<QueryStream<T>>();
        let mergedPacket = new QueryStreamPacket<T>();

        this.startNextSourceStream(sources, queries, closed$, sourceStreams);

        const mergedSourceStreams = sourceStreams.pipe(
            mergeAll(),
            tap(packet => {
                mergedPacket = mergedPacket.merge(packet);
            }),
            finalize(() => {
                const expansionStream = this.createExpansionStream(queries, mergedPacket.getPayload()).pipe(
                    shareReplay()
                );

                streams$.next(
                    merge(
                        expansionStream.pipe(
                            map(QueryStreamPacket.withoutRejected),
                            filter(QueryStreamPacket.isNotEmpty)
                        ),
                        expansionStream.pipe(
                            tap(packet => {
                                mergedPacket = mergedPacket.merge(packet);
                            }),
                            switchMap(() => EMPTY)
                        ),
                        expansionStream.pipe(
                            finalize(() => {
                                const rejected = mergedPacket.reduceQueriesByAccepted(queries) || queries;

                                if (rejected.length) {
                                    const lastPacket = new QueryStreamPacket<T>({
                                        rejected,
                                    });

                                    streams$.next(of(lastPacket));
                                }

                                streams$.complete();
                            })
                        )
                    )
                );
            })
        );

        streams$.next(mergedSourceStreams);

        return streams$.pipe(
            concatAll(),
            finalize(() => {
                closed$.next();
                closed$.complete();
            })
        );
    }

    private toOpenExpansionQueries<T>(rejected: Query<T>[], accepted: Query<T>[]): Query<T>[] {
        return flatten(
            rejected.map(rejectedQuery => {
                // [todo] need Query.intersect() for better readability here, ...
                const withoutExpansion = rejectedQuery.withoutExpansion();
                const reduced = withoutExpansion.reduceBy(accepted);

                if (!reduced) {
                    return [];
                }

                // ... and here
                return (reduceQueries([withoutExpansion], reduced) || [withoutExpansion]).map(
                    reducedQuery =>
                        new Query(
                            rejectedQuery.getEntitySchema(),
                            reducedQuery.getCriteria(),
                            rejectedQuery.getExpansion()
                        )
                );
            })
        );
    }

    private createExpansionStream<T>(queries: Query<T>[], payload: QueriedEntities<T>[]): QueryStream<T> {
        const hydrators = this.hydrators.slice().reverse();
        const expansionStreams$ = new ReplaySubject<QueryStream<T>>();
        const accepted = flatMap(payload, p => p.getQuery());
        const rejected = reduceQueries(queries, accepted) || queries;
        const openExpansionQueries = this.toOpenExpansionQueries(rejected, accepted);
        // [todo] instead, we could just expect an array of QueriedEntities, and hydrate each one of those.
        const flatPayload = flatten(payload.map(p => p.getEntities()));

        const startNext = (openQueries: Query<T>[]) => {
            if (!openQueries.length) {
                return expansionStreams$.complete();
            }

            const nextHydrator = hydrators.pop();

            if (!nextHydrator) {
                return expansionStreams$.complete();
            }

            const queriedEntities = openQueries.map(
                query => new QueriedEntities(query, query.getCriteria().filter(flatPayload))
            );

            let nextQueries = openQueries;
            let dispatchedNext = false;
            const stream$ = nextHydrator.hydrate(queriedEntities, this).pipe(shareReplay());
            const startNextStream$ = stream$.pipe(
                scan(QueryStreamPacket.merge),
                tap(mergedPacket => {
                    nextQueries = mergedPacket.reduceQueriesByAccepted(queries) || queries;
                }),
                tap(mergedPacket => {
                    if (dispatchedNext) {
                        return;
                    }

                    const reducedQueries = mergedPacket.reduceQueries(nextQueries) || nextQueries;

                    if (reducedQueries.length) {
                        return;
                    }

                    dispatchedNext = true;
                    startNext(nextQueries);
                }),
                switchMap(() => EMPTY),
                finalize(() => {
                    if (dispatchedNext) return;
                    startNext(nextQueries);
                })
            );

            expansionStreams$.next(merge(stream$, startNextStream$));
        };

        startNext(openExpansionQueries);

        return expansionStreams$.pipe(mergeAll());
    }

    private startNextSourceStream<T>(
        sources: IEntitySource_V2[],
        queries: Query<T>[],
        closed$: Observable<unknown>,
        sourceStreams: Subject<QueryStream<T>>
    ): void {
        const nextSource = sources.pop();

        if (!nextSource || !queries.length) {
            // [todo] hack. if removed, and all sources emit synchronously (which they might do),
            // "firstValueFrom()" won't work. (didn't check normal .subscribe() yet)
            setTimeout(() => {
                sourceStreams.complete();
            });

            return;
        }

        const sourceStream = nextSource.query_v2(queries).pipe(takeUntil(closed$), shareReplay());
        const listenerStream = this.listenToStreamToDispatchNext$(sourceStream, queries, (openQueries: Query<T>[]) => {
            this.startNextSourceStream(sources, openQueries, closed$, sourceStreams);
        });

        sourceStreams.next(
            merge(
                listenerStream,
                sourceStream.pipe(map(QueryStreamPacket.withoutRejected), filter(QueryStreamPacket.isNotEmpty))
            )
        );
    }

    private listenToStreamToDispatchNext$<T>(
        stream: Observable<QueryStreamPacket>,
        queries: Query<T>[],
        startNext: (openQueries: Query<T>[]) => void
    ): Observable<never> {
        let openQueries = queries;
        let dispatchedNext = false;

        return stream.pipe(
            scan(QueryStreamPacket.merge),
            tap(mergedPacket => {
                openQueries = mergedPacket.reduceQueriesByAccepted(queries) || queries;
            }),
            tap(mergedPacket => {
                if (dispatchedNext) return;
                const reducedQueries = mergedPacket.reduceQueries(openQueries) || openQueries;
                if (reducedQueries.length) return;
                dispatchedNext = true;
                startNext(openQueries);
            }),
            switchMap(() => EMPTY),
            finalize(() => {
                if (dispatchedNext) return;
                startNext(openQueries);
            })
        );
    }
}
