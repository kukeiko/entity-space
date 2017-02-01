import * as _ from "lodash";
import { getEntityMetadata, IEntityType } from "./metadata";
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
        expansions?: string | Expansion[];
    }) {
        this.entityType = args.entityType;

        let expansions = typeof (args.expansions) == "string"
            ? Expansion.parse(args.entityType, args.expansions)
            : (args.expansions || []);

        this.expansions = Object.freeze(expansions.slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1));
    }

    static equals<T>(a: Query<T>, b: Query<T>): boolean {
        return a.toString() == b.toString();
    }

    static parse<T>(query: string): Query<T> {
        let typeIdentifier: string;
        let rest = "";
        let hasIdentity = false;

        for (let i = 0; i < query.length; ++i) {
            switch (query[i]) {
                case "(":
                    hasIdentity = true;

                case "/":
                    typeIdentifier = query.substring(0, i);
                    rest = query.substring(i + 1);
                    break;
            }

            if (rest) break;
        }

        if (!typeIdentifier) {
            typeIdentifier = query;
        }

        let metadata = getEntityMetadata(typeIdentifier);

        if (!metadata) {
            throw `no metadata for '${typeIdentifier}' found`;
        }

        if (!hasIdentity) {
            return new Query.All({
                entityType: metadata.entityType,
                expansions: Expansion.parse(metadata.entityType, rest)
            });
        }

        let isInQuotes = false;
        let identity = "";

        for (let i = 0; i < rest.length; ++i) {
            let c = rest[i];

            if (!isInQuotes) {
                if (c == ")") {
                    identity = rest.substring(0, i);
                    rest = rest.substring(i + 2);
                    break;
                } else if (c == "/") {
                    identity = rest.substring(0, i);
                    rest = rest.substring(i + 1);
                    break;
                }
            }

            if (c == "\"") {
                isInQuotes = !isInQuotes;
            } else if (c == "\\" && rest[i + 1] == "\"") {
                i++;
            }
        }

        let value: Object;

        try {
            value = JSON.parse(identity);
        } catch (error) {
            throw `invalid identity format: ${error}`;
        }

        if (typeof (value) == "number" || typeof (value) == "string") {
            return new Query.ByKey({
                entityType: metadata.entityType,
                expansions: Expansion.parse(metadata.entityType, rest),
                key: value
            });
        } else if (value instanceof Array) {
            return new Query.ByKeys({
                entityType: metadata.entityType,
                expansions: Expansion.parse(metadata.entityType, rest),
                keys: value
            });
        } else {
            let keys = Object.keys(value);

            if (keys.length == 0) {
                throw `empty index`;
            }

            if (keys.length == 1) {
                return new Query.ByIndex({
                    entityType: metadata.entityType,
                    expansions: Expansion.parse(metadata.entityType, rest),
                    index: keys[0],
                    value: (value as any)[keys[0]] // todo: dirty
                });
            } else {
                return new Query.ByIndexes({
                    entityType: metadata.entityType,
                    expansions: Expansion.parse(metadata.entityType, rest),
                    indexes: value as any // todo: dirty
                });
            }
        }
    }

    abstract isSuperSetOf(other: Query<T>): boolean;

    isSubsetOf(other: Query<T>): boolean {
        return other.isSuperSetOf(this);
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

            case "index":
                q = new Query.ByIndex<T>({ index: self.index, value: self.value, entityType: self.entityType, expansions: expansions });
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
    export class All<T> extends Query<T> {
        readonly type = "all";

        isSuperSetOf(other: Query<T>): boolean {
            if (other.entityType != this.entityType) return false;

            return Expansion.isSuperset(this.expansions.slice(), other.expansions.slice());
        }
    }

    export class ByKey<T> extends Query<T> {
        readonly type = "key";
        readonly key: any;

        constructor(args: {
            key: any;
            entityType: IEntityType<T>;
            expansions?: string | Expansion[];
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
        readonly type = "keys";
        readonly keys: ReadonlyArray<any>;
        private readonly _sortedKeys: Array<any>;

        constructor(args: {
            keys: any[];
            entityType: IEntityType<T>;
            expansions?: string | Expansion[];
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
        readonly type = "index";
        readonly index: string;
        readonly value: any;

        constructor(args: {
            index: string;
            value: any;
            entityType: IEntityType<T>;
            expansions?: string | Expansion[];
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
        readonly type = "indexes";
        readonly indexes: Readonly<{ [key: string]: Object }>;

        constructor(args: {
            indexes: { [key: string]: Object };
            entityType: IEntityType<T>;
            expansions?: string | Expansion[];
        }) {
            super(args);

            // tslint:disable-next-line:semicolon
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
            // tslint:disable-next-line:semicolon
        }
    }
}

export type QueryType<T> =
    Query.All<T>
    | Query.ByIndex<T>
    | Query.ByIndexes<T>
    | Query.ByKey<T>
    | Query.ByKeys<T>;
