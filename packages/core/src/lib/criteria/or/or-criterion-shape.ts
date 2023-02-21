import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IOrCriterion } from "./or-criterion.interface";

export class OrCriterionShape<T extends ICriterionShape> implements ICriterionShape<IOrCriterion> {
    constructor({ shapes, tools }: { shapes: T[]; tools: IEntityCriteriaTools }) {
        this.shapes = shapes;
        this.tools = tools;
    }

    readonly [ICriterionShape$] = true;
    private readonly tools: IEntityCriteriaTools;
    private readonly shapes: T[];

    reshape(criterion: ICriterion): false | ReshapedCriterion<IOrCriterion> {
        let remapped: ICriterion[] = [];

        const addToRemapped = (criterion: ICriterion) => {
            remapped = remapped.filter(item => criterion.subtractFrom(item) !== true);
            remapped.push(criterion);
        };

        for (const shape of this.shapes) {
            const result = shape.reshape(criterion);

            if (result === false) {
                continue;
            }

            for (const item of result.getReshaped()) {
                addToRemapped(item);
            }

            if (result.getOpen().length === 0) {
                return new ReshapedCriterion([this.tools.or(remapped)]);
            }

            criterion = this.tools.or(result.getOpen());
        }

        if (remapped.length > 0) {
            // [todo] can we replace Criterion[] w/ just Criterion @ RemapCriterionResult?
            // in this case, a single OrCriteria() which is not nested in a 1-element array
            // [todo] confusing at first that we supply "criterion" for the "open" parameter,
            // as it is the argument given to this function. you have to read the code of this
            // function to see that it is reassigned; very smelly.
            return new ReshapedCriterion([this.tools.or(remapped)], [criterion]);
        }

        return false;
    }

    toString(): string {
        return `(${this.shapes.map(shape => shape.toString()).join(" | ")})`;
    }
}
