import { Criterion } from "../criterion/criterion";
import { OrCriteria } from "../criterion/or/or-criteria";
import { ICriterionShape } from "./criterion-shape.interface";
import { InstancedCriterionShape } from "./instanced-criterion-shape.type";
import { ReshapedCriterion } from "./reshaped-criterion";

export class OrCriteriaShape<T extends ICriterionShape>
    implements ICriterionShape<OrCriteria<InstancedCriterionShape<T>>>
{
    constructor(items: T[]) {
        this.items = items;
    }

    private readonly items: T[];

    getItems(): T[] {
        return this.items;
    }

    reshape(criterion: Criterion): false | ReshapedCriterion<OrCriteria<InstancedCriterionShape<T>>> {
        let remapped: InstancedCriterionShape<T>[] = [];

        const addToRemapped = (criterion: InstancedCriterionShape<T>) => {
            remapped = remapped.filter(item => criterion.subtractFrom(item) !== true);
            remapped.push(criterion);
        };

        for (const template of this.getItems()) {
            const result = template.reshape(criterion) as false | ReshapedCriterion<InstancedCriterionShape<T>>;

            if (result === false) {
                continue;
            }

            for (const item of result.getReshaped()) {
                addToRemapped(item);
            }

            if (result.getOpen().length === 0) {
                return new ReshapedCriterion([new OrCriteria(remapped)]);
            }

            criterion = new OrCriteria(result.getOpen());
        }

        if (remapped.length > 0) {
            // [todo] can we replace Criterion[] w/ just Criterion @ RemapCriterionResult?
            // in this case, a single OrCriteria() which is not nested in a 1-element array
            return new ReshapedCriterion([new OrCriteria(remapped)], [criterion]);
        }

        return false;
    }

    matches(criterion: Criterion): criterion is OrCriteria<InstancedCriterionShape<T>> {
        if (!(criterion instanceof OrCriteria)) {
            return false;
        }

        return criterion.getItems().every(item => this.getItems().some(template => template.matches(item)));
    }

    toString(): string {
        return `(${this.items.map(item => item.toString()).join(" | ")})`;
    }
}
