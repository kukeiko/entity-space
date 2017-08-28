import * as _ from "lodash";
import { ToStringable, ArrayLike } from "../util";
import { getEntityMetadata, EntityType, IEntity } from "../metadata";
import { Expansion } from "./expansion";
import { Extraction } from "./extraction";
import { Identity, All as $All, ById as $ById, ByIds as $ByIds, ByIndexes as $ByIndexes } from "./identity";

/**
 * Describes which entities and expansions should be considered for an operation.
 *
 * Immutable
 */
export abstract class Query<T extends IEntity> {
    /**
     * The entity type operated on.
     */
    readonly entityType: EntityType<T>;

    /**
     * Idenfitication of the set of entities operated on.
     */
    readonly identity: Identity;

    /**
     * Included navigations for the operation.
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
        entityType: EntityType<T>;
        identity: Identity;
        expand?: string | ArrayLike<Expansion>;
    }) {
        this.entityType = args.entityType;
        this.identity = args.identity;

        let expansions = (typeof (args.expand) == "string"
            ? Expansion.parse(args.entityType, args.expand)
            : (args.expand || []))
            .slice()
            .sort((a, b) => a.property.name.toLocaleLowerCase() < b.property.name.toLocaleLowerCase() ? -1 : 1);

        this.expansion = expansions.map(exp => exp.toString()).join(",");
        this.expansions = Object.freeze(expansions.slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1));
        this.numExpansions = this.expansions.map(exp => exp.numExpansions).reduce((p, c) => p + c, 0) + this.expansions.length;
    }

    static equals<T extends IEntity>(a: Query<T>, b: Query<T>): boolean {
        return a.toString() == b.toString();
    }

    abstract isSupersetOf(other: Query<T>): boolean;
    abstract reduce(other: QueryType<any>): QueryType<any>;

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
                q = new Query.All<T>({ entityType: self.entityType, expand: expansions });
                break;

            case "id":
                q = new Query.ById<T>({ id: self.id, entityType: self.entityType, expand: expansions });
                break;

            case "ids":
                q = new Query.ByIds<T>({ ids: self.ids.slice(), entityType: self.entityType, expand: expansions });
                break;

            case "indexes":
                q = new Query.ByIndexes<T>({ indexes: self.indexes, entityType: self.entityType, expand: expansions });
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
    /**
     * A query that targets all entities of one entity type.
     *
     * Immutable
     */
    export class All<T extends IEntity> extends Query<T> {
        readonly type = "all";

        constructor(args: {
            entityType: EntityType<T>;
            expand?: string | ArrayLike<Expansion>;
        }) {
            super({
                entityType: args.entityType,
                identity: new $All(),
                expand: args.expand
            });
        }

        isSupersetOf(other: Query<T>): boolean {
            if (other.entityType != this.entityType) return false;

            return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
        }

        /**
         * Reduce another query by this query.
         */
        reduce(other: QueryType<T>): QueryType<T> {
            if (this.entityType != other.entityType) return other;

            let remainingExpansions = Expansion.minus(other.expansions.slice(), this.expansions.slice());
            if (remainingExpansions.length == 0) return null;

            switch (other.type) {
                case "all": return new Query.All<T>({ entityType: other.entityType, expand: remainingExpansions });
                case "id": return new Query.ById<T>({ id: other.id, entityType: other.entityType, expand: remainingExpansions });
                case "ids": return new Query.ByIds<T>({ ids: other.ids.slice(), entityType: other.entityType, expand: remainingExpansions });
                case "indexes": return new Query.ByIndexes<T>({ indexes: other.indexes, entityType: other.entityType, expand: remainingExpansions });
                default: throw `unsupported query ${other}`;
            }
        }

        merge(other: Query.All<T>): Query.All<T> {
            return new Query.All({
                entityType: this.entityType,
                expand: Expansion.add(this.expansions.slice(), other.expansions.slice())
            });
        }
    }

    /**
     * A query that targets a single entity of an entity type by its key.
     *
     * Immutable
     */
    export class ById<T extends IEntity> extends Query<T> {
        readonly type = "id";
        readonly id: ToStringable;

        constructor(args: {
            id: ToStringable;
            entityType: EntityType<T>;
            expand?: string | ArrayLike<Expansion>;
        }) {
            super({
                entityType: args.entityType,
                identity: new $ById(args.id),
                expand: args.expand
            });

            this.id = args.id;
        }

        isSupersetOf(other: Query<T>): boolean {
            if (other.entityType != this.entityType) return false;
            if (other instanceof ById && other.id == this.id) {
                return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
            }

            return false;
        }

        toString(): string {
            return this._toString({
                suffix: this.id
            });
        }

