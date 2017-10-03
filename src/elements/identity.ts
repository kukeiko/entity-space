import * as _ from "lodash";
import { ArrayLike, ToStringable } from "../util";

/**
 * An Identity points to a specific set of entities.
 */
export type Identity = All | ByIds | ByIndexes;

/**
 * All the types of identities.
 */
export type Identities = Identity["type"];

/**
 * Common code of identities.
 */
export abstract class IdentityBase {
    abstract type: any;

    /**
     * How likely it is to reduce another identity (lower is better).
     */
    abstract priority: any;

    /**
     * Reduce another identity, trying to make its resulting set smaller.
     */
    abstract reduce(other: Identity): Identity;

    private readonly _toString: string;

    constructor(toString: string) {
        this._toString = toString;
    }

    /**
     * If this identity points to a bigger or equal set of entities.
     */
    isSupersetOf(other: Identity): boolean {
        return this.reduce(other) == null;
    }

    /**
     * If this identity points to a lesser or equal set of entities.
     */
    isSubsetOf(other: Identity): boolean {
        return other.isSupersetOf(this);
    }

    /**
     * If this identity points to the same set of entities.
     */
    equals(other: Identity): boolean {
        return this._toString == other.toString();
    }

    toString(): string {
        return this._toString;
    }
}

/**
 * Points to all entities.
 */
export class All extends IdentityBase {
    readonly type = "all";

    /** @inheritdoc */
    readonly priority = 0;

    constructor() {
        super("all");
    }

    /** @inheritdoc */
    reduce(other: Identity): Identity | null {
        return null;
    }
}

/**
 * Points a set of entities referenced by their primary keys.
 */
export class ByIds extends IdentityBase {
    readonly type = "ids";

    /** @inheritdoc */
    readonly priority = 1;
    readonly ids: ReadonlyArray<ToStringable>;

    constructor(ids: ArrayLike<ToStringable>) {
        // todo: escape commas in ids
        super(Object.freeze(ids.slice().sort()).join(","));

        if (ids.length == 0) {
            throw new Error(`can't create an [ids] identity with an empty array of ids`);
        }

        this.ids = Object.freeze(ids.slice());
        Object.freeze(this);
    }

    /** @inheritdoc */
    reduce(other: Identity): Identity | null {
        switch (other.type) {
            case "ids":
                let diff = _.difference(other.ids, this.ids);
                if (diff.length == 0) return null;

                return diff.length == other.ids.length ? other : new ByIds(diff);

            default:
                return other;
        }
    }
}

/**
 * Points to a set of entities referenced by indexed properties.
 */
export class ByIndexes extends IdentityBase {
    readonly type = "indexes";

    /** @inheritdoc */
    readonly priority = 2;

    /**
     * Specific values indexed properties of entities must have.
     */
    readonly criteria: Readonly<ByIndexes.Criteria>;

    constructor(criteria: ByIndexes.Criteria) {
        // todo: escape colons & commas in indexes
        super(Object.keys(criteria).sort().map(k => `${k}:${criteria[k].toString()}`).join(","));

        if (Object.keys(criteria).length == 0) {
            throw new Error(`can't create an [indexes] identity with empty index criteria`);
        }

        this.criteria = Object.freeze({ ...criteria });
        Object.freeze(this);
    }

    /** @inheritdoc */
    reduce(other: Identity): Identity | null {
        switch (other.type) {
            case "indexes":
                for (let key in other.criteria) {
                    if (!(key in this.criteria) || this.criteria[key] != other.criteria[key]) {
                        return other;
                    }
                }
                return null;

            default:
                return other;
        }
    }
}

export module ByIndexes {
    /**
     * Specific values indexed properties of entities must have.
     */
    export type Criteria = { [key: string]: ToStringable };
}
