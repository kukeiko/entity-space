import { IEntitySchema, UnpackedEntitySelection } from "@entity-space/common";
import { any, AnyCriterion, Criterion, NamedCriteria, never, NeverCriterion } from "@entity-space/criteria";
import { EntitySelection } from "./entity-selection";
import { QueryPaging } from "./query-paging";
import { subtractQueries } from "./subtract-queries.fn";

export interface EntityQueryCtorArg {
    entitySchema: IEntitySchema;
    criteria?: Criterion;
    options?: Criterion;
    selection?: EntitySelection | UnpackedEntitySelection;
    paging?: QueryPaging;
}

export class EntityQuery {
    constructor({ entitySchema, criteria = any(), options = never(), selection, paging }: EntityQueryCtorArg) {
        this.entitySchema = entitySchema;
        this.options = options;
        this.criteria = criteria;
        this.selection =
            selection === void 0
                ? new EntitySelection({ schema: entitySchema, value: entitySchema.getDefaultSelection() })
                : selection instanceof EntitySelection
                ? selection
                : new EntitySelection({ schema: entitySchema, value: selection });
        this.paging = paging;
    }

    private readonly entitySchema: IEntitySchema;
    private readonly criteria: Criterion;
    private readonly options: Criterion;
    private readonly selection: EntitySelection;
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
        return new EntityQuery({ entitySchema: this.entitySchema, criteria, selection: this.selection });
    }

    getSelection(): EntitySelection {
        return this.selection;
    }

    getSelectionValue() {
        return this.selection.getValue();
    }

    withoutSelection(): EntityQuery {
        return new EntityQuery({ entitySchema: this.entitySchema, criteria: this.criteria });
    }

    withSelection(selection: EntitySelection | UnpackedEntitySelection): EntityQuery {
        return new EntityQuery({ entitySchema: this.entitySchema, criteria: this.criteria, selection });
    }

    toString(): string {
        const options = this.options instanceof NeverCriterion ? "" : `<${this.options.toString()}>`;
        const criterion = this.criteria instanceof AnyCriterion ? "" : `(${this.criteria.toString()})`;
        const paging = this.paging ? this.paging.toString() : "";
        const selection = this.selection.isEmpty() ? "" : "/" + this.selection.toString();

        return `${this.entitySchema.getId()}${options}${criterion}${paging}${selection}`;
    }

    subtractBy(others: EntityQuery[]): false | EntityQuery[] {
        return subtractQueries([this], others);
    }

    intersect(other: EntityQuery): false | EntityQuery {
        const criteria = this.getCriteria().intersect(other.getCriteria());

        if (criteria === false) {
            return false;
        }

        const selection = this.getSelection().intersect(other.getSelection());

        if (selection === false) {
            return false;
        }

        return new EntityQuery({
            entitySchema: this.entitySchema,
            criteria,
            selection,
        });
    }

    intersectCriteriaOmitSelection(other: EntityQuery): false | EntityQuery {
        const intersectedCriterion = other.getCriteria().intersect(this.getCriteria());

        if (!intersectedCriterion) {
            return false;
        }

        const intersectedWithoutDehydrated = NamedCriteria.omitSelection(
            intersectedCriterion,
            other.getSelection().getValue()
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
                other.getSelection().equivalent(first.getSelection())
        );
    }
}
