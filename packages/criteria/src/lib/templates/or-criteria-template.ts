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
        const remapped: InstancedCriterionTemplate<T>[] = [];

        for (const template of this.getItems()) {
            const result = template.remap(criterion) as false | RemapCriterionResult<InstancedCriterionTemplate<T>>;

            if (result === false) {
                continue;
            }

            if (result.getOpen().length === 0) {
                return new RemapCriterionResult([new OrCriteria(result.getCriteria())]);
            }

            remapped.push(...result.getCriteria());
            criterion = new OrCriteria(result.getOpen());
        }

        if (remapped.length > 0) {
            return new RemapCriterionResult([new OrCriteria(remapped)], [criterion]);
        }

        return false;
    }
}
