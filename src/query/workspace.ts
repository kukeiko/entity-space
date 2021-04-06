import { Observable, merge, of, combineLatest } from "rxjs";
import { map, mergeMap, startWith, tap } from "rxjs/operators";
import { reduceSelection } from "../selection";
import { Query } from "./query";
import { Instance } from "./instance";
import { ComponentProvider } from "./component-provider";
import { QueryStreamPacket } from "./query-stream-packet";
import { PayloadHydration } from "./payload-hydration";
import { Class } from "../utils";
import { reduceQuery } from "./reduce-query";
import { queryToString } from "./query-to-string";

export class Workspace {
    constructor(provider: ComponentProvider) {
        this._provider = provider;
    }

    private readonly _provider: ComponentProvider;
    private readonly _cachedQueries = new Map<Class, Query[]>();

    load$<T = Instance>(query: Query): Observable<T[]> {
        console.log(`[workspace] loading query: ${queryToString(query)}`);
        const reducedQuery = this._reduceQueryAgainstCache(query);

        if (reducedQuery === query) {
            console.log(`[workspace] query not reduced at all`);
        } else if (reducedQuery === null) {
            console.log(`[workspace] query fully reduced`);
        } else {
            console.log(`[workspace] query partially reduced to: ${queryToString(reducedQuery)}`);
        }

        const cached = this._readFromCache(query);

        if (reducedQuery === null) {
            return of(cached as T[]);
        }

        const translator = this._provider.getTranslator(reducedQuery);
        const streams = translator.translate(reducedQuery);
        const observables = streams.map(s =>
            s.open$().pipe(
                tap(packet => this._writeToCache(packet)),
                mergeMap(packet => this._hydrate$(reducedQuery, packet)),
                startWith([] as Instance[])
            )
        );

        observables.push(of(cached));

        return combineLatest(observables).pipe(map(nested => nested.reduce<T[]>((acc, value) => [...acc, ...value] as T[], [])));
    }

    private _hydrate$(target: Query, packet: QueryStreamPacket): Observable<Instance[]> {
        /**
         * [todo] actually check "open" against "loaded" to see which hydrations will never be loaded from stream
         * to clarify: the reason we're returning eagerly is because the stream might provide the hydrations itself.
         */
        if (packet.open.length > 0) {
            return of(packet.payload);
        }

        const missing = reduceSelection(target.selection, packet.loaded.selection);

        if (missing === null) {
            return of(packet.payload);
        }

        const hydrations: PayloadHydration[] = [];

        for (const model of packet.loaded.model) {
            const hydrator = this._provider.getHydrator(model);

            hydrations.push(
                ...hydrator.hydrate({
                    loaded: packet.loaded,
                    payload: packet.payload,
                    selection: missing,
                })
            );
        }

        if (hydrations.length === 0) {
            return of(packet.payload);
        }

        return merge(...hydrations.map(hydration => combineLatest(of(hydration), this.load$(hydration.load)))).pipe(
            tap(([hydration, payload]) => hydration.assign(packet.payload, payload)),
            map(() => packet.payload)
        );
    }

    private _readFromCache(query: Query): Instance[] {
        if (this._provider.getCacheReader === void 0) {
            return [];
        }

        const cacheReader = this._provider.getCacheReader();

        return cacheReader.readFromCache(query);
    }

    private _reduceQueryAgainstCache(query: Query): Query | null {
        // [todo] we don't support caching queries with multiple models yet
        if (query.model.length > 1) {
            return query;
        }

        const cachedQueries = this._cachedQueries.get(query.model[0]);

        if (cachedQueries === void 0) {
            return query;
        }

        let reducedQuery: Query | null = query;

        for (const cachedQuery of cachedQueries) {
            reducedQuery = reduceQuery(reducedQuery, cachedQuery);

            if (reducedQuery === null) {
                return null;
            }
        }

        return reducedQuery;
    }

    private _writeToCache(packet: QueryStreamPacket): void {
        if (this._provider.getCacheWriter === void 0) {
            return;
        }

        // [todo] we don't support caching queries with multiple models yet
        if (packet.loaded.model.length > 1) {
            return;
        }

        const cache = this._provider.getCacheWriter();
        cache.writeToCache(packet);

        let cachedQueries = this._cachedQueries.get(packet.loaded.model[0]);

        if (cachedQueries === void 0) {
            cachedQueries = [];
            this._cachedQueries.set(packet.loaded.model[0], cachedQueries);
        }

        cachedQueries.push(packet.loaded);
    }
}
