import { Criteria } from "../criteria";
import { Criterion } from "../criterion";
import { OrCriteria } from "./or-criteria";

export function or<T extends Criterion, U extends T[]>(...criteria: [...U]): Criteria<[...U][number]>;
export function or<T extends Criterion>(criteria: T[]): Criteria<T>;
export function or<T extends Criterion>(...args: any): Criteria<T> {
    if (Array.isArray(args[0])) {
        return new OrCriteria(args[0]);
    } else {
        return new OrCriteria(args);
    }
}
