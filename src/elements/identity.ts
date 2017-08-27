import * as _ from "lodash";
import { ArrayLike, ToStringable } from "../util";

export type Identity = All | ById | ByIds | ByIndexes;
export type Identites = Identity["type"];

export abstract class IdentityBase {
    abstract type: any;
    abstract isSupersetOf(other: Identity): boolean;

    isSubsetOf(other: Identity): boolean {
        return other.isSupersetOf(this);
    }
}

export class All extends IdentityBase {
    readonly type = "all";

    isSupersetOf(other: Identity): boolean {
        return true;
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

    isSupersetOf(other: Identity): boolean {
        switch (other.type) {
            case "id": return this.id == other.id;
            default: return false;
        }
    }

    isSubsetOf(other: Identity): boolean {
        return other.isSupersetOf(this);
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

    isSupersetOf(other: Identity): boolean {
        switch (other.type) {
            case "id": return this.ids.includes(other.id);
            case "ids": return _.difference(other.ids, this.ids).length == 0;
            default: return false;
        }
    }
}

export class ByIndexes extends IdentityBase {
    readonly type = "indexes";
    readonly indexes: Readonly<{ [key: string]: ToStringable }>;

    constructor(indexes: { [key: string]: ToStringable }) {
        super();
        this.indexes = Object.freeze({ ...indexes });

        Object.freeze(this);
    }

    isSupersetOf(other: Identity): boolean {
        switch (other.type) {
            case "indexes":
                for (let key in other.indexes) {
                    if (!(key in this.indexes) || this.indexes[key] != other.indexes[key]) {
                        return false;
                    }
                }
                return true;

            default: return false;
        }
    }
}
