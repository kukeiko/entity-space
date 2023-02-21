import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaTools } from "../entity-criteria-tools.interface";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IAndCriterion } from "./and-criterion.interface";

export class AndCriterionShape<T extends ICriterionShape> implements ICriterionShape<IAndCriterion> {
    constructor({ shapes, tools }: { shapes: T[]; tools: IEntityCriteriaTools }) {
        this.shapes = shapes;
        this.tools = tools;
    }

    readonly [ICriterionShape$] = true;
    private readonly tools: IEntityCriteriaTools;
    private readonly shapes: T[];

    reshape(criterion: ICriterion): false | ReshapedCriterion<IAndCriterion> {
        /**
         * (A&B) | (C&D) => A&B | C&D
         * (A|B) & (C|D) => A&C | A&D | B&C | B&D
         * A = (0|1) & (2|3)
         * (((0|1) & (2|3)) | B) & (C|D) => 0&2&C | 0&3&C | 1&2&C | 1&3&C | 0&2&D | 0&3&D | 1&2&D | 1&3&D | B&C | B&D
         */
        throw new Error("Method not implemented.");
    }

    toString(): string {
        return `(${this.shapes.map(shape => shape.toString()).join(" & ")})`;
    }
}
