import { EntityType } from "../metadata";
import { Query } from "../elements";
import { IService } from "./service.type";

export class StaticDataService<K, V> implements IService {
    private _items: V[] = [];
    private _onNotFound?: (key: K) => Promise<V> | V;
    private _keyGetter: (item: V) => K;

    constructor(args: {
        entityType: EntityType<any>;
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

    async loadOne(q: Query.ById<V>): Promise<V> {
        let item = this._items.find(i => this._keyGetter(i) == q.id);

        if (!item && this._onNotFound) {
            item = await this._onNotFound(q.id as K);
        }

        return item ? Promise.resolve(item) : Promise.reject<any>(`${q.entityType.name} with id ${q.id} not found`);
    }

    async loadMany(q: Query.ByIds<V>): Promise<V[]> {
        return await Promise.all(q.ids.map(k => this.loadOne(new Query.ById({
            entityType: q.entityType,
            expand: q.expansions.slice(),
            id: k
        }))));
    }
}
