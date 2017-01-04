import * as _ from "lodash";
import { getEntityMetadata, IEntityType, Navigation } from "./metadata";
import { Expansion } from "./expansion";
import { Extraction } from "./extraction";

/**
 * Describes which entities and expansions should be loaded. 
 * 
 * Is immutable.
 */
export abstract class Query<T> {
    readonly entityType: IEntityType<T>;
    readonly expansions: ReadonlyArray<Expansion>;

    constructor(args: {
        entityType: IEntityType<T>;
        expansions?: Expansion[];
    }) {
        this.entityType = args.entityType;
        this.expansions = Object.freeze((args.expansions || []).slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1));
    }

    static equals<T>(a: Query<T>, b: Query<T>): boolean {
        return a.toString() == b.toString();
    }

    abstract isSuperSetOf(other: Query<T>): boolean;

    isSubsetOf(other: Query<T>): boolean {
        return other.isSuperSetOf(this);
    }

    equals(other: Query<T>): boolean {
        return Query.equals(this, other);
    }

    extract(predicate: (p: Expansion) => boolean): [Query<T>, Extraction[]] {
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


        let q: Query<T>;

        if (this instanceof Query.ByKey) {
            q = new Query.ByKey<T>({ key: this.key, entityType: this.entityType, expansions: expansions });
        } else if (this instanceof Query.ByKeys) {
            q = new Query.ByKeys<T>({ keys: this.keys.slice(), entityType: this.entityType, expansions: expansions });
        } else if (this instanceof Query.ByIndex) {
            q = new Query.ByIndex<T>({ index: this.index, value: this.value, entityType: this.entityType, expansions: expansions });
        } else if (this instanceof Query.ByIndexes) {
            q = new Query.ByIndexes<T>({ indexes: this.indexes, entityType: this.entityType, expansions: expansions });
        } else if (this instanceof Query.All) {
            q = new Query.All<T>({ entityType: this.entityType, expansions: expansions });
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
    export class All<T> extends Query<T> {
        isSuperSetOf(other: Query<T>): boolean {
            if (other.entityType != this.entityType) return false;

            return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
        }
    }

    export class ByKey<T> extends Query<T> {
        readonly key: any;

        constructor(args: {
            key: any;
            entityType: IEntityType<T>;
            expansions?: Expansion[];
        }) {
            super(args);

            this.key = args.key;
        }

        isSuperSetOf(other: Query<T>): boolean {
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
    }

    export class ByKeys<T> extends Query<T> {
        readonly keys: ReadonlyArray<any>;
        private readonly _sortedKeys: Array<any>;

        constructor(args: {
            keys: any[];
            entityType: IEntityType<T>;
            expansions?: Expansion[];
        }) {
            super(args);

            this.keys = args.keys.slice();
            this._sortedKeys = args.keys.slice().sort();
        }

        isSuperSetOf(other: Query<T>): boolean {
            if (other.entityType != this.entityType) return false;
            if (other instanceof ByKey && this._sortedKeys.includes(other.key)) {
                return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
            } else if (other instanceof ByKeys && _.isEqual(this._sortedKeys, other._sortedKeys)) {
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

    export class ByIndex<T> extends Query<T> {
        readonly index: string;
        readonly value: any;

        constructor(args: {
            index: string;
            value: any;
            entityType: IEntityType<T>;
            expansions?: Expansion[];
        }) {
            super(args);

            this.index = args.index;
            this.value = args.value;
        }

        isSuperSetOf(other: Query<T>): boolean {
            if (other.entityType != this.entityType) return false;
            if (other instanceof ByIndex && other.index == this.index && other.value == this.value) {
                return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
            }

            return false;
        }

        toString(): string {
            return this._toString({
                suffix: `${this.index}:${this.value}`
            });
        }
    }

    export class ByIndexes<T> extends Query<T> {
        readonly indexes: Readonly<{ [key: string]: Object }>;

        constructor(args: {
            indexes: { [key: string]: Object };
            entityType: IEntityType<T>;
            expansions?: Expansion[];
        }) {
            super(args);

            this.indexes = Object.freeze({ ...args.indexes });
        }

        isSuperSetOf(other: Query<T>): boolean {
            if (other.entityType != this.entityType) return false;
            if (other instanceof ByIndex && other.index in this.indexes && this.indexes[other.index] == other.value) {
                return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
            }

            if (other instanceof ByIndexes) {
                let otherDiffers = false;

                for (let key in other.indexes) {
                    if (!(key in this.indexes) || this.indexes[key] != other.indexes[key]) {
                        otherDiffers = true;
                    }
                }
            }

            return false;
        }

        toString(): string {
            let indexValues = new Array<string>();
            for (let k in this.indexes) indexValues.push(`${k}:${this.indexes[k]}`)
            indexValues.sort();

            return this._toString({
                suffix: indexValues.join(",")
            });
        }
    }
}
