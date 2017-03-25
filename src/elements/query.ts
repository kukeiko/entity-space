import * as _ from "lodash";
import { IStringable } from "../util";
import { getEntityMetadata, IEntityType, IEntity } from "../metadata";
import { Expansion } from "./expansion";
import { Extraction } from "./extraction";

/**
 * All the supported query identities by which the initial set of an operation is narrowed down.
 */
export type QueryIdentity = "all" | "key" | "keys" | "index" | "indexes";

/**
 * Describes which entities and expansions should be considered for an operation.
 *
 * Immutable.
 */
export abstract class Query<T extends IEntity> {
    /**
     * The entity type designated by this query.
     */
    readonly entityType: IEntityType<T>;

    /**
     * All expansions of this query.
     */
    readonly expansions: ReadonlyArray<Expansion>;

    /**
     * The full expansion string of this query.
     */
    readonly expansion: string;

    /**
     * Number of all expansions (including nested).
     */
    readonly numExpansions: number;

    /**
     * Extending this class and trying to use it will lead to random exceptions.
     */
    protected constructor(args: {
        entityType: IEntityType<T>;
        expansions?: string | Expansion[];
    }) {
        this.entityType = args.entityType;

        let expansions = (typeof (args.expansions) == "string"
            ? Expansion.parse(args.entityType, args.expansions)
            : (args.expansions || []))
            .sort((a, b) => a.property.name.toLocaleLowerCase() < b.property.name.toLocaleLowerCase() ? -1 : 1);

        this.expansion = expansions.map(exp => exp.toString()).join(",");
        this.expansions = Object.freeze(expansions.slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1));
        this.numExpansions = this.expansions.map(exp => exp.numExpansions).reduce((p, c) => p + c, 0);
    }

    static equals<T extends IEntity>(a: Query<T>, b: Query<T>): boolean {
        return a.toString() == b.toString();
    }

    abstract isSupersetOf(other: Query<T>): boolean;

    isSubsetOf(other: Query<T>): boolean {
        return other.isSupersetOf(this);
    }

    equals(other: Query<T>): boolean {
        return Query.equals(this, other);
    }

    extract(predicate: (p: Expansion) => boolean): [QueryType<T>, Extraction[]] {
        let extractions = new Array<Extraction>();
        let expansions = new Array<Expansion>();

        this.expansions.forEach(exp => {
            if (predicate(exp)) {
                extractions.push(new Extraction({
                    extracted: exp
                }));
            } else {
                let [subExp, subExtractions] = exp.extract(predicate);

                expansions.push(subExp);
                extractions = extractions.concat(subExtractions);
            }
        });

        // todo: this screams for a Query.copy(newProps) method
        let q: QueryType<T>;
        let self = this as any as QueryType<T>;

        switch (self.type) {
            case "all":
                q = new Query.All<T>({ entityType: self.entityType, expansions: expansions });
                break;

            case "key":
                q = new Query.ByKey<T>({ key: self.key, entityType: self.entityType, expansions: expansions });
                break;

            case "keys":
                q = new Query.ByKeys<T>({ keys: self.keys.slice(), entityType: self.entityType, expansions: expansions });
                break;

            case "indexes":
                q = new Query.ByIndexes<T>({ indexes: self.indexes, entityType: self.entityType, expansions: expansions });
                break;

            default:
                throw `unknown query type '${(self as any).type}'`;
        }

        return [q, extractions];
    }

    toString(): string {
        return this._toString();
    }

    protected _toString(args?: {
        suffix?: any;
    }): string {
        args = args || {} as any;

        let str = getEntityMetadata(this.entityType).name;

        if (args.suffix != null) {
            str += `(${args.suffix})`;
        }

        if (this.expansions.length > 0) {
            str += "/";

            if (this.expansions.length > 1) str += "{";
            str += this.expansions.map(exp => exp.toString()).join(",");
            if (this.expansions.length > 1) str += "}";
        }

        return str;
    }
}

export module Query {
    export class All<T extends IEntity> extends Query<T> {
        readonly type = "all";

        constructor(args: {
            entityType: IEntityType<T>;
            expansions?: string | Expansion[];
        }) {
            super(args);
        }

        isSupersetOf(other: Query<T>): boolean {
            if (other.entityType != this.entityType) return false;

            return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
        }

        /**
         * Reduce another query by this query.
         */
        reduce(other: QueryType<T>): QueryType<T> {
            let remainingExpansions = Expansion.minus(other.expansions.slice(), this.expansions.slice());
            if (remainingExpansions.length == 0) return null;

            switch (other.type) {
                case "all": return new Query.All<T>({ entityType: other.entityType, expansions: remainingExpansions });
                case "key": return new Query.ByKey<T>({ key: other.key, entityType: other.entityType, expansions: remainingExpansions });
                case "keys": return new Query.ByKeys<T>({ keys: other.keys.slice(), entityType: other.entityType, expansions: remainingExpansions });
                case "indexes": return new Query.ByIndexes<T>({ indexes: other.indexes, entityType: other.entityType, expansions: remainingExpansions });
                default: throw `unsupported query ${other}`;
            }
        }

