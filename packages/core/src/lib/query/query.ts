import { ExpansionValue } from "@entity-space/common";
import { any, AnyCriterion, Criterion } from "@entity-space/criteria";
import { Expansion } from "../expansion/expansion";
import { IEntitySchema } from "../schema/schema.interface";
import { reduceQueries } from "./reduce-queries.fn";

// [todo] T is unused
export class Query {
    constructor(entitySchema: IEntitySchema, criteria: Criterion = any(), expansion?: Expansion | ExpansionValue) {
        this.entitySchema = entitySchema;
        this.criteria = criteria;
        this.expansion =
            expansion === void 0
                ? new Expansion({ schema: entitySchema, value: true })
                : expansion instanceof Expansion
                ? expansion
                : new Expansion({ schema: entitySchema, value: expansion });
    }

    private readonly entitySchema: IEntitySchema;
    private readonly criteria: Criterion;
    private readonly expansion: Expansion;

    getEntitySchema(): IEntitySchema {
        return this.entitySchema;
    }

    getCriteria(): Criterion {
        return this.criteria;
    }

    withCriteria(criteria: Criterion): Query {
        return new Query(this.entitySchema, criteria, this.expansion);
    }

    getExpansion(): Expansion {
        return this.expansion;
    }

    getExpansionValue() {
        return this.expansion.getValue();
    }

    withoutExpansion(): Query {
        return new Query(this.entitySchema, this.criteria);
    }

    withExpansion(expansion: Expansion | ExpansionValue): Query {
        return new Query(this.entitySchema, this.criteria, expansion);
    }

    toString(): string {
        const expansion = this.expansion.isEmpty() ? "" : "/" + this.expansion.toString();
        const criterion = this.criteria instanceof AnyCriterion ? "" : ":" + this.criteria.toString();

        return `${this.entitySchema.getId()}${criterion}${expansion}`;
    }

    reduceBy(others: Query[]): false | Query[] {
        return reduceQueries([this], others);
    }

    intersect(other: Query): false | Query {
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

    static equivalent(...queries: Query[]): boolean {
        const [first, ...others] = queries;

        return others.every(
            other =>
                other.getCriteria().equivalent(first.getCriteria()) &&
                other.getExpansion().equivalent(first.getExpansion())
        );
    }
}
