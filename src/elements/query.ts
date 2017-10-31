import { ArrayLike, ToStringable } from "../util";
import { getEntityMetadata, EntityType, IEntity } from "../metadata";
import { Expansion } from "./expansion";
import { Extraction } from "./extraction";
import { Identity, All, ByIds, ByIndexes } from "./identity";
import { Filter } from "./filter";

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

    readonly filter?: Filter;

    /**
     * Extending this class and trying to use it will lead to random exceptions.
     */
    constructor(args: {
        entityType: EntityType<T>;
        identity: Identity;
        expand?: string | ArrayLike<Expansion>;
        filter?: Filter;
    }) {
        this.entityType = args.entityType;
        this.identity = args.identity;
        this.filter = args.filter || null;

        let expansions = (typeof (args.expand) == "string"
            ? Expansion.parse(args.entityType, args.expand)
            : (args.expand || []))
            .slice()
            .sort((a, b) => a.property.name.toLocaleLowerCase() < b.property.name.toLocaleLowerCase() ? -1 : 1);

        this.expansion = expansions.map(exp => exp.toString()).join(",");
        this.expansions = Object.freeze(expansions.slice().sort((a, b) => a.property.name < b.property.name ? -1 : 1));
        this.numExpansions = this.expansions.map(exp => exp.numExpansions).reduce((p, c) => p + c, 0) + this.expansions.length;
    }

    /**
     * If this query points to a bigger or equal set of entities.
     */
    isSupersetOf(other: Query<T>): boolean {
        return this.reduce(other) == null;
    }

    /**
     * If this query points to a lesser or equal set of entities.
     */
    isSubsetOf(other: Query<T>): boolean {
        return other.isSupersetOf(this);
    }

    /**
     * Reduce another query, trying to make its resulting set smaller.
     *
     * Returns the reduced query, or null if it was completely reduced.
     */
    reduce(other: Query<T>): Query<T> {
        if (this.filter != null && other.filter == null) {
            return other;
        }

        let identity = this.identity.reduce(other.identity);

        if (identity == null) {
            if (this.filter != null) {
                let filter = this.filter.reduce(other.filter);
                if (filter == other.filter) return other;

                if (filter == null) {
                    let expansions = Expansion.minus(other.expansions, this.expansions);
                    if (expansions.length == 0) return null;

                    return new Query({
                        entityType: this.entityType,
                        expand: expansions,
                        identity: other.identity,
                        filter: filter
                    });
                } else if (Expansion.isSuperset(this.expansions, other.expansions)) {
                    return new Query({
                        entityType: this.entityType,
                        expand: other.expansions,
                        identity: other.identity,
                        filter: filter
                    });
                } else {
                    return other;
                }
            }

            let expansions = Expansion.minus(other.expansions, this.expansions);
            if (expansions.length == 0) return null;

            return new Query({
                entityType: this.entityType,
                expand: expansions,
                identity: other.identity,
                filter: other.filter
            });
        } else {
            if (this.filter != null) {
                let filter = this.filter.reduce(other.filter);

                if (filter == null && Expansion.isSuperset(this.expansions, other.expansions)) {
                    return new Query({
                        entityType: this.entityType,
                        expand: other.expansions,
                        identity: identity,
                        filter: other.filter
                    });
                } else {
                    return other;
                }
            }

            if (Expansion.isSuperset(this.expansions, other.expansions)) {
                return new Query({
                    entityType: this.entityType,
                    expand: other.expansions,
                    identity: identity,
                    filter: other.filter
                });
            } else {
                return other;
            }
        }
    }

    /**
     * Returns a query with all expansions matching the given predicate missing
     * and the expansions extracted in the process.
     *
     * Extractions are not applied recursively on extraced expansions.
     */
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

    // todo: include filter string representation
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

    /**
     * Create a query pointing to all entities, with an optional expansion & filter.
     */
    static All<T>(args: {
        entity: EntityType<T>;
        expand?: string | ArrayLike<Expansion>;
        filter?: Filter.Criteria;
    }): Query<T> {
        return new Query({
            entityType: args.entity,
            expand: args.expand,
            identity: new All(),
            filter: args.filter ? new Filter(args.filter) : null
        });
    }

    /**
     * Create a query pointing to entities with matching primary keys, with an optional expansion & filter.
     */
    static ByIds<T>(args: {
        entity: EntityType<T>;
        ids: ArrayLike<ToStringable>;
        expand?: string | ArrayLike<Expansion>;
        filter?: Filter.Criteria;
    }): Query<T> {
        return new Query({
            entityType: args.entity,
            expand: args.expand,
            identity: new ByIds(args.ids),
            filter: args.filter ? new Filter(args.filter) : null
        });
    }

    /**
     * Create a query pointing to entities with matching indexed values, with an optional expansion & filter.
     */
    static ByIndexes<T>(args: {
        entity: EntityType<T>;
        criteria: ByIndexes.Criteria;
        expand?: string | ArrayLike<Expansion>;
        filter?: Filter.Criteria;
    }): Query<T> {
        return new Query({
            entityType: args.entity,
            expand: args.expand,
            identity: new ByIndexes(args.criteria),
            filter: args.filter ? new Filter(args.filter) : null
        });
    }
}
