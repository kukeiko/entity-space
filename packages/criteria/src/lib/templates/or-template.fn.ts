import { ICriterionShape } from "./criterion-shape.interface";
import { OrCriteriaShape } from "./or-criteria-template";

export function orShape<T extends ICriterionShape, U extends T[]>(
    ...templates: [...U]
): OrCriteriaShape<[...U][number]>;
export function orShape<T extends ICriterionShape>(templates: T[]): OrCriteriaShape<T>;
export function orShape<T extends ICriterionShape>(...args: any): OrCriteriaShape<T> {
    if (Array.isArray(args[0])) {
        return new OrCriteriaShape(args[0]);
    } else {
        return new OrCriteriaShape(args);
    }
}
