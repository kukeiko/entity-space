import * as _ from "lodash";
import { IEntityType } from "../metadata";
import { Query, QueryType, QueryIdentity } from "../elements";

type PerExpansions = Map<string, QueryType<any>>;
type PerIdentity = Map<QueryIdentity, PerExpansions>;

export class QueryCache {
    get cachedQueries(): QueryType<any>[] {
        return Array.from(this._all.values());
    }

    private _all = new Set<QueryType<any>>();
    private _byType = new Map<IEntityType<any>, PerIdentity>();

    /**
     * todo: this should be optimized by deleting queries that are subsets of the given query
     * todo: implement index + indexes
     */
    add(query: QueryType<any>): void {
        if (this.isCached(query)) return;

        switch (query.type) {
            case "key":
                {
                    let byKeys = this._perExpansion(query.entityType, "keys");
                    let sameExpansion = byKeys.get(query.expansion) as Query.ByKeys<any>;
                    let newKeys: any[] = [];

                    if (sameExpansion) {
                        newKeys = [...sameExpansion.keys, query.key];
                        this._all.delete(sameExpansion);
                    } else {
                        newKeys = [query.key];
                    }

                    let q = new Query.ByKeys({
                        entityType: query.entityType,
                        keys: newKeys,
                        expansions: query.expansions.slice()
                    });

                    byKeys.set(query.expansion, q);
                    this._all.add(q);
                }
                break;

            case "keys":
                {
                    let byKeys = this._perExpansion(query.entityType, "keys");
                    let sameExpansion = byKeys.get(query.expansion) as Query.ByKeys<any>;
                    let newKeys: any[] = [];

                    if (sameExpansion) {
                        newKeys = _.flatten([...sameExpansion.keys, ...query.keys]);
                        this._all.delete(sameExpansion);
                    } else {
                        newKeys = query.keys.slice();
                    }

                    let q = new Query.ByKeys({
                        entityType: query.entityType,
                        keys: newKeys,
                        expansions: query.expansions.slice()
                    });

                    byKeys.set(query.expansion, q);
                    this._all.add(q);
                }
                break;

            case "all":
                {
                    let byKeys = this._perExpansion(query.entityType, "keys");
                    let sameExpansion = byKeys.get(query.expansion) as Query.ByKeys<any>;

                    if (sameExpansion) {
                        byKeys.delete(query.expansion);
                        this._all.delete(sameExpansion);
                    }

                    let cached = this._perExpansion(query.entityType, query.type);
                    cached.set(query.expansion, query);
                    this._all.add(query);
                }
                break;

            default:
                // todo: this seems to overwrite queries even though it shouldn't
                let cached = this._perExpansion(query.entityType, query.type);
                cached.set(query.expansion, query);
        }
    }

    /**
     * todo: this should be optimized by checking against type of incoming query,
     * effectively re-implementing logic already existing @ query.ts
     *
     * right now it checks in order or highest (guessed) probability
     */
    isCached(query: QueryType<any>): boolean {
        let byKeys = this._perExpansion(query.entityType, "keys");
        if (Array.from(byKeys.values()).some(q => q.isSuperSetOf(query))) return true;

        let byIndex = this._perExpansion(query.entityType, "index");
        if (Array.from(byIndex.values()).some(q => q.isSuperSetOf(query))) return true;

        let byIndexes = this._perExpansion(query.entityType, "indexes");
        if (Array.from(byIndexes.values()).some(q => q.isSuperSetOf(query))) return true;

        let all = this._perExpansion(query.entityType, "all");
        if (Array.from(all.values()).some(q => q.isSuperSetOf(query))) return true;

        return false;
    }

    /**
     * Clear parts or all of the cache.
     */
    clear(args?: {
        entityType?: IEntityType<any>;
        queryIdentity?: QueryIdentity;
    }): void {
        args = args || {};

        if (args.entityType && args.queryIdentity) {
            let cache = this._perExpansion(args.entityType, args.queryIdentity);
            cache.clear();
        } else if (args.entityType) {
            let cache = this._perIdentity(args.entityType);
            cache.clear();
        } else if (args.queryIdentity) {
            this._byType.forEach(perIdentity => {
                perIdentity.set(args.queryIdentity, new Map<string, QueryType<any>>());
            });
        } else {
            this._byType = new Map<IEntityType<any>, PerIdentity>();
        }
    }

    numCached(args?: {
        entityType?: IEntityType<any>;
        queryIdentity?: QueryIdentity;
    }): number {
        if (!args) {
            let all = _.flatten(Array.from(this._byType.values()).map(x => Array.from(x.values())));
            return _.flatten(all.map(x => Array.from(x.values()))).length;
        } else if (args.entityType && args.queryIdentity) {
            return this._perExpansion(args.entityType, args.queryIdentity).size;
        } else if (args.entityType) {
            let allIdentities = Array.from(this._perIdentity(args.entityType).values());
            return _.flatten(allIdentities.map(x => Array.from(x.values()))).length;
        } else if (args.queryIdentity) {
            let ofSameIdentity = Array.from(this._byType.values())
                .map(x => x.get(args.queryIdentity))
                .filter(x => x);

            return _.flatten(ofSameIdentity.map(x => Array.from(x.values()))).length;
        }
    }

    private _perExpansion(entityType: IEntityType<any>, queryIdentity: QueryIdentity): PerExpansions {
        let perIdentity = this._perIdentity(entityType);
        let perExpansions = perIdentity.get(queryIdentity);

        if (!perExpansions) {
            perExpansions = new Map<string, QueryType<any>>();
            perIdentity.set(queryIdentity, perExpansions);
        }

        return perExpansions;
    }

    private _perIdentity(entityType: IEntityType<any>): PerIdentity {
        let queries = this._byType.get(entityType);

        if (!queries) {
            queries = new Map<QueryIdentity, PerExpansions>();
            this._byType.set(entityType, queries);
        }

        return queries;
    }
}