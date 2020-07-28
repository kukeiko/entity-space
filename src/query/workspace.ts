import { Observable, merge, of, combineLatest } from "rxjs";
import { scan, map, mergeMap } from "rxjs/operators";
import { reduceSelection } from "../selection";
import { Query } from "./query";
import { Instance } from "./instance";
import { ComponentProvider } from "./component-provider";
import { QueryStreamPacket } from "./query-stream-packet";
import { PayloadHydration } from "./payload-hydration";

export class Workspace {
    constructor(provider: ComponentProvider) {
        this._provider = provider;
    }

    private readonly _provider: ComponentProvider;

    load$<T = Instance>(query: Query): Observable<T[]> {
        const translator = this._provider.getTranslator(query);
        const streams = translator.translate(query);
        const observables = streams.map(s => s.open$());

        return merge(...observables).pipe(
            mergeMap(x => this._hydrate$(query, x)),
            scan((acc, value) => [...acc, ...value] as T[], [] as T[])
        );
    }

    private _hydrate$(target: Query, packet: QueryStreamPacket): Observable<Instance[]> {
        // [todo] actually check "open" against "loaded" to see which hydrations will never be loaded from stream
        if (packet.open.length > 0) {
            return of(packet.payload);
        }

        const missing = reduceSelection(target.selection, packet.loaded.selection);

        if (missing === null) {
            return of(packet.payload);
        }

        let hydrations: PayloadHydration[] = [];

        for (const model of packet.loaded.model) {
            const hydrator = this._provider.getHydrator(model);

            hydrations = [
                ...hydrations,
                ...hydrator.hydrate({
                    loaded: packet.loaded,
                    payload: packet.payload,
                    selection: missing,
                }),
            ];
        }

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
}
