import { any, AnyCriterion, Criterion } from "@entity-space/criteria";
import { Entity } from "../entity";
import { Expansion, ExpansionObject } from "../expansion";
import { IEntitySchema } from "../schema";
import { reduceQueries } from "./reduce-queries.fn";

// [todo] T is unused
export class Query<
    T extends Entity = Entity,
    C extends Criterion = Criterion,
    E extends ExpansionObject = ExpansionObject
> {
    constructor(entitySchema: IEntitySchema, criteria: C = any() as C, expansion?: E | Expansion<E>) {
        this.entitySchema = entitySchema;
        this.criteria = criteria;
        this.expansion =
            expansion === void 0
                ? new Expansion<E>({} as E)
                : expansion instanceof Expansion
                ? expansion
                : new Expansion<E>(expansion);
    }

    private readonly entitySchema: IEntitySchema;
    private readonly criteria: C;
    private readonly expansion: Expansion<E>;

    getEntitySchema(): IEntitySchema {
        return this.entitySchema;
    }

    getCriteria(): C {
        return this.criteria;
    }

    withCriteria<C extends Criterion>(criteria: C): Query<T, C, E> {
        return new Query(this.entitySchema, criteria, this.expansion);
    }

    getExpansion(): Expansion<E> {
        return this.expansion;
    }

    getExpansionObject(): E {
        return this.expansion.getObject();
    }

    withoutExpansion(): Query<T, C, ExpansionObject> {
        return new Query(this.entitySchema, this.criteria);
    }

    withExpansion(expansion: E | Expansion<E>): Query<T, C, E> {
        return new Query(this.entitySchema, this.criteria, expansion);
    }

    toString(): string {
        const expansion = this.expansion.isEmpty() ? "" : "/" + JSON.stringify(this.expansion.getObject());
        const criterion = this.criteria instanceof AnyCriterion ? "" : ":" + this.criteria.toString();

        return `${this.entitySchema.getId()}${criterion}${expansion}`;
    }

    reduceBy(others: Query<T>[]): false | Query<T>[] {
        return reduceQueries([this], others);
    }

    intersect(other: Query<T>): false | Query<T> {
        const intersectedCriterion = this.getCriteria().intersect(other.getCriteria());

        if (intersectedCriterion === false) {
            return false;
        }

        const intersectedExpansion = this.getExpansion().intersect(other.getExpansion());

        if (intersectedExpansion === false) {
            return false;
        }

        return new Query(this.entitySchema, intersectedCriterion, intersectedExpansion);
    }

    static equivalentCriteria(...queries: Query[]): boolean {
        const [first, ...others] = queries;

        return others.every(other => other.getCriteria().equivalent(first.getCriteria()));
    }
}
