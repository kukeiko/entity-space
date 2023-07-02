import { Entity } from "../common/entity.type";
import { UnpackedEntitySelection } from "../common/unpacked-entity-selection.type";
import { ICriterion } from "../criteria/criterion.interface";
import { EntityCriteriaTools } from "../criteria/entity-criteria-tools";
import { IEntityCriteriaTools } from "../criteria/entity-criteria-tools.interface";
import { EntityCriteria } from "../criteria/entity-criteria/entity-criteria";
import { IEntitySchema } from "../schema/schema.interface";
import { IEntityQueryTools } from "./entity-query-tools.interface";
import { IEntityQuery } from "./entity-query.interface";
import { EntitySelection } from "./entity-selection";
import { QueryPaging } from "./query-paging";

export class EntityQuery implements IEntityQuery {
    constructor({
        criteria,
        entitySchema,
        queryTools,
        paging,
        parameters,
        selection,
    }: {
        criteria: ICriterion;
        entitySchema: IEntitySchema;
        queryTools: IEntityQueryTools;
        paging?: QueryPaging;
        parameters?: Entity;
        selection: EntitySelection;
    }) {
        this.entitySchema = entitySchema;
        this.criteria = criteria;
        this.selection = selection;
        this.paging = paging;
        this.parameters = parameters;
        this.queryTools = queryTools;
    }

    private readonly entitySchema: IEntitySchema;
    private readonly criteria: ICriterion;
    private readonly selection: EntitySelection;
    private readonly paging?: QueryPaging;
    private readonly parameters?: Entity;
    private readonly criteriaTools: IEntityCriteriaTools = new EntityCriteriaTools();
    private readonly queryTools: IEntityQueryTools;

    getEntitySchema(): IEntitySchema {
        return this.entitySchema;
    }

    getCriteria(): ICriterion {
        return this.criteria;
    }

    getPaging(): QueryPaging | undefined {
        return this.paging;
    }

    getParameters(): Entity | undefined {
        return this.parameters;
    }

    withCriteria(criteria: ICriterion): IEntityQuery {
        return this.queryTools.createQuery({ entitySchema: this.entitySchema, criteria, selection: this.selection });
    }

    getSelection(): EntitySelection {
        return this.selection;
    }

    getSelectionValue() {
        return this.selection.getValue();
    }

    withoutSelection(): IEntityQuery {
        return this.queryTools.createQuery({ entitySchema: this.entitySchema, criteria: this.criteria });
    }

    withSelection(selection: EntitySelection | UnpackedEntitySelection): IEntityQuery {
        return this.queryTools.createQuery({ entitySchema: this.entitySchema, criteria: this.criteria, selection });
    }

    toString(): string {
        const parameters = this.parameters === void 0 ? "" : `<${JSON.stringify(this.parameters)}>`;
        const criterion = this.criteriaTools.isAllCriterion(this.criteria) ? "" : `(${this.criteria.toString()})`;
        const paging = this.paging ? this.paging.toString() : "";
        const selection = this.selection.isEmpty() ? "" : "/" + this.selection.toString();

        return `${this.entitySchema.getId()}${parameters}${criterion}${paging}${selection}`;
    }

    subtractBy(others: IEntityQuery[]): false | IEntityQuery[] {
        return this.queryTools.subtractQueries([this], others);
    }

    // [todo] #30 parameters intersection missing
    intersect(other: IEntityQuery): false | IEntityQuery {
        const criteria = this.getCriteria().intersect(other.getCriteria());

        if (criteria === false) {
            return false;
        }

        const selection = this.getSelection().intersect(other.getSelection());

        if (selection === false) {
            return false;
        }

        return this.queryTools.createQuery({
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
            this.criteriaTools
        );

        return this.withCriteria(intersectedWithoutDehydrated);
    }

    static equivalentCriteria(...queries: IEntityQuery[]): boolean {
        const [first, ...others] = queries;

        return others.every(other => other.getCriteria().equivalent(first.getCriteria()));
    }

    // [todo] #30 parameters equivalency missing
    static equivalent(...queries: IEntityQuery[]): boolean {
        const [first, ...others] = queries;

        return others.every(
            other =>
                other.getCriteria().equivalent(first.getCriteria()) &&
                other.getSelection().equivalent(first.getSelection())
        );
    }
}
