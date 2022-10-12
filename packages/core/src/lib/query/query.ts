import { ExpansionValue, IEntitySchema } from "@entity-space/common";
import { any, AnyCriterion, Criterion } from "@entity-space/criteria";
import { NeverCriterion } from "packages/criteria/src/lib/criterion/never/never";
import { never } from "packages/criteria/src/lib/criterion/never/never.fn";
import { Expansion } from "../expansion/expansion";
import { reduceQueries } from "./reduce-queries.fn";

export interface EntityQueryCtorArg {
    entitySchema: IEntitySchema;
    criteria?: Criterion;
    options?: Criterion;
    expansion?: Expansion | ExpansionValue;
}

export class Query {
    constructor({
        entitySchema,
        criteria = any(),
        options = never(),
        expansion,
    }: {
        entitySchema: IEntitySchema;
        criteria?: Criterion;
        options?: Criterion;
        expansion?: Expansion | ExpansionValue;
    }) {
        this.entitySchema = entitySchema;
        this.options = options;
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
    private readonly options: Criterion;
    private readonly expansion: Expansion;

    getEntitySchema(): IEntitySchema {
        return this.entitySchema;
    }

    getCriteria(): Criterion {
        return this.criteria;
    }

    getOptions(): Criterion {
        return this.options;
    }

    withCriteria(criteria: Criterion): Query {
        return new Query({ entitySchema: this.entitySchema, criteria, expansion: this.expansion });
    }

    getExpansion(): Expansion {
        return this.expansion;
    }

    getExpansionValue() {
        return this.expansion.getValue();
    }

    withoutExpansion(): Query {
        return new Query({ entitySchema: this.entitySchema, criteria: this.criteria });
    }

    withExpansion(expansion: Expansion | ExpansionValue): Query {
        return new Query({ entitySchema: this.entitySchema, criteria: this.criteria, expansion });
    }

    toString(): string {
        const options = this.options instanceof NeverCriterion ? "" : `<${this.options.toString()}>`;
        const criterion = this.criteria instanceof AnyCriterion ? "" : `(${this.criteria.toString()})`;
        const expansion = this.expansion.isEmpty() ? "" : "/" + this.expansion.toString();

        return `${this.entitySchema.getId()}${options}${criterion}${expansion}`;
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

        return new Query({
            entitySchema: this.entitySchema,
            criteria: intersectedCriterion,
            expansion: intersectedExpansion,
        });
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
