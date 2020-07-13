import { Observable, merge, of } from "rxjs";
import { mergeMap, scan, takeLast, map } from "rxjs/operators";
import { EntityLoader, Query, QueriedEntitySet, EntityHydrator } from "./query";
import { Class } from "../lang";
import { Selection } from "../selection";

export class Workspace {
    private _loaders = new Map<Class, EntityLoader>();
    private _hydrators = new Map<Class, EntityHydrator>();

    setLoader(entityType: Class, loader: EntityLoader): this {
        this._loaders.set(entityType, loader);
        return this;
    }

    setHydrator<T>(entityType: Class<T>, hydrator: EntityHydrator<T>): this {
        this._hydrators.set(entityType, hydrator);
        return this;
    }

    load$<T>(query: Query<T>): Observable<QueriedEntitySet<T>> {
        const loader = this._getLoader(query.entityType);

        return loader.load$(query, this).pipe(
            mergeMap((entities) => {
                const missingSelection = Selection.reduce(query.selection, entities.query.selection);

                if (missingSelection !== null) {
                    const hydrations = this._getHydrator(query.entityType).createInstrumentedHydrations(entities, missingSelection);
                    return merge(...hydrations.map((hydration) => this.load$(hydration.query).pipe(map((queried) => hydration.assign(entities, queried)))));
                } else {
                    return of(entities);
                }
            }),
            scan((acc, value) => [...acc, value], [] as QueriedEntitySet<T>[]),
            takeLast(1),
            map((entitySets) => ([] as T[]).concat(...entitySets.map((entitySet) => entitySet.all()))),
            map((entities) => new QueriedEntitySet(query, entities))
        );
    }

    private _getLoader<T>(entityType: Class<T>): EntityLoader<T> {
        const loader = this._loaders.get(entityType);

        if (loader === void 0) {
            throw new Error(`no loader for entity class '${entityType.name}' found in workspace`);
        }

        return loader;
    }

    private _getHydrator<T>(entityType: Class<T>): EntityHydrator<T> {
        const hydrator = this._hydrators.get(entityType);

        if (hydrator === void 0) {
            throw new Error(`no hydrator for entity class '${entityType.name}' found in workspace`);
        }

        return hydrator;
    }
}
