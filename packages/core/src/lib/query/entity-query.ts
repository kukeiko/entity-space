import { ExpansionValue, IEntitySchema } from "@entity-space/common";
import { any, AnyCriterion, Criterion, NamedCriteria, never, NeverCriterion } from "@entity-space/criteria";
import { Expansion } from "../expansion/expansion";
import { QueryPaging } from "./query-paging";
import { reduceQueries } from "./reduce-queries.fn";

export interface EntityQueryCtorArg {
    entitySchema: IEntitySchema;
    criteria?: Criterion;
    options?: Criterion;
    expansion?: Expansion | ExpansionValue;
    paging?: QueryPaging;
}

export class EntityQuery {
    constructor({ entitySchema, criteria = any(), options = never(), expansion, paging }: EntityQueryCtorArg) {
        this.entitySchema = entitySchema;
        this.options = options;
        this.criteria = criteria;
        this.expansion =
            expansion === void 0
                ? new Expansion({ schema: entitySchema, value: true })
                : expansion instanceof Expansion
                ? expansion
                : new Expansion({ schema: entitySchema, value: expansion });
        this.paging = paging;
    }

    private readonly entitySchema: IEntitySchema;
    private readonly criteria: Criterion;
    private readonly options: Criterion;
    private readonly expansion: Expansion;
    private readonly paging?: QueryPaging;

    getEntitySchema(): IEntitySchema {
        return this.entitySchema;
    }

    getCriteria(): Criterion {
        return this.criteria;
    }

    getOptions(): Criterion {
        return this.options;
    }

    getPaging(): QueryPaging | undefined {
        return this.paging;
    }

    withCriteria(criteria: Criterion): EntityQuery {
        return new EntityQuery({ entitySchema: this.entitySchema, criteria, expansion: this.expansion });
    }

    getExpansion(): Expansion {
        return this.expansion;
    }

    getExpansionValue() {
        return this.expansion.getValue();
    }

    withoutExpansion(): EntityQuery {
        return new EntityQuery({ entitySchema: this.entitySchema, criteria: this.criteria });
    }

    withExpansion(expansion: Expansion | ExpansionValue): EntityQuery {
        return new EntityQuery({ entitySchema: this.entitySchema, criteria: this.criteria, expansion });
    }

    toString(): string {
        const options = this.options instanceof NeverCriterion ? "" : `<${this.options.toString()}>`;
        const criterion = this.criteria instanceof AnyCriterion ? "" : `(${this.criteria.toString()})`;
        const paging = this.paging ? this.paging.toString() : "";
        const expansion = this.expansion.isEmpty() ? "" : "/" + this.expansion.toString();

        return `${this.entitySchema.getId()}${options}${criterion}${paging}${expansion}`;
    }

    reduceBy(others: EntityQuery[]): false | EntityQuery[] {
        return reduceQueries([this], others);
    }

    // [todo] not actually used anywhere
    intersect(other: EntityQuery): false | EntityQuery {
        const intersectedCriterion = this.getCriteria().intersect(other.getCriteria());

        if (intersectedCriterion === false) {
            return false;
        }

        const intersectedExpansion = this.getExpansion().intersect(other.getExpansion());

        if (intersectedExpansion === false) {
            return false;
        }

        return new EntityQuery({
            entitySchema: this.entitySchema,
            criteria: intersectedCriterion,
            expansion: intersectedExpansion,
        });
    }

    intersectCriteriaOmitExpansion(other: EntityQuery): false | EntityQuery {
        const intersectedCriterion = other.getCriteria().intersect(this.getCriteria());

        if (!intersectedCriterion) {
            return false;
        }

        const intersectedWithoutDehydrated = NamedCriteria.omitExpansion(
            intersectedCriterion,
            other.getExpansion().getValue()
        );

        if (intersectedWithoutDehydrated === intersectedCriterion) {
            return false;
        }

        return this.withCriteria(intersectedWithoutDehydrated);
    }

    static equivalentCriteria(...queries: EntityQuery[]): boolean {
        const [first, ...others] = queries;

        return others.every(other => other.getCriteria().equivalent(first.getCriteria()));
    }

    static equivalent(...queries: EntityQuery[]): boolean {
        const [first, ...others] = queries;

        return others.every(
            other =>
                other.getCriteria().equivalent(first.getCriteria()) &&
                other.getExpansion().equivalent(first.getExpansion())
        );
    }
}
