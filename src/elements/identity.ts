import * as _ from "lodash";
import { ArrayLike, ToStringable } from "../util";

export type Identity = All | ById | ByIds | ByIndexes;
export type Identites = Identity["type"];
export type IndexCriteria = { [key: string]: ToStringable };

export abstract class IdentityBase {
    abstract type: any;
    abstract priority: any;
    abstract reduce(other: Identity): Identity;

    private readonly _toString: string;

    constructor(toString: string) {
        this._toString = toString;
    }

    isSupersetOf(other: Identity): boolean {
        return this.reduce(other) == null;
    }

    isSubsetOf(other: Identity): boolean {
        return other.isSupersetOf(this);
    }

    equals(other: Identity): boolean {
        return this._toString == other.toString();
    }

    toString(): string {
        return this._toString;
    }
}

export class All extends IdentityBase {
    readonly type = "all";
    readonly priority = 0;

    constructor() {
        super("all");
    }

    /**
     * Returns null if it completely consumes the other (is a superset).
     */
    reduce(other: Identity): Identity | null {
        return null;
    }
}

export class ById extends IdentityBase {
    readonly type = "id";
    readonly priority = 2;
    readonly id: ToStringable;

    constructor(id: ToStringable) {
        super(id.toString());
        this.id = id;

        Object.freeze(this);
    }

    reduce(other: Identity): Identity | null {
        switch (other.type) {
            case "id":
                return this.id == other.id ? null : other;

            default:
                return other;
        }
    }
}

export class ByIds extends IdentityBase {
    readonly type = "ids";
    readonly priority = 1;
    readonly ids: ReadonlyArray<ToStringable>;

    constructor(ids: ArrayLike<ToStringable>) {
        // todo: escape commas in ids
        super(Object.freeze(ids.slice().sort()).join(","));
        this.ids = Object.freeze(ids.slice());

        Object.freeze(this);
    }

    reduce(other: Identity): Identity | null {
        switch (other.type) {
            case "id":
                return this.ids.includes(other.id) ? null : other;

            case "ids":
                let diff = _.difference(other.ids, this.ids);
                if (diff.length == 0) return null;

                return diff.length == other.ids.length ? other : new ByIds(diff);

            default:
                return other;
        }
    }
}

export class ByIndexes extends IdentityBase {
    readonly type = "indexes";
    readonly priority = 3;
    readonly indexes: Readonly<IndexCriteria>;

    constructor(indexes: IndexCriteria) {
        // todo: escape colons & commas in indexes
        super(Object.keys(indexes).sort().map(k => `${k}:${indexes[k].toString()}`).join(","));
        this.indexes = Object.freeze({ ...indexes });

        Object.freeze(this);
    }

    reduce(other: Identity): Identity | null {
        switch (other.type) {
            case "indexes":
                for (let key in other.indexes) {
                    if (!(key in this.indexes) || this.indexes[key] != other.indexes[key]) {
                        return other;
                    }
                }
                return null;

            default:
                return other;
        }
    }
}
