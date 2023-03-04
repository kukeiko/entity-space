import { permutateEntries } from "@entity-space/utils";
import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { reshapeOrCriteria } from "../reshape-or-criteria.fn";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IEntityCriteria } from "./entity-criteria.interface";

export class EntityCriteriaShape implements ICriterionShape<IEntityCriteria> {
    constructor({
        tools,
        required,
        optional,
    }: {
        tools: IEntityCriteriaTools;
        required: Record<string, ICriterionShape>;
        optional?: Record<string, ICriterionShape>;
    }) {
        this.tools = tools;
        this.required = required;
        this.optional = optional;
    }

    readonly [ICriterionShape$] = true;
    private readonly tools: IEntityCriteriaTools;
    private readonly required: Record<string, ICriterionShape>;
    private readonly optional?: Record<string, ICriterionShape>;

    reshape(criterion: ICriterion): false | ReshapedCriterion<IEntityCriteria> {
        if (this.tools.isEntityCriteria(criterion)) {
            return this.reshapeEntityCriteria(criterion);
        } else if (this.tools.isOrCriterion(criterion)) {
            return reshapeOrCriteria(this, criterion);
        }

        return false;
    }

    // [todo] what happens if the shape has overlapping $required & $optional shapes?
    // example: { [$required]: { bar: { id: Number } }, [$optional]: { bar: { name: String } } }
    private reshapeEntityCriteria(criterion: IEntityCriteria): false | ReshapedCriterion<IEntityCriteria> {
        const criteria = criterion.getCriteria();
        const criteriaToPermutate: Record<string, ICriterion[]> = {};
        const openCriteria: Record<string, ICriterion[]> = {};

        for (const [key, shape] of Object.entries(this.required)) {
            const criterion = criteria[key];

            if (criterion === void 0) {
                return false;
            }

            const reshaped = shape.reshape(criterion);

            if (reshaped === false) {
                return false;
            }

            criteriaToPermutate[key] = reshaped.getReshaped();

            if (reshaped.getOpen().length) {
                openCriteria[key] = reshaped.getOpen();
            }
        }

        for (const [key, shape] of Object.entries(this.optional ?? {})) {
            const criterion = criteria[key];

            if (criterion === void 0) {
                continue;
            }

            const reshaped = shape.reshape(criterion);

            // [todo] interesting that we check against open here. should understand and document the reason
            if (reshaped === false || reshaped.getOpen().length) {
                continue;
            }

            criteriaToPermutate[key] = reshaped.getReshaped();
        }

        if (!Object.keys(criteriaToPermutate).length && Object.keys(this.required).length) {
            return false;
        }

        const reshaped = permutateEntries(criteriaToPermutate).map(criteria => this.tools.where(criteria));

        const open = Object.entries(openCriteria).map(([key, openCriteria]) =>
            this.tools.where({ ...criteria, [key]: this.tools.or(openCriteria) })
        );

        return new ReshapedCriterion(reshaped, open);
    }

    toString(): string {
        return `{ ${[
            ...Object.entries(this.required).map(([key, value]) => `${key}: ${value.toString()}`),
            ...Object.entries(this.optional ?? {}).map(([key, value]) => `${key}?: ${value.toString()}`),
        ].join(", ")} }`;
    }
}
