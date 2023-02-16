import { ICriterionShape, ICriterionShape$ } from "../criterion-shape.interface";
import { ICriterion } from "../criterion.interface";
import { IEntityCriteriaFactory } from "../entity-criteria-factory.interface";
import { ReshapedCriterion } from "../reshaped-criterion";
import { IOrCriterion } from "./or-criterion.interface";

export class OrCriterionShape<T extends ICriterionShape<ICriterion, any>>
    implements ICriterionShape<IOrCriterion, any>
{
    static create<T extends ICriterionShape<ICriterion, any>>(
        shapes: T[],
        factory: IEntityCriteriaFactory
    ): OrCriterionShape<T> {
        return new OrCriterionShape({ shapes, factory });
    }

    constructor({ shapes, factory }: { shapes: T[]; factory: IEntityCriteriaFactory }) {
        this.shapes = shapes;
        this.factory = factory;
    }

    readonly [ICriterionShape$] = true;
    private readonly factory: IEntityCriteriaFactory;
    private readonly shapes: T[];

    read(criterion: IOrCriterion) {
        throw new Error("Method not implemented.");
    }

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
                return new ReshapedCriterion([this.factory.or(remapped)]);
            }

            criterion = this.factory.or(result.getOpen());
        }

        if (remapped.length > 0) {
            // [todo] can we replace Criterion[] w/ just Criterion @ RemapCriterionResult?
            // in this case, a single OrCriteria() which is not nested in a 1-element array
            // [todo] confusing at first that we supply "criterion" for the "open" parameter,
            // as it is the argument given to this function. you have to read the code of this
            // function to see that it is reassigned; very smelly.
            return new ReshapedCriterion([this.factory.or(remapped)], [criterion]);
        }

        return false;
    }

    toString(): string {
        return `(${this.shapes.map(item => item.toString()).join(" | ")})`;
    }
}