        merge(other: Query.All<T>): Query.All<T> {
            return new Query.All({
                entityType: this.entityType,
                expansions: Expansion.add(this.expansions.slice(), other.expansions.slice())
            });
        }
    }

    export class ByKey<T extends IEntity> extends Query<T> {
        readonly type = "key";
        readonly key: IStringable;

        constructor(args: {
            key: IStringable;
            entityType: IEntityType<T>;
            expansions?: string | Expansion[];
        }) {
            super(args);

            this.key = args.key;
        }

        isSupersetOf(other: Query<T>): boolean {
            if (other.entityType != this.entityType) return false;
            if (other instanceof ByKey && other.key == this.key) {
                return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
            }

            return false;
        }

        toString(): string {
            return this._toString({
                suffix: this.key
            });
        }

        reduce(other: Query.ByKey<T>): Query.ByKey<T> {
            if (other.key != this.key) throw `can't reduce using two by-key queries with different keys`;

            let remainingExpansions = Expansion.minus(other.expansions.slice(), this.expansions.slice());
            if (remainingExpansions.length == 0) return null;

            return new Query.ByKey({
                entityType: this.entityType,
                expansions: remainingExpansions,
                key: this.key
            });
        }

        merge(other: Query.ByKey<T>): Query.ByKey<T> {
            if (other.key != this.key) throw `can't merge two by-key queries with different keys`;

            return new Query.ByKey({
                entityType: this.entityType,
                expansions: Expansion.add(this.expansions.slice(), other.expansions.slice()),
                key: this.key
            });
        }
    }

    export class ByKeys<T extends IEntity> extends Query<T> {
        readonly type = "keys";
        readonly keys: ReadonlyArray<IStringable>;
        private readonly _sortedKeys: Array<IStringable>;

        constructor(args: {
            keys: IStringable[];
            entityType: IEntityType<T>;
            expansions?: string | Expansion[];
        }) {
            super(args);

            this.keys = args.keys.slice();
            this._sortedKeys = args.keys.slice().sort();
        }

        isSupersetOf(other: Query<T>): boolean {
            if (other.entityType != this.entityType) return false;
            if (other instanceof ByKey && this._sortedKeys.includes(other.key)) {
                return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
            } else if (other instanceof ByKeys && _.difference(other._sortedKeys, this._sortedKeys).length == 0) {
                return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
            }

            return false;
        }

        toString(): string {
            return this._toString({
                suffix: this.keys.join(",")
            });
        }
    }

    export class ByIndexes<T extends IEntity> extends Query<T> {
        readonly type = "indexes";
        readonly indexes: Readonly<{ [key: string]: IStringable }>;

        constructor(args: {
            indexes: { [key: string]: IStringable };
            entityType: IEntityType<T>;
            expansions?: string | Expansion[];
        }) {
            super(args);

            this.indexes = Object.freeze({ ...args.indexes });
        }

        static indexesToArray(indexes: { [key: string]: IStringable }): string[] {
            return Object.keys(indexes).sort().map(k => `${k}:${indexes[k].toString()}`);
        }

        indexesToArray(): string[] {
            return ByIndexes.indexesToArray(this.indexes);
        }

        isSupersetOf(other: Query<T>): boolean {
            if (other.entityType != this.entityType) return false;
            if (other instanceof ByIndexes) {
                for (let key in other.indexes) {
                    if (!(key in this.indexes) || this.indexes[key] != other.indexes[key]) {
                        return false;
                    }
                }
            }

            return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
        }

        toString(): string {
            let indexValues = new Array<string>();
            for (let k in this.indexes) indexValues.push(`${k}:${this.indexes[k]}`);

            indexValues.sort();

            return this._toString({
                suffix: indexValues.join(",")
            });
        }

        // todo: throw if indexes are incompatible
        reduce(other: Query.ByIndexes<T>): Query.ByIndexes<T> {
            let remainingExpansions = Expansion.minus(other.expansions.slice(), this.expansions.slice());
            if (remainingExpansions.length == 0) return null;

            return new Query.ByIndexes({
                entityType: this.entityType,
                expansions: remainingExpansions,
                indexes: this.indexes
            });
        }

        // todo: throw if indexes are incompatible
        merge(other: Query.ByIndexes<T>): Query.ByIndexes<T> {
            return new Query.ByIndexes({
                entityType: this.entityType,
                expansions: Expansion.add(this.expansions.slice(), other.expansions.slice()),
                indexes: this.indexes
            });
        }
    }
}

export type QueryType<T extends IEntity> =
    Query.All<T>
    | Query.ByKey<T>
    | Query.ByKeys<T>
    | Query.ByIndexes<T>;
