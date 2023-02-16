import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { IAllCriterion } from "../criteria/vnext/all/all-criterion.interface";
import { ICriterion } from "../criteria/vnext/criterion.interface";
import { EntityCriteriaFactory } from "../criteria/vnext/entity-criteria-factory";
import { EntityCriteria } from "../criteria/vnext/entity-criteria/entity-criteria";
import { INeverCriterion } from "../criteria/vnext/never/never-criterion.interface";
import { IEntitySchema } from "../schema/schema.interface";
import { IEntityQueryFactory } from "./entity-query-factory.interface";
import { IEntityQuery } from "./entity-query.interface";
import { EntitySelection } from "./entity-selection";
import { QueryPaging } from "./query-paging";
import { subtractQueries } from "./subtract-queries.fn";

export class EntityQuery implements IEntityQuery {
    constructor({
        criteria,
        entitySchema,
        factory,
        options,
        paging,
        selection,
    }: {
        criteria: ICriterion;
        entitySchema: IEntitySchema;
        factory: IEntityQueryFactory;
        options: ICriterion;
        paging?: QueryPaging;
        selection: EntitySelection;
    }) {
        this.entitySchema = entitySchema;
        this.options = options;
        this.criteria = criteria;
        this.selection = selection;
        this.paging = paging;
        this.factory = factory;
    }

    private readonly entitySchema: IEntitySchema;
    private readonly criteria: ICriterion;
    private readonly options: ICriterion;
    private readonly selection: EntitySelection;
    private readonly paging?: QueryPaging;
    private readonly factory: IEntityQueryFactory;

    getEntitySchema(): IEntitySchema {
        return this.entitySchema;
    }

    getCriteria(): ICriterion {
        return this.criteria;
    }

    getOptions(): ICriterion {
        return this.options;
    }

    getPaging(): QueryPaging | undefined {
        return this.paging;
    }

    withCriteria(criteria: ICriterion): IEntityQuery {
        return this.factory.createQuery({ entitySchema: this.entitySchema, criteria, selection: this.selection });
    }

    getSelection(): EntitySelection {
        return this.selection;
    }

    getSelectionValue() {
        return this.selection.getValue();
    }

    withoutSelection(): IEntityQuery {
        return this.factory.createQuery({ entitySchema: this.entitySchema, criteria: this.criteria });
    }

    withSelection(selection: EntitySelection | UnpackedEntitySelection): IEntityQuery {
        return this.factory.createQuery({ entitySchema: this.entitySchema, criteria: this.criteria, selection });
    }

    toString(): string {
        const options = INeverCriterion.is(this.options) ? "" : `<${this.options.toString()}>`;
        const criterion = IAllCriterion.is(this.criteria) ? "" : `(${this.criteria.toString()})`;
        const paging = this.paging ? this.paging.toString() : "";
        const selection = this.selection.isEmpty() ? "" : "/" + this.selection.toString();

        return `${this.entitySchema.getId()}${options}${criterion}${paging}${selection}`;
    }

    subtractBy(others: IEntityQuery[]): false | IEntityQuery[] {
        return subtractQueries([this], others);
    }

    intersect(other: IEntityQuery): false | IEntityQuery {
        const criteria = this.getCriteria().intersect(other.getCriteria());

        if (criteria === false) {
            return false;
        }

        const selection = this.getSelection().intersect(other.getSelection());

        if (selection === false) {
            return false;
        }

        return this.factory.createQuery({
            entitySchema: this.entitySchema,
            criteria,
            selection,
        });
    }

    intersectCriteriaOmitSelection(other: IEntityQuery): false | IEntityQuery {
        const intersectedCriterion = other.getCriteria().intersect(this.getCriteria());

        if (!intersectedCriterion) {
            return false;
        }

        const intersectedWithoutDehydrated = EntityCriteria.omitSelection(
            intersectedCriterion,
            other.getSelection().getValue(),
            // [todo] hardcoded
            new EntityCriteriaFactory()
        );

        if (intersectedWithoutDehydrated === intersectedCriterion) {
            return false;
        }

        return this.withCriteria(intersectedWithoutDehydrated);
    }

    static equivalentCriteria(...queries: IEntityQuery[]): boolean {
        const [first, ...others] = queries;

        return others.every(other => other.getCriteria().equivalent(first.getCriteria()));
    }

    static equivalent(...queries: IEntityQuery[]): boolean {
        const [first, ...others] = queries;

        return others.every(
            other =>
                other.getCriteria().equivalent(first.getCriteria()) &&
                other.getSelection().equivalent(first.getSelection())
        );
    }
}
