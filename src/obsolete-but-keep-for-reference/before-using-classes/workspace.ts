import { Observable, merge, of, combineLatest } from "rxjs";
import { mergeMap, scan, takeLast, map } from "rxjs/operators";
import { Query } from "./query";
import { Class } from "../../utils";
import { Selection } from "../selection";
import { QueryTranslator } from "./query-translator";
import { ObjectHydrator } from "./object-hydrator";
import { Model } from "../model";

export class Workspace {
    private _translators = new Map<Model, QueryTranslator>();
    private _hydrators = new Map<Model.Object, ObjectHydrator>();

    setTranslator(model: Model, translator: QueryTranslator): this {
        this._translators.set(model, translator);
        return this;
    }

    setHydrator(model: Model.Object, hydrator: ObjectHydrator): this {
        this._hydrators.set(model, hydrator);
        return this;
    }

    load$<Q extends Query>(query: Q): Observable<Query.Payload<Q>> {
        const translator = this._getTranslator(query.model);
        const streams = translator.translate(query);
        const observables = streams.map(s => s.open$());

        combineLatest(observables).pipe(map(x => x)) as any;

        return "foo" as any;
        // return combineLatest().pipe(map(entities => ([] as any[]).concat(...entities))) as any;
    }

    private _getTranslator(model: Model): QueryTranslator {
        const loader = this._translators.get(model);

        if (loader === void 0) {
            throw new Error(`no translator for model '${JSON.stringify(model)}' found in workspace`);
        }

        return loader;
    }

    private _getHydrator(model: Model.Object): ObjectHydrator {
        const hydrator = this._hydrators.get(model);

        if (hydrator === void 0) {
            throw new Error(`no hydrator for model '${JSON.stringify(model)}' found in workspace`);
        }

        return hydrator;
    }
}
