import { ICriterionTemplate } from "./criterion-template.interface";
import { OrCriteriaTemplate } from "./or-criteria-template";

export function orTemplate<T extends ICriterionTemplate, U extends T[]>(
    ...templates: [...U]
): OrCriteriaTemplate<[...U][number]>;
export function orTemplate<T extends ICriterionTemplate>(templates: T[]): OrCriteriaTemplate<T>;
export function orTemplate<T extends ICriterionTemplate>(...args: any): OrCriteriaTemplate<T> {
    if (Array.isArray(args[0])) {
        return new OrCriteriaTemplate(args[0]);
    } else {
        return new OrCriteriaTemplate(args);
    }
}
