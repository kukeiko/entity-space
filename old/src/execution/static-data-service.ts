import { ToStringable } from "../util";
import { EntityType, IEntity } from "../metadata";
import { Query } from "../elements";
import { Service } from "./service";

export class StaticDataService<K extends ToStringable, V extends IEntity> implements Service {
    private _items = new Map<string, V>();
    private _onNotFound?: (key: K) => Promise<V> | V;
    private _keyGetter: (item: V) => K;

    constructor(args: {
        entityType: EntityType<any>;
        items: V[];
        keyGetter: (item: V) => K;
        onNotFound?: (key: K) => Promise<V> | V;
    }) {
        let item: V;

        for (let i = 0; i < args.items.length; ++i) {
            item = args.items[i];
            this._items.set(args.keyGetter(item).toString(), item);
        }

        this._onNotFound = args.onNotFound || null;
        this._keyGetter = args.keyGetter;
    }

    async load(q: Query<V>): Promise<V[]> {
        switch (q.identity.type) {
            case "all":
                return Array.from(this._items.values());

            case "ids":
                let items = await Promise.all(q.identity.ids.map(async id => {
                    let item = this._items.get(id.toString());

                    if (!item && this._onNotFound) {
                        item = await this._onNotFound(id as K);
                    }

                    return item;
                }));

                return items.filter(x => x);

            case "indexes":
                {
                    let indexes = q.identity.criteria;
                    let items: V[] = [];

                    this._items.forEach(item => {
                        for (let k in indexes) {
                            if (item[k] != indexes[k]) {
                                return;
                            }
                        }

                        items.push(item);
                    });

                    return items;
                }

            default:
                throw new Error(`unexpected query identity '${(q.identity as any).type}'`);
        }
    }
}
