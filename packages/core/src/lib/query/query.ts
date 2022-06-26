import { any, AnyCriterion, Criterion } from "@entity-space/criteria";
import { Entity } from "../entity/entity";
import { Expansion } from "../expansion/expansion";
import { ExpansionObject } from "../expansion/expansion-object";
import { IEntitySchema } from "../schema/schema.interface";
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

    static equivalentCriteria(...queries: Query[]): boolean {
        const [first, ...others] = queries;

        return others.every(other => other.getCriteria().equivalent(first.getCriteria()));
    }
}
