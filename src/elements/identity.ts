import * as _ from "lodash";
import { ArrayLike, ToStringable } from "../util";

export type Identity = All | ById | ByIds | ByIndexes;
export type Identites = Identity["type"];
export type IndexCriteria = { [key: string]: ToStringable };

export abstract class IdentityBase {
    abstract type: any;
    abstract reduce(other: Identity): Identity;
    abstract merge(other: Identity): Identity;
    abstract toString(): string;

    isSupersetOf(other: Identity): boolean {
        return this.reduce(other) == null;
    }

    isSubsetOf(other: Identity): boolean {
        return other.isSupersetOf(this);
    }
}

export class All extends IdentityBase {
    readonly type = "all";

    /**
     * Returns null if it completely consumes the other (is a superset).
     */
    reduce(other: Identity): Identity | null {
        return null;
    }

    merge(other: Identity): Identity | null {
        return this;
    }

    toString(): string {
        return "all";
    }
}

export class ById extends IdentityBase {
    readonly type = "id";
    readonly id: ToStringable;

    constructor(id: ToStringable) {
        super();
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

    merge(other: Identity): Identity | null {
        switch (other.type) {
            // case "all":
            //     return other;

            case "id":
                return this.id == other.id ? this : null;

            // case "ids":
            //     return other.merge(this);

            default:
                return null;
        }
    }

    toString(): string {
        return this.id.toString();
    }
}

export class ByIds extends IdentityBase {
    readonly type = "ids";
    readonly ids: ReadonlyArray<ToStringable>;

    constructor(ids: ArrayLike<ToStringable>) {
        super();
        this.ids = Object.freeze(ids.slice().sort());

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

    merge(other: Identity): Identity | null {
        switch (other.type) {
            // case "all":
            //     return other;

            case "id":
                return this.ids.includes(other.id) ? this : new ByIds([...this.ids, other.id]);

            case "ids":
                let diff = _.difference(other.ids, this.ids);

                return diff.length == 0 ? this : new ByIds([...this.ids, ...diff]);

            default:
                return null;
        }
    }

    toString(): string {
        return this.ids.join(",");
    }
}

export class ByIndexes extends IdentityBase {
    readonly type = "indexes";
    readonly indexes: Readonly<IndexCriteria>;

    private readonly _toString: string;

    constructor(indexes: IndexCriteria) {
        super();
        this.indexes = Object.freeze({ ...indexes });
        this._toString = Object.keys(this.indexes).sort().map(k => `${k}:${indexes[k].toString()}`).join(",");

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

    merge(other: Identity): Identity | null {
        switch (other.type) {
            case "all":
                return other;

            case "indexes":
                return this.reduce(other) == null ? this : null;

            default:
                return null;
        }
    }

    toString(): string {
        return this._toString;
    }
}
