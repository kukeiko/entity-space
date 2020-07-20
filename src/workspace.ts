import { Observable, merge, of, combineLatest } from "rxjs";
import { scan, map, mergeMap } from "rxjs/operators";
import { Class, getInstanceClass } from "./utils";
import { Query, QueryTranslator, PayloadHydrator, QueryStreamPacket } from "./query";
import { ObjectSelection } from "./selection";

export class Workspace {
    private readonly _translators = new Map<Class<Query>, QueryTranslator>();
    private readonly _hydrators = new Map<Class, PayloadHydrator>();

    foo<Q extends Query>(query: Q): void {}

    // [todo] "Q extends Query" leads to massive performance problems
    // load$<Q extends Query>(query: Q): Observable<Query.Payload<Q>> {
    load$<Q extends Query>(query: Q): Observable<Query.Payload<Q>> {
        // Observable<Query.Payload<Q>> {
        const translator = this._getTranslator(query);
        const streams = translator.translate(query);
        const observables = streams.map(s => s.open$());

        // return of([] as any);
        return merge(...observables).pipe(
            mergeMap(x => this._hydrate$(query, x)),
            scan((acc, value) => [...acc, ...value], [] as Query.Payload<Q>)
        );
    }

    private _hydrate$<Q extends Query>(target: Q, packet: QueryStreamPacket): Observable<Query.Payload<Q>> {
        // [todo] actually check "open" against "loaded" to see which hydrations will never be loaded from stream
        if (packet.open.length > 0) {
            return of(packet.payload);
        }

        const missing = ObjectSelection.reduce(target.selection, packet.loaded.selection);

        if (missing === null) {
            return of(packet.payload);
        }

        const hydrator = this._getHydrator(packet.loaded.getModel());

        const hydrations = hydrator.hydrate({
            loaded: packet.loaded,
            payload: packet.payload,
            selection: missing,
        });

        if (hydrations.length === 0) {
            return of(packet.payload);
        }

        return merge(...hydrations.map(hydration => combineLatest(of(hydration), this.load$(hydration.load)))).pipe(
            map(([hydration, payload]) => {
                hydration.assign(packet.payload, payload);
            }),
            map(() => packet.payload)
        );
    }

    setTranslator<Q extends Query>(query: Class<Q>, translator: QueryTranslator<Q>): this {
        this._translators.set(query, translator);
        return this;
    }

    setHydrator<T>(model: Class<T>, hydrator: PayloadHydrator<T>): this {
        this._hydrators.set(model, hydrator);
        return this;
    }

    private _getTranslator<Q extends Query>(query: Q): QueryTranslator<Q> {
        const type = getInstanceClass(query);
        const translator = this._translators.get(type);

        if (translator === void 0) {
            throw new Error(`no translator for query '${type.name}' found in workspace`);
        }

        return translator as QueryTranslator<Q>;
    }

    private _getHydrator<T>(model: Class<T>): PayloadHydrator<T> {
        const hydrator = this._hydrators.get(model);

        if (hydrator === void 0) {
            throw new Error(`no hydrator for model '${model.name}' found in workspace`);
        }

        return hydrator;
    }
}
