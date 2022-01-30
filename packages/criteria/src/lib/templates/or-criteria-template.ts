import { Criterion } from "../criterion/criterion";
import { OrCriteria } from "../criterion/or/or-criteria";
import { ICriterionTemplate } from "./criterion-template.interface";
import { InstancedCriterionTemplate } from "./instanced-criterion-template.type";
import { RemapCriterionResult } from "./remap-criterion-result";

export class OrCriteriaTemplate<T extends ICriterionTemplate>
    implements ICriterionTemplate<OrCriteria<InstancedCriterionTemplate<T>>>
{
    constructor(items: T[]) {
        this.items = items;
    }
    
    private readonly items: T[];

    getItems(): T[] {
        return this.items;
    }

    remap(criterion: Criterion): false | RemapCriterionResult<OrCriteria<InstancedCriterionTemplate<T>>> {
        let remapped: InstancedCriterionTemplate<T>[] = [];

        const addToRemapped = (criterion: InstancedCriterionTemplate<T>) => {
            remapped = remapped.filter(item => criterion.reduce(item) !== true);
            remapped.push(criterion);
        };

        for (const template of this.getItems()) {
            const result = template.remap(criterion) as false | RemapCriterionResult<InstancedCriterionTemplate<T>>;

            if (result === false) {
                continue;
            }

            for (const item of result.getCriteria()) {
                addToRemapped(item);
            }

            if (result.getOpen().length === 0) {
                return new RemapCriterionResult([new OrCriteria(remapped)]);
            }

            criterion = new OrCriteria(result.getOpen());
        }

        if (remapped.length > 0) {
            return new RemapCriterionResult([new OrCriteria(remapped)], [criterion]);
        }

        return false;
    }

    matches(criterion: Criterion): criterion is OrCriteria<InstancedCriterionTemplate<T>> {
        if (!(criterion instanceof OrCriteria)) {
            return false;
        }

        return criterion.getItems().every(item => this.getItems().some(template => template.matches(item)));
    }
}
