import { any } from "../any/any.fn";
import { Criterion } from "../criterion";
import { OrCriteria } from "./or-criteria";

export function or<T extends Criterion, U extends T[]>(...criteria: [...U]): Criterion;
export function or<T extends Criterion>(criteria: T[]): Criterion;
export function or(...args: any): Criterion {
    const items = (Array.isArray(args[0]) ? args[0] : args) as Criterion[];

    return items.length === 0 ? any() : new OrCriteria(items);
}
