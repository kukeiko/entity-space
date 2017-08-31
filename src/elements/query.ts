import { ArrayLike, ToStringable } from "../util";
import { getEntityMetadata, EntityType, IEntity } from "../metadata";
import { Expansion } from "./expansion";
import { Extraction } from "./extraction";
import { Identity, All, ByIds, ByIndexes, Indexes } from "./identity";

/**
 * Describes which entities and expansions should be considered for an operation.
 *
 * Immutable
 */
export class Query<T extends IEntity> {
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
    constructor(args: {
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

    reduce(other: Query<T>): Query<T> {
        let identity = this.identity.reduce(other.identity);

        if (identity == null) {
            let expansions = Expansion.minus(other.expansions, this.expansions);
            if (expansions.length == 0) return null;

            return new Query({
                entityType: this.entityType,
                expand: expansions,
                identity: other.identity
            });
        } else {
            if (Expansion.isSuperset(this.expansions, other.expansions)) {
                return new Query({
                    entityType: this.entityType,
                    expand: other.expansions,
                    identity: identity
                });
            } else {
                return other;
            }
        }
    }

    isSupersetOf(other: Query<T>): boolean {
        return this.reduce(other) == null;
    }

    isSubsetOf(other: Query<T>): boolean {
        return other.isSupersetOf(this);
    }

    extract(predicate: (p: Expansion) => boolean): [Query<T>, Extraction[]] {
        let extractions = new Array<Extraction>();
        let expansions = new Array<Expansion>();
        let exp: Expansion;

        for (let i = 0; i < this.expansions.length; ++i) {
            exp = this.expansions[i];

            if (predicate(exp)) {
                extractions.push(new Extraction({ extracted: exp }));
            } else {
                let [subExp, subExtractions] = exp.extract(predicate);

                expansions.push(subExp);
                extractions = extractions.concat(subExtractions);
            }
        }

        let query = new Query({
            entityType: this.entityType,
            expand: expansions,
            identity: this.identity
        });

        return [query, extractions];
    }

    toString(): string {
        let val = `${getEntityMetadata(this.entityType).name}(${this.identity})`;

        if (this.expansions.length > 0) {
            val += "/";

            if (this.expansions.length > 1) val += "{";
            val += this.expansions.map(exp => exp.toString()).join(",");
            if (this.expansions.length > 1) val += "}";
        }

        return val;
    }

    static All<T>(args: {
        entity: EntityType<T>;
        expand?: string | ArrayLike<Expansion>;
    }): Query<T> {
        return new Query({
            entityType: args.entity,
            expand: args.expand,
            identity: new All()
        });
    }

    static ByIds<T>(args: {
        entity: EntityType<T>;
        ids: ArrayLike<ToStringable>;
        expand?: string | ArrayLike<Expansion>;
    }): Query<T> {
        return new Query({
            entityType: args.entity,
            expand: args.expand,
            identity: new ByIds(args.ids)
        });
    }

    static ByIndexes<T>(args: {
        entity: EntityType<T>;
        indexes: Indexes;
        expand?: string | ArrayLike<Expansion>;
    }): Query<T> {
        return new Query({
            entityType: args.entity,
            expand: args.expand,
            identity: new ByIndexes(args.indexes)
        });
    }
}
