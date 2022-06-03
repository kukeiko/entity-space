import { any } from "../any/any.fn";
import { Criterion } from "../criterion";
import { AndCriteria } from "./and-criteria";

export function and<T extends Criterion, U extends T[]>(...criteria: [...U]): Criterion;
export function and<T extends Criterion>(criteria: T[]): Criterion;
export function and(...args: any): Criterion {
    const items = (Array.isArray(args[0]) ? args[0] : args) as Criterion[];

    return items.length === 0 ? any() : new AndCriteria(items);
}
