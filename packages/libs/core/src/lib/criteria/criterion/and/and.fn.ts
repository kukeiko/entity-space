import { AndCriteria } from "./and-criteria";
import { Criteria } from "../criteria";
import { Criterion } from "../criterion";

export function and<T extends Criterion, U extends T[]>(...criteria: [...U]): Criteria<[...U][number]>;
export function and<T extends Criterion>(criteria: T[]): Criteria<T>;
export function and<T extends Criterion>(...args: any): Criteria<T> {
    if (Array.isArray(args[0])) {
        return new AndCriteria(args[0]);
    } else {
        return new AndCriteria(args);
    }
}
