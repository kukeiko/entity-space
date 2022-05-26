import { ICriterionTemplate } from "./criterion-template.interface";
import { OrCriteriaTemplate } from "./or-criteria-template";
import { orTemplate } from "./or-template.fn";
import { SomeCriterionTemplate } from "./some-criterion.template";

export function someTemplate<T extends ICriterionTemplate>(template: T): SomeCriterionTemplate<T>;
export function someTemplate<T extends ICriterionTemplate, U extends T[]>(
    ...templates: [...U]
): SomeCriterionTemplate<OrCriteriaTemplate<[...U][number]>>;
export function someTemplate<T extends ICriterionTemplate>(
    templates: T[]
): SomeCriterionTemplate<OrCriteriaTemplate<T>>;
export function someTemplate<T extends ICriterionTemplate>(...args: any): any {
    const items: T[] = Array.isArray(args[0]) ? args[0] : args;

    if (items.length > 1) {
        return new SomeCriterionTemplate(orTemplate(items));
    } else {
        return new SomeCriterionTemplate(items[0]);
    }
}
