import { IEntityClass } from "../metadata";
import { Query } from "../elements";
import { IQueryExecuter } from "./query-executer";

export class StaticDataQueryExecuter<K, V> implements IQueryExecuter<V> {
    private _items: V[] = [];
    private _onNotFound?: (key: K) => Promise<V> | V;
    private _keyGetter: (item: V) => K;

    constructor(args: {
        entityType: IEntityClass<V>;
        items: V[];
        keyGetter: (item: V) => K;
        onNotFound?: (key: K) => Promise<V> | V;
    }) {
        this._items = args.items.slice();
        this._onNotFound = args.onNotFound || null;
        this._keyGetter = args.keyGetter;
    }

    async loadAll(q?: Query.All<V>): Promise<V[]> {
        return Promise.resolve(this._items.slice());
    }

    async loadOne(q: Query.ByKey<V>): Promise<V> {
        let item = this._items.find(i => this._keyGetter(i) == q.key);

        if (!item && this._onNotFound) {
            item = await this._onNotFound(q.key as K);
        }

        return item ? Promise.resolve(item) : Promise.reject<any>(`${q.entityType.name} with id ${q.key} not found`);
    }

    async loadMany(q: Query.ByKeys<V>): Promise<V[]> {
        return await Promise.all(q.keys.map(k => this.loadOne(new Query.ByKey({
            entityType: q.entityType,
            expansions: q.expansions.slice(),
            key: k
        }))));
    }
}