        reduce(other: Query.ById<T>): Query.ById<T> {
            if (this.entityType != other.entityType || other.id != this.id) return other;

            let remainingExpansions = Expansion.minus(other.expansions.slice(), this.expansions.slice());
            if (remainingExpansions.length == 0) return null;

            return new Query.ById({
                entityType: this.entityType,
                expand: remainingExpansions,
                id: this.id
            });
        }

        merge(other: Query.ById<T>): Query.ById<T> {
            if (other.id != this.id) throw `can't merge two by-key queries with different keys`;

            return new Query.ById({
                entityType: this.entityType,
                expand: Expansion.add(this.expansions.slice(), other.expansions.slice()),
                id: this.id
            });
        }
    }

    /**
     * A query that targets multiple entities of one entity type by their keys.
     *
     * Immutable
     */
    export class ByIds<T extends IEntity> extends Query<T> {
        readonly type = "ids";
        readonly ids: ReadonlyArray<ToStringable>;
        private readonly _sortedKeys: Array<ToStringable>;

        constructor(args: {
            ids: ArrayLike<ToStringable>;
            entityType: EntityType<T>;
            expand?: string | ArrayLike<Expansion>;
        }) {
            super({
                entityType: args.entityType,
                identity: new $ByIds(args.ids),
                expand: args.expand
            });

            this.ids = args.ids.slice();
            this._sortedKeys = args.ids.slice().sort();
        }

        isSupersetOf(other: Query<T>): boolean {
            if (other.entityType != this.entityType) return false;
            if (other instanceof ById && this._sortedKeys.includes(other.id)) {
                return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
            } else if (other instanceof ByIds && _.difference(other._sortedKeys, this._sortedKeys).length == 0) {
                return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
            }

            return false;
        }

        reduce(other: QueryType<any>): QueryType<any> {
            if (other.type != this.type) return other;
            if (this.entityType != other.entityType) return other;

            let remainingExpansions = Expansion.minus(other.expansions.slice(), this.expansions.slice());
            if (remainingExpansions.length > 0) return other;

            return new Query.ByIds({
                entityType: this.entityType,
                expand: remainingExpansions,
                ids: _.difference(other.ids, this.ids)
            });
        }

        toString(): string {
            return this._toString({
                suffix: this.ids.join(",")
            });
        }
    }

    /**
     * A query that targets multiple entities of one entity type by one or many indexes.
     *
     * Immutable
     */
    export class ByIndexes<T extends IEntity> extends Query<T> {
        readonly type = "indexes";
        readonly indexes: Readonly<{ [key: string]: ToStringable }>;

        constructor(args: {
            indexes: { [key: string]: ToStringable };
            entityType: EntityType<T>;
            expand?: string | ArrayLike<Expansion>;
        }) {
            super({
                entityType: args.entityType,
                identity: new $ByIndexes(args.indexes),
                expand: args.expand
            });

            this.indexes = Object.freeze({ ...args.indexes });
        }

        /**
         * Returns the indexes sorted by their name.
         */
        static indexesToArray(indexes: { [key: string]: ToStringable }): string[] {
            return Object.keys(indexes).sort().map(k => `${k} == ${indexes[k].toString()}`);
        }

        /**
         * Returns the indexes sorted by their name.
         */
        indexesToArray(): string[] {
            return ByIndexes.indexesToArray(this.indexes);
        }

        indexesToString(): string {
            return this.indexesToArray().join(" && ");
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

        reduce(other: Query.ByIndexes<T>): Query.ByIndexes<T>;
        reduce(other: QueryType<any>): QueryType<any>;
        // todo: throw if indexes are incompatible
        reduce(other: QueryType<any>): QueryType<any> {
            if (other.type != this.type) return other;
            if (this.entityType != other.entityType) return other;

            if (!_.isEqual(other.indexes, this.indexes)) return other;

            let remainingExpansions = Expansion.minus(other.expansions.slice(), this.expansions.slice());
            if (remainingExpansions.length == 0) return null;

            return new Query.ByIndexes({
                entityType: this.entityType,
                expand: remainingExpansions,
                indexes: this.indexes
            });
        }

        // todo: throw if indexes are incompatible
        merge(other: Query.ByIndexes<T>): Query.ByIndexes<T> {
            if (this.entityType != other.entityType) return other;
            return new Query.ByIndexes({
                entityType: this.entityType,
                expand: Expansion.add(this.expansions.slice(), other.expansions.slice()),
                indexes: this.indexes
            });
        }
    }
}

export type QueryType<T extends IEntity> =
    Query.All<T>
    | Query.ById<T>
    | Query.ByIds<T>
    | Query.ByIndexes<T>;
