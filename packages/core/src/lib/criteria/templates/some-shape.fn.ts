import { ICriterionShape } from "./criterion-shape.interface";
import { OrCriteriaShape } from "./or-criteria-shape";
import { orShape } from "./or-shape.fn";
import { SomeCriterionShape } from "./some-criterion-shape";

export function someShape<T extends ICriterionShape>(template: T): SomeCriterionShape<T>;
export function someShape<T extends ICriterionShape, U extends T[]>(
    ...templates: [...U]
): SomeCriterionShape<OrCriteriaShape<[...U][number]>>;
export function someShape<T extends ICriterionShape>(templates: T[]): SomeCriterionShape<OrCriteriaShape<T>>;
export function someShape<T extends ICriterionShape>(...args: any): any {
    const items: T[] = Array.isArray(args[0]) ? args[0] : args;

    if (items.length > 1) {
        return new SomeCriterionShape(orShape(items));
    } else {
        return new SomeCriterionShape(items[0]);
    }
}
